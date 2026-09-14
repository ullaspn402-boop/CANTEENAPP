import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Order } from '../types';
import { trackOrderByToken } from '../services/api';

interface DigitalTokenScreenProps {
  visible: boolean;
  onClose: () => void;
  order: Order | null;
}

export const DigitalTokenScreen: React.FC<DigitalTokenScreenProps> = ({
  visible,
  onClose,
  order: initialOrder,
}) => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(initialOrder);

  useEffect(() => {
    setCurrentOrder(initialOrder);
  }, [initialOrder]);

  // Polling order status
  useEffect(() => {
    if (!visible || !currentOrder?.tokenNumber) return;

    const interval = setInterval(async () => {
      try {
        const fresh = await trackOrderByToken(currentOrder.tokenNumber);
        setCurrentOrder(fresh);
      } catch (err) {
        console.error(err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [visible, currentOrder?.tokenNumber]);

  if (!currentOrder) return null;

  const isReady = currentOrder.status === 'ready';
  const isCompleted = currentOrder.status === 'completed';

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Digital Food Token</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Token Box */}
          <View style={[styles.tokenBox, isReady && styles.tokenBoxReady]}>
            <Text style={styles.tokenPrefix}>CAMPUS CANTEEN TOKEN</Text>
            <Text style={styles.tokenNumber}>{currentOrder.tokenNumber}</Text>
            <Text style={styles.tokenInstructions}>
              Show this token at Counter 1 when status indicates READY
            </Text>
          </View>

          {/* Stepper Status */}
          <View style={styles.statusSection}>
            <View style={styles.stepperRow}>
              <View
                style={[
                  styles.stepDot,
                  ['confirmed', 'preparing', 'ready', 'completed'].includes(currentOrder.status) &&
                    styles.stepDotActive,
                ]}
              />
              <View
                style={[
                  styles.stepLine,
                  ['preparing', 'ready', 'completed'].includes(currentOrder.status) &&
                    styles.stepLineActive,
                ]}
              />
              <View
                style={[
                  styles.stepDot,
                  ['preparing', 'ready', 'completed'].includes(currentOrder.status) &&
                    styles.stepDotActive,
                ]}
              />
              <View
                style={[
                  styles.stepLine,
                  ['ready', 'completed'].includes(currentOrder.status) &&
                    styles.stepLineActive,
                ]}
              />
              <View
                style={[
                  styles.stepDot,
                  ['ready', 'completed'].includes(currentOrder.status) &&
                    styles.stepDotActive,
                ]}
              />
            </View>

            <View style={styles.stepperLabels}>
              <Text style={styles.stepLabel}>Order Placed</Text>
              <Text style={styles.stepLabel}>Cooking</Text>
              <Text style={styles.stepLabel}>Ready for Pickup</Text>
            </View>

            <View style={styles.currentStatusBadge}>
              <Text style={styles.currentStatusText}>
                CURRENT STATUS: {currentOrder.status.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Order Summary */}
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Amount:</Text>
              <Text style={styles.summaryValue}>₹{currentOrder.totalAmount}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment:</Text>
              <Text style={styles.summaryValue}>Pay at Counter</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Estimated Prep Time:</Text>
              <Text style={styles.summaryValue}>~{currentOrder.prepTimeMinutes} mins</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Keep Browsing Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1c1917',
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    color: '#a8a29e',
    fontWeight: '700',
  },
  tokenBox: {
    backgroundColor: '#ffedd5',
    borderColor: '#ea580c',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  tokenBoxReady: {
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
  },
  tokenPrefix: {
    fontSize: 10,
    fontWeight: '800',
    color: '#c2410c',
    letterSpacing: 1,
  },
  tokenNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#9a3412',
    marginVertical: 4,
  },
  tokenInstructions: {
    fontSize: 11,
    color: '#78716c',
    textAlign: 'center',
  },
  statusSection: {
    marginBottom: 20,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#e7e5e4',
  },
  stepDotActive: {
    backgroundColor: '#ea580c',
  },
  stepLine: {
    width: 60,
    height: 3,
    backgroundColor: '#e7e5e4',
  },
  stepLineActive: {
    backgroundColor: '#ea580c',
  },
  stepperLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 12,
  },
  stepLabel: {
    fontSize: 10,
    color: '#78716c',
    fontWeight: '600',
  },
  currentStatusBadge: {
    backgroundColor: '#f5f5f4',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  currentStatusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#292524',
  },
  summaryBox: {
    backgroundColor: '#fafaf9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#78716c',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1c1917',
  },
  doneBtn: {
    backgroundColor: '#292524',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
