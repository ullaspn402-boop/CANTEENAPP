// Standalone seed script for Neon database
// Run with: node scripts/seed-neon.mjs

import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = 'postgresql://neondb_owner:npg_wpDJCHYOuo04@ep-bitter-violet-aeddim6n-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const client = await pool.connect();
  try {
    console.log('✅ Connected to Neon database!');

    // Check existing items
    const existing = await client.query('SELECT COUNT(*) as count FROM food_items');
    if (parseInt(existing.rows[0].count) >= 5) {
      console.log(`✅ Already seeded: ${existing.rows[0].count} food items found. Nothing to do!`);
      return;
    }

    console.log('🌱 Seeding canteen settings...');
    await client.query(`
      INSERT INTO canteen_settings (is_open, current_wait_time_minutes, announcement)
      VALUES (true, 8, 'Welcome to Campus Canteen! Pre-order meals to skip long counter queues.')
      ON CONFLICT DO NOTHING
    `);

    console.log('🌱 Seeding categories...');
    const catResult = await client.query(`
      INSERT INTO categories (name, slug, description, icon, display_order)
      VALUES
        ('Breakfast', 'breakfast', 'Start your morning with our hot breakfast options', 'Sunrise', 1),
        ('Meals', 'meals', 'Complete wholesome Indian meals', 'UtensilsCrossed', 2),
        ('Snacks', 'snacks', 'Light bites and quick snacks', 'Cookie', 3),
        ('Beverages', 'beverages', 'Hot and cold drinks for all occasions', 'Coffee', 4),
        ('Fast Food', 'fast-food', 'Quick, tasty fast food options', 'Sandwich', 5),
        ('Healthy', 'healthy', 'Nutritious and balanced choices', 'Salad', 6)
      ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug
      RETURNING id, name
    `);

    const catMap = {};
    for (const row of catResult.rows) {
      catMap[row.name] = row.id;
    }
    console.log('  Categories created:', Object.keys(catMap).join(', '));

    // If cats already existed, fetch them
    if (catResult.rows.length === 0) {
      const existing = await client.query('SELECT id, name FROM categories');
      for (const row of existing.rows) catMap[row.name] = row.id;
    }

    console.log('🌱 Seeding food items...');
    const foods = [
      // Breakfast
      { name: 'Masala Dosa', desc: 'Crispy crepe with spiced potato filling, served with coconut chutney and sambar', price: 60, cat: 'Breakfast', veg: true, prep: 12, cal: 320, spice: 'Medium', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80' },
      { name: 'Idli Vada Combo', desc: 'Two fluffy steamed rice cakes with crispy medu vada, sambar and chutney', price: 50, cat: 'Breakfast', veg: true, prep: 8, cal: 280, spice: 'Mild', img: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop&q=80' },
      { name: 'Poha', desc: 'Flattened rice with peas, onions, mustard seeds and curry leaves', price: 35, cat: 'Breakfast', veg: true, prep: 6, cal: 220, spice: 'Mild', img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80' },
      { name: 'Poori Bhaji', desc: 'Deep-fried whole wheat bread with spiced potato curry', price: 55, cat: 'Breakfast', veg: true, prep: 10, cal: 420, spice: 'Medium', img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&auto=format&fit=crop&q=80' },
      { name: 'Egg Bhurji', desc: 'Spiced scrambled eggs with onions, tomatoes and green chillies', price: 60, cat: 'Breakfast', veg: false, prep: 7, cal: 250, spice: 'Medium', img: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&auto=format&fit=crop&q=80' },
      // Meals
      { name: 'North Indian Thali', desc: 'Dal, 2 sabzis, rice, roti, raita and papad — a full wholesome meal', price: 110, cat: 'Meals', veg: true, prep: 15, cal: 720, spice: 'Medium', img: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=600&auto=format&fit=crop&q=80' },
      { name: 'Chicken Biryani', desc: 'Aromatic basmati rice layered with spiced chicken, caramelized onions and saffron', price: 140, cat: 'Meals', veg: false, prep: 20, cal: 650, spice: 'Hot', img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80' },
      { name: 'South Indian Meals', desc: 'Rice with rasam, sambar, 2 curries, papad, pickle and payasam', price: 90, cat: 'Meals', veg: true, prep: 12, cal: 680, spice: 'Medium', img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&auto=format&fit=crop&q=80' },
      { name: 'Rajma Chawal', desc: 'Hearty red kidney bean curry served over steamed basmati rice', price: 80, cat: 'Meals', veg: true, prep: 10, cal: 580, spice: 'Medium', img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80' },
      // Snacks
      { name: 'Samosa (2 pcs)', desc: 'Golden triangular pastry shells stuffed with spiced potatoes and peas', price: 30, cat: 'Snacks', veg: true, prep: 5, cal: 180, spice: 'Medium', img: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80' },
      { name: 'Paneer Pakoda', desc: 'Crispy gram-flour battered cottage cheese fritters with mint chutney', price: 70, cat: 'Snacks', veg: true, prep: 8, cal: 290, spice: 'Mild', img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=600&auto=format&fit=crop&q=80' },
      { name: 'Maggi Noodles', desc: 'Comfort classic instant noodles with masala, topped with fresh vegetables', price: 40, cat: 'Snacks', veg: true, prep: 6, cal: 320, spice: 'Medium', img: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&auto=format&fit=crop&q=80' },
      { name: 'Kathi Roll', desc: 'Egg or paneer wrapped in soft paratha with onions, mint chutney and sauce', price: 75, cat: 'Snacks', veg: true, prep: 8, cal: 380, spice: 'Medium', img: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=600&auto=format&fit=crop&q=80' },
      // Beverages
      { name: 'Masala Chai', desc: 'Freshly brewed spiced milk tea with ginger, cardamom and cinnamon', price: 20, cat: 'Beverages', veg: true, prep: 4, cal: 80, spice: 'None', img: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80' },
      { name: 'Filter Coffee', desc: 'Strong South Indian drip coffee served in traditional steel tumbler and davara', price: 25, cat: 'Beverages', veg: true, prep: 4, cal: 60, spice: 'None', img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=80' },
      { name: 'Cold Coffee', desc: 'Chilled blended coffee with milk and ice cream, topped with chocolate syrup', price: 60, cat: 'Beverages', veg: true, prep: 5, cal: 220, spice: 'None', img: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80' },
      { name: 'Mint Lime Soda', desc: 'Refreshing fizzy drink with fresh mint, lime and a hint of black salt', price: 40, cat: 'Beverages', veg: true, prep: 3, cal: 40, spice: 'None', img: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&auto=format&fit=crop&q=80' },
      // Fast Food
      { name: 'Veg Burger', desc: 'Crispy aloo tikki patty in a soft sesame bun with lettuce, tomato and sauce', price: 65, cat: 'Fast Food', veg: true, prep: 8, cal: 400, spice: 'Mild', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80' },
      { name: 'Peri Peri Fries', desc: 'Golden crispy potato fries tossed in tangy peri peri spice mix', price: 55, cat: 'Fast Food', veg: true, prep: 6, cal: 350, spice: 'Hot', img: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80' },
      { name: 'Bombay Sandwich', desc: 'Triple-decker grilled sandwich with green chutney, cheese and mixed veggies', price: 70, cat: 'Fast Food', veg: true, prep: 7, cal: 420, spice: 'Mild', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80' },
      { name: 'Chicken Burger', desc: 'Juicy grilled chicken patty with lettuce, tomato, pickles and mayo in a brioche bun', price: 110, cat: 'Fast Food', veg: false, prep: 12, cal: 520, spice: 'Medium', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80' },
      // Healthy
      { name: 'Sprouted Moong Chaat', desc: 'Protein-packed sprouted moong beans with tomato, cucumber, lemon and spices', price: 55, cat: 'Healthy', veg: true, prep: 5, cal: 180, spice: 'Mild', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80' },
      { name: 'Fruit Bowl', desc: 'Fresh seasonal fruit salad with a honey-lemon drizzle and chaat masala', price: 70, cat: 'Healthy', veg: true, prep: 5, cal: 160, spice: 'None', img: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&auto=format&fit=crop&q=80' },
      { name: 'Protein Egg Bowl', desc: '3 boiled eggs with sautéed veggies, quinoa and low-fat yogurt dip', price: 90, cat: 'Healthy', veg: false, prep: 8, cal: 320, spice: 'Mild', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80' },
    ];

    let inserted = 0;
    for (const f of foods) {
      const catId = catMap[f.cat];
      if (!catId) { console.log(`  ⚠️  Category not found: ${f.cat}`); continue; }
      await client.query(`
        INSERT INTO food_items (name, description, price, category_id, is_veg, prep_time_minutes, spice_level, image_url, is_available, is_active, rating, rating_count, total_orders)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,true,4.2,18,124)
        ON CONFLICT DO NOTHING
      `, [f.name, f.desc, f.price, catId, f.veg, f.prep, f.spice, f.img]);
      inserted++;
    }

    const finalCount = await client.query('SELECT COUNT(*) as count FROM food_items');
    console.log(`\n✅ SUCCESS! ${finalCount.rows[0].count} food items are now in your Neon database!`);
    console.log('✅ Categories seeded:', Object.keys(catMap).join(', '));
    console.log('\n🚀 Your Neon database is ready for Vercel deployment!');

  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
