import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Order } from '../types';
import { fetchMyOrders, submitOrderFeedback } from '../services/api';

interface OrderHistoryScreenProps {
  onSelectOrder: (order: Order) => void;
}

export const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({ onSelectOrder }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Feedback state
  const [selectedOrderForFeedback, setSelectedOrderForFeedback] = useState<Order | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchMyOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleFeedbackSubmit = async () => {
    if (!selectedOrderForFeedback) return;
    setSubmittingFeedback(true);
    try {
      await submitOrderFeedback(selectedOrderForFeedback.id, rating, comment.trim());
      Alert.alert('Thank You!', 'Your rating has been received by the canteen staff.');
      setSelectedOrderForFeedback(null);
      setComment('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Order History</Text>
        <Text style={styles.subtitle}>Past meal pickups and digital tokens</Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#ea580c" size="large" />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No orders placed yet.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderToken}>Token #{item.tokenNumber}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(item.createdAt).toLocaleDateString()} at{' '}
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    item.status === 'completed'
                      ? styles.statusCompleted
                      : item.status === 'ready'
                      ? styles.statusReady
                      : styles.statusPreparing,
                  ]}
                >
                  <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.orderDetails}>
                <Text style={styles.orderTotal}>Total: ₹{item.totalAmount}</Text>
                <Text style={styles.paymentMethod}>Pay at Counter</Text>
              </View>

              <View style={styles.cardActions}>
                {['confirmed', 'preparing', 'ready'].includes(item.status) && (
                  <TouchableOpacity
                    style={styles.trackButton}
                    onPress={() => onSelectOrder(item)}
                  >
                    <Text style={styles.trackText}>Track Live Status</Text>
                  </TouchableOpacity>
                )}

                {item.status === 'completed' && (
                  <TouchableOpacity
                    style={styles.feedbackButton}
                    onPress={() => setSelectedOrderForFeedback(item)}
                  >
                    <Text style={styles.feedbackText}>★ Rate Food</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}

      {/* Feedback Modal */}
      <Modal visible={!!selectedOrderForFeedback} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Rate Your Meal</Text>
            <Text style={styles.modalSubtitle}>
              Token #{selectedOrderForFeedback?.tokenNumber}
            </Text>

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Text style={[styles.star, s <= rating && styles.starActive]}>★</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="Tell us about the taste, temperature, and service..."
              value={comment}
              onChangeText={setComment}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedOrderForFeedback(null)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleFeedbackSubmit}
                disabled={submittingFeedback}
              >
                {submittingFeedback ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Review</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafaf9',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f4',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1c1917',
  },
  subtitle: {
    fontSize: 11,
    color: '#78716c',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#78716c',
    fontSize: 14,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f5f5f4',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderToken: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1c1917',
  },
  orderDate: {
    fontSize: 11,
    color: '#a8a29e',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusCompleted: {
    backgroundColor: '#f5f5f4',
  },
  statusReady: {
    backgroundColor: '#dcfce7',
  },
  statusPreparing: {
    backgroundColor: '#ffedd5',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#292524',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#fafaf9',
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ea580c',
  },
  paymentMethod: {
    fontSize: 11,
    color: '#78716c',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  trackButton: {
    backgroundColor: '#ea580c',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  trackText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  feedbackButton: {
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  feedbackText: {
    color: '#d97706',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1c1917',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#78716c',
    marginBottom: 12,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 12,
  },
  star: {
    fontSize: 32,
    color: '#d6d3d1',
  },
  starActive: {
    color: '#eab308',
  },
  commentInput: {
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 12,
    padding: 10,
    height: 80,
    fontSize: 13,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f5f5f4',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#57534e',
    fontWeight: '600',
    fontSize: 13,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#ea580c',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
