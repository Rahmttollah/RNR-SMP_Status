const { drizzle } = require("drizzle-orm/node-postgres");
const pg = require("pg");
const schema = require("./schema");
const { Pool } = pg;
if (!process.env.DATABASE_URL) console.warn("DATABASE_URL not set");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });
module.exports = { pool, db };
