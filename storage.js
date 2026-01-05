const { db } = require("./db");
const { persistentState } = require("./schema");
const { eq } = require("drizzle-orm");
class DatabaseStorage {
  async getPersistentState(key) {
    const [result] = await db.select().from(persistentState).where(eq(persistentState.key, key));
    return result?.value || null;
  }
  async setPersistentState(key, value) {
    await db.insert(persistentState).values({ key, value }).onConflictDoUpdate({ target: persistentState.key, set: { value } });
  }
}
const storage = new DatabaseStorage();
module.exports = { storage };
