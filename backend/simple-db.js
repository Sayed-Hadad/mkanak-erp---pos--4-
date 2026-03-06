import fs from 'fs';
import path from 'path';

class SimpleDB {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.data = this.load();
    this.autoIncrement = {};
  }

  load() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const loaded = JSON.parse(fs.readFileSync(this.dbPath, 'utf8'));
        console.log('✅ Database loaded from', this.dbPath);
        return loaded;
      }
    } catch (e) {
      console.log('📝 Creating new database at', this.dbPath);
    }
    return {};
  }

  save() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error('Failed to save database:', e);
    }
  }

  exec(sql) {
    // Parse CREATE TABLE statements and initialize tables
    const tableMatches = sql.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)/g);
    for (const match of tableMatches) {
      const tableName = match[1];
      if (!this.data[tableName]) {
        this.data[tableName] = [];
        this.autoIncrement[tableName] = 1;
      }
    }
    this.save();
  }

  prepare(sql) {
    const self = this;
    
    return {
      run(...params) {
        const insertMatch = sql.match(/INSERT INTO (\w+) \((.*?)\) VALUES \((.*?)\)/i);
        if (insertMatch) {
          const table = insertMatch[1];
          const columns = insertMatch[2].split(',').map(c => c.trim());
          
          if (!self.data[table]) self.data[table] = [];
          if (!self.autoIncrement[table]) self.autoIncrement[table] = 1;
          
          const id = self.autoIncrement[table]++;
          const newItem = { id };
          columns.forEach((col, i) => {
            newItem[col] = params[i];
          });
          
          self.data[table].push(newItem);
          self.save();
          return { lastInsertRowid: id };
        }

        const updateMatch = sql.match(/UPDATE (\w+) SET (.*?) WHERE (.*)/i);
        if (updateMatch) {
          const table = updateMatch[1];
          const sets = updateMatch[2];
          const where = updateMatch[3];
          
          if (self.data[table]) {
            self.data[table].forEach(item => {
              if (self.matchWhere(item, where, params)) {
                const setPairs = sets.split(',');
                setPairs.forEach(pair => {
                  const [col, val] = pair.split('=').map(s => s.trim());
                  if (val === '?') {
                    item[col] = params.shift();
                  } else if (val.includes('?')) {
                    // Handle expressions like "quantity = quantity - ?"
                    const match = val.match(/(\w+)\s*([+-])\s*\?/);
                    if (match) {
                      const [, field, op] = match;
                      const value = params.shift();
                      item[col] = op === '+' ? (item[field] || 0) + value : (item[field] || 0) - value;
                    }
                  }
                });
              }
            });
            self.save();
          }
          return {};
        }

        const deleteMatch = sql.match(/DELETE FROM (\w+) WHERE (.*)/i);
        if (deleteMatch) {
          const table = deleteMatch[1];
          if (self.data[table]) {
            self.data[table] = self.data[table].filter(item => !self.matchWhere(item, deleteMatch[2], params));
            self.save();
          }
          return {};
        }

        return {};
      },

      get(...params) {
        // Handle COUNT queries
        const countMatch = sql.match(/SELECT COUNT\(\*\) as (\w+) FROM (\w+)/i);
        if (countMatch) {
          const countField = countMatch[1];
          const table = countMatch[2];
          const count = (self.data[table] || []).length;
          return { [countField]: count };
        }

        const selectMatch = sql.match(/SELECT (.*?) FROM (\w+)(.*)/i);
        if (!selectMatch) return null;
        
        const table = selectMatch[2];
        const rest = selectMatch[3] || '';
        
        if (!self.data[table]) return null;
        
        const whereMatch = rest.match(/WHERE (.*?)(?:ORDER|GROUP|LIMIT|$)/i);
        const items = self.data[table].filter(item => {
          if (!whereMatch) return true;
          return self.matchWhere(item, whereMatch[1], params);
        });
        
        // Handle JOINs simplistically
        const joinMatches = [...rest.matchAll(/LEFT JOIN (\w+) (\w+) ON (.*?)(?:LEFT|WHERE|ORDER|GROUP|LIMIT|$)/gi)];
        if (joinMatches.length > 0) {
          return items.map(item => {
            const joined = { ...item };
            joinMatches.forEach(match => {
              const joinTable = match[1];
              const joinAlias = match[2];
              const onClause = match[3];
              
              const joinItem = self.data[joinTable]?.find(jItem => {
                const onMatch = onClause.match(/(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/);
                if (onMatch) {
                  const [, t1, c1, t2, c2] = onMatch;
                  return item[c1] === jItem[c2];
                }
                return false;
              });
              
              if (joinItem) {
                Object.keys(joinItem).forEach(key => {
                  joined[`${key}`] = joinItem[key];
                });
              }
            });
            return joined;
          })[0] || null;
        }
        
        return items[0] || null;
      },

      all(...params) {
        const selectMatch = sql.match(/SELECT (.*?) FROM (\w+)(.*)/i);
        if (!selectMatch) return [];
        
        const table = selectMatch[2];
        const rest = selectMatch[3] || '';
        
        if (!self.data[table]) return [];
        
        let items = [...self.data[table]];
        
        // Handle WHERE
        const whereMatch = rest.match(/WHERE (.*?)(?:GROUP|ORDER|LIMIT|$)/i);
        if (whereMatch) {
          items = items.filter(item => self.matchWhere(item, whereMatch[1], params));
        }
        
        // Handle JOINs
        const joinMatches = [...rest.matchAll(/(?:LEFT |INNER )?JOIN (\w+) (\w+) ON (.*?)(?:LEFT|JOIN|WHERE|GROUP|ORDER|LIMIT|$)/gi)];
        if (joinMatches.length > 0) {
          items = items.map(item => {
            const joined = { ...item };
            joinMatches.forEach(match => {
              const joinTable = match[1];
              const onClause = match[3];
              
              const joinItem = self.data[joinTable]?.find(jItem => {
                const onMatch = onClause.match(/(\w+)\.(\w+)\s*=\s*(\w+)\.(\w+)/);
                if (onMatch) {
                  const [, t1, c1, t2, c2] = onMatch;
                  return item[c1] === jItem[c2] || joined[c1] === jItem[c2];
                }
                return false;
              });
              
              if (joinItem) {
                Object.keys(joinItem).forEach(key => {
                  joined[key] = joinItem[key];
                });
              }
            });
            return joined;
          });
        }
        
        // Handle GROUP BY (simplified)
        const groupMatch = rest.match(/GROUP BY (.*?)(?:ORDER|LIMIT|$)/i);
        if (groupMatch) {
          const groupBy = groupMatch[1].split(',')[0].trim();
          const grouped = {};
          items.forEach(item => {
            const key = item[groupBy] || item[groupBy.split('.')[1]];
            if (!grouped[key]) grouped[key] = item;
          });
          items = Object.values(grouped);
        }
        
        // Handle ORDER BY
        const orderMatch = rest.match(/ORDER BY (.*?)(?:LIMIT|$)/i);
        if (orderMatch) {
          const [field, dir = 'ASC'] = orderMatch[1].split(/\s+/);
          items.sort((a, b) => {
            const aVal = a[field] || 0;
            const bVal = b[field] || 0;
            return dir.toUpperCase() === 'DESC' ? bVal - aVal : aVal - bVal;
          });
        }
        
        // Handle LIMIT
        const limitMatch = rest.match(/LIMIT (\d+)/i);
        if (limitMatch) {
          items = items.slice(0, parseInt(limitMatch[1]));
        }
        
        return items;
      }
    };
  }

  matchWhere(item, whereClause, params) {
    // Simple WHERE matching
    const conditions = whereClause.split(/AND|OR/i);
    let paramIndex = 0;
    
    return conditions.every(cond => {
      cond = cond.trim();
      
      if (cond.includes('=')) {
        const [field, value] = cond.split('=').map(s => s.trim());
        const cleanField = field.replace(/^.*\./, '');
        if (value === '?') {
          return item[cleanField] == params[paramIndex++];
        }
        return item[cleanField] == value.replace(/['"]/g, '');
      }
      
      if (cond.includes('>') || cond.includes('<') || cond.includes('<=') || cond.includes('>=')) {
        return true; // Simplified
      }
      
      return true;
    });
  }

  close() {
    this.save();
  }
}

export default SimpleDB;

