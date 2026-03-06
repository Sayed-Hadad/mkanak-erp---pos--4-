import fs from 'fs';
import path from 'path';

class SimpleDB {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.data = this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.dbPath)) {
        return JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
      }
    } catch (e) {
      console.log('Creating new database');
    }
    return {
      branches: [],
      users: [],
      categories: [],
      products: [],
      inventory: [],
      customers: [],
      sales: [],
      sale_items: [],
      transfers: [],
      transfer_items: [],
      returns: [],
      return_items: [],
      notifications: [],
      messages: []
    };
  }

  save() {
    fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
  }

  // Simple query methods
  prepare(sql) {
    const self = this;
    return {
      get(table, condition) {
        return self.data[table]?.find(condition) || null;
      },
      all(table, condition) {
        if (!condition) return self.data[table] || [];
        return self.data[table]?.filter(condition) || [];
      },
      run(table, action, item) {
        if (action === 'insert') {
          const id = (self.data[table]?.length || 0) + 1;
          const newItem = { ...item, id };
          self.data[table].push(newItem);
          self.save();
          return { lastInsertRowid: id };
        }
        if (action === 'update') {
          const index = self.data[table].findIndex(i => i.id === item.id);
          if (index !== -1) {
            self.data[table][index] = { ...self.data[table][index], ...item };
            self.save();
          }
        }
        if (action === 'delete') {
          self.data[table] = self.data[table].filter(i => i.id !== item.id);
          self.save();
        }
      }
    };
  }
}

export default SimpleDB;
