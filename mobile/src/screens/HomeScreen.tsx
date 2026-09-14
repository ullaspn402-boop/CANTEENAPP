import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Category, FoodItem, CanteenStatus, CartItem, Order } from '../types';
import { fetchCanteenStatus, fetchCategories, fetchFoodItems } from '../services/api';

interface HomeScreenProps {
  cart: CartItem[];
  onAddToCart: (item: FoodItem) => void;
  onOpenCart: () => void;
  onSelectItem: (item: FoodItem) => void;
  activeOrder: Order | null;
  onOpenTokenTracker: (order: Order) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  cart,
  onAddToCart,
  onOpenCart,
  onSelectItem,
  activeOrder,
  onOpenTokenTracker,
}) => {
  const [canteenStatus, setCanteenStatus] = useState<CanteenStatus | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [status, cats] = await Promise.all([
        fetchCanteenStatus(),
        fetchCategories(),
      ]);
      setCanteenStatus(status);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const items = await fetchFoodItems({
        categoryId: selectedCategory || undefined,
        isVeg: vegFilter === 'all' ? undefined : vegFilter === 'veg',
        search: search.trim() || undefined,
      });
      setFoodItems(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadItems();
  }, [selectedCategory, vegFilter, search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadData(), loadItems()]);
    setRefreshing(false);
  };

  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const totalCartAmount = cart.reduce((sum, i) => sum + i.foodItem.price * i.quantity, 0);

  return (
    <View style={styles.container}>
      {/* Canteen Status Banner */}
      <View style={styles.statusBar}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: canteenStatus?.isOpen ? '#22c55e' : '#ef4444' }]} />
          <Text style={styles.statusText}>
            {canteenStatus?.isOpen ? 'Canteen Open' : 'Canteen Closed'} • {canteenStatus?.currentWaitTimeMinutes || 8} mins wait
          </Text>
        </View>
        {canteenStatus?.announcement && (
          <Text style={styles.announcementText} numberOfLines={1}>
            {canteenStatus.announcement}
          </Text>
        )}
      </View>

      {/* Active Order Banner if ongoing */}
      {activeOrder && (
        <TouchableOpacity
          style={styles.activeOrderBanner}
          onPress={() => onOpenTokenTracker(activeOrder)}
        >
          <View>
            <Text style={styles.activeTokenLabel}>LIVE ORDER IN PROGRESS</Text>
            <Text style={styles.activeTokenNumber}>Token #{activeOrder.tokenNumber}</Text>
          </View>
          <View style={styles.activeStatusPill}>
            <Text style={styles.activeStatusText}>{activeOrder.status.toUpperCase()}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search dosas, thalis, chai, snacks..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Categories Horizontal Bar */}
      <View style={styles.categoriesSection}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 0, name: 'All Menu' }, ...categories]}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const isSelected = item.id === 0 ? selectedCategory === null : selectedCategory === item.id;
            return (
              <TouchableOpacity
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(item.id === 0 ? null : item.id)}
              >
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* Veg / Non-Veg Filters */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, vegFilter === 'all' && styles.filterBtnActive]}
          onPress={() => setVegFilter('all')}
        >
          <Text style={[styles.filterBtnText, vegFilter === 'all' && styles.filterBtnTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, vegFilter === 'veg' && styles.filterBtnActive]}
          onPress={() => setVegFilter('veg')}
        >
          <Text style={[styles.filterBtnText, vegFilter === 'veg' && styles.filterBtnTextActive]}>🟢 Pure Veg</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, vegFilter === 'nonveg' && styles.filterBtnActive]}
          onPress={() => setVegFilter('nonveg')}
        >
          <Text style={[styles.filterBtnText, vegFilter === 'nonveg' && styles.filterBtnTextActive]}>🔴 Non-Veg</Text>
        </TouchableOpacity>
      </View>

      {/* Food Items List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ea580c" />
        </View>
      ) : (
        <FlatList
          data={foodItems}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.foodList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.foodCard}
              onPress={() => onSelectItem(item)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.foodImage} />
              <View style={styles.foodInfo}>
                <View style={styles.foodHeader}>
                  <Text style={styles.foodTitle}>{item.name}</Text>
                  <Text style={styles.vegBadge}>{item.isVeg ? '🟢' : '🔴'}</Text>
                </View>
                <Text style={styles.foodDesc} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.foodMeta}>
                  <Text style={styles.foodPrice}>₹{item.price}</Text>
                  <Text style={styles.prepTime}>⏱ {item.prepTimeMinutes}m</Text>
                  {item.spiceLevel && item.spiceLevel !== 'None' && (
                    <Text style={styles.prepTime}>🌶️ {item.spiceLevel}</Text>
                  )}
                  <Text style={styles.rating}>★ {item.rating.toFixed(1)}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.addButton, !item.isAvailable && styles.disabledButton]}
                disabled={!item.isAvailable}
                onPress={() => onAddToCart(item)}
              >
                <Text style={styles.addButtonText}>
                  {item.isAvailable ? '+ ADD' : 'SOLD'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Floating Cart Button */}
      {totalCartCount > 0 && (
        <TouchableOpacity style={styles.floatingCart} onPress={onOpenCart} activeOpacity={0.9}>
          <View>
            <Text style={styles.floatingCartCount}>{totalCartCount} ITEM{totalCartCount > 1 ? 'S' : ''}</Text>
            <Text style={styles.floatingCartTotal}>₹{totalCartAmount}</Text>
          </View>
          <View style={styles.viewCartButton}>
            <Text style={styles.viewCartText}>View Tray ➔</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafaf9',
  },
  statusBar: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f4',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#292524',
  },
  announcementText: {
    fontSize: 11,
    color: '#78716c',
    marginTop: 2,
  },
  activeOrderBanner: {
    backgroundColor: '#ea580c',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeTokenLabel: {
    color: '#fed7aa',
    fontSize: 10,
    fontWeight: '700',
  },
  activeTokenNumber: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  activeStatusPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeStatusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  categoriesSection: {
    marginTop: 10,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e7e5e4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryChipActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  categoryChipText: {
    fontSize: 12,
    color: '#57534e',
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e7e5e4',
  },
  filterBtnActive: {
    backgroundColor: '#292524',
    borderColor: '#292524',
  },
  filterBtnText: {
    fontSize: 11,
    color: '#78716c',
    fontWeight: '600',
  },
  filterBtnTextActive: {
    color: '#ffffff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodList: {
    padding: 16,
    paddingBottom: 90,
    gap: 12,
  },
  foodCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f5f5f4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  foodImage: {
    width: 74,
    height: 74,
    borderRadius: 12,
    backgroundColor: '#f5f5f4',
  },
  foodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  foodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  foodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1917',
    flex: 1,
  },
  vegBadge: {
    fontSize: 10,
  },
  foodDesc: {
    fontSize: 11,
    color: '#78716c',
    marginTop: 2,
  },
  foodMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  foodPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ea580c',
  },
  prepTime: {
    fontSize: 11,
    color: '#a8a29e',
  },
  rating: {
    fontSize: 11,
    color: '#eab308',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  disabledButton: {
    backgroundColor: '#f5f5f4',
  },
  addButtonText: {
    color: '#c2410c',
    fontSize: 12,
    fontWeight: '800',
  },
  floatingCart: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#ea580c',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingCartCount: {
    color: '#fed7aa',
    fontSize: 10,
    fontWeight: '700',
  },
  floatingCartTotal: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  viewCartButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewCartText: {
    color: '#ea580c',
    fontSize: 12,
    fontWeight: '800',
  },
});
