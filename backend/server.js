import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, "mkanak.db"));

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT,
    is_main INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('super_admin', 'branch_manager', 'cashier')) NOT NULL,
    branch_id INTEGER,
    FOREIGN KEY(branch_id) REFERENCES branches(id)
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    barcode TEXT UNIQUE,
    category_id INTEGER,
    price REAL NOT NULL,
    cost REAL NOT NULL,
    min_stock INTEGER DEFAULT 5,
    FOREIGN KEY(category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    branch_id INTEGER,
    quantity INTEGER DEFAULT 0,
    UNIQUE(product_id, branch_id),
    FOREIGN KEY(product_id) REFERENCES products(id),
    FOREIGN KEY(branch_id) REFERENCES branches(id)
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    points INTEGER DEFAULT 0,
    classification TEXT DEFAULT 'Regular'
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER,
    user_id INTEGER,
    customer_id INTEGER,
    total_amount REAL,
    tax REAL,
    discount REAL,
    payment_method TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(branch_id) REFERENCES branches(id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price REAL,
    FOREIGN KEY(sale_id) REFERENCES sales(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS transfers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_branch_id INTEGER,
    to_branch_id INTEGER,
    status TEXT DEFAULT 'pending',
    type TEXT DEFAULT 'send',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(from_branch_id) REFERENCES branches(id),
    FOREIGN KEY(to_branch_id) REFERENCES branches(id)
  );

  CREATE TABLE IF NOT EXISTS transfer_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transfer_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    FOREIGN KEY(transfer_id) REFERENCES transfers(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS returns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    branch_id INTEGER,
    user_id INTEGER,
    total_return_amount REAL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sale_id) REFERENCES sales(id),
    FOREIGN KEY(branch_id) REFERENCES branches(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS return_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    return_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price REAL,
    FOREIGN KEY(return_id) REFERENCES returns(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(branch_id) REFERENCES branches(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_branch_id INTEGER,
    to_branch_id INTEGER,
    from_user_id INTEGER,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER DEFAULT 0,
    FOREIGN KEY(from_branch_id) REFERENCES branches(id),
    FOREIGN KEY(to_branch_id) REFERENCES branches(id),
    FOREIGN KEY(from_user_id) REFERENCES users(id)
  );
`);

// Migration: Add type column to transfers if it doesn't exist
try {
  db.prepare("ALTER TABLE transfers ADD COLUMN type TEXT DEFAULT 'send'").run();
  db.prepare("UPDATE transfers SET type = 'send' WHERE type IS NULL").run();
} catch (e) {
  // Column might already exist
}

// Seed initial data if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
if (userCount.count === 0) {
  console.log("Seeding initial data...");
  const mainBranch = db.prepare("INSERT INTO branches (name, is_main) VALUES (?, ?)").run("Main Warehouse", 1);
  db.prepare("INSERT INTO branches (name) VALUES (?)").run("Branch 1");
  db.prepare("INSERT INTO users (username, password, role, branch_id) VALUES (?, ?, ?, ?)").run("admin", "admin123", "super_admin", mainBranch.lastInsertRowid);
  db.prepare("INSERT INTO categories (name) VALUES (?)").run("General");
  
  // Add some products
  const p1 = db.prepare("INSERT INTO products (name, barcode, category_id, price, cost, min_stock) VALUES (?, ?, ?, ?, ?, ?)").run("كتاب تعلم البرمجة", "1001", 1, 150, 100, 5);
  const p2 = db.prepare("INSERT INTO products (name, barcode, category_id, price, cost, min_stock) VALUES (?, ?, ?, ?, ?, ?)").run("رواية الخيال", "1002", 1, 80, 50, 10);
  const p3 = db.prepare("INSERT INTO products (name, barcode, category_id, price, cost, min_stock) VALUES (?, ?, ?, ?, ?, ?)").run("دفتر ملاحظات", "1003", 1, 25, 10, 20);

  // Add inventory for main branch
  db.prepare("INSERT INTO inventory (product_id, branch_id, quantity) VALUES (?, ?, ?)").run(p1.lastInsertRowid, 1, 50);
  db.prepare("INSERT INTO inventory (product_id, branch_id, quantity) VALUES (?, ?, ?)").run(p2.lastInsertRowid, 1, 30);
  db.prepare("INSERT INTO inventory (product_id, branch_id, quantity) VALUES (?, ?, ?)").run(p3.lastInsertRowid, 1, 100);

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

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Mkanak ERP Server is running" });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT u.*, b.name as branch_name FROM users u LEFT JOIN branches b ON u.branch_id = b.id WHERE username = ? AND password = ?").get(username, password);
  if (user) {
    res.json({ user: { id: user.id, username: user.username, role: user.role, branch_id: user.branch_id, branch_name: user.branch_name } });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.get("/api/dashboard/stats", (req, res) => {
  const stats = {
    totalSales: db.prepare("SELECT SUM(total_amount) as total FROM sales").get(),
    totalRevenue: db.prepare("SELECT SUM(total_amount) as total FROM sales WHERE created_at >= date('now')").get(),
    lowStock: db.prepare("SELECT COUNT(*) as count FROM inventory i JOIN products p ON i.product_id = p.id WHERE i.quantity <= p.min_stock").get(),
    branchSales: db.prepare("SELECT b.name, SUM(s.total_amount) as total FROM branches b LEFT JOIN sales s ON b.id = s.branch_id GROUP BY b.id").all()
  };
  res.json(stats);
});

app.get("/api/products", (req, res) => {
  const { branch_id } = req.query;
  
  if (branch_id) {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name, COALESCE(i.quantity, 0) as stock
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      JOIN inventory i ON p.id = i.product_id 
      WHERE i.branch_id = ? AND i.quantity > 0
    `).all(branch_id);
    res.json(products);
  } else {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name, SUM(COALESCE(i.quantity, 0)) as stock
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN inventory i ON p.id = i.product_id 
      GROUP BY p.id
    `).all();
    res.json(products);
  }
});

app.get("/api/products/:id/stock", (req, res) => {
  const { id } = req.params;
  const stock = db.prepare(`
    SELECT b.name as branch_name, COALESCE(i.quantity, 0) as quantity
    FROM branches b
    LEFT JOIN inventory i ON b.id = i.branch_id AND i.product_id = ?
    WHERE i.quantity > 0 OR b.is_main = 1
  `).all(id);
  res.json(stock);
});

app.post("/api/products", (req, res) => {
  const { name, barcode, category_id, price, cost, min_stock, initial_stock, branch_id } = req.body;
  try {
    const transaction = db.transaction(() => {
      const productResult = db.prepare(`
        INSERT INTO products (name, barcode, category_id, price, cost, min_stock) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(name, barcode, category_id, price, cost, min_stock);
      
      const productId = productResult.lastInsertRowid;
      
      if (initial_stock > 0 && branch_id) {
        db.prepare(`
          INSERT INTO inventory (product_id, branch_id, quantity) 
          VALUES (?, ?, ?)
        `).run(productId, branch_id, initial_stock);
      }
      
      return productId;
    });

    const productId = transaction();
    res.json({ success: true, productId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/categories", (req, res) => {
  const categories = db.prepare("SELECT * FROM categories").all();
  res.json(categories);
});

app.get("/api/inventory", (req, res) => {
  const { branch_id } = req.query;
  let query = `
    SELECT p.id as product_id, p.name as product_name, b.id as branch_id, b.name as branch_name, i.quantity 
    FROM inventory i 
    JOIN products p ON i.product_id = p.id 
    JOIN branches b ON i.branch_id = b.id
  `;
  
  if (branch_id) {
    query += " WHERE i.branch_id = ?";
    const inventory = db.prepare(query).all(branch_id);
    res.json(inventory);
  } else {
    const inventory = db.prepare(query).all();
    res.json(inventory);
  }
});

app.get("/api/transfers", (req, res) => {
  const { branch_id } = req.query;
  let query = `
    SELECT t.*, fb.name as from_branch_name, tb.name as to_branch_name 
    FROM transfers t
    JOIN branches fb ON t.from_branch_id = fb.id
    JOIN branches tb ON t.to_branch_id = tb.id
  `;
  
  if (branch_id) {
    query += " WHERE t.from_branch_id = ? OR t.to_branch_id = ?";
    const transfers = db.prepare(query + " ORDER BY t.created_at DESC").all(branch_id, branch_id);
    res.json(transfers);
  } else {
    const transfers = db.prepare(query + " ORDER BY t.created_at DESC").all();
    res.json(transfers);
  }
});

app.get("/api/transfers/:id", (req, res) => {
  const { id } = req.params;
  const transfer = db.prepare(`
    SELECT t.*, fb.name as from_branch_name, tb.name as to_branch_name 
    FROM transfers t
    JOIN branches fb ON t.from_branch_id = fb.id
    JOIN branches tb ON t.to_branch_id = tb.id
    WHERE t.id = ?
  `).get(id);
  
  if (!transfer) return res.status(404).json({ error: "Transfer not found" });
  
  const items = db.prepare(`
    SELECT ti.*, p.name as product_name, p.barcode
    FROM transfer_items ti
    JOIN products p ON ti.product_id = p.id
    WHERE ti.transfer_id = ?
  `).all(id);
  
  res.json({ ...transfer, items });
});

app.post("/api/transfers", (req, res) => {
  const { from_branch_id, to_branch_id, items, type = 'send' } = req.body;
  
  if (!from_branch_id || !to_branch_id || !items || items.length === 0) {
    return res.status(400).json({ error: "بيانات التحويل غير مكتملة" });
  }

  try {
    const transaction = db.transaction(() => {
      const transferResult = db.prepare(`
        INSERT INTO transfers (from_branch_id, to_branch_id, status, type) 
        VALUES (?, ?, 'pending', ?)
      `).run(from_branch_id, to_branch_id, type);
      
      const transferId = transferResult.lastInsertRowid;
      
      for (const item of items) {
        db.prepare(`
          INSERT INTO transfer_items (transfer_id, product_id, quantity) 
          VALUES (?, ?, ?)
        `).run(transferId, item.product_id, item.quantity);
      }

      const notifiedBranchId = type === 'send' ? to_branch_id : from_branch_id;
      const creatorBranchId = type === 'send' ? from_branch_id : to_branch_id;

      const creatorBranch = db.prepare("SELECT name FROM branches WHERE id = ?").get(creatorBranchId);
      const title = type === 'send' ? "طلب تحويل وارد" : "طلب تزويد مخزني";
      const message = type === 'send' 
        ? `وصلك طلب تحويل مخزني جديد من ${creatorBranch.name}`
        : `يطلب منك ${creatorBranch.name} تزويده بمنتجات من مخزنك`;

      db.prepare(`
        INSERT INTO notifications (branch_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `).run(notifiedBranchId, title, message, "transfer");

      return transferId;
    });

    transaction();
    res.json({ success: true });
  } catch (error) {
    console.error("Error creating transfer:", error);
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/transfers/:id/accept", (req, res) => {
  const { id } = req.params;
  try {
    const transaction = db.transaction(() => {
      const transfer = db.prepare("SELECT * FROM transfers WHERE id = ?").get(id);
      if (!transfer || transfer.status !== 'pending') {
        throw new Error("Invalid transfer or already processed");
      }

      const items = db.prepare("SELECT * FROM transfer_items WHERE transfer_id = ?").all(id);
      
      for (const item of items) {
        const sourceStock = db.prepare(`
          SELECT id, quantity FROM inventory WHERE product_id = ? AND branch_id = ?
        `).get(item.product_id, transfer.from_branch_id);

        if (sourceStock) {
          db.prepare(`
            UPDATE inventory SET quantity = quantity - ? 
            WHERE id = ?
          `).run(item.quantity, sourceStock.id);
        } else {
          db.prepare(`
            INSERT INTO inventory (product_id, branch_id, quantity) 
            VALUES (?, ?, ?)
          `).run(item.product_id, transfer.from_branch_id, -item.quantity);
        }
        
        const destStock = db.prepare(`
          SELECT id FROM inventory WHERE product_id = ? AND branch_id = ?
        `).get(item.product_id, transfer.to_branch_id);
        
        if (destStock) {
          db.prepare(`
            UPDATE inventory SET quantity = quantity + ? 
            WHERE id = ?
          `).run(item.quantity, destStock.id);
        } else {
          db.prepare(`
            INSERT INTO inventory (product_id, branch_id, quantity) 
            VALUES (?, ?, ?)
          `).run(item.product_id, transfer.to_branch_id, item.quantity);
        }
      }

      db.prepare("UPDATE transfers SET status = 'completed' WHERE id = ?").run(id);
      
      const notifiedBranchId = transfer.type === 'send' ? transfer.from_branch_id : transfer.to_branch_id;
      const acceptorBranchId = transfer.type === 'send' ? transfer.to_branch_id : transfer.from_branch_id;

      const acceptorBranch = db.prepare("SELECT name FROM branches WHERE id = ?").get(acceptorBranchId);
      db.prepare(`
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

    transaction();
    res.json({ success: true });
  } catch (error) {
    console.error("Error accepting transfer:", error);
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/transfers/:id/reject", (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("UPDATE transfers SET status = 'rejected' WHERE id = ?").run(id);
    
    const transfer = db.prepare("SELECT * FROM transfers WHERE id = ?").get(id);
    const notifiedBranchId = transfer.type === 'send' ? transfer.from_branch_id : transfer.to_branch_id;
    const rejectorBranchId = transfer.type === 'send' ? transfer.to_branch_id : transfer.from_branch_id;
    
    const rejectorBranch = db.prepare("SELECT name FROM branches WHERE id = ?").get(rejectorBranchId);
    
    db.prepare(`
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

app.get("/api/notifications", (req, res) => {
  const { branch_id } = req.query;
  if (!branch_id) return res.status(400).json({ error: "branch_id required" });
  
  const notifications = db.prepare(`
    SELECT * FROM notifications 
    WHERE branch_id = ? 
    ORDER BY created_at DESC 
    LIMIT 20
  `).all(branch_id);
  res.json(notifications);
});

app.put("/api/notifications/:id/read", (req, res) => {
  const { id } = req.params;
  db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
  res.json({ success: true });
});

app.get("/api/messages", (req, res) => {
  const { branch_id } = req.query;
  if (!branch_id) return res.status(400).json({ error: "branch_id required" });

  try {
    const messages = db.prepare(`
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

app.post("/api/messages", (req, res) => {
  const { from_branch_id, to_branch_id, from_user_id, message } = req.body;
  if (!from_branch_id || !to_branch_id || !from_user_id || !message) {
    return res.status(400).json({ error: "بيانات الرسالة غير مكتملة" });
  }

  try {
    const result = db.prepare(`
      INSERT INTO messages (from_branch_id, to_branch_id, from_user_id, message)
      VALUES (?, ?, ?, ?)
    `).run(from_branch_id, to_branch_id, from_user_id, message);

    const fromBranch = db.prepare("SELECT name FROM branches WHERE id = ?").get(from_branch_id);
    db.prepare(`
      INSERT INTO notifications (branch_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `).run(to_branch_id, "رسالة جديدة", `وصلتك رسالة جديدة من فرع ${fromBranch.name}`, "message");

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/branches", (req, res) => {
  const branches = db.prepare("SELECT * FROM branches").all();
  res.json(branches);
});

app.post("/api/branches", (req, res) => {
  const { name, location, username, password } = req.body;
  
  try {
    const transaction = db.transaction(() => {
      const branchResult = db.prepare("INSERT INTO branches (name, location) VALUES (?, ?)").run(name, location);
      const branchId = branchResult.lastInsertRowid;
      
      if (username && password) {
        db.prepare("INSERT INTO users (username, password, role, branch_id) VALUES (?, ?, ?, ?)").run(
          username, 
          password, 
          'branch_manager', 
          branchId
        );
      }
      return branchId;
    });

    const branchId = transaction();
    res.json({ success: true, branchId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put("/api/branches/:id", (req, res) => {
  const { id } = req.params;
  const { name, location } = req.body;
  try {
    db.prepare("UPDATE branches SET name = ?, location = ? WHERE id = ?").run(name, location, id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/branches/:id", (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM users WHERE branch_id = ?").run(id);
    db.prepare("DELETE FROM branches WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("DELETE FROM inventory WHERE product_id = ?").run(id);
    db.prepare("DELETE FROM products WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const { name, barcode, category_id, price, cost, min_stock } = req.body;
  try {
    db.prepare(`
      UPDATE products 
      SET name = ?, barcode = ?, category_id = ?, price = ?, cost = ?, min_stock = ? 
      WHERE id = ?
    `).run(name, barcode, category_id, price, cost, min_stock, id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/sales", (req, res) => {
  const { branch_id, user_id, customer_id, total_amount, tax, discount, payment_method, items } = req.body;
  
  if (!customer_id) {
    return res.status(400).json({ error: "يجب اختيار عميل لإتمام عملية البيع" });
  }

  try {
    const transaction = db.transaction(() => {
      const saleResult = db.prepare(`
        INSERT INTO sales (branch_id, user_id, customer_id, total_amount, tax, discount, payment_method) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(branch_id, user_id, customer_id, total_amount, tax, discount, payment_method);
      
      const saleId = saleResult.lastInsertRowid;
      
      for (const item of items) {
        db.prepare(`
          INSERT INTO sale_items (sale_id, product_id, quantity, price) 
          VALUES (?, ?, ?, ?)
        `).run(saleId, item.id, item.quantity, item.price);
        
        db.prepare(`
          UPDATE inventory SET quantity = quantity - ? 
          WHERE product_id = ? AND branch_id = ?
        `).run(item.quantity, item.id, branch_id);
      }
      return saleId;
    });

    const saleId = transaction();
    res.json({ success: true, saleId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/customers", (req, res) => {
  const { name, phone } = req.body;
  try {
    const result = db.prepare("INSERT INTO customers (name, phone) VALUES (?, ?)").run(name, phone);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/customers", (req, res) => {
  try {
    const customers = db.prepare("SELECT * FROM customers").all();
    res.json(customers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/sales", (req, res) => {
  try {
    const sales = db.prepare(`
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

app.get("/api/sales/:id", (req, res) => {
  const { id } = req.params;
  try {
    const sale = db.prepare(`
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

    const items = db.prepare(`
      SELECT si.*, p.name as product_name, p.barcode
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `).all(id);

    const returnedItems = db.prepare(`
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

app.post("/api/returns", (req, res) => {
  const { sale_id, branch_id, user_id, total_return_amount, reason, items } = req.body;
  
  try {
    const transaction = db.transaction(() => {
      const returnResult = db.prepare(`
        INSERT INTO returns (sale_id, branch_id, user_id, total_return_amount, reason) 
        VALUES (?, ?, ?, ?, ?)
      `).run(sale_id, branch_id, user_id, total_return_amount, reason);
      
      const returnId = returnResult.lastInsertRowid;
      
      for (const item of items) {
        db.prepare(`
          INSERT INTO return_items (return_id, product_id, quantity, price) 
          VALUES (?, ?, ?, ?)
        `).run(returnId, item.product_id, item.quantity, item.price);
        
        db.prepare(`
          UPDATE inventory SET quantity = quantity + ? 
          WHERE product_id = ? AND branch_id = ?
        `).run(item.quantity, item.product_id, branch_id);
      }
      return returnId;
    });

    const returnId = transaction();
    res.json({ success: true, returnId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/api/returns", (req, res) => {
  try {
    const returns = db.prepare(`
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

app.get("/api/reports/stats", (req, res) => {
  try {
    const totalSales = db.prepare("SELECT SUM(total_amount) as total FROM sales").get();
    const totalTax = db.prepare("SELECT SUM(tax) as total FROM sales").get();
    const totalOrders = db.prepare("SELECT COUNT(*) as count FROM sales").get();
    
    const topProducts = db.prepare(`
      SELECT p.name, SUM(si.quantity) as qty
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      GROUP BY p.id
      ORDER BY qty DESC
      LIMIT 5
    `).all();

    const dailySales = db.prepare(`
      SELECT strftime('%Y-%m-%d', created_at) as date, SUM(total_amount) as sales
      FROM sales
      GROUP BY date
      ORDER BY date DESC
      LIMIT 7
    `).all();

    const salesByCategory = db.prepare(`
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
