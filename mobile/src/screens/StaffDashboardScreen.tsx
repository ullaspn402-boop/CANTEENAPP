import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Image,
} from 'react-native';
import {
  fetchStaffOrders,
  updateOrderStatus,
  fetchFoodItems,
  toggleFoodItemAvailability,
  updateFoodItemStock,
} from '../services/api';
import { Order, FoodItem } from '../types';

interface StaffDashboardProps {
  user: { name: string; email: string; role: string };
  onLogout: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#8b5cf6',
  ready: '#10b981',
  completed: '#6b7280',
  cancelled: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '🕐 Pending',
  confirmed: '✅ Confirmed',
  preparing: '👨‍🍳 Preparing',
  ready: '🔔 Ready',
  completed: '✔️ Completed',
  cancelled: '❌ Cancelled',
};

const NEXT_STATUS: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'completed',
};

export const StaffDashboardScreen: React.FC<StaffDashboardProps> = ({ user, onLogout }) => {
  // Navigation & State
  const [mainTab, setMainTab] = useState<'orders' | 'menu'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [togglingItemId, setTogglingItemId] = useState<number | null>(null);

  // Menu Search & Filter
  const [menuSearch, setMenuSearch] = useState('');
  const [menuFilter, setMenuFilter] = useState<'all' | 'veg' | 'nonveg' | 'soldout'>('all');

  const loadData = async () => {
    try {
      const [ordersData, itemsData] = await Promise.all([
        fetchStaffOrders().catch(() => []),
        fetchFoodItems({ includeInactive: true }).catch(() => []),
      ]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setMenuItems(Array.isArray(itemsData) ? itemsData : []);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000); // Auto-refresh every 20s
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
      );
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleItemAvailability = async (item: FoodItem) => {
    const nextAvailability = !item.isAvailable;
    setTogglingItemId(item.id);

    // Optimistic UI update
    setMenuItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isAvailable: nextAvailability } : i))
    );

    try {
      await toggleFoodItemAvailability(item.id, nextAvailability);
    } catch (err: any) {
      // Revert if failed
      setMenuItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isAvailable: !nextAvailability } : i))
      );
      Alert.alert('Update Failed', err.message || 'Could not toggle item availability.');
    } finally {
      setTogglingItemId(null);
    }
  };

  const handleQuickStockAdjust = async (item: FoodItem, delta: number) => {
    const current = item.availableStock ?? 0;
    const nextStock = Math.max(0, current + delta);
    setMenuItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, availableStock: nextStock } : i))
    );

    try {
      await updateFoodItemStock(item.id, nextStock);
    } catch (err: any) {
      setMenuItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, availableStock: current } : i))
      );
      Alert.alert('Stock Update Failed', err.message || 'Could not update stock.');
    }
  };

  const activeOrders = orders.filter((o) =>
    ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
  );
  const displayOrders = activeTab === 'active' ? activeOrders : orders;

  const stats = {
    active: activeOrders.length,
    ready: orders.filter((o) => o.status === 'ready').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    soldOut: menuItems.filter((i) => !i.isAvailable).length,
  };

  // Filtered Menu Items
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesSearch =
      !menuSearch ||
      item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(menuSearch.toLowerCase()));

    if (!matchesSearch) return false;
    if (menuFilter === 'veg') return item.isVeg;
    if (menuFilter === 'nonveg') return !item.isVeg;
    if (menuFilter === 'soldout') return !item.isAvailable;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Staff Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerRole}>
            {user.role === 'admin' ? '🛡️ ADMINISTRATOR PORTAL' : '👨‍🍳 CANTEEN OPERATOR'}
          </Text>
          <Text style={styles.headerName}>{user.name}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Main Mode Toggle: Orders vs Menu Management */}
      <View style={styles.mainNav}>
        <TouchableOpacity
          style={[styles.mainNavBtn, mainTab === 'orders' && styles.mainNavBtnActive]}
          onPress={() => setMainTab('orders')}
          activeOpacity={0.8}
        >
          <Text style={[styles.mainNavText, mainTab === 'orders' && styles.mainNavTextActive]}>
            📦 Live Orders ({stats.active})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainNavBtn, mainTab === 'menu' && styles.mainNavBtnActive]}
          onPress={() => setMainTab('menu')}
          activeOpacity={0.8}
        >
          <Text style={[styles.mainNavText, mainTab === 'menu' && styles.mainNavTextActive]}>
            🍽️ Menu & Stock ({menuItems.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
            tintColor="#ea580c"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* VIEW 1: LIVE ORDERS                                                */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {mainTab === 'orders' ? (
          <>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderColor: '#fed7aa' }]}>
                <Text style={styles.statNumber}>{stats.active}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={[styles.statCard, { borderColor: '#bbf7d0' }]}>
                <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.ready}</Text>
                <Text style={styles.statLabel}>Ready</Text>
              </View>
              <View style={[styles.statCard, { borderColor: '#ddd6fe' }]}>
                <Text style={[styles.statNumber, { color: '#8b5cf6' }]}>{stats.preparing}</Text>
                <Text style={styles.statLabel}>Cooking</Text>
              </View>
              <View style={[styles.statCard, { borderColor: '#e5e7eb' }]}>
                <Text style={[styles.statNumber, { color: '#6b7280' }]}>{stats.completed}</Text>
                <Text style={styles.statLabel}>Done</Text>
              </View>
            </View>

            {/* Tab Toggle */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'active' && styles.tabActive]}
                onPress={() => setActiveTab('active')}
              >
                <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
                  Active Orders {stats.active > 0 ? `(${stats.active})` : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'all' && styles.tabActive]}
                onPress={() => setActiveTab('all')}
              >
                <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
                  All Orders {orders.length > 0 ? `(${orders.length})` : ''}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Orders List */}
            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#ea580c" />
                <Text style={styles.loadingText}>Loading orders...</Text>
              </View>
            ) : displayOrders.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>{activeTab === 'active' ? '✅' : '📋'}</Text>
                <Text style={styles.emptyTitle}>
                  {activeTab === 'active' ? 'No active orders' : 'No orders yet'}
                </Text>
                <Text style={styles.emptyDesc}>
                  {activeTab === 'active'
                    ? 'All orders are completed or the canteen is quiet.'
                    : 'Orders will appear here once students start placing them.'}
                </Text>
                <TouchableOpacity
                  style={styles.refreshBtn}
                  onPress={() => {
                    setLoading(true);
                    loadData();
                  }}
                >
                  <Text style={styles.refreshBtnText}>↻ Refresh</Text>
                </TouchableOpacity>
              </View>
            ) : (
              displayOrders.map((order) => (
                <View key={order.id} style={styles.orderCard}>
                  {/* Order Header */}
                  <View style={styles.orderHeader}>
                    <View style={styles.tokenBadge}>
                      <Text style={styles.tokenText}>#{order.tokenNumber || order.id}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: STATUS_COLORS[order.status] + '20',
                          borderColor: STATUS_COLORS[order.status],
                        },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] }]}>
                        {STATUS_LABELS[order.status] || order.status}
                      </Text>
                    </View>
                  </View>

                  {/* Customer Info */}
                  {order.customerName && (
                    <Text style={styles.customerName}>👤 {order.customerName}</Text>
                  )}

                  {/* Order Items */}
                  <View style={styles.orderItems}>
                    {(order.items || []).map((item: any, idx: number) => (
                      <Text key={idx} style={styles.orderItem}>
                        · {item.quantity}× {item.foodItem?.name || item.name || `Item #${item.foodItemId}`}
                      </Text>
                    ))}
                    {order.specialInstructions ? (
                      <Text style={styles.specialNote}>📝 {order.specialInstructions}</Text>
                    ) : null}
                  </View>

                  {/* Order Meta */}
                  <View style={styles.orderMeta}>
                    <Text style={styles.orderMetaText}>💰 ₹{order.totalAmount || '—'}</Text>
                    <Text style={styles.orderMetaText}>
                      🕐{' '}
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '—'}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  {NEXT_STATUS[order.status] && (
                    <TouchableOpacity
                      style={[styles.actionBtn, updatingId === order.id && styles.actionBtnLoading]}
                      onPress={() => handleUpdateStatus(order.id, NEXT_STATUS[order.status])}
                      disabled={updatingId === order.id}
                    >
                      {updatingId === order.id ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.actionBtnText}>
                          Mark as {STATUS_LABELS[NEXT_STATUS[order.status]]} →
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {order.status === 'pending' && (
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => {
                        Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
                          { text: 'No', style: 'cancel' },
                          {
                            text: 'Yes, Cancel',
                            style: 'destructive',
                            onPress: () => handleUpdateStatus(order.id, 'cancelled'),
                          },
                        ]);
                      }}
                    >
                      <Text style={styles.cancelBtnText}>❌ Cancel Order</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </>
        ) : (
          /* ═════════════════════════════════════════════════════════════════ */
          /* VIEW 2: MENU & STOCK MANAGEMENT                                  */
          /* ═════════════════════════════════════════════════════════════════ */
          <>
            {/* Live Sync Banner */}
            <View style={styles.syncBanner}>
              <Text style={styles.syncBannerText}>
                ⚡ Changes update student menus live in real-time across Web & Mobile!
              </Text>
            </View>

            {/* Menu Search Box */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="🔍 Search dishes to update availability..."
                placeholderTextColor="#a8a29e"
                value={menuSearch}
                onChangeText={setMenuSearch}
              />
              {menuSearch.length > 0 && (
                <TouchableOpacity onPress={() => setMenuSearch('')} style={styles.clearSearchBtn}>
                  <Text style={styles.clearSearchText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Pills */}
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterPill, menuFilter === 'all' && styles.filterPillActive]}
                onPress={() => setMenuFilter('all')}
              >
                <Text style={[styles.filterPillText, menuFilter === 'all' && styles.filterPillTextActive]}>
                  All ({menuItems.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterPill, menuFilter === 'veg' && styles.filterPillActive]}
                onPress={() => setMenuFilter('veg')}
              >
                <Text style={[styles.filterPillText, menuFilter === 'veg' && styles.filterPillTextActive]}>
                  🟢 Veg
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterPill, menuFilter === 'nonveg' && styles.filterPillActive]}
                onPress={() => setMenuFilter('nonveg')}
              >
                <Text style={[styles.filterPillText, menuFilter === 'nonveg' && styles.filterPillTextActive]}>
                  🔴 Non-Veg
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterPill, menuFilter === 'soldout' && styles.filterPillActive]}
                onPress={() => setMenuFilter('soldout')}
              >
                <Text style={[styles.filterPillText, menuFilter === 'soldout' && styles.filterPillTextActive]}>
                  🚫 Sold Out ({stats.soldOut})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Food Items List */}
            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#ea580c" />
                <Text style={styles.loadingText}>Loading menu catalog...</Text>
              </View>
            ) : filteredMenuItems.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🍽️</Text>
                <Text style={styles.emptyTitle}>No food items found</Text>
                <Text style={styles.emptyDesc}>Try adjusting your search or category filter.</Text>
              </View>
            ) : (
              filteredMenuItems.map((item) => (
                <View
                  key={item.id}
                  style={[styles.menuItemCard, !item.isAvailable && styles.menuItemCardSoldOut]}
                >
                  <View style={styles.menuItemTop}>
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={styles.menuThumb} />
                    ) : (
                      <View style={[styles.menuThumb, styles.menuThumbPlaceholder]}>
                        <Text style={{ fontSize: 24 }}>🍱</Text>
                      </View>
                    )}

                    <View style={styles.menuItemDetails}>
                      <View style={styles.menuItemNameRow}>
                        <Text style={styles.menuItemVeg}>{item.isVeg ? '🟢' : '🔴'}</Text>
                        <Text style={styles.menuItemTitle} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>
                      <Text style={styles.menuItemPrice}>₹{item.price}</Text>
                      <Text style={styles.menuItemDesc} numberOfLines={2}>
                        {item.description || 'No description provided.'}
                      </Text>
                    </View>
                  </View>

                  {/* Stock & Availability Control Bar */}
                  <View style={styles.controlBar}>
                    {/* Stock Increment / Decrement */}
                    <View style={styles.stockControl}>
                      <Text style={styles.stockLabel}>Stock:</Text>
                      <TouchableOpacity
                        style={styles.stockBtn}
                        onPress={() => handleQuickStockAdjust(item, -5)}
                      >
                        <Text style={styles.stockBtnText}>-5</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.stockBtn}
                        onPress={() => handleQuickStockAdjust(item, -1)}
                      >
                        <Text style={styles.stockBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.stockValue}>{item.availableStock ?? 0}</Text>
                      <TouchableOpacity
                        style={styles.stockBtn}
                        onPress={() => handleQuickStockAdjust(item, 1)}
                      >
                        <Text style={styles.stockBtnText}>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.stockBtn}
                        onPress={() => handleQuickStockAdjust(item, 5)}
                      >
                        <Text style={styles.stockBtnText}>+5</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Instant Availability Toggle */}
                    <TouchableOpacity
                      style={[
                        styles.availabilityBtn,
                        item.isAvailable ? styles.btnInStock : styles.btnSoldOut,
                        togglingItemId === item.id && { opacity: 0.6 },
                      ]}
                      onPress={() => handleToggleItemAvailability(item)}
                      disabled={togglingItemId === item.id}
                      activeOpacity={0.8}
                    >
                      {togglingItemId === item.id ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.availabilityBtnText}>
                          {item.isAvailable ? '🟢 IN STOCK' : '🔴 SOLD OUT'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafaf9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f4',
  },
  headerRole: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ea580c',
    letterSpacing: 1.2,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1c1917',
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  mainNav: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f4',
    padding: 6,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 14,
    gap: 6,
  },
  mainNavBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainNavBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  mainNavText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#78716c',
  },
  mainNavTextActive: {
    color: '#ea580c',
    fontWeight: '800',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ea580c',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78716c',
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#f5f5f4',
  },
  tabActive: {
    backgroundColor: '#ea580c',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78716c',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenBadge: {
    backgroundColor: '#fff7ed',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  tokenText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ea580c',
  },
  customerName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#44403c',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  orderItems: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f4',
  },
  orderItem: {
    fontSize: 13,
    color: '#292524',
    fontWeight: '500',
    marginBottom: 2,
  },
  specialNote: {
    fontSize: 11,
    color: '#78716c',
    fontStyle: 'italic',
    marginTop: 4,
  },
  orderMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  orderMetaText: {
    fontSize: 12,
    color: '#57534e',
    fontWeight: '600',
  },
  actionBtn: {
    backgroundColor: '#ea580c',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  actionBtnLoading: {
    opacity: 0.7,
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  cancelBtn: {
    backgroundColor: '#fef2f2',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelBtnText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 12,
  },
  // Menu Management Tab Styles
  syncBanner: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    marginBottom: 12,
  },
  syncBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
    textAlign: 'center',
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1c1917',
  },
  clearSearchBtn: {
    position: 'absolute',
    right: 12,
    top: 10,
  },
  clearSearchText: {
    fontSize: 14,
    color: '#a8a29e',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f5f5f4',
  },
  filterPillActive: {
    backgroundColor: '#ea580c',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78716c',
  },
  filterPillTextActive: {
    color: '#ffffff',
  },
  menuItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  menuItemCardSoldOut: {
    backgroundColor: '#fcfcfc',
    borderColor: '#fecaca',
    opacity: 0.9,
  },
  menuItemTop: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  menuThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: '#f5f5f4',
  },
  menuThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemDetails: {
    flex: 1,
  },
  menuItemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  menuItemVeg: {
    fontSize: 10,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1c1917',
    flex: 1,
  },
  menuItemPrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ea580c',
    marginBottom: 2,
  },
  menuItemDesc: {
    fontSize: 11,
    color: '#78716c',
    lineHeight: 15,
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f4',
    gap: 8,
  },
  stockControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78716c',
    marginRight: 2,
  },
  stockBtn: {
    backgroundColor: '#f5f5f4',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  stockBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#44403c',
  },
  stockValue: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1c1917',
    paddingHorizontal: 4,
  },
  availabilityBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
  },
  btnInStock: {
    backgroundColor: '#10b981',
  },
  btnSoldOut: {
    backgroundColor: '#ef4444',
  },
  availabilityBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  centerBox: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#78716c',
  },
  emptyBox: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    marginTop: 8,
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1c1917',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#78716c',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 14,
  },
  refreshBtn: {
    backgroundColor: '#fff7ed',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ea580c',
  },
});
