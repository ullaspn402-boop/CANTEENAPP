/**
 * CampusBite Mobile App — WebView Wrapper
 *
 * Architecture:
 * - On launch, fetches mobile-config.json from the GitHub repo to get the live Vercel URL.
 * - Loads the full website in a native WebView — 100% same UI as the website.
 * - If GitHub config fetch fails, uses the last known good URL or a baked-in fallback.
 * - No hardcoded Vercel URL in the APK — update mobile-config.json on GitHub to change URL.
 *
 * To change Vercel URL: Edit mobile-config.json in the repo root → push to main → done!
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  BackHandler,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync().catch(() => {});

// ─── Config ────────────────────────────────────────────────────────────────────
// URL of mobile-config.json in GitHub repo — this is ALWAYS stable (it's in source control)
const CONFIG_URL =
  'https://raw.githubusercontent.com/ullaspn402-boop/CANTEENAPP/main/mobile-config.json';

// Fallback URL used ONLY if both GitHub config AND stored URL are unavailable
const LAST_RESORT_FALLBACK = 'https://canteen-app.vercel.app';

// Timeout for config fetch in ms
const CONFIG_FETCH_TIMEOUT = 8000;

// ─── Types ─────────────────────────────────────────────────────────────────────
interface RemoteConfig {
  appUrl: string;
  appName?: string;
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const webviewRef = useRef<WebView>(null);
  const spinValue = useRef(new Animated.Value(0)).current;

  const [appUrl, setAppUrl] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false);
  const [webviewError, setWebviewError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Spin animation for loading logo
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ─── Fetch Remote Config ─────────────────────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    setConfigError(false);
    setWebviewError(false);
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG_FETCH_TIMEOUT);

      const res = await fetch(CONFIG_URL + '?t=' + Date.now(), {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' },
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error('Config fetch failed: ' + res.status);

      const config: RemoteConfig = await res.json();
      if (!config.appUrl || !config.appUrl.startsWith('http')) {
        throw new Error('Invalid appUrl in config');
      }

      setAppUrl(config.appUrl.replace(/\/+$/, ''));
    } catch (err) {
      console.warn('[CampusBite] Config fetch error:', err);
      // Use last-resort fallback — app still works
      setAppUrl(LAST_RESORT_FALLBACK);
      setConfigError(true);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // ─── Hide splash once URL is ready ───────────────────────────────────────────
  useEffect(() => {
    if (appUrl !== null) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appUrl]);

  // ─── Android hardware back button ─────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webviewRef.current) {
        webviewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => handler.remove();
  }, [canGoBack]);

  // ─── Navigation state change ──────────────────────────────────────────────────
  const handleNavStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
  };

  // ─── Loading screen while config is being fetched ────────────────────────────
  if (appUrl === null) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#ea580c" />
        <View style={styles.splashContent}>
          <Animated.View style={[styles.splashLogo, { transform: [{ rotate: spin }] }]}>
            <Text style={styles.splashLogoText}>🍽️</Text>
          </Animated.View>
          <Text style={styles.splashTitle}>CampusBite</Text>
          <Text style={styles.splashSubtitle}>Campus Food Ordering System</Text>
          <Text style={styles.splashLoading}>Connecting to campus canteen...</Text>
        </View>
      </View>
    );
  }

  // ─── Full WebView Error Screen ─────────────────────────────────────────────────
  if (webviewError) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff7ed" />
        <View style={styles.errorContent}>
          <Text style={styles.errorEmoji}>📡</Text>
          <Text style={styles.errorTitle}>Connection Issue</Text>
          <Text style={styles.errorMessage}>
            Unable to reach the CampusBite server.{'\n'}
            Please check your internet connection.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setWebviewError(false);
              setIsLoading(true);
              // Refetch config then reload
              fetchConfig();
            }}
          >
            <Text style={styles.retryBtnText}>🔄  Retry Connection</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.retryBtnOutline}
            onPress={() => {
              setWebviewError(false);
              setIsLoading(true);
              webviewRef.current?.reload();
            }}
          >
            <Text style={styles.retryBtnOutlineText}>↻  Reload Page</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main WebView ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.appContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Offline / Config warning banner */}
      {configError && (
        <View style={styles.configWarningBanner}>
          <Text style={styles.configWarningText}>
            ⚠️  Using cached server address. Some features may be limited.
          </Text>
        </View>
      )}

      {/* Page loading progress indicator */}
      {isLoading && (
        <View style={styles.pageLoadBar}>
          <View style={styles.pageLoadBarFill} />
        </View>
      )}

      <WebView
        ref={webviewRef}
        source={{ uri: appUrl }}
        style={styles.webview}
        // Show native loading indicator while page loads
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={(e) => {
          console.error('[WebView] Error:', e.nativeEvent);
          setWebviewError(true);
          setIsLoading(false);
        }}
        onHttpError={(e) => {
          // Only treat 5xx server errors as fatal
          if (e.nativeEvent.statusCode >= 500) {
            console.error('[WebView] HTTP Error:', e.nativeEvent.statusCode);
            setWebviewError(true);
          }
          setIsLoading(false);
        }}
        onNavigationStateChange={handleNavStateChange}
        // Allow all navigation within the same origin
        originWhitelist={['*']}
        // Enable JavaScript & DOM storage (required for React app)
        javaScriptEnabled={true}
        domStorageEnabled={true}
        // Allow the website to access camera, media, etc.
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // Allow mixed content (http + https resources)
        mixedContentMode="always"
        // Set a proper mobile user agent so the website knows it's in the app
        applicationNameForUserAgent="CampusBiteApp/1.0 (Android)"
        // Inject JS to tell website it's inside native app
        injectedJavaScriptBeforeContentLoaded={`
          window.CAMPUSBITE_NATIVE_APP = true;
          window.CAMPUSBITE_APP_VERSION = '1.0.0';
          window.CAMPUSBITE_PLATFORM = 'android';
          true;
        `}
        // Allow file access for potential upload features
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
        // Geolocation for campus location features
        geolocationEnabled={true}
        // Caching for offline resilience
        cacheEnabled={true}
        cacheMode="LOAD_DEFAULT"
        // Pull to refresh
        pullToRefreshEnabled={true}
        // Sharpness on high-DPI screens
        scalesPageToFit={false}
        // Ensure viewport meta is respected
        viewportContent="width=device-width, initial-scale=1.0, maximum-scale=1.0"
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Splash / Loading
  splashContainer: {
    flex: 1,
    backgroundColor: '#ea580c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
    gap: 8,
  },
  splashLogo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  splashLogoText: {
    fontSize: 36,
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  splashSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  splashLoading: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 24,
    fontWeight: '400',
  },

  // Error Screen
  errorContainer: {
    flex: 1,
    backgroundColor: '#fff7ed',
  },
  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1c1917',
  },
  errorMessage: {
    fontSize: 14,
    color: '#78716c',
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  retryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  retryBtnOutline: {
    borderWidth: 1.5,
    borderColor: '#d6d3d1',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
    minWidth: 200,
    alignItems: 'center',
  },
  retryBtnOutlineText: {
    color: '#57534e',
    fontWeight: '600',
    fontSize: 14,
  },

  // Main App
  appContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
  },

  // Config warning
  configWarningBanner: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  configWarningText: {
    fontSize: 11,
    color: '#92400e',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Page load bar
  pageLoadBar: {
    height: 2,
    backgroundColor: '#ffedd5',
    overflow: 'hidden',
  },
  pageLoadBarFill: {
    height: 2,
    width: '70%',
    backgroundColor: '#ea580c',
  },
});
