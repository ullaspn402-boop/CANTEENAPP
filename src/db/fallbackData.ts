import type { Category, FoodItem, Order, OrderStatus, Notification, AnalyticsData, ReviewItem, ReviewSummary, Feedback } from '../types.ts';

// 1. In-Memory Resilient Categories
export const fallbackCategories: Category[] = [
  { id: 1, name: 'Breakfast', slug: 'breakfast', description: 'Morning favorites served hot till 11:30 AM', icon: 'Sunrise', displayOrder: 1 },
  { id: 2, name: 'Meals', slug: 'meals', description: 'Wholesome hearty lunch and dinner plates', icon: 'UtensilsCrossed', displayOrder: 2 },
  { id: 3, name: 'Snacks', slug: 'snacks', description: 'Quick bites, samosas & evening tea snacks', icon: 'Cookie', displayOrder: 3 },
  { id: 4, name: 'Beverages', slug: 'beverages', description: 'Cold drinks, fresh juices & hot brewed tea/coffee', icon: 'Coffee', displayOrder: 4 },
  { id: 5, name: 'Fast Food', slug: 'fast-food', description: 'Burgers, sandwiches, rolls and crispy fries', icon: 'Sandwich', displayOrder: 5 },
  { id: 6, name: 'Healthy Options', slug: 'healthy-options', description: 'Protein-packed salads, fresh fruit bowls & oats', icon: 'Salad', displayOrder: 6 },
];

// 2. In-Memory Resilient Food Items
export const fallbackFoodItems: FoodItem[] = [
  // Breakfast
  {
    id: 1,
    categoryId: 1,
    categoryName: 'Breakfast',
    name: 'Masala Dosa',
    description: 'Crispy fermented crepe stuffed with spiced potato mash, served with coconut chutney & sambar',
    price: 40,
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    isActive: true,
    spiceLevel: 'Medium',
    availableStock: 45,
    prepTimeMinutes: 8,
    rating: 4.8,
    ratingCount: 142,
    totalOrders: 320,
  },
  {
    id: 2,
    categoryId: 1,
    categoryName: 'Breakfast',
    name: 'Idli Vada Combo',
    description: 'Two fluffy steamed rice cakes & one crispy medu vada with hot sambar & green chutney',
    price: 35,
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    isActive: true,
    spiceLevel: 'Mild',
    availableStock: 50,
    prepTimeMinutes: 5,
    rating: 4.6,
    ratingCount: 88,
    totalOrders: 190,
  },
  {
    id: 3,
    categoryId: 1,
    categoryName: 'Breakfast',
    name: 'Poha with Sev & Jalebi',
    description: 'Indori flattened rice tempered with mustard, curry leaves, peanuts and topped with crunchy sev',
    price: 30,
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    isActive: true,
    spiceLevel: 'Mild',
    availableStock: 30,
    prepTimeMinutes: 4,
    rating: 4.5,
    ratingCount: 76,
    totalOrders: 145,
  },
  {
    id: 4,
    categoryId: 1,
    categoryName: 'Breakfast',
    name: 'Poori Bhaji (4 pcs)',
    description: 'Golden puffed pooris served with zesty aloo masala gravy and pickle',
    price: 45,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    isActive: true,
    spiceLevel: 'Medium',
    availableStock: 40,
    prepTimeMinutes: 8,
    rating: 4.7,
    ratingCount: 94,
    totalOrders: 180,
  },
  // Meals
  {
    id: 5,
    categoryId: 2,
    categoryName: 'Meals',
    name: 'Special North Indian Thali',
    description: 'Paneer sabzi, Dal Makhani, 2 Butter Rotis, Jeera Rice, Gulab Jamun, Papad & Salad',
    price: 90,
    imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    isActive: true,
    spiceLevel: 'Medium',
    availableStock: 60,
    prepTimeMinutes: 10,
    rating: 4.8,
    ratingCount: 210,
    totalOrders: 420,
  },
  {
    id: 6,
    categoryId: 2,
    categoryName: 'Meals',
    name: 'Chicken Dum Biryani Bowl',
    description: 'Fragrant basmati rice slow-cooked with spiced marinated chicken, boiled egg and creamy raita',
    price: 130,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    isVeg: false,
    isAvailable: true,
    isActive: true,
    spiceLevel: 'Hot',
    availableStock: 50,
    prepTimeMinutes: 10,
    rating: 4.9,
    ratingCount: 340,
    totalOrders: 580,
  },
  {
    id: 7,
    categoryId: 2,
    categoryName: 'Meals',
    name: 'Rajma Chawal Bowl',
    description: 'Comforting Punjabi red kidney beans curry served over steamed basmati rice with pickled onions',
    price: 75,
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    isActive: true,
    spiceLevel: 'Medium',
    availableStock: 40,
    prepTimeMinutes: 6,
    rating: 4.6,
    ratingCount: 95,
    totalOrders: 195,
  },
  // Snacks
  {
    id: 8,
    categoryId: 3,
    categoryName: 'Snacks',
    name: 'Crispy Samosa (2 pcs)',
    description: 'Golden fried crust stuffed with spicy potato and green peas, served with sweet tamarind & mint chutney',
    price: 25,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    isActive: true,
    spiceLevel: 'Medium',
    availableStock: 80,
    prepTimeMinutes: 3,
    rating: 4.7,
    ratingCount: 290,
    totalOrders: 650,
  },
  {
    id: 9,
    categoryId: 3,
    categoryName: 'Snacks',
    name: 'Double Masala Maggi',
    description: 'Classic college staple with sauteed carrots, green peas, capsicum and extra masala magic',
    price: 35,
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    isActive: true,
    spiceLevel: 'Medium',
    availableStock: 65,
    prepTimeMinutes: 6,
    rating: 4.8,
    ratingCount: 280,
    totalOrders: 510,
  },
  // Beverages
  {
    id: 10,
    categoryId: 4,
    categoryName: 'Beverages',
    name: 'Masala Chai (Kulhad)',
    description: 'Slow-brewed strong Assam tea infused with ginger, cardamom and cloves served in clay cup',
    price: 15,
    imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    isActive: true,
    spiceLevel: 'Mild',
    availableStock: 120,
    prepTimeMinutes: 3,
    rating: 4.9,
    ratingCount: 420,
    totalOrders: 920,
  },
  {
    id: 11,
    categoryId: 4,
    categoryName: 'Beverages',
    name: 'Cold Coffee with Vanilla Scoop',
    description: 'Chilled blended espresso with chocolate drizzle topped with a creamy vanilla scoop',
    price: 45,
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    isActive: true,
    spiceLevel: 'Mild',
    availableStock: 45,
    prepTimeMinutes: 4,
    rating: 4.8,
    ratingCount: 220,
    totalOrders: 430,
  },
  // Fast Food
  {
    id: 12,
    categoryId: 5,
    categoryName: 'Fast Food',
    name: 'Crispy Veg Cheese Burger',
    description: 'Crunchy herb potato patty with lettuce, tomatoes, creamy thousand island sauce & cheese slice',
    price: 55,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    isActive: true,
    spiceLevel: 'Mild',
    availableStock: 35,
    prepTimeMinutes: 8,
    rating: 4.6,
    ratingCount: 155,
    totalOrders: 290,
  },
  {
    id: 13,
    categoryId: 5,
    categoryName: 'Fast Food',
    name: 'Grilled Bombay Veg Sandwich',
    description: 'Three-layer butter toasted sandwich packed with spiced potato, cucumber, beetroot and green chutney',
    price: 50,
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    isActive: true,
    spiceLevel: 'Medium',
    availableStock: 40,
    prepTimeMinutes: 7,
    rating: 4.7,
    ratingCount: 175,
    totalOrders: 320,
  },
  // Healthy Options
  {
    id: 14,
    categoryId: 6,
    categoryName: 'Healthy Options',
    name: 'Fresh Seasonal Fruit Bowl',
    description: 'Hand-picked cuts of watermelon, papaya, kiwi, pomegranate & pineapple with chia seeds',
    price: 50,
    imageUrl: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=600&auto=format&fit=crop&q=80',
    isVeg: true,
    isAvailable: true,
    isActive: true,
    spiceLevel: 'Mild',
    availableStock: 25,
    prepTimeMinutes: 3,
    rating: 4.8,
    ratingCount: 75,
    totalOrders: 140,
  },
];

let nextFoodId = 100;
let nextOrderId = 500;

// 3. In-Memory Resilient Orders
export const fallbackOrders: Order[] = [
  {
    id: 101,
    tokenNumber: 'C101',
    userId: 1,
    customerName: 'Rahul Sharma',
    customerEmail: 'rahul.student@campus.edu',
    customerPhone: '+91 98765 43210',
    status: 'confirmed',
    totalAmount: 70,
    paymentStatus: 'pay_at_canteen',
    paymentMethod: 'pay_at_canteen',
    prepTimeMinutes: 8,
    specialInstructions: 'Extra spicy sambar and crispy roast please',
    pickupEstimatedAt: new Date(Date.now() + 8 * 60 * 1000),
    readyAt: null,
    completedAt: null,
    createdAt: new Date(Date.now() - 4 * 60 * 1000),
    items: [
      { id: 1, foodItemId: 1, name: 'Masala Dosa', quantity: 1, unitPrice: 40, subtotal: 40, isVeg: true },
      { id: 2, foodItemId: 10, name: 'Masala Chai (Kulhad)', quantity: 2, unitPrice: 15, subtotal: 30, isVeg: true },
    ],
  },
  {
    id: 102,
    tokenNumber: 'C102',
    userId: 2,
    customerName: 'Sneha Patel',
    customerEmail: 'sneha.p@campus.edu',
    customerPhone: '+91 91234 56789',
    status: 'preparing',
    totalAmount: 130,
    paymentStatus: 'paid',
    paymentMethod: 'upi_online',
    prepTimeMinutes: 10,
    specialInstructions: 'Make raita thick without onions',
    pickupEstimatedAt: new Date(Date.now() + 5 * 60 * 1000),
    readyAt: null,
    completedAt: null,
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
    items: [
      { id: 3, foodItemId: 6, name: 'Chicken Dum Biryani Bowl', quantity: 1, unitPrice: 130, subtotal: 130, isVeg: false },
    ],
  },
  {
    id: 103,
    tokenNumber: 'C103',
    userId: 3,
    customerName: 'Aman Verma',
    customerEmail: 'aman.v@campus.edu',
    customerPhone: '+91 99887 76655',
    status: 'ready',
    totalAmount: 50,
    paymentStatus: 'paid',
    paymentMethod: 'upi_online',
    prepTimeMinutes: 6,
    specialInstructions: 'Cut into 4 pieces',
    pickupEstimatedAt: new Date(Date.now() - 2 * 60 * 1000),
    readyAt: new Date(Date.now() - 1 * 60 * 1000),
    completedAt: null,
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    items: [
      { id: 4, foodItemId: 13, name: 'Grilled Bombay Veg Sandwich', quantity: 1, unitPrice: 50, subtotal: 50, isVeg: true },
    ],
  },
  {
    id: 104,
    tokenNumber: 'C098',
    userId: 1,
    customerName: 'Rahul Sharma',
    customerEmail: 'rahul.student@campus.edu',
    customerPhone: '+91 98765 43210',
    status: 'completed',
    totalAmount: 90,
    paymentStatus: 'paid',
    paymentMethod: 'pay_at_canteen',
    prepTimeMinutes: 10,
    specialInstructions: null,
    pickupEstimatedAt: new Date(Date.now() - 40 * 60 * 1000),
    readyAt: new Date(Date.now() - 35 * 60 * 1000),
    completedAt: new Date(Date.now() - 30 * 60 * 1000),
    createdAt: new Date(Date.now() - 50 * 60 * 1000),
    items: [
      { id: 5, foodItemId: 5, name: 'Special North Indian Thali', quantity: 1, unitPrice: 90, subtotal: 90, isVeg: true },
    ],
  },
];

// Helper Operations on In-Memory Resilient Store
export function getFallbackCategories(): Category[] {
  return [...fallbackCategories].sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getFallbackFoodItems(filter?: {
  categoryId?: number;
  isVeg?: boolean;
  search?: string;
  sortBy?: 'popular' | 'price_low' | 'price_high' | 'rating';
  includeInactive?: boolean;
}): FoodItem[] {
  let list = [...fallbackFoodItems];

  if (!filter?.includeInactive) {
    list = list.filter((i) => i.isActive !== false);
  }
  if (filter?.categoryId) {
    list = list.filter((i) => i.categoryId === Number(filter.categoryId));
  }
  if (filter?.isVeg !== undefined) {
    list = list.filter((i) => i.isVeg === Boolean(filter.isVeg));
  }
  if (filter?.search) {
    const s = filter.search.toLowerCase();
    list = list.filter((i) => i.name.toLowerCase().includes(s) || (i.description && i.description.toLowerCase().includes(s)));
  }

  if (filter?.sortBy === 'price_low') {
    list.sort((a, b) => a.price - b.price);
  } else if (filter?.sortBy === 'price_high') {
    list.sort((a, b) => b.price - a.price);
  } else if (filter?.sortBy === 'rating') {
    list.sort((a, b) => b.rating - a.rating);
  } else {
    list.sort((a, b) => b.totalOrders - a.totalOrders);
  }

  return list;
}

export function createFallbackFoodItem(data: any): FoodItem {
  const category = fallbackCategories.find((c) => c.id === Number(data.categoryId));
  const newItem: FoodItem = {
    id: ++nextFoodId,
    categoryId: Number(data.categoryId) || 1,
    categoryName: category?.name || 'Breakfast',
    name: String(data.name || '').trim() || 'New Item',
    description: String(data.description || '').trim(),
    price: Math.max(1, Number(data.price) || 20),
    imageUrl: String(data.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'),
    isVeg: Boolean(data.isVeg),
    isAvailable: data.isAvailable !== false,
    isActive: data.isActive !== false,
    spiceLevel: data.spiceLevel || 'Medium',
    availableStock: Math.max(0, Number(data.availableStock ?? 30)),
    prepTimeMinutes: Math.max(1, Number(data.prepTimeMinutes) || 8),
    rating: 5.0,
    ratingCount: 1,
    totalOrders: 0,
    createdAt: new Date(),
  };
  fallbackFoodItems.unshift(newItem);
  return newItem;
}

export function updateFallbackFoodItem(id: number, data: any): FoodItem {
  const idx = fallbackFoodItems.findIndex((i) => i.id === id);
  if (idx === -1) {
    throw new Error(`Food item #${id} not found.`);
  }
  const existing = fallbackFoodItems[idx];
  const category = data.categoryId ? fallbackCategories.find((c) => c.id === Number(data.categoryId)) : undefined;

  const updated: FoodItem = {
    ...existing,
    name: data.name !== undefined ? String(data.name).trim() : existing.name,
    description: data.description !== undefined ? String(data.description).trim() : existing.description,
    price: data.price !== undefined ? Math.max(1, Number(data.price)) : existing.price,
    categoryId: data.categoryId !== undefined ? Number(data.categoryId) : existing.categoryId,
    categoryName: category ? category.name : existing.categoryName,
    imageUrl: data.imageUrl !== undefined ? data.imageUrl : existing.imageUrl,
    isVeg: data.isVeg !== undefined ? Boolean(data.isVeg) : existing.isVeg,
    isAvailable: data.isAvailable !== undefined ? Boolean(data.isAvailable) : existing.isAvailable,
    isActive: data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive,
    spiceLevel: data.spiceLevel !== undefined ? data.spiceLevel : existing.spiceLevel,
    availableStock: data.availableStock !== undefined ? Math.max(0, Number(data.availableStock)) : existing.availableStock,
    prepTimeMinutes: data.prepTimeMinutes !== undefined ? Math.max(1, Number(data.prepTimeMinutes)) : existing.prepTimeMinutes,
  };

  fallbackFoodItems[idx] = updated;
  return updated;
}

export function deleteFallbackFoodItem(id: number): FoodItem {
  const idx = fallbackFoodItems.findIndex((i) => i.id === id);
  if (idx === -1) {
    throw new Error(`Food item #${id} not found.`);
  }
  // Soft deactivate so historical orders remain valid
  fallbackFoodItems[idx].isActive = false;
  fallbackFoodItems[idx].isAvailable = false;
  return fallbackFoodItems[idx];
}

export function toggleFallbackActive(id: number, isActive?: boolean): FoodItem {
  const idx = fallbackFoodItems.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error(`Food item #${id} not found.`);
  fallbackFoodItems[idx].isActive = isActive !== undefined ? isActive : !fallbackFoodItems[idx].isActive;
  return fallbackFoodItems[idx];
}

export function toggleFallbackAvailability(id: number, isAvailable?: boolean): FoodItem {
  const idx = fallbackFoodItems.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error(`Food item #${id} not found.`);
  fallbackFoodItems[idx].isAvailable = isAvailable !== undefined ? isAvailable : !fallbackFoodItems[idx].isAvailable;
  return fallbackFoodItems[idx];
}

export function updateFallbackStock(id: number, stock: number): FoodItem {
  const idx = fallbackFoodItems.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error(`Food item #${id} not found.`);
  fallbackFoodItems[idx].availableStock = Math.max(0, stock);
  if (stock === 0) {
    fallbackFoodItems[idx].isAvailable = false;
  }
  return fallbackFoodItems[idx];
}

export function getFallbackOrders(statusFilter?: string): Order[] {
  let list = [...fallbackOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (statusFilter && statusFilter !== 'all') {
    list = list.filter((o) => o.status === statusFilter);
  }
  return list;
}

export function getFallbackOrderById(id: number): Order | undefined {
  return fallbackOrders.find((o) => o.id === id);
}

export function getFallbackOrderByToken(tokenNumber: string): Order | null {
  const norm = tokenNumber.trim().toUpperCase();
  return fallbackOrders.find((o) => o.tokenNumber.toUpperCase() === norm) || null;
}

export function getFallbackUserOrders(userId: number): Order[] {
  return fallbackOrders
    .filter((o) => o.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createFallbackOrder(
  userId: number,
  customerName: string,
  customerEmail: string,
  itemsList: Array<{ foodItemId: number; quantity: number }>,
  specialInstructions?: string,
  paymentMethod: string = 'pay_at_canteen'
): Order {
  let total = 0;
  let maxPrep = 8;
  const lineItems: any[] = [];

  for (const item of itemsList) {
    const food = fallbackFoodItems.find((f) => f.id === item.foodItemId);
    if (!food) throw new Error(`Item #${item.foodItemId} not found.`);
    if (food.availableStock !== undefined && food.availableStock < item.quantity) {
      throw new Error(`Insufficient stock for "${food.name}".`);
    }
    // Deduct stock
    if (food.availableStock !== undefined) {
      food.availableStock = Math.max(0, food.availableStock - item.quantity);
      food.totalOrders += item.quantity;
    }
    const subtotal = food.price * item.quantity;
    total += subtotal;
    if (food.prepTimeMinutes > maxPrep) maxPrep = food.prepTimeMinutes;

    lineItems.push({
      id: Math.floor(Math.random() * 10000),
      foodItemId: food.id,
      name: food.name,
      imageUrl: food.imageUrl,
      isVeg: food.isVeg,
      quantity: item.quantity,
      unitPrice: food.price,
      subtotal,
    });
  }

  const tokenNumber = `C${Math.floor(100 + (fallbackOrders.length * 7 + Math.random() * 50) % 899)}`;
  const isOnline = paymentMethod.includes('upi') || paymentMethod.includes('online');

  const newOrder: Order = {
    id: ++nextOrderId,
    tokenNumber,
    userId,
    customerName,
    customerEmail,
    customerPhone: null,
    status: 'confirmed',
    totalAmount: total,
    paymentStatus: isOnline ? 'paid' : 'pay_at_canteen',
    paymentMethod,
    prepTimeMinutes: maxPrep,
    specialInstructions: specialInstructions || null,
    pickupEstimatedAt: new Date(Date.now() + maxPrep * 60 * 1000),
    readyAt: null,
    completedAt: null,
    createdAt: new Date(),
    items: lineItems,
  };

  fallbackOrders.unshift(newOrder);

  // Dispatch live in-memory notification for student
  addFallbackNotification({
    userId,
    orderId: newOrder.id,
    title: `Order Placed: Token #${tokenNumber}`,
    message: `Your order of ${lineItems.length} item(s) for ₹${total} is confirmed. Estimated pickup: ~${maxPrep} mins.`,
    type: 'order_confirmed',
  });

  // Dispatch broadcast alert for canteen staff & admin
  addFallbackNotification({
    userId: 0, // 0 indicates staff/admin broadcast
    orderId: newOrder.id,
    title: `🔔 New Order Received: Token #${tokenNumber}`,
    message: `${customerName} placed an order for ₹${total} (${lineItems.map((i: any) => `${i.name} x${i.quantity}`).join(', ')}).`,
    type: 'new_order_incoming',
  });

  return newOrder;
}

export function updateFallbackOrderStatus(orderId: number, nextStatus: OrderStatus): Order {
  const order = fallbackOrders.find((o) => o.id === orderId);
  if (!order) throw new Error(`Order #${orderId} not found.`);

  order.status = nextStatus;
  if (nextStatus === 'ready') {
    order.readyAt = new Date();
    addFallbackNotification({
      userId: order.userId,
      orderId: order.id,
      title: `Order Ready! Token #${order.tokenNumber}`,
      message: `Your meal is prepared and hot! Please proceed to Counter 1 for pickup.`,
      type: 'order_ready',
    });
  } else if (nextStatus === 'completed') {
    order.completedAt = new Date();
    order.paymentStatus = 'paid';

    // Notify student
    addFallbackNotification({
      userId: order.userId,
      orderId: order.id,
      title: `Order Completed! Token #${order.tokenNumber}`,
      message: `Order #${order.tokenNumber} handed over. Enjoy your meal! Please rate your experience.`,
      type: 'order_completed',
    });

    // Notify staff & admin
    addFallbackNotification({
      userId: 0,
      orderId: order.id,
      title: `Order #${order.tokenNumber} Completed & Closed`,
      message: `Successfully fulfilled order for ${order.customerName || 'Student'}. Total ₹${order.totalAmount} collected.`,
      type: 'order_completed_summary',
    });
  }
  return order;
}

export function updateFallbackOrderPayment(
  orderId: number,
  paymentStatus: 'paid' | 'pay_at_canteen' | 'pending'
): Order {
  const order = fallbackOrders.find((o) => o.id === orderId);
  if (!order) throw new Error(`Order #${orderId} not found.`);

  order.paymentStatus = paymentStatus;
  return order;
}

// 4. In-Memory Resilient Notifications Store
let nextNotificationId = 100;
export const fallbackNotifications: Notification[] = [
  {
    id: 1,
    userId: 0,
    orderId: null,
    title: 'Canteen Live System Ready',
    message: 'CampusBite smart ordering console is active and ready to accept orders.',
    type: 'system',
    isRead: false,
    createdAt: new Date(),
  },
];

export function addFallbackNotification(data: {
  userId: number;
  orderId?: number | null;
  title: string;
  message: string;
  type: string;
}): Notification {
  const notif: Notification = {
    id: ++nextNotificationId,
    userId: data.userId,
    orderId: data.orderId || null,
    title: data.title,
    message: data.message,
    type: data.type,
    isRead: false,
    createdAt: new Date(),
  };
  fallbackNotifications.unshift(notif);
  return notif;
}

export function getFallbackNotifications(userId: number, role?: string): Notification[] {
  return fallbackNotifications.filter((n) => {
    if (n.userId === userId) return true;
    if (n.userId === 0 && (role === 'staff' || role === 'admin')) return true;
    return false;
  });
}

export function markAllFallbackNotificationsRead(userId: number, role?: string) {
  for (const n of fallbackNotifications) {
    if (n.userId === userId || (n.userId === 0 && (role === 'staff' || role === 'admin'))) {
      n.isRead = true;
    }
  }
}

// 5. In-Memory Resilient Analytics Data Generator
export function getFallbackAnalyticsData(): AnalyticsData {
  const totalOrdersToday = fallbackOrders.length;
  const totalSalesToday = fallbackOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const completedOrdersCount = fallbackOrders.filter((o) => o.status === 'completed').length;
  const averageOrderValue = totalOrdersToday > 0 ? Math.round(totalSalesToday / totalOrdersToday) : 0;

  // Clone and sort food items
  const sortedFoods = [...fallbackFoodItems].sort((a, b) => b.totalOrders - a.totalOrders);
  const popularFoodItems = sortedFoods.slice(0, 5);
  const leastPopularFoodItems = [...sortedFoods].reverse().slice(0, 5);

  const categoryBreakdown = fallbackCategories.map((cat) => {
    const catFoods = fallbackFoodItems.filter((f) => f.categoryId === cat.id);
    const ordersInCat = catFoods.reduce((sum, f) => sum + (f.totalOrders || 0), 0);
    const revenueInCat = catFoods.reduce((sum, f) => sum + (f.totalOrders || 0) * f.price, 0);
    return {
      category: cat.name,
      orders: ordersInCat,
      revenue: revenueInCat,
    };
  });

  const hourlyPeakData = [
    { time: '08:30 - 09:30 AM', slot: 'Breakfast Rush', orders: Math.max(12, Math.round(totalOrdersToday * 0.2)), intensity: 'Moderate' },
    { time: '10:30 - 11:30 AM', slot: 'Morning Break', orders: Math.max(20, Math.round(totalOrdersToday * 0.3)), intensity: 'High' },
    { time: '12:30 - 01:30 PM', slot: 'Lunch Peak', orders: Math.max(35, Math.round(totalOrdersToday * 0.45)), intensity: 'Very High' },
    { time: '01:30 - 02:30 PM', slot: 'Post-Lunch Wave', orders: Math.max(18, Math.round(totalOrdersToday * 0.25)), intensity: 'High' },
    { time: '04:00 - 05:30 PM', slot: 'Evening Tea/Snacks', orders: Math.max(22, Math.round(totalOrdersToday * 0.35)), intensity: 'High' },
    { time: '06:00 - 07:30 PM', slot: 'Hostel Dinner Rush', orders: Math.max(15, Math.round(totalOrdersToday * 0.2)), intensity: 'Moderate' },
  ];

  const weeklyTrend = [
    { day: 'Mon', sales: 18400, orders: 165 },
    { day: 'Tue', sales: 22100, orders: 198 },
    { day: 'Wed', sales: 24500, orders: 215 },
    { day: 'Thu', sales: 21800, orders: 189 },
    { day: 'Fri', sales: 27900, orders: 245 },
    { day: 'Sat', sales: 14200, orders: 120 },
    { day: 'Today', sales: totalSalesToday, orders: totalOrdersToday },
  ];

  return {
    totalOrdersToday,
    totalSalesToday,
    completedOrdersCount,
    averageOrderValue,
    popularFoodItems,
    leastPopularFoodItems,
    categoryBreakdown,
    hourlyPeakData,
    weeklyTrend,
  };
}

// 6. In-Memory Resilient Reviews & Feedback Store
export const fallbackFeedbacks: ReviewItem[] = [
  {
    id: 101,
    orderId: 1001,
    userId: 1,
    userName: 'Rohan Sharma',
    userEmail: 'rohan.sharma@campus.edu',
    rating: 5,
    comment: 'The Masala Dosa is consistently the best breakfast on campus! Crispy, hot, and the coconut chutney was fresh. The digital token was ready in 6 minutes.',
    foodItemId: 1,
    foodItemName: 'Masala Dosa',
    tags: ['Crispy & Fresh', 'Fast Counter', 'Super Tasty'],
    helpfulCount: 24,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
  },
  {
    id: 102,
    orderId: 1002,
    userId: 2,
    userName: 'Priya Patel',
    userEmail: 'priya.patel@campus.edu',
    rating: 5,
    comment: 'Cold coffee with vanilla ice cream saved me during double lecture break! Perfectly chilled and creamy. Love the digital token tracking.',
    foodItemId: 17,
    foodItemName: 'Cold Coffee with Ice Cream',
    tags: ['Chilled & Creamy', 'Must Try', 'Pocket Friendly'],
    helpfulCount: 19,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
  },
  {
    id: 103,
    orderId: 1003,
    userId: 3,
    userName: 'Amit Verma',
    userEmail: 'amit.verma@campus.edu',
    rating: 5,
    comment: 'Special North Indian Thali is unmatched value for ₹90. Dal Makhani was rich and the Gulab Jamun was soft and warm. Clean thali and fast service.',
    foodItemId: 5,
    foodItemName: 'Special North Indian Thali',
    tags: ['Full Meal', 'Value for Money', 'Hygienic'],
    helpfulCount: 31,
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
  },
  {
    id: 104,
    orderId: 1004,
    userId: 4,
    userName: 'Sneha Rao',
    userEmail: 'sneha.rao@campus.edu',
    rating: 4,
    comment: 'Paneer Butter Masala had great flavor and generous paneer cubes. Butter naan was warm. Slightly busy around 1 PM but token counter kept it organized.',
    foodItemId: 7,
    foodItemName: 'Paneer Butter Masala with Naan',
    tags: ['Rich Gravy', 'Generous Portion'],
    helpfulCount: 15,
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hours ago
  },
  {
    id: 105,
    orderId: 1005,
    userId: 5,
    userName: 'Vikram Nair',
    userEmail: 'vikram.nair@campus.edu',
    rating: 5,
    comment: 'Crispy Samosas with sweet tamarind chutney & hot cutting chai. Essential evening combo before hostel study hours.',
    foodItemId: 9,
    foodItemName: 'Crispy Veg Samosa (2 pcs)',
    tags: ['Crunchy', 'Evening Classic'],
    helpfulCount: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(), // 8 hours ago
  },
  {
    id: 106,
    orderId: 1006,
    userId: 6,
    userName: 'Ananya Joshi',
    userEmail: 'ananya.joshi@campus.edu',
    rating: 5,
    comment: 'Veg Hakka Noodles was surprisingly authentic with good crunch of bell peppers and cabbage. Ready right when my token reached Step 3.',
    foodItemId: 13,
    foodItemName: 'Veg Hakka Noodles',
    tags: ['Authentic Flavor', 'Quick Prep'],
    helpfulCount: 9,
    createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(), // 10 hours ago
  },
  {
    id: 107,
    orderId: null,
    userId: 7,
    userName: 'Karthik Reddy',
    userEmail: 'karthik.reddy@campus.edu',
    rating: 4,
    comment: 'Idli Vada combo is always steaming hot. Chutney refill counter is super handy and staff are polite.',
    foodItemId: 2,
    foodItemName: 'Idli Vada Combo',
    tags: ['Steaming Hot', 'Good Service'],
    helpfulCount: 8,
    createdAt: new Date(Date.now() - 1000 * 60 * 1440).toISOString(), // 1 day ago
  },
];

let nextFeedbackId = 200;

export function addFallbackFeedback(item: {
  orderId?: number | null;
  userId: number;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  foodItemId?: number | null;
  foodItemName?: string | null;
  tags?: string[];
}): ReviewItem {
  const newReview: ReviewItem = {
    id: nextFeedbackId++,
    orderId: item.orderId || null,
    userId: item.userId,
    userName: item.userName || 'Campus Student',
    userEmail: item.userEmail || '',
    rating: Math.min(5, Math.max(1, Math.round(item.rating))),
    comment: item.comment,
    foodItemId: item.foodItemId || null,
    foodItemName: item.foodItemName || null,
    tags: item.tags || [],
    helpfulCount: 0,
    createdAt: new Date().toISOString(),
  };

  fallbackFeedbacks.unshift(newReview);

  // Update corresponding food item rating if applicable
  if (item.foodItemId) {
    const food = fallbackFoodItems.find((f) => f.id === item.foodItemId);
    if (food) {
      const newCount = (food.ratingCount || 0) + 1;
      food.rating = Number((((food.rating || 4.5) * (food.ratingCount || 0) + item.rating) / newCount).toFixed(1));
      food.ratingCount = newCount;
    }
  }

  return newReview;
}

export function toggleFeedbackHelpful(feedbackId: number): number {
  const fb = fallbackFeedbacks.find((f) => f.id === feedbackId);
  if (fb) {
    fb.helpfulCount = (fb.helpfulCount || 0) + 1;
    return fb.helpfulCount;
  }
  return 0;
}

export function getFallbackFeedbackSummary(): ReviewSummary {
  const totalCount = fallbackFeedbacks.length;
  const sumRatings = fallbackFeedbacks.reduce((sum, f) => sum + f.rating, 0);
  const avg = totalCount > 0 ? Number((sumRatings / totalCount).toFixed(1)) : 4.8;

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const f of fallbackFeedbacks) {
    const star = Math.min(5, Math.max(1, Math.round(f.rating))) as 1 | 2 | 3 | 4 | 5;
    breakdown[star]++;
  }

  // Top liked food items
  const sortedFoods = [...fallbackFoodItems].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const mostLikedItems = sortedFoods.slice(0, 4);
  const poorlyRatedItems = sortedFoods.slice(-2);

  return {
    averageRating: avg,
    totalFeedbackCount: totalCount,
    ratingBreakdown: breakdown,
    recentFeedback: [...fallbackFeedbacks],
    mostLikedItems,
    poorlyRatedItems,
  };
}

