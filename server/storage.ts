import { db } from "../db";
import { 
  users, 
  stores, 
  products, 
  ingredients, 
  recipes, 
  stockEntries,
  type User,
  type InsertUser,
  type Store,
  type InsertStore,
  type Product,
  type InsertProduct,
  type Ingredient,
  type InsertIngredient,
  type Recipe,
  type InsertRecipe,
  type StockEntry,
  type InsertStockEntry,
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  
  // Stores
  getAllStores(): Promise<Store[]>;
  getStore(id: string): Promise<Store | undefined>;
  createStore(store: InsertStore): Promise<Store>;
  
  // Products
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductByCode(code: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  
  // Ingredients
  getAllIngredients(): Promise<Ingredient[]>;
  getIngredient(id: string): Promise<Ingredient | undefined>;
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  updateIngredient(id: string, ingredient: Partial<InsertIngredient>): Promise<Ingredient | undefined>;
  deleteIngredient(id: string): Promise<void>;
  
  // Recipes
  getRecipesByProduct(productId: string): Promise<Recipe[]>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  deleteRecipe(id: string): Promise<void>;
  deleteRecipesByProduct(productId: string): Promise<void>;
  recalculateProductCost(productId: string): Promise<void>;
  getProductsUsingIngredient(ingredientId: string): Promise<string[]>;
  
  // Stock Entries
  getAllStockEntries(): Promise<StockEntry[]>;
  getStockEntriesByDate(date: string): Promise<StockEntry[]>;
  getStockEntriesByStore(storeId: string): Promise<StockEntry[]>;
  getStockEntriesByProduct(productId: string): Promise<StockEntry[]>;
  getLatestStockEntry(productId: string, storeId: string): Promise<StockEntry | undefined>;
  createStockEntry(entry: InsertStockEntry): Promise<StockEntry>;
  updateStockEntry(id: string, entry: Partial<InsertStockEntry>): Promise<StockEntry | undefined>;
  
  // Analytics
  getProductsWithLowStock(): Promise<Array<Product & { currentStock: number }>>;
  getStockDiscrepancies(threshold?: number): Promise<Array<StockEntry & { productName: string; storeName: string }>>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Stores
  async getAllStores(): Promise<Store[]> {
    return await db.select().from(stores);
  }

  async getStore(id: string): Promise<Store | undefined> {
    const result = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
    return result[0];
  }

  async createStore(store: InsertStore): Promise<Store> {
    const result = await db.insert(stores).values(store).returning();
    return result[0];
  }

  // Products
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(products.name);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async getProductByCode(code: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.code, code)).limit(1);
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(product).returning();
    return result[0];
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Ingredients
  async getAllIngredients(): Promise<Ingredient[]> {
    return await db.select().from(ingredients).orderBy(ingredients.name);
  }

  async getIngredient(id: string): Promise<Ingredient | undefined> {
    const result = await db.select().from(ingredients).where(eq(ingredients.id, id)).limit(1);
    return result[0];
  }

  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    const result = await db.insert(ingredients).values(ingredient).returning();
    return result[0];
  }

  async updateIngredient(id: string, ingredient: Partial<InsertIngredient>): Promise<Ingredient | undefined> {
    const result = await db.update(ingredients).set(ingredient).where(eq(ingredients.id, id)).returning();
    return result[0];
  }

  async deleteIngredient(id: string): Promise<void> {
    await db.delete(ingredients).where(eq(ingredients.id, id));
  }

  // Recipes
  async getRecipesByProduct(productId: string): Promise<Recipe[]> {
    return await db.select().from(recipes).where(eq(recipes.productId, productId));
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const result = await db.insert(recipes).values(recipe).returning();
    return result[0];
  }

  async deleteRecipe(id: string): Promise<void> {
    await db.delete(recipes).where(eq(recipes.id, id));
  }

  async deleteRecipesByProduct(productId: string): Promise<void> {
    await db.delete(recipes).where(eq(recipes.productId, productId));
  }

  async recalculateProductCost(productId: string): Promise<void> {
    // Get all recipes for this product
    const productRecipes = await this.getRecipesByProduct(productId);
    
    // Calculate total ingredient cost
    let totalIngredientCost = 0;
    for (const recipe of productRecipes) {
      const ingredient = await this.getIngredient(recipe.ingredientId);
      if (ingredient) {
        totalIngredientCost += ingredient.costPerUnit * recipe.quantity;
      }
    }
    
    // Update the product's unit cost
    await db.update(products)
      .set({ unitCost: totalIngredientCost })
      .where(eq(products.id, productId));
  }

  async getProductsUsingIngredient(ingredientId: string): Promise<string[]> {
    const recipeList = await db
      .select({ productId: recipes.productId })
      .from(recipes)
      .where(eq(recipes.ingredientId, ingredientId));
    
    // Return unique product IDs
    return [...new Set(recipeList.map(r => r.productId))];
  }

  // Stock Entries
  async getAllStockEntries(): Promise<StockEntry[]> {
    return await db.select().from(stockEntries).orderBy(desc(stockEntries.date));
  }

  async getStockEntriesByDate(date: string): Promise<StockEntry[]> {
    return await db.select().from(stockEntries).where(eq(stockEntries.date, date));
  }

  async getStockEntriesByStore(storeId: string): Promise<StockEntry[]> {
    return await db.select().from(stockEntries).where(eq(stockEntries.storeId, storeId)).orderBy(desc(stockEntries.date));
  }

  async getStockEntriesByProduct(productId: string): Promise<StockEntry[]> {
    return await db.select().from(stockEntries).where(eq(stockEntries.productId, productId)).orderBy(desc(stockEntries.date));
  }

  async getLatestStockEntry(productId: string, storeId: string): Promise<StockEntry | undefined> {
    const result = await db
      .select()
      .from(stockEntries)
      .where(and(eq(stockEntries.productId, productId), eq(stockEntries.storeId, storeId)))
      .orderBy(desc(stockEntries.date))
      .limit(1);
    return result[0];
  }

  async createStockEntry(entry: InsertStockEntry): Promise<StockEntry> {
    const result = await db.insert(stockEntries).values(entry).returning();
    return result[0];
  }

  async updateStockEntry(id: string, entry: Partial<InsertStockEntry>): Promise<StockEntry | undefined> {
    const result = await db.update(stockEntries).set(entry).where(eq(stockEntries.id, id)).returning();
    return result[0];
  }

  // Analytics
  async getProductsWithLowStock(): Promise<Array<Product & { currentStock: number }>> {
    const latestStocks = await db
      .select({
        productId: stockEntries.productId,
        currentStock: sql<number>`MAX(${stockEntries.currentStock})`.as('current_stock'),
      })
      .from(stockEntries)
      .groupBy(stockEntries.productId);

    const lowStockProducts = [];
    for (const stock of latestStocks) {
      const product = await this.getProduct(stock.productId);
      if (product && stock.currentStock < product.minStockLevel) {
        lowStockProducts.push({ ...product, currentStock: stock.currentStock });
      }
    }
    return lowStockProducts;
  }

  async getStockDiscrepancies(threshold: number = 5): Promise<Array<StockEntry & { productName: string; storeName: string }>> {
    const entries = await db
      .select()
      .from(stockEntries)
      .orderBy(desc(stockEntries.date))
      .limit(50);

    const discrepancies = [];
    for (const entry of entries) {
      if (Math.abs(entry.discrepancy) >= threshold) {
        const product = await this.getProduct(entry.productId);
        const store = await this.getStore(entry.storeId);
        if (product && store) {
          discrepancies.push({
            ...entry,
            productName: product.name,
            storeName: store.name,
          });
        }
      }
    }
    return discrepancies;
  }
}

export const storage = new DatabaseStorage();
