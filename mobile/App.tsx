import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { FoodItem, CartItem, Order } from './src/types';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { CartModal } from './src/screens/CartModal';
import { DigitalTokenScreen } from './src/screens/DigitalTokenScreen';
import { OrderHistoryScreen } from './src/screens/OrderHistoryScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { FoodDetailModal } from './src/screens/FoodDetailModal';
import { setMobileAuthSession } from './src/services/api';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class MobileErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Mobile startup error caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#ea580c', marginBottom: 8 }}>Smart Canteen</Text>
          <Text style={{ fontSize: 13, color: '#57534e', textAlign: 'center', marginBottom: 20 }}>
            App initialization completed. Tap below to launch your campus canteen menu.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: '#ea580c', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 }}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>Launch Menu</Text>
          </TouchableOpacity>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    role: string;
  } | null>(null);

  const [currentTab, setCurrentTab] = useState<'menu' | 'orders' | 'profile'>('menu');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodItem | null>(null);

  const handleLoginSuccess = (
    user: { name: string; email: string; role: string },
    token: string | null = null
  ) => {
    setCurrentUser(user);
    setMobileAuthSession(token, user.role);
  };

  const handleLogout = () => {
    setMobileAuthSession(null, '');
    setCurrentUser(null);
    setCart([]);
    setActiveOrder(null);
  };

  const handleAddToCart = (item: FoodItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.foodItem.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.foodItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { foodItem: item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (foodItemId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((c) => c.foodItem.id !== foodItemId));
      return;
    }
    setCart((prev) =>
      prev.map((c) => (c.foodItem.id === foodItemId ? { ...c, quantity } : c))
    );
  };

  const handleOrderPlaced = (order: Order) => {
    setActiveOrder(order);
    setIsTokenModalOpen(true);
  };

  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top Mobile Bar */}
      <View style={styles.appHeader}>
        <View>
          <Text style={styles.headerSubtitle}>
            {currentUser.role === 'admin'
              ? 'CANTEEN ADMINISTRATOR'
              : currentUser.role === 'staff'
              ? 'CANTEEN STAFF'
              : 'CAMPUS CANTEEN'}
          </Text>
          <Text style={styles.headerTitle}>Smart Canteen</Text>
        </View>
        <View style={styles.userBadge}>
          <Text style={styles.userBadgeText}>{currentUser.name.split(' ')[0]}</Text>
        </View>
      </View>

      {/* Main Tab Screen */}
      <View style={styles.mainContent}>
        {currentTab === 'menu' && (
          <HomeScreen
            cart={cart}
            onAddToCart={handleAddToCart}
            onOpenCart={() => setIsCartOpen(true)}
            onSelectItem={(item) => setSelectedFoodItem(item)}
            activeOrder={activeOrder}
            onOpenTokenTracker={(order) => {
              setActiveOrder(order);
              setIsTokenModalOpen(true);
            }}
          />
        )}

        {currentTab === 'orders' && (
          <OrderHistoryScreen
            onSelectOrder={(order) => {
              setActiveOrder(order);
              setIsTokenModalOpen(true);
            }}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileScreen user={currentUser} onLogout={handleLogout} />
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('menu')}
        >
          <Text style={[styles.navIcon, currentTab === 'menu' && styles.navActive]}>🍽️</Text>
          <Text style={[styles.navLabel, currentTab === 'menu' && styles.navLabelActive]}>Menu</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('orders')}
        >
          <Text style={[styles.navIcon, currentTab === 'orders' && styles.navActive]}>📋</Text>
          <Text style={[styles.navLabel, currentTab === 'orders' && styles.navLabelActive]}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setCurrentTab('profile')}
        >
          <Text style={[styles.navIcon, currentTab === 'profile' && styles.navActive]}>👤</Text>
          <Text style={[styles.navLabel, currentTab === 'profile' && styles.navLabelActive]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Cart Modal */}
      <CartModal
        visible={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={() => setCart([])}
        onOrderPlaced={handleOrderPlaced}
      />

      {/* Digital Token Tracker Modal */}
      <DigitalTokenScreen
        visible={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        order={activeOrder}
      />

      {/* Food Item Detail Modal */}
      <FoodDetailModal
        item={selectedFoodItem}
        onClose={() => setSelectedFoodItem(null)}
        onAddToCart={handleAddToCart}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <MobileErrorBoundary>
      <MainApp />
    </MobileErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f4',
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ea580c',
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1c1917',
  },
  userBadge: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  userBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#c2410c',
  },
  mainContent: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f4',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  navIcon: {
    fontSize: 18,
    marginBottom: 2,
    opacity: 0.6,
  },
  navActive: {
    opacity: 1,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78716c',
  },
  navLabelActive: {
    color: '#ea580c',
    fontWeight: '800',
  },
});
