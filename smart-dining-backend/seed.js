const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Load DATABASE_URL from .env if not present
if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^DATABASE_URL=["']?([^"'\r\n]+)["']?/m);
    if (match) {
      process.env.DATABASE_URL = match[1];
    }
  }
}

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not defined in environment or .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  console.log('Starting Smart Dining System database seeding...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Hash default passwords using bcryptjs
    const defaultPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // 1. Insert Super Admin
    console.log('Inserting Super Admin...');
    const superAdminRes = await client.query(
      `INSERT INTO super_admins (name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name, email;`,
      ['Master Super Admin', 'admin@smartdining.com', passwordHash]
    );
    const superAdminId = superAdminRes.rows[0].id;
    console.log(`  Super Admin ID: ${superAdminId}`);

    // 2. Insert 2 Test Restaurants
    const restaurantsData = [
      {
        name: 'La Bella Italia',
        address: '123 Gourmet Street, Downtown',
        email: 'contact@labellaitalia.com',
        ownerEmail: 'owner@labellaitalia.com',
        phone: '+1-555-0191',
        avgDuration: 60,
        categories: [
          {
            name: 'Starters & Antipasti',
            display_order: 1,
            items: [
              { name: 'Bruschetta Classica', description: 'Grilled bread with garlic, olive oil, and fresh tomatoes', price: 12.50 },
              { name: 'Caprese Salad', description: 'Fresh buffalo mozzarella, ripe tomatoes, and basil pesto', price: 14.00 }
            ]
          },
          {
            name: 'Artisanal Pasta & Mains',
            display_order: 2,
            items: [
              { name: 'Truffle Tagliatelle', description: 'Handmade pasta with black truffle cream sauce', price: 24.99 },
              { name: 'Wood-fired Margherita Pizza', description: 'San Marzano tomatoes, fresh mozzarella, and basil', price: 18.50 },
              { name: 'Osso Buco alla Milanese', description: 'Braised veal shanks with saffron risotto', price: 34.00 }
            ]
          }
        ]
      },
      {
        name: 'Tokyo Sushi Bar',
        address: '456 Cherry Blossom Way, Midtown',
        email: 'contact@tokyosushibar.com',
        ownerEmail: 'owner@tokyosushibar.com',
        phone: '+1-555-0282',
        avgDuration: 45,
        categories: [
          {
            name: 'Appetizers & Nigiri',
            display_order: 1,
            items: [
              { name: 'Edamame with Sea Salt', description: 'Steamed soybeans sprinkled with Maldon sea salt', price: 7.00 },
              { name: 'Salmon & Tuna Nigiri Combo', description: 'Chef selected fresh salmon and bluefin tuna nigiri', price: 16.50 }
            ]
          },
          {
            name: 'Signature Rolls & Bento',
            display_order: 2,
            items: [
              { name: 'Dragon Roll', description: 'Eel, cucumber topped with avocado and unagi sauce', price: 19.00 },
              { name: 'Spicy Tuna Roll', description: 'Fresh tuna with sriracha mayo, scallions, and tempura crunch', price: 15.50 },
              { name: 'Deluxe Sashimi Bento', description: 'Assorted premium sashimi with miso soup and salad', price: 32.00 }
            ]
          }
        ]
      }
    ];

    for (let rIndex = 0; rIndex < restaurantsData.length; rIndex++) {
      const rData = restaurantsData[rIndex];
      console.log(`Inserting Restaurant ${rIndex + 1}: ${rData.name}...`);

      const restRes = await client.query(
        `INSERT INTO restaurants (name, address, email, phone, password_hash, avg_dining_duration_minutes, created_by_super_admin_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO UPDATE SET
           name = EXCLUDED.name,
           address = EXCLUDED.address,
           phone = EXCLUDED.phone
         RETURNING id;`,
        [rData.name, rData.address, rData.email, rData.phone, passwordHash, rData.avgDuration, superAdminId]
      );
      const restaurantId = restRes.rows[0].id;
      console.log(`  Restaurant ID: ${restaurantId}`);

      // 3. Insert 1 Owner + 1 Staff account per restaurant
      const staffList = [
        { name: `${rData.name} Owner`, email: rData.ownerEmail, role: 'owner' },
        { name: `${rData.name} Head Staff`, email: `staff@${rData.email.split('@')[1]}`, role: 'staff' }
      ];

      for (const staff of staffList) {
        await client.query(
          `INSERT INTO restaurant_staff (restaurant_id, name, email, password_hash, role)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (restaurant_id, email) DO UPDATE SET
             name = EXCLUDED.name,
             role = EXCLUDED.role;`,
          [restaurantId, staff.name, staff.email, passwordHash, staff.role]
        );
      }
      console.log(`  Added Owner & Staff accounts for ${rData.name}`);

      // 4. Insert 8 Tables per restaurant in a 4x2 Grid (rows 1..4, cols 1..2)
      // Grid capacities: 2, 2, 4, 4, 4, 6, 6, 8
      const capacities = [2, 2, 4, 4, 4, 6, 6, 8];
      let tCount = 1;
      for (let row = 1; row <= 4; row++) {
        for (let col = 1; col <= 2; col++) {
          const tableNum = `T${tCount}`;
          const capacity = capacities[tCount - 1];

          await client.query(
            `INSERT INTO tables (restaurant_id, table_number, capacity, grid_row, grid_col, status)
             VALUES ($1, $2, $3, $4, $5, 'free')
             ON CONFLICT (restaurant_id, grid_row, grid_col) DO UPDATE SET
               table_number = EXCLUDED.table_number,
               capacity = EXCLUDED.capacity,
               status = 'free';`,
            [restaurantId, tableNum, capacity, row, col]
          );
          tCount++;
        }
      }
      console.log(`  Added 8 tables (4x2 grid) for ${rData.name}`);

      // 5. Insert 2 Categories and 5 Menu Items per restaurant
      for (const catData of rData.categories) {
        const catRes = await client.query(
          `INSERT INTO menu_categories (restaurant_id, name, display_order)
           VALUES ($1, $2, $3)
           RETURNING id;`,
          [restaurantId, catData.name, catData.display_order]
        );
        const categoryId = catRes.rows[0].id;

        for (const item of catData.items) {
          await client.query(
            `INSERT INTO menu_items (restaurant_id, category_id, name, description, price, is_available)
             VALUES ($1, $2, $3, $4, $5, true);`,
            [restaurantId, categoryId, item.name, item.description, item.price]
          );
        }
      }
      console.log(`  Added 2 menu categories & 5 menu items for ${rData.name}`);
    }

    await client.query('COMMIT');
    console.log('\nSeeding completed successfully with zero constraint errors!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed with error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
