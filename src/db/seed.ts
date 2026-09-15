import { db } from './index.ts';
import {
  canteenSettings,
  categories,
  foodItems,
  inventory,
  orders,
  orderItems,
  payments,
  feedback,
  users,
} from './schema.ts';
import { getOrCreateUser } from './users.ts';
import { sql } from 'drizzle-orm';

export async function seedDatabase() {
  try {
    // Check if foodItems already fully seeded (require at least 5 items)
    const existingItems = await db.select().from(foodItems).limit(5);
    if (existingItems.length >= 5) {
      console.log('Database already seeded.');
      return;
    }

    console.log('Seeding College Canteen database...');

    // 1. Canteen Settings
    await db.insert(canteenSettings).values({
      isOpen: true,
      currentWaitTimeMinutes: 8,
      announcement: 'Fresh hot meals & snacks being served! Place order online to skip long counter queues.',
    });

    // 2. Categories
    const categoryData = [
      { name: 'Breakfast', slug: 'breakfast', description: 'Morning favorites served hot till 11:30 AM', icon: 'Sunrise', displayOrder: 1 },
      { name: 'Meals', slug: 'meals', description: 'Wholesome hearty lunch and dinner plates', icon: 'UtensilsCrossed', displayOrder: 2 },
      { name: 'Snacks', slug: 'snacks', description: 'Quick bites, samosas & evening tea snacks', icon: 'Cookie', displayOrder: 3 },
      { name: 'Beverages', slug: 'beverages', description: 'Cold drinks, fresh juices & hot brewed tea/coffee', icon: 'Coffee', displayOrder: 4 },
      { name: 'Fast Food', slug: 'fast-food', description: 'Burgers, sandwiches, rolls and crispy fries', icon: 'Sandwich', displayOrder: 5 },
      { name: 'Healthy Options', slug: 'healthy-options', description: 'Protein-packed salads, fresh fruit bowls & oats', icon: 'Salad', displayOrder: 6 },
    ];

    const insertedCategories = await db.insert(categories).values(categoryData).returning();
    const catMap = new Map<string, number>();
    for (const c of insertedCategories) {
      catMap.set(c.slug, c.id);
    }

    // 3. Food Items
    const foodData = [
      // Breakfast
      {
        categoryId: catMap.get('breakfast')!,
        name: 'Masala Dosa',
        description: 'Crispy fermented crepe stuffed with spiced potato mash, served with coconut chutney & sambar',
        price: 40,
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        prepTimeMinutes: 8,
        rating: 4.8,
        ratingCount: 142,
        totalOrders: 320,
      },
      {
        categoryId: catMap.get('breakfast')!,
        name: 'Idli Vada Combo',
        description: 'Two fluffy steamed rice cakes & one crispy medu vada with hot sambar & green chutney',
        price: 35,
        imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        prepTimeMinutes: 5,
        rating: 4.6,
        ratingCount: 88,
        totalOrders: 190,
      },
      {
        categoryId: catMap.get('breakfast')!,
        name: 'Poha with Sev & Jalebi',
        description: 'Indori flattened rice tempered with mustard, curry leaves, peanuts and topped with crunchy sev',
        price: 30,
        imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        prepTimeMinutes: 4,
        rating: 4.5,
        ratingCount: 76,
        totalOrders: 145,
      },
      {
        categoryId: catMap.get('breakfast')!,
        name: 'Poori Bhaji (4 pcs)',
        description: 'Golden puffed pooris served with zesty aloo masala gravy and pickle',
        price: 45,
        imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        prepTimeMinutes: 8,
        rating: 4.7,
        ratingCount: 94,
        totalOrders: 180,
      },
      {
        categoryId: catMap.get('breakfast')!,
        name: 'Egg Bhurji with Pav',
        description: 'Spiced scrambled eggs with onions, green chilies, tomatoes and two buttered pavs',
        price: 50,
        imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80',
        isVeg: false,
        isAvailable: true,
        prepTimeMinutes: 7,
        rating: 4.6,
        ratingCount: 65,
        totalOrders: 130,
      },

      // Meals
      {
        categoryId: catMap.get('meals')!,
        name: 'Special North Indian Thali',
        description: 'Paneer sabzi, Dal Makhani, 2 Butter Rotis, Jeera Rice, Gulab Jamun, Papad & Salad',
        price: 90,
        imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        prepTimeMinutes: 10,
        rating: 4.8,
        ratingCount: 210,
        totalOrders: 420,
      },
      {
        categoryId: catMap.get('meals')!,
        name: 'Chicken Dum Biryani Bowl',
        description: 'Fragrant basmati rice slow-cooked with spiced marinated chicken, boiled egg and creamy raita',
        price: 130,
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
        isVeg: false,
        isAvailable: true,
        prepTimeMinutes: 10,
        rating: 4.9,
        ratingCount: 340,
        totalOrders: 580,
      },
      {
        categoryId: catMap.get('meals')!,
        name: 'South Indian Mini Meals',
        description: 'Sambar rice, Rasam, Curd rice, Poriyal, Appalam and Sweet Kesari',
        price: 80,
        imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        prepTimeMinutes: 6,
        rating: 4.7,
        ratingCount: 115,
        totalOrders: 230,
      },
      {
        categoryId: catMap.get('meals')!,
        name: 'Rajma Chawal Bowl',
        description: 'Comforting Punjabi red kidney beans curry served over steamed basmati rice with pickled onions',
        price: 75,
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        prepTimeMinutes: 6,
        rating: 4.6,
        ratingCount: 95,
        totalOrders: 195,
      },

      // Snacks
      {
        categoryId: catMap.get('snacks')!,
        name: 'Crispy Samosa (2 pcs)',
        description: 'Golden fried crust stuffed with spicy potato and green peas, served with sweet tamarind & mint chutney',
        price: 25,
        imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        prepTimeMinutes: 3,
        rating: 4.7,
        ratingCount: 290,
        totalOrders: 650,
      },
      {
        categoryId: catMap.get('snacks')!,
        name: 'Cheesy Paneer Pakoda (4 pcs)',
        description: 'Fresh cottage cheese cubes batter-fried in spiced gram flour with chat masala',
        price: 45,
        imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        prepTimeMinutes: 6,
        rating: 4.5,
        ratingCount: 82,
        totalOrders: 160,
      },
      {
        categoryId: catMap.get('snacks')!,
        name: 'Double Masala Maggi',
        description: 'Classic college staple with sauteed carrots, green peas, capsicum and extra masala magic',
        price: 35,
        imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        prepTimeMinutes: 6,
        rating: 4.8,
        ratingCount: 280,
        totalOrders: 510,
      },
      {
        categoryId: catMap.get('snacks')!,
        name: 'Kathi Chicken Roll',
        description: 'Flaky paratha layered with beaten egg, juicy marinated chicken strips, sliced onions and mint mayo',
        price: 70,
        imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
        isVeg: false,
        isAvailable: true,
        prepTimeMinutes: 8,
        rating: 4.7,
        ratingCount: 160,
        totalOrders: 310,
      },

      // Beverages
      {
        categoryId: catMap.get('beverages')!,
        name: 'Masala Chai (Kulhad)',
        description: 'Slow-brewed strong Assam tea infused with ginger, cardamom and cloves served in clay cup',
        price: 15,
        imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        prepTimeMinutes: 3,
        rating: 4.9,
        ratingCount: 420,
        totalOrders: 920,
      },
      {
        categoryId: catMap.get('beverages')!,
        name: 'South Indian Filter Coffee',
        description: 'Authentic decoction brewed freshly with frothy boiled milk and chicory blend',
        price: 20,
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        prepTimeMinutes: 3,
        rating: 4.8,
        ratingCount: 310,
        totalOrders: 640,
      },
      {
        categoryId: catMap.get('beverages')!,
        name: 'Cold Coffee with Vanilla Scoop',
        description: 'Chilled blended espresso with chocolate drizzle topped with a creamy vanilla scoop',
        price: 45,
        imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        prepTimeMinutes: 4,
        rating: 4.8,
        ratingCount: 220,
        totalOrders: 430,
      },
      {
        categoryId: catMap.get('beverages')!,
        name: 'Fresh Mint Lime Soda',
        description: 'Freshly squeezed lemon juice with crushed mint leaves, rock salt and sparkling soda',
        price: 25,
        imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        prepTimeMinutes: 3,
        rating: 4.6,
        ratingCount: 140,
        totalOrders: 280,
      },

      // Fast Food
      {
        categoryId: catMap.get('fast-food')!,
        name: 'Crispy Veg Cheese Burger',
        description: 'Crunchy herb potato patty with lettuce, tomatoes, creamy thousand island sauce & cheese slice',
        price: 55,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        prepTimeMinutes: 8,
        rating: 4.6,
        ratingCount: 155,
        totalOrders: 290,
      },
      {
        categoryId: catMap.get('fast-food')!,
        name: 'Peri Peri French Fries',
        description: 'Golden crinkle-cut fries tossed generously in spicy tangy African peri peri seasoning',
        price: 45,
        imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        prepTimeMinutes: 5,
        rating: 4.7,
        ratingCount: 190,
        totalOrders: 380,
      },
      {
        categoryId: catMap.get('fast-food')!,
        name: 'Grilled Bombay Veg Sandwich',
        description: 'Three-layer butter toasted sandwich packed with spiced potato, cucumber, beetroot and green chutney',
        price: 50,
        imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        prepTimeMinutes: 7,
        rating: 4.7,
        ratingCount: 175,
        totalOrders: 320,
      },
      {
        categoryId: catMap.get('fast-food')!,
        name: 'Crispy Chicken Burger',
        description: 'Batter-crusted juicy chicken breast fillet with chipotle mayo, pickled gherkins and cheddar',
        price: 85,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
        isVeg: false,
        isAvailable: true,
        prepTimeMinutes: 9,
        rating: 4.8,
        ratingCount: 180,
        totalOrders: 340,
      },

      // Healthy Options
      {
        categoryId: catMap.get('healthy-options')!,
        name: 'Sprouted Moong & Paneer Chaat',
        description: 'High-protein steamed moong sprouts tossed with diced paneer, pomegranate seeds, lemon & chaat masala',
        price: 45,
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        prepTimeMinutes: 4,
        rating: 4.7,
        ratingCount: 90,
        totalOrders: 160,
      },
      {
        categoryId: catMap.get('healthy-options')!,
        name: 'Fresh Seasonal Fruit Bowl',
        description: 'Hand-picked cuts of watermelon, papaya, kiwi, pomegranate & pineapple with chia seeds',
        price: 50,
        imageUrl: 'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=600&auto=format&fit=crop&q=80',
        isVeg: true,
        isAvailable: true,
        prepTimeMinutes: 3,
        rating: 4.8,
        ratingCount: 75,
        totalOrders: 140,
      },
      {
        categoryId: catMap.get('healthy-options')!,
        name: 'Boiled Egg Protein Bowl (3 eggs)',
        description: 'Farm-fresh boiled eggs seasoned with black pepper, pink Himalayan salt, olive oil drizzle & microgreens',
        price: 45,
        imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80',
        isVeg: false,
        isAvailable: true,
        prepTimeMinutes: 4,
        rating: 4.6,
        ratingCount: 84,
        totalOrders: 155,
      },
    ];

    const insertedFoods = await db.insert(foodItems).values(foodData).returning();

    // 4. Inventory for each food item
    const invData = insertedFoods.map((f, idx) => ({
      foodItemId: f.id,
      initialStock: 120 + (idx % 5) * 20,
      availableStock: 35 + (idx % 8) * 10,
      dailyPrepared: 100 + (idx % 6) * 15,
      dailySold: 65 + (idx % 5) * 12,
      unit: 'portions',
      reorderLevel: 20,
    }));
    await db.insert(inventory).values(invData);

    // 5. Create default initial users (Rahul - Student, Suresh - Staff, Prof. Deshmukh - Admin)
    const studentUser = await getOrCreateUser('demo_student_uid', 'rahul.sharma@campus.edu', 'Rahul Sharma', undefined, 'student');
    const staffUser = await getOrCreateUser('demo_staff_uid', 'suresh.kumar@campus-canteen.edu', 'Suresh Kumar', undefined, 'staff');
    const adminUser = await getOrCreateUser('demo_admin_uid', 'admin.deshmukh@campus.edu', 'Prof. Deshmukh', undefined, 'admin');

    // 6. Create sample orders for student & staff queues
    const order1 = await db.insert(orders).values({
      tokenNumber: 'C101',
      userId: studentUser.id,
      status: 'preparing',
      totalAmount: 70,
      paymentStatus: 'pay_at_canteen',
      paymentMethod: 'pay_at_canteen',
      prepTimeMinutes: 8,
      specialInstructions: 'Extra spicy sambar please',
      createdAt: new Date(Date.now() - 6 * 60 * 1000), // 6 minutes ago
    }).returning();

    await db.insert(orderItems).values([
      { orderId: order1[0].id, foodItemId: insertedFoods[0].id, quantity: 1, unitPrice: 40, subtotal: 40 }, // Masala Dosa
      { orderId: order1[0].id, foodItemId: insertedFoods[13].id, quantity: 2, unitPrice: 15, subtotal: 30 }, // Masala Chai
    ]);

    await db.insert(payments).values({
      orderId: order1[0].id,
      amount: 70,
      paymentMethod: 'pay_at_canteen',
      status: 'pending',
    });

    // Sample completed order with feedback
    const order2 = await db.insert(orders).values({
      tokenNumber: 'C098',
      userId: studentUser.id,
      status: 'completed',
      totalAmount: 130,
      paymentStatus: 'pay_at_canteen',
      paymentMethod: 'pay_at_canteen',
      prepTimeMinutes: 10,
      completedAt: new Date(Date.now() - 45 * 60 * 1000),
      createdAt: new Date(Date.now() - 55 * 60 * 1000),
    }).returning();

    await db.insert(orderItems).values([
      { orderId: order2[0].id, foodItemId: insertedFoods[5].id, quantity: 1, unitPrice: 130, subtotal: 130 }, // Chicken Biryani Bowl
    ]);

    await db.insert(feedback).values({
      orderId: order2[0].id,
      userId: studentUser.id,
      rating: 5,
      comment: 'Biryani was piping hot and aromatic! Token system saved me 15 minutes of line waiting.',
      foodItemId: insertedFoods[5].id,
    });

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Database seeding failed:', err);
  }
}
