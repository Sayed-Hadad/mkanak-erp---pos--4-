import express from "express";
import cors from "cors";
import pg from "pg";
import { PgWrapper } from "./pg-wrapper.js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

console.log("🚀 Starting Mkanak ERP Backend...");
console.log("📍 Node version:", process.version);
console.log("🌍 Environment:", process.env.NODE_ENV || 'development');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PostgreSQL connection
const { Pool } = pg;

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set!");
  console.error("Please set DATABASE_URL in Railway or your .env file");
  process.exit(1);
}

console.log("💾 Connecting to PostgreSQL...");
console.log("📍 Database URL starts with:", process.env.DATABASE_URL.substring(0, 20) + "...");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

let db;
try {
  // Test connection
  const client = await pool.connect();
  console.log("✅ PostgreSQL connected successfully");
  client.release();
  // Wrap pool with SQLite-like API
  db = new PgWrapper(pool);
} catch (error) {
  console.error("❌ Database connection failed:", error);
  process.exit(1);
}

// Initialize Database Schema
await db.exec(`
  CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    is_main INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('super_admin', 'branch_manager', 'cashier')) NOT NULL,
    branch_id INTEGER,
    FOREIGN KEY(branch_id) REFERENCES branches(id)
  );

  CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    barcode TEXT UNIQUE,
    category_id INTEGER,
    price REAL NOT NULL,
    cost REAL NOT NULL,
    min_stock INTEGER DEFAULT 5,
    FOREIGN KEY(category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    branch_id INTEGER,
    quantity INTEGER DEFAULT 0,
    UNIQUE(product_id, branch_id),
    FOREIGN KEY(product_id) REFERENCES products(id),
    FOREIGN KEY(branch_id) REFERENCES branches(id)
  );

  CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    points INTEGER DEFAULT 0,
    classification TEXT DEFAULT 'Regular'
  );

  CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER,
    user_id INTEGER,
    customer_id INTEGER,
    total_amount REAL,
    tax REAL,
    discount REAL,
    payment_method TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(branch_id) REFERENCES branches(id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price REAL,
    FOREIGN KEY(sale_id) REFERENCES sales(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS transfers (
    id SERIAL PRIMARY KEY,
    from_branch_id INTEGER,
    to_branch_id INTEGER,
    status TEXT DEFAULT 'pending',
    type TEXT DEFAULT 'send',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(from_branch_id) REFERENCES branches(id),
    FOREIGN KEY(to_branch_id) REFERENCES branches(id)
  );

  CREATE TABLE IF NOT EXISTS transfer_items (
    id SERIAL PRIMARY KEY,
    transfer_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    FOREIGN KEY(transfer_id) REFERENCES transfers(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS returns (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER,
    branch_id INTEGER,
    user_id INTEGER,
    total_return_amount REAL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sale_id) REFERENCES sales(id),
    FOREIGN KEY(branch_id) REFERENCES branches(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS return_items (
    id SERIAL PRIMARY KEY,
    return_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price REAL,
    FOREIGN KEY(return_id) REFERENCES returns(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    branch_id INTEGER,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(branch_id) REFERENCES branches(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    from_branch_id INTEGER,
    to_branch_id INTEGER,
    from_user_id INTEGER,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER DEFAULT 0,
    FOREIGN KEY(from_branch_id) REFERENCES branches(id),
    FOREIGN KEY(to_branch_id) REFERENCES branches(id),
    FOREIGN KEY(from_user_id) REFERENCES users(id)
  );
`);

// Seed initial data if empty
const userCountResult = await db.prepare("SELECT COUNT(*) as count FROM users").get();
if (parseInt(userCountResult.count) === 0) {
  console.log("Seeding initial data...");
  // Use RETURNING to get inserted IDs in PostgreSQL style
  const mainBranchResult = await db.query("INSERT INTO branches (name, is_main) VALUES ($1, $2) RETURNING id", ["Main Warehouse", 1]);
  const mainBranchId = mainBranchResult.rows[0].id;
  await db.query("INSERT INTO branches (name) VALUES ($1)", ["Branch 1"]);
  await db.query("INSERT INTO users (username, password, role, branch_id) VALUES ($1, $2, $3, $4)", ["admin", "admin123", "super_admin", mainBranchId]);
  await db.query("INSERT INTO categories (name) VALUES ($1)", ["General"]);
  
  // Add some products
  const p1Result = await db.query("INSERT INTO products (name, barcode, category_id, price, cost, min_stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id", ["كتاب تعلم البرمجة", "1001", 1, 150, 100, 5]);
  const p2Result = await db.query("INSERT INTO products (name, barcode, category_id, price, cost, min_stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id", ["رواية الخيال", "1002", 1, 80, 50, 10]);
  const p3Result = await db.query("INSERT INTO products (name, barcode, category_id, price, cost, min_stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id", ["دفتر ملاحظات", "1003", 1, 25, 10, 20]);

  // Add inventory for main branch
  await db.query("INSERT INTO inventory (product_id, branch_id, quantity) VALUES ($1, $2, $3)", [p1Result.rows[0].id, 1, 50]);
  await db.query("INSERT INTO inventory (product_id, branch_id, quantity) VALUES ($1, $2, $3)", [p2Result.rows[0].id, 1, 30]);
  await db.query("INSERT INTO inventory (product_id, branch_id, quantity) VALUES ($1, $2, $3)", [p3Result.rows[0].id, 1, 100]);

  console.log("Seeding complete. Admin user: admin / admin123");
}

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - Allow requests from Vercel frontend
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(null, true); // For development, allow all origins
    }
  },
  credentials: true
}));

app.use(express.json());

console.log("🛣️  Setting up API routes...");

// API Routes
app.get("/api/health", async (req, res) => {
  console.log("❤️  Health check requested");
  const userCount = await db.prepare("SELECT COUNT(*) as count FROM users").get();
  res.json({ 
    status: "ok", 
    message: "Mkanak ERP Server is running",
    users: userCount.count 
  });
});

// Seed endpoint - Only for initial setup
app.post("/api/seed", async (req, res) => {
  try {
    const userCount = await db.prepare("SELECT COUNT(*) as count FROM users").get();
    
    if (userCount.count > 0) {
      return res.status(400).json({ error: "Database already seeded" });
    }

    console.log("Manual seeding triggered...");
    const mainBranch = await db.prepare("INSERT INTO branches (name, is_main) VALUES (?, ?)").run("Main Warehouse", 1);
    await db.prepare("INSERT INTO branches (name) VALUES (?)").run("Branch 1");
    await db.prepare("INSERT INTO users (username, password, role, branch_id) VALUES (?, ?, ?, ?)").run("admin", "admin123", "super_admin", mainBranch.lastInsertRowid);
    await db.prepare("INSERT INTO categories (name) VALUES (?)").run("General");
    
    // Add some products
    const p1 = await db.prepare("INSERT INTO products (name, barcode, category_id, price, cost, min_stock) VALUES (?, ?, ?, ?, ?, ?)").run("كتاب تعلم البرمجة", "1001", 1, 150, 100, 5);
    const p2 = await db.prepare("INSERT INTO products (name, barcode, category_id, price, cost, min_stock) VALUES (?, ?, ?, ?, ?, ?)").run("رواية الخيال", "1002", 1, 80, 50, 10);
    const p3 = await db.prepare("INSERT INTO products (name, barcode, category_id, price, cost, min_stock) VALUES (?, ?, ?, ?, ?, ?)").run("دفتر ملاحظات", "1003", 1, 25, 10, 20);

    // Add inventory for main branch
    await db.prepare("INSERT INTO inventory (product_id, branch_id, quantity) VALUES (?, ?, ?)").run(p1.lastInsertRowid, 1, 50);
    await db.prepare("INSERT INTO inventory (product_id, branch_id, quantity) VALUES (?, ?, ?)").run(p2.lastInsertRowid, 1, 30);
    await db.prepare("INSERT INTO inventory (product_id, branch_id, quantity) VALUES (?, ?, ?)").run(p3.lastInsertRowid, 1, 100);

    console.log("Manual seeding complete!");
    res.json({ success: true, message: "Database seeded successfully. Login with admin/admin123" });
  } catch (error) {
    console.error("Seeding error:", error);
    res.status(500).json({ error: "Seeding failed: " + error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await db.prepare("SELECT u.*, b.name as branch_name FROM users u LEFT JOIN branches b ON u.branch_id = b.id WHERE username = ? AND password = ?").get(username, password);
  if (user) {
    res.json({ user: { id: user.id, username: user.username, role: user.role, branch_id: user.branch_id, branch_name: user.branch_name } });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.get("/api/dashboard/stats", async (req, res) => {
  const stats = {
    totalSales: await db.prepare("SELECT SUM(total_amount) as total FROM sales").get(),
    totalRevenue: await db.prepare("SELECT SUM(total_amount) as total FROM sales WHERE created_at >= date('now')").get(),
    lowStock: await db.prepare("SELECT COUNT(*) as count FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.quantity <= p.min_stock").get(),
    branchSales: await db.prepare("SELECT b.name, SUM(s.total_amount) as total FROM branches b LEFT JOIN sales s ON b.id = s.branch_id GROUP BY b.id").all()
  };
  res.json(stats);
});

app.get("/api/products", async (req, res) => {
  const { branch_id } = req.query;
  
  if (branch_id) {
    const products = await db.prepare(`
      SELECT p.*, c.name as category_name, COALESCE(i.quantity, 0) as stock
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      JOIN inventory i ON p.id = i.product_id 
      WHERE i.branch_id = ? AND i.quantity > 0
    `).all(branch_id);
    res.json(products);
  } else {
    const products = await db.prepare(`
      SELECT p.id, p.name, p.barcode, p.category_id, p.price, p.cost, p.min_stock, 
             c.name as category_name, SUM(COALESCE(i.quantity, 0)) as stock
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN inventory i ON p.id = i.product_id 
      GROUP BY p.id, p.name, p.barcode, p.category_id, p.price, p.cost, p.min_stock, c.name
    `).all();
    res.json(products);
  }
});

app.get("/api/products/:id/stock", async (req, res) => {
  const { id } = req.params;
  const stock = await db.prepare(`
    SELECT b.name as branch_name, COALESCE(i.quantity, 0) as quantity
    FROM branches b
    LEFT JOIN inventory i ON b.id = i.branch_id AND i.product_id = ?
    WHERE i.quantity > 0 OR b.is_main = 1
  `).all(id);
  res.json(stock);
});

app.post("/api/products", async (req, res) => {
  const { name, barcode, category_id, price, cost, min_stock, initial_stock, branch_id } = req.body;
  try {
    const transaction = db.transaction(async (db) => {
      const productResult = await db.prepare(`
        INSERT INTO products (name, barcode, category_id, price, cost, min_stock) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(name, barcode, category_id, price, cost, min_stock);
      
      const productId = productResult.lastInsertRowid;
      
      if (initial_stock > 0 && branch_id) {
        await db.prepare(`
          INSERT INTO inventory (product_id, branch_id, quantity) 
          VALUES (?, ?, ?)
        `).run(productId, branch_id, initial_stock);
      }
      
      return productId;
    });

    const productId = await transaction();
    res.json({ success: true, productId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/categories", async (req, res) => {
  const categories = await db.prepare("SELECT * FROM categories").all();
  res.json(categories);
});

app.get("/api/inventory", async (req, res) => {
  const { branch_id } = req.query;
  let query = `
    SELECT p.id as product_id, p.name as product_name, b.id as branch_id, b.name as branch_name, i.quantity 
    FROM inventory i 
    JOIN products p ON i.product_id = p.id 
    JOIN branches b ON i.branch_id = b.id
  `;
  
  if (branch_id) {
    query += " WHERE i.branch_id = ?";
    const inventory = await db.prepare(query).all(branch_id);
    res.json(inventory);
  } else {
    const inventory = await db.prepare(query).all();
    res.json(inventory);
  }
});

app.get("/api/transfers", async (req, res) => {
  const { branch_id } = req.query;
  let query = `
    SELECT t.*, fb.name as from_branch_name, tb.name as to_branch_name 
    FROM transfers t
    JOIN branches fb ON t.from_branch_id = fb.id
    JOIN branches tb ON t.to_branch_id = tb.id
  `;
  
  if (branch_id) {
    query += " WHERE t.from_branch_id = ? OR t.to_branch_id = ?";
    const transfers = await db.prepare(query + " ORDER BY t.created_at DESC").all(branch_id, branch_id);
    res.json(transfers);
  } else {
    const transfers = await db.prepare(query + " ORDER BY t.created_at DESC").all();
    res.json(transfers);
  }
});

app.get("/api/transfers/:id", async (req, res) => {
  const { id } = req.params;
  const transfer = await db.prepare(`
    SELECT t.*, fb.name as from_branch_name, tb.name as to_branch_name 
    FROM transfers t
    JOIN branches fb ON t.from_branch_id = fb.id
    JOIN branches tb ON t.to_branch_id = tb.id
    WHERE t.id = ?
  `).get(id);
  
  if (!transfer) return res.status(404).json({ error: "Transfer not found" });
  
  const items = await db.prepare(`
    SELECT ti.*, p.name as product_name, p.barcode
    FROM transfer_items ti
    JOIN products p ON ti.product_id = p.id
    WHERE ti.transfer_id = ?
  `).all(id);
  
  res.json({ ...transfer, items });
});

app.post("/api/transfers", async (req, res) => {
  const { from_branch_id, to_branch_id, items, type = 'send' } = req.body;
  
  if (!from_branch_id || !to_branch_id || !items || items.length === 0) {
    return res.status(400).json({ error: "بيانات التحويل غير مكتملة" });
  }

  try {
    const transaction = db.transaction(async (db) => {
      const transferResult = await db.prepare(`
        INSERT INTO transfers (from_branch_id, to_branch_id, status, type) 
        VALUES (?, ?, 'pending', ?)
      `).run(from_branch_id, to_branch_id, type);
      
      const transferId = transferResult.lastInsertRowid;
      
      for (const item of items) {
        await db.prepare(`
          INSERT INTO transfer_items (transfer_id, product_id, quantity) 
          VALUES (?, ?, ?)
        `).run(transferId, item.product_id, item.quantity);
      }

      const notifiedBranchId = type === 'send' ? to_branch_id : from_branch_id;
      const creatorBranchId = type === 'send' ? from_branch_id : to_branch_id;

      const creatorBranch = await db.prepare("SELECT name FROM branches WHERE id = ?").get(creatorBranchId);
      const title = type === 'send' ? "طلب تحويل وارد" : "طلب تزويد مخزني";
      const message = type === 'send' 
        ? `وصلك طلب تحويل مخزني جديد من ${creatorBranch.name}`
        : `يطلب منك ${creatorBranch.name} تزويده بمنتجات من مخزنك`;

      await db.prepare(`
        INSERT INTO notifications (branch_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `).run(notifiedBranchId, title, message, "transfer");

      return transferId;
    });

    await transaction();
    res.json({ success: true });
  } catch (error) {
    console.error("Error creating transfer:", error);
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/transfers/:id/accept", async (req, res) => {
  const { id } = req.params;
  try {
    const transaction = db.transaction(async (db) => {
      const transfer = await db.prepare("SELECT * FROM transfers WHERE id = ?").get(id);
      if (!transfer || transfer.status !== 'pending') {
        throw new Error("Invalid transfer or already processed");
      }

      const items = await db.prepare("SELECT * FROM transfer_items WHERE transfer_id = ?").all(id);
      
      for (const item of items) {
        const sourceStock = await db.prepare(`
          SELECT id, quantity FROM inventory WHERE product_id = ? AND branch_id = ?
        `).get(item.product_id, transfer.from_branch_id);

        if (sourceStock) {
          await db.prepare(`
            UPDATE inventory SET quantity = quantity - ? 
            WHERE id = ?
          `).run(item.quantity, sourceStock.id);
        } else {
          await db.prepare(`
            INSERT INTO inventory (product_id, branch_id, quantity) 
            VALUES (?, ?, ?)
          `).run(item.product_id, transfer.from_branch_id, -item.quantity);
        }
        
        const destStock = await db.prepare(`
          SELECT id FROM inventory WHERE product_id = ? AND branch_id = ?
        `).get(item.product_id, transfer.to_branch_id);
        
        if (destStock) {
          await db.prepare(`
            UPDATE inventory SET quantity = quantity + ? 
            WHERE id = ?
          `).run(item.quantity, destStock.id);
        } else {
          await db.prepare(`
            INSERT INTO inventory (product_id, branch_id, quantity) 
            VALUES (?, ?, ?)
          `).run(item.product_id, transfer.to_branch_id, item.quantity);
        }
      }

      await db.prepare("UPDATE transfers SET status = 'completed' WHERE id = ?").run(id);
      
      const notifiedBranchId = transfer.type === 'send' ? transfer.from_branch_id : transfer.to_branch_id;
      const acceptorBranchId = transfer.type === 'send' ? transfer.to_branch_id : transfer.from_branch_id;

      const acceptorBranch = await db.prepare("SELECT name FROM branches WHERE id = ?").get(acceptorBranchId);
      await db.prepare(`
        INSERT INTO notifications (branch_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `).run(
        notifiedBranchId, 
        "تم قبول التحويل", 
        `تم قبول طلب التحويل من قبل ${acceptorBranch.name}`,
        "transfer"
      );

      return true;
    });

    await transaction();
    res.json({ success: true });
  } catch (error) {
    console.error("Error accepting transfer:", error);
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/transfers/:id/reject", async (req, res) => {
  const { id } = req.params;
  try {
    await db.prepare("UPDATE transfers SET status = 'rejected' WHERE id = ?").run(id);
    
    const transfer = await db.prepare("SELECT * FROM transfers WHERE id = ?").get(id);
    const notifiedBranchId = transfer.type === 'send' ? transfer.from_branch_id : transfer.to_branch_id;
    const rejectorBranchId = transfer.type === 'send' ? transfer.to_branch_id : transfer.from_branch_id;
    
    const rejectorBranch = await db.prepare("SELECT name FROM branches WHERE id = ?").get(rejectorBranchId);
    
    await db.prepare(`
      INSERT INTO notifications (branch_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `).run(
      notifiedBranchId, 
      "تم رفض التحويل", 
      `تم رفض طلب التحويل من قبل ${rejectorBranch.name}`,
      "transfer"
    );

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/notifications", async (req, res) => {
  const { branch_id } = req.query;
  if (!branch_id) return res.status(400).json({ error: "branch_id required" });
  
  const notifications = await db.prepare(`
    SELECT * FROM notifications 
    WHERE branch_id = ? 
    ORDER BY created_at DESC 
    LIMIT 20
  `).all(branch_id);
  res.json(notifications);
});

app.put("/api/notifications/:id/read", async (req, res) => {
  const { id } = req.params;
  await db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
  res.json({ success: true });
});

app.get("/api/messages", async (req, res) => {
  const { branch_id } = req.query;
  if (!branch_id) return res.status(400).json({ error: "branch_id required" });

  try {
    const messages = await db.prepare(`
      SELECT m.*, fb.name as from_branch_name, u.username as from_username
      FROM messages m
      JOIN branches fb ON m.from_branch_id = fb.id
      JOIN users u ON m.from_user_id = u.id
      WHERE m.to_branch_id = ? OR m.from_branch_id = ?
      ORDER BY m.created_at ASC
    `).all(branch_id, branch_id);
    res.json(messages);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/messages", async (req, res) => {
  const { from_branch_id, to_branch_id, from_user_id, message } = req.body;
  if (!from_branch_id || !to_branch_id || !from_user_id || !message) {
    return res.status(400).json({ error: "بيانات الرسالة غير مكتملة" });
  }

  try {
    const result = await db.prepare(`
      INSERT INTO messages (from_branch_id, to_branch_id, from_user_id, message)
      VALUES (?, ?, ?, ?)
    `).run(from_branch_id, to_branch_id, from_user_id, message);

    const fromBranch = await db.prepare("SELECT name FROM branches WHERE id = ?").get(from_branch_id);
    await db.prepare(`
      INSERT INTO notifications (branch_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `).run(to_branch_id, "رسالة جديدة", `وصلتك رسالة جديدة من فرع ${fromBranch.name}`, "message");

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/branches", async (req, res) => {
  const branches = await db.prepare("SELECT * FROM branches").all();
  res.json(branches);
});

app.post("/api/branches", async (req, res) => {
  const { name, location, username, password } = req.body;
  
  try {
    const transaction = db.transaction(async (db) => {
      const branchResult = await db.prepare("INSERT INTO branches (name, location) VALUES (?, ?)").run(name, location);
      const branchId = branchResult.lastInsertRowid;
      
      if (username && password) {
        await db.prepare("INSERT INTO users (username, password, role, branch_id) VALUES (?, ?, ?, ?)").run(
          username, 
          password, 
          'branch_manager', 
          branchId
        );
      }
      return branchId;
    });

    const branchId = await transaction();
    res.json({ success: true, branchId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put("/api/branches/:id", async (req, res) => {
  const { id } = req.params;
  const { name, location } = req.body;
  try {
    await db.prepare("UPDATE branches SET name = ?, location = ? WHERE id = ?").run(name, location, id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/branches/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.prepare("DELETE FROM users WHERE branch_id = ?").run(id);
    await db.prepare("DELETE FROM branches WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.prepare("DELETE FROM inventory WHERE product_id = ?").run(id);
    await db.prepare("DELETE FROM products WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { name, barcode, category_id, price, cost, min_stock } = req.body;
  try {
    await db.prepare(`
      UPDATE products 
      SET name = ?, barcode = ?, category_id = ?, price = ?, cost = ?, min_stock = ? 
      WHERE id = ?
    `).run(name, barcode, category_id, price, cost, min_stock, id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/sales", async (req, res) => {
  const { branch_id, user_id, customer_id, total_amount, tax, discount, payment_method, items } = req.body;
  
  if (!customer_id) {
    return res.status(400).json({ error: "يجب اختيار عميل لإتمام عملية البيع" });
  }

  try {
    const transaction = db.transaction(async (db) => {
      const saleResult = await db.prepare(`
        INSERT INTO sales (branch_id, user_id, customer_id, total_amount, tax, discount, payment_method) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(branch_id, user_id, customer_id, total_amount, tax, discount, payment_method);
      
      const saleId = saleResult.lastInsertRowid;
      
      for (const item of items) {
        await db.prepare(`
          INSERT INTO sale_items (sale_id, product_id, quantity, price) 
          VALUES (?, ?, ?, ?)
        `).run(saleId, item.id, item.quantity, item.price);
        
        await db.prepare(`
          UPDATE inventory SET quantity = quantity - ? 
          WHERE product_id = ? AND branch_id = ?
        `).run(item.quantity, item.id, branch_id);
      }
      return saleId;
    });

    const saleId = await transaction();
    res.json({ success: true, saleId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/customers", async (req, res) => {
  const { name, phone } = req.body;
  try {
    const result = await db.prepare("INSERT INTO customers (name, phone) VALUES (?, ?)").run(name, phone);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/customers", async (req, res) => {
  try {
    const customers = await db.prepare("SELECT * FROM customers").all();
    res.json(customers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/sales", async (req, res) => {
  try {
    const sales = await db.prepare(`
      SELECT s.*, c.name as customer_name, b.name as branch_name, u.username 
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN branches b ON s.branch_id = b.id
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
      LIMIT 50
    `).all();
    res.json(sales);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/sales/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const sale = await db.prepare(`
      SELECT s.*, c.name as customer_name, c.phone as customer_phone, b.name as branch_name, u.username 
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN branches b ON s.branch_id = b.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = ?
    `).get(id);

    if (!sale) {
      return res.status(404).json({ error: "الفاتورة غير موجودة" });
    }

    const items = await db.prepare(`
      SELECT si.*, p.name as product_name, p.barcode
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `).all(id);

    const returnedItems = await db.prepare(`
      SELECT ri.product_id, SUM(ri.quantity) as returned_qty
      FROM return_items ri
      JOIN returns r ON ri.return_id = r.id
      WHERE r.sale_id = ?
      GROUP BY ri.product_id
    `).all(id);

    const itemsWithReturns = items.map((item) => {
      const returned = returnedItems.find(r => r.product_id === item.product_id);
      return {
        ...item,
        returned_qty: returned ? returned.returned_qty : 0
      };
    });

    res.json({ ...sale, items: itemsWithReturns });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/returns", async (req, res) => {
  const { sale_id, branch_id, user_id, total_return_amount, reason, items } = req.body;
  
  try {
    const transaction = db.transaction(async (db) => {
      const returnResult = await db.prepare(`
        INSERT INTO returns (sale_id, branch_id, user_id, total_return_amount, reason) 
        VALUES (?, ?, ?, ?, ?)
      `).run(sale_id, branch_id, user_id, total_return_amount, reason);
      
      const returnId = returnResult.lastInsertRowid;
      
      for (const item of items) {
        await db.prepare(`
          INSERT INTO return_items (return_id, product_id, quantity, price) 
          VALUES (?, ?, ?, ?)
        `).run(returnId, item.product_id, item.quantity, item.price);
        
        await db.prepare(`
          UPDATE inventory SET quantity = quantity + ? 
          WHERE product_id = ? AND branch_id = ?
        `).run(item.quantity, item.product_id, branch_id);
      }
      return returnId;
    });

    const returnId = await transaction();
    res.json({ success: true, returnId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/returns", async (req, res) => {
  try {
    const returns = await db.prepare(`
      SELECT r.*, s.id as sale_id, b.name as branch_name, u.username 
      FROM returns r
      JOIN sales s ON r.sale_id = s.id
      JOIN branches b ON r.branch_id = b.id
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `).all();
    res.json(returns);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/reports/stats", async (req, res) => {
  try {
    const totalSales = await db.prepare("SELECT SUM(total_amount) as total FROM sales").get();
    const totalTax = await db.prepare("SELECT SUM(tax) as total FROM sales").get();
    const totalOrders = await db.prepare("SELECT COUNT(*) as count FROM sales").get();
    
    const topProducts = await db.prepare(`
      SELECT p.name, SUM(si.quantity) as qty
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      GROUP BY p.id
      ORDER BY qty DESC
      LIMIT 5
    `).all();

    const dailySales = await db.prepare(`
      SELECT strftime('%Y-%m-%d', created_at) as date, SUM(total_amount) as sales
      FROM sales
      GROUP BY date
      ORDER BY date DESC
      LIMIT 7
    `).all();

    const salesByCategory = await db.prepare(`
      SELECT c.name, SUM(si.quantity * si.price) as total
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      GROUP BY c.id
    `).all();

    res.json({
      totalSales: totalSales.total || 0,
      totalTax: totalTax.total || 0,
      totalOrders: totalOrders.count || 0,
      topProducts,
      dailySales: dailySales.reverse(),
      salesByCategory
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('⚠️  Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

console.log(`🚀 Attempting to start server on port ${PORT}...`);
console.log(`🌍 Allowed origins: ${allowedOrigins.join(', ')}`);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ SERVER STARTED SUCCESSFULLY`);
  console.log(`${'='.repeat(50)}`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Server URL: http://0.0.0.0:${PORT}`);
  console.log(`💚 Health: http://0.0.0.0:${PORT}/api/health`);
  console.log(`${'='.repeat(50)}\n`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('\n❌ FATAL: Server failed to start');
  console.error('Error:', error);
  console.error('Port:', PORT);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    db.close();
    process.exit(0);
  });
});
