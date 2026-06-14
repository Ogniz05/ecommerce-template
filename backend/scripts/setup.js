#!/usr/bin/env node
/**
 * Auto-setup script for ecommerce-template
 * Reads .env, creates DB, runs schema + seed
 *
 * Usage: node backend/scripts/setup.js
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Load .env from project root
const envPath = path.resolve(__dirname, '../../.env');
if (!fs.existsSync(envPath)) {
  console.error('ERROR: .env file not found. Copy .env.example to .env and configure it first.');
  process.exit(1);
}

require('dotenv').config({ path: envPath });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

const DB_NAME = process.env.DB_NAME || 'ecommerce_template';
const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
const seedPath = path.resolve(__dirname, '../../database/seed.sql');

async function run() {
  console.log('\n🚀 Ecommerce Template - Setup\n');
  console.log(`📡 Connecting to MySQL at ${config.host}:${config.port}...`);

  let conn;
  try {
    conn = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL\n');
  } catch (err) {
    console.error('❌ Failed to connect to MySQL:', err.message);
    console.error('\nMake sure Laragon MySQL is running and credentials in .env are correct.');
    process.exit(1);
  }

  try {
    // Create database
    console.log(`📦 Creating database "${DB_NAME}"...`);
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${DB_NAME}\``);
    console.log(`✅ Database "${DB_NAME}" ready\n`);

    // Run schema
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ database/schema.sql not found');
      process.exit(1);
    }
    console.log('🏗️  Running schema.sql...');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const schemaStatements = schema.split(';').filter(s => s.trim().length > 0);
    let schemaCount = 0;
    for (const stmt of schemaStatements) {
      if (stmt.trim()) {
        try {
          await conn.query(stmt);
          schemaCount++;
        } catch (e) {
          // Ignore "table already exists" errors
          if (!e.message.includes('already exists') && !e.message.includes('Duplicate')) {
            console.warn(`  ⚠️  Schema warning: ${e.message.substring(0, 80)}`);
          }
        }
      }
    }
    console.log(`✅ Schema applied (${schemaCount} statements)\n`);

    // Run seed
    if (!fs.existsSync(seedPath)) {
      console.warn('⚠️  database/seed.sql not found. Skipping seed data.');
    } else {
      console.log('🌱 Running seed.sql...');
      const seed = fs.readFileSync(seedPath, 'utf8');
      const seedStatements = seed.split(';').filter(s => s.trim().length > 0);
      let seedCount = 0;
      for (const stmt of seedStatements) {
        if (stmt.trim()) {
          try {
            await conn.query(stmt);
            seedCount++;
          } catch (e) {
            if (!e.message.includes('Duplicate entry')) {
              console.warn(`  ⚠️  Seed warning: ${e.message.substring(0, 80)}`);
            }
          }
        }
      }
      console.log(`✅ Seed data loaded (${seedCount} statements)\n`);
    }

    // Verify
    const [tables] = await conn.query('SHOW TABLES');
    console.log(`📊 Tables created: ${tables.length}`);
    const [products] = await conn.query('SELECT COUNT(*) as c FROM products');
    console.log(`📦 Products in DB: ${products[0].c}`);
    const [users] = await conn.query('SELECT COUNT(*) as c FROM users');
    console.log(`👤 Users in DB: ${users[0].c}\n`);

    console.log('✨ Setup complete!\n');
    console.log('📋 Next steps:');
    console.log('   1. Configure your .env file (Stripe, PayPal, SMTP keys)');
    console.log('   2. Start backend:  cd backend && npm install && npm run dev');
    console.log('   3. Start frontend: cd frontend && npm install && npm run dev');
    console.log(`   4. Admin login:    http://localhost:5173/admin`);
    console.log(`      Email: admin@example.com`);
    console.log(`      Password: Admin@123456\n`);

  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    if (conn) await conn.end();
    process.exit(1);
  }

  await conn.end();
  process.exit(0);
}

run();
