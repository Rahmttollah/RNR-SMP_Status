const { pgTable, text, jsonb } = require("drizzle-orm/pg-core");
const persistentState = pgTable("persistent_state", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
});
module.exports = { persistentState };
