import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(),
  storeId: varchar("store_id").references(() => stores.id),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const stores = pgTable("stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  deliverySchedule: text("delivery_schedule").notNull(),
});

export const insertStoreSchema = createInsertSchema(stores).omit({ id: true });
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof stores.$inferSelect;

export const ingredients = pgTable("ingredients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  costPerUnit: real("cost_per_unit").notNull(),
  unit: text("unit").notNull(),
});

export const insertIngredientSchema = createInsertSchema(ingredients).omit({ id: true });
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type Ingredient = typeof ingredients.$inferSelect;

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  unitCost: real("unit_cost").notNull().default(0),
  sellingPrice: real("selling_price").notNull(),
  minStockLevel: integer("min_stock_level").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export const recipes = pgTable("recipes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  ingredientId: varchar("ingredient_id").notNull().references(() => ingredients.id, { onDelete: "cascade" }),
  quantity: real("quantity").notNull(),
});

export const insertRecipeSchema = createInsertSchema(recipes).omit({ id: true });
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Recipe = typeof recipes.$inferSelect;

export const stockEntries = pgTable("stock_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  storeId: varchar("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  delivered: integer("delivered").notNull().default(0),
  currentStock: integer("current_stock").notNull().default(0),
  waste: integer("waste").notNull().default(0),
  sales: integer("sales").notNull().default(0),
  expectedRemaining: integer("expected_remaining").notNull().default(0),
  reportedRemaining: integer("reported_remaining").notNull().default(0),
  discrepancy: real("discrepancy").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStockEntrySchema = createInsertSchema(stockEntries).omit({ id: true, createdAt: true });
export type InsertStockEntry = z.infer<typeof insertStockEntrySchema>;
export type StockEntry = typeof stockEntries.$inferSelect;

export const deliveries = pgTable("deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  storeId: varchar("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantitySent: integer("quantity_sent").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({ id: true, createdAt: true });
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveries.$inferSelect;

export const sales = pgTable("sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: date("date").notNull(),
  storeId: varchar("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(0),
  unitPrice: real("unit_price"),
  source: varchar("source", { length: 50 }).default("manual"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSaleSchema = createInsertSchema(sales).omit({ id: true, createdAt: true });
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof sales.$inferSelect;
