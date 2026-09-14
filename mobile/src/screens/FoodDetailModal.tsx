import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { FoodItem } from '../types';

interface FoodDetailModalProps {
  item: FoodItem | null;
  onClose: () => void;
  onAddToCart: (item: FoodItem) => void;
}

export const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  item,
  onClose,
  onAddToCart,
}) => {
  if (!item) return null;

  return (
    <Modal visible={!!item} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Image source={{ uri: item.imageUrl }} style={styles.image} />

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.vegTag}>{item.isVeg ? '🟢 Pure Veg' : '🔴 Non-Veg'}</Text>
            </View>

            <Text style={styles.description}>{item.description}</Text>

            <View style={styles.detailsGrid}>
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Prep Time</Text>
                <Text style={styles.detailValue}>{item.prepTimeMinutes} mins</Text>
              </View>
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Campus Rating</Text>
                <Text style={styles.detailValue}>★ {item.rating.toFixed(1)}</Text>
              </View>
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Orders Served</Text>
                <Text style={styles.detailValue}>{item.totalOrders}+</Text>
              </View>
            </View>

            <View style={styles.footerRow}>
              <View>
                <Text style={styles.priceLabel}>Price</Text>
                <Text style={styles.price}>₹{item.price}</Text>
              </View>

              <TouchableOpacity
                style={[styles.addBtn, !item.isAvailable && styles.disabledBtn]}
                disabled={!item.isAvailable}
                onPress={() => {
                  onAddToCart(item);
                  onClose();
                }}
              >
                <Text style={styles.addBtnText}>
                  {item.isAvailable ? 'Add to Tray ➔' : 'Currently Unavailable'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#f5f5f4',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1c1917',
    flex: 1,
  },
  vegTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#57534e',
  },
  description: {
    fontSize: 13,
    color: '#57534e',
    lineHeight: 18,
    marginTop: 8,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 16,
  },
  detailCard: {
    flex: 1,
    backgroundColor: '#fafaf9',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 10,
    color: '#78716c',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#292524',
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f4',
    paddingTop: 14,
  },
  priceLabel: {
    fontSize: 11,
    color: '#78716c',
  },
  price: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ea580c',
  },
  addBtn: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  disabledBtn: {
    backgroundColor: '#e7e5e4',
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
