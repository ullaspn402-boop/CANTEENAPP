export type UserRole = 'student' | 'staff' | 'admin';

export interface User {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
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
}

export interface OrderItem {
  id?: number;
  orderId?: number;
  foodItemId: number;
  foodItem?: FoodItem;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  itemNotes?: string | null;
}

export interface Order {
  id: number;
  tokenNumber: string;
  userId: number;
  customerName?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  prepTimeMinutes: number;
  specialInstructions?: string | null;
  pickupEstimatedAt?: string | null;
  readyAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  items?: OrderItem[];
}

export interface CanteenStatus {
  id?: number;
  isOpen: boolean;
  currentWaitTimeMinutes: number;
  announcement?: string | null;
}

export interface CartItem {
  foodItem: FoodItem;
  quantity: number;
}
