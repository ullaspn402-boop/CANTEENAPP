import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CartItem, Order } from '../types';
import { createStudentOrder } from '../services/api';

interface CartModalProps {
  visible: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (foodItemId: number, quantity: number) => void;
  onClearCart: () => void;
  onOrderPlaced: (order: Order) => void;
}

export const CartModal: React.FC<CartModalProps> = ({
  visible,
  onClose,
  cart,
  onUpdateQuantity,
  onClearCart,
  onOrderPlaced,
}) => {
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  const totalAmount = cart.reduce((sum, i) => sum + i.foodItem.price * i.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const orderPayload = cart.map((c) => ({
        foodItemId: c.foodItem.id,
        quantity: c.quantity,
      }));

      const order = await createStudentOrder(orderPayload, specialInstructions.trim() || undefined);
      onClearCart();
      setSpecialInstructions('');
      onClose();
      onOrderPlaced(order);
    } catch (err: any) {
      Alert.alert('Order Placement Failed', err.message || 'Could not place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Your Campus Tray</Text>
              <Text style={styles.subtitle}>Pay at Canteen Counter pickup</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Cart Items List */}
          {cart.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Your tray is currently empty.</Text>
            </View>
          ) : (
            <FlatList
              data={cart}
              keyExtractor={(item) => item.foodItem.id.toString()}
              contentContainerStyle={styles.itemList}
              renderItem={({ item }) => (
                <View style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.foodItem.name}</Text>
                    <Text style={styles.itemPrice}>₹{item.foodItem.price} each</Text>
                  </View>

                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => onUpdateQuantity(item.foodItem.id, item.quantity - 1)}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => onUpdateQuantity(item.foodItem.id, item.quantity + 1)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.subtotalText}>
                    ₹{item.foodItem.price * item.quantity}
                  </Text>
                </View>
              )}
            />
          )}

          {/* Special Cooking Instructions */}
          {cart.length > 0 && (
            <View style={styles.instructionBox}>
              <Text style={styles.instructionLabel}>Special Cooking Notes (Optional):</Text>
              <TextInput
                style={styles.instructionInput}
                placeholder="e.g. Less spicy, extra sambar, crispier dosa..."
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
              />
            </View>
          )}

          {/* Total & Checkout */}
          {cart.length > 0 && (
            <View style={styles.footer}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Grand Total</Text>
                <Text style={styles.totalAmount}>₹{totalAmount}</Text>
              </View>

              <TouchableOpacity
                style={styles.checkoutBtn}
                onPress={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.checkoutText}>
                    Confirm & Generate Digital Token (₹{totalAmount})
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f4',
    paddingBottom: 12,
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
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    color: '#a8a29e',
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#78716c',
    fontSize: 14,
  },
  itemList: {
    gap: 12,
    paddingVertical: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#fafaf9',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#292524',
  },
  itemPrice: {
    fontSize: 11,
    color: '#78716c',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f4',
    borderRadius: 8,
    paddingHorizontal: 4,
    marginHorizontal: 12,
  },
  qtyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#292524',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  subtotalText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ea580c',
    minWidth: 44,
    textAlign: 'right',
  },
  instructionBox: {
    marginTop: 12,
  },
  instructionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#57534e',
    marginBottom: 4,
  },
  instructionInput: {
    backgroundColor: '#fafaf9',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  footer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f4',
    paddingTop: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#57534e',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1c1917',
  },
  checkoutBtn: {
    backgroundColor: '#ea580c',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  checkoutText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
