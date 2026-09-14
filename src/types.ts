export type UserRole = 'student' | 'staff' | 'admin';

export interface User {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string | null;
  avatarUrl: string | null;
  createdAt?: string | Date;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  displayOrder: number;
}

export interface FoodItem {
  id: number;
  categoryId: number;
  categoryName?: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  isVeg: boolean;
  isAvailable: boolean;
  isActive?: boolean;
  spiceLevel?: string;
  availableStock?: number;
  prepTimeMinutes: number;
  rating: number;
  ratingCount: number;
  totalOrders: number;
  createdAt?: string | Date;
}

export interface OrderItem {
  id?: number;
  foodItemId: number;
  name?: string;
  imageUrl?: string;
  isVeg?: boolean;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  itemNotes?: string | null;
}

export type OrderStatus = 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface Order {
  id: number;
  tokenNumber: string;
  userId: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string | null;
  status: OrderStatus;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'pay_at_canteen';
  paymentMethod: string;
  prepTimeMinutes: number;
  specialInstructions: string | null;
  pickupEstimatedAt: string | Date | null;
  readyAt: string | Date | null;
  completedAt: string | Date | null;
  createdAt: string | Date;
  items?: OrderItem[];
  feedback?: Feedback | null;
}

export interface Feedback {
  id?: number;
  orderId: number;
  userId?: number;
  userName?: string;
  rating: number;
  comment: string | null;
  foodItemId?: number | null;
  createdAt?: string | Date;
}

export type FeedbackItem = Feedback;

export interface InventoryItem {
  id: number;
  foodItemId: number;
  name: string;
  price: number;
  isVeg: boolean;
  initialStock: number;
  availableStock: number;
  dailyPrepared: number;
  dailySold: number;
  unit: string;
  reorderLevel: number;
  updatedAt: string | Date;
}

export interface Notification {
  id: number;
  userId: number;
  orderId: number | null;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string | Date;
}

export interface CanteenStatus {
  id?: number;
  isOpen: boolean;
  currentWaitTimeMinutes: number;
  announcement: string | null;
  updatedAt?: string | Date;
}

export interface CartItem {
  foodItem: FoodItem;
  quantity: number;
}

export interface AnalyticsData {
  totalOrdersToday: number;
  totalSalesToday: number;
  completedOrdersCount: number;
  averageOrderValue: number;
  popularFoodItems: FoodItem[];
  leastPopularFoodItems: FoodItem[];
  categoryBreakdown: Array<{ category: string; orders: number; revenue: number }>;
  hourlyPeakData: Array<{ time: string; slot: string; orders: number; intensity: string }>;
  weeklyTrend: Array<{ day: string; sales: number; orders: number }>;
}

export interface IntelligenceData {
  demandPredictions: Array<{
    timeSlot: string;
    predictions: Array<{
      itemName: string;
      predictedUnits: number;
      confidence: string;
      reason: string;
    }>;
  }>;
  peakHourPredictions: Array<{
    slot: string;
    expectedRush: string;
    queueEstimateMins: number;
    recommendation: string;
  }>;
  foodWasteAnalysis: Array<{
    foodItemId: number;
    name: string;
    dailyPrepared: number;
    dailySold: number;
    overPreparedUnits: number;
    wastePercentage: number;
    riskLevel: string;
  }>;
  recommendations: Array<{
    title: string;
    item: string;
    savingsHint: string;
    badge: string;
  }>;
  mlModelStatus: {
    architecture: string;
    dataCollectionActive: boolean;
    historicalRecordsCount: number;
    datasetHealth: string;
  };
}
