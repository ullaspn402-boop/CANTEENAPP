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
} from 'react-native';
import { fetchStaffOrders, updateOrderStatus } from '../services/api';
import { Order } from '../types';

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'all'>('active');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const loadOrders = async () => {
    try {
      const data = await fetchStaffOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load orders:', err);
      // Show sample data if API is not connected
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 30000); // Auto-refresh every 30s
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

  const activeOrders = orders.filter((o) =>
    ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
  );
  const displayOrders = activeTab === 'active' ? activeOrders : orders;

  const stats = {
    active: activeOrders.length,
    ready: orders.filter((o) => o.status === 'ready').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  };

  return (
    <View style={styles.container}>
      {/* Staff Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerRole}>
            {user.role === 'admin' ? '🛡️ ADMINISTRATOR' : '👨‍🍳 CANTEEN STAFF'}
          </Text>
          <Text style={styles.headerName}>{user.name}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} tintColor="#ea580c" />
        }
        showsVerticalScrollIndicator={false}
      >
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
            <TouchableOpacity style={styles.refreshBtn} onPress={() => { setLoading(true); loadOrders(); }}>
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
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status] + '20', borderColor: STATUS_COLORS[order.status] }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[order.status] }]}>
                    {STATUS_LABELS[order.status] || order.status}
                  </Text>
                </View>
              </View>

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
                <Text style={styles.orderMetaText}>
                  💰 ₹{order.totalAmount || '—'}
                </Text>
                <Text style={styles.orderMetaText}>
                  🕐 {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
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
                      Mark as {STATUS_LABELS[NEXT_STATUS[order.status]]}  →
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
                      { text: 'Yes, Cancel', style: 'destructive', onPress: () => handleUpdateStatus(order.id, 'cancelled') },
                    ]);
                  }}
                >
                  <Text style={styles.cancelBtnText}>❌ Cancel Order</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        <View style={{ height: 24 }} />
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
    backgroundColor: '#1c1917',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerRole: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ea580c',
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fafaf9',
  },
  logoutBtn: {
    backgroundColor: '#292524',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  logoutText: {
    color: '#f5f5f4',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  statNumber: {
    fontSize: 22,
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
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#1c1917',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78716c',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  centerBox: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 13,
    color: '#78716c',
    marginTop: 12,
  },
  emptyBox: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f5f5f4',
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1c1917',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#78716c',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  refreshBtn: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  refreshBtnText: {
    color: '#c2410c',
    fontWeight: '700',
    fontSize: 13,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f5f5f4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  tokenBadge: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tokenText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#c2410c',
    letterSpacing: 0.5,
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
});
