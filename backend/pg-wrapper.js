// PostgreSQL wrapper that mimics SQLite's better-sqlite3 API
export class PgWrapper {
  constructor(pool) {
    this.pool = pool;
  }

  // Execute raw SQL (for schema creation)
  async query(sql, params = []) {
    return await this.pool.query(sql, params);
  }

  // Mimic better-sqlite3's prepare() API
  prepare(sql) {
    // Convert SQLite ? placeholders to PostgreSQL $1, $2, etc.
    let paramCount = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++paramCount}`);

    return {
      // For SELECT queries that return single row
      get: async (...params) => {
        const result = await this.pool.query(pgSql, params);
        return result.rows[0] || null;
      },

      // For SELECT queries that return multiple rows
      all: async (...params) => {
        const result = await this.pool.query(pgSql, params);
        return result.rows;
      },

      // For INSERT/UPDATE/DELETE queries
      run: async (...params) => {
        const result = await this.pool.query(pgSql, params);
        return {
          changes: result.rowCount,
          lastInsertRowid: result.rows[0]?.id || null
        };
      }
    };
  }

  // For schema creation
  async exec(sql) {
    await this.pool.query(sql);
  }

  // Transaction support
  transaction(fn) {
    return async (...args) => {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        
        // Create a temporary db object that uses this client
        const transactionDb = {
          prepare: (sql) => {
            let paramCount = 0;
            const pgSql = sql.replace(/\?/g, () => `$${++paramCount}`);
            
            return {
              get: async (...params) => {
                const result = await client.query(pgSql, params);
                return result.rows[0] || null;
              },
              all: async (...params) => {
                const result = await client.query(pgSql, params);
                return result.rows;
              },
              run: async (...params) => {
                // For INSERT with RETURNING
                const needsReturning = sql.trim().toUpperCase().startsWith('INSERT') && !sql.toUpperCase().includes('RETURNING');
                const finalSql = needsReturning ? pgSql + ' RETURNING id' : pgSql;
                const result = await client.query(finalSql, params);
                return {
                  changes: result.rowCount,
                  lastInsertRowid: result.rows[0]?.id || null
                };
              }
            };
          }
        };
        
        const result = await fn(transactionDb);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    };
  }
}
