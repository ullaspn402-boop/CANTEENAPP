/**
 * Mobile API Configuration
 * 
 * CRITICAL ANDROID NETWORKING RULE:
 * On an Android physical device, 'localhost' refers to the phone itself (127.0.0.1).
 * To connect to a local development machine:
 * - Android Emulator uses: 'http://10.0.2.2:3000'
 * - Physical phone on same Wi-Fi uses: 'http://<YOUR_PC_LAN_IP>:3000' (e.g. 'http://192.168.1.10:3000')
 * - Production cloud deployment uses: 'https://<CLOUD_APP_URL>'
 */

declare const process: any;
declare const __DEV__: boolean;

// Primary production API URL resolved from EXPO_PUBLIC_API_BASE_URL (or GitHub secret CANTEEN_API_URL).
const configuredEnvUrl =
  (typeof process !== 'undefined' && process?.env?.EXPO_PUBLIC_API_BASE_URL)
    ? process.env.EXPO_PUBLIC_API_BASE_URL.trim()
    : '';

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

// In production release builds, fallback to local emulator (10.0.2.2) is prohibited.
let activeApiBaseUrl = configuredEnvUrl || (isDev ? 'http://10.0.2.2:3000' : '');

export function getMobileApiBaseUrl(): string {
  const clean = activeApiBaseUrl.replace(/\/+$/, '');
  
  // Security guard for production builds
  if (!isDev && (clean.includes('localhost') || clean.includes('127.0.0.1') || clean.includes('10.0.2.2'))) {
    console.error('CRITICAL: Production APK cannot connect to localhost or 10.0.2.2. Please supply EXPO_PUBLIC_API_BASE_URL.');
  }

  return clean;
}

export function setMobileApiBaseUrl(url: string) {
  if (url && url.trim().length > 0) {
    activeApiBaseUrl = url.trim().replace(/\/+$/, '');
  }
}

export function buildMobileApiUrl(path: string): string {
  const base = getMobileApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}
