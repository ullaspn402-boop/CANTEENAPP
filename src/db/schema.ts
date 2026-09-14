import { relations } from 'drizzle-orm';
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Users table - tied to Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('student'), // 'student' | 'staff' | 'admin'
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Students profile table
export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  studentIdNumber: text('student_id_number').notNull(), // Roll Number / ID
  department: text('department').notNull().default('Computer Science'),
  year: text('year').notNull().default('3rd Year'),
  hostelResident: boolean('hostel_resident').default(false),
});

// Staff profile table
export const staff = pgTable('staff', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  employeeCode: text('employee_code').notNull(),
  station: text('station').notNull().default('Main Counter'),
  isActive: boolean('is_active').default(true),
});

// Admin profile table
export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  designation: text('designation').notNull().default('Canteen Supervisor'),
  permissions: text('permissions').default('all'),
});

// Categories table
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  icon: text('icon').default('Utensils'),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Food Items table
export const foodItems = pgTable('food_items', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id')
    .references(() => categories.id)
    .notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(), // ₹ In Indian Rupees
  imageUrl: text('image_url').notNull(),
  isVeg: boolean('is_veg').notNull().default(true),
  isAvailable: boolean('is_available').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  spiceLevel: text('spice_level').default('Medium'),
  prepTimeMinutes: integer('prep_time_minutes').notNull().default(10),
  rating: doublePrecision('rating').default(4.5).notNull(),
  ratingCount: integer('rating_count').default(0).notNull(),
  totalOrders: integer('total_orders').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Orders table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  tokenNumber: text('token_number').notNull().unique(), // e.g. "C101"
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  status: text('status').notNull().default('confirmed'), // 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  totalAmount: integer('total_amount').notNull(),
  paymentStatus: text('payment_status').notNull().default('pay_at_canteen'), // 'pending' | 'paid' | 'pay_at_canteen'
  paymentMethod: text('payment_method').notNull().default('pay_at_canteen'),
  prepTimeMinutes: integer('prep_time_minutes').notNull().default(10),
  specialInstructions: text('special_instructions'),
  pickupEstimatedAt: timestamp('pickup_estimated_at'),
  readyAt: timestamp('ready_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Order Items table
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  foodItemId: integer('food_item_id')
    .references(() => foodItems.id)
    .notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  subtotal: integer('subtotal').notNull(),
  itemNotes: text('item_notes'),
});

// Payments table
export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  amount: integer('amount').notNull(),
  paymentMethod: text('payment_method').notNull().default('pay_at_canteen'),
  status: text('status').notNull().default('pending'), // 'pending' | 'completed' | 'refunded'
  transactionRef: text('transaction_ref'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Feedback table
export const feedback = pgTable('feedback', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id)
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  rating: integer('rating').notNull(), // 1 - 5 stars
  comment: text('comment'),
  foodItemId: integer('food_item_id').references(() => foodItems.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Inventory table
export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  foodItemId: integer('food_item_id')
    .references(() => foodItems.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  initialStock: integer('initial_stock').notNull().default(100),
  availableStock: integer('available_stock').notNull().default(50),
  dailyPrepared: integer('daily_prepared').notNull().default(100),
  dailySold: integer('daily_sold').notNull().default(0),
  unit: text('unit').notNull().default('portions'),
  reorderLevel: integer('reorder_level').notNull().default(15),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('order_update'),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Canteen Settings table
export const canteenSettings = pgTable('canteen_settings', {
  id: serial('id').primaryKey(),
  isOpen: boolean('is_open').notNull().default(true),
  currentWaitTimeMinutes: integer('current_wait_time_minutes').notNull().default(8),
  announcement: text('announcement').default('Fresh hot meals & snacks being served today!'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  student: one(students, { fields: [users.id], references: [students.userId] }),
  staff: one(staff, { fields: [users.id], references: [staff.userId] }),
  admin: one(admins, { fields: [users.id], references: [admins.userId] }),
  orders: many(orders),
  feedback: many(feedback),
  notifications: many(notifications),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  foodItems: many(foodItems),
}));

export const foodItemsRelations = relations(foodItems, ({ one, many }) => ({
  category: one(categories, { fields: [foodItems.categoryId], references: [categories.id] }),
  orderItems: many(orderItems),
  inventory: one(inventory, { fields: [foodItems.id], references: [inventory.foodItemId] }),
  feedback: many(feedback),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
  payment: one(payments, { fields: [orders.id], references: [payments.orderId] }),
  feedback: one(feedback, { fields: [orders.id], references: [feedback.orderId] }),
  notifications: many(notifications),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  foodItem: one(foodItems, { fields: [orderItems.foodItemId], references: [foodItems.id] }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
  order: one(orders, { fields: [feedback.orderId], references: [orders.id] }),
  user: one(users, { fields: [feedback.userId], references: [users.id] }),
  foodItem: one(foodItems, { fields: [feedback.foodItemId], references: [foodItems.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  order: one(orders, { fields: [notifications.orderId], references: [orders.id] }),
}));
