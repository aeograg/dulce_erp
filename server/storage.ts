import { db } from "../db";
import { 
  users, 
  stores, 
  products, 
  ingredients, 
  recipes, 
  stockEntries,
  deliveries,
  sales,
  inventory,
  predeterminedDeliveries,
  userPermissions,
  needsRequests,
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
  type Delivery,
  type InsertDelivery,
  type Sale,
  type InsertSale,
  type Inventory,
  type InsertInventory,
  type PredeterminedDelivery,
  type UserPermission,
  type InsertUserPermission,
  type NeedsRequest,
  type InsertNeedsRequest,
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser, createdBy?: string): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  
  // Stores
  getAllStores(): Promise<Store[]>;
  getStore(id: string): Promise<Store | undefined>;
  createStore(store: InsertStore, createdBy?: string): Promise<Store>;
  
  // Products
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductByCode(code: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct, createdBy?: string): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  
  // Ingredients
  getAllIngredients(): Promise<Ingredient[]>;
  getIngredient(id: string): Promise<Ingredient | undefined>;
  createIngredient(ingredient: InsertIngredient, createdBy?: string): Promise<Ingredient>;
  updateIngredient(id: string, ingredient: Partial<InsertIngredient>): Promise<Ingredient | undefined>;
  deleteIngredient(id: string): Promise<void>;
  
  // Recipes
  getRecipesByProduct(productId: string): Promise<Recipe[]>;
  createRecipe(recipe: InsertRecipe, createdBy?: string): Promise<Recipe>;
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
  getPreviousStockEntry(date: string, productId: string, storeId: string): Promise<StockEntry | undefined>;
  getStockEntryByDateProductStore(date: string, productId: string, storeId: string): Promise<StockEntry | undefined>;
  createStockEntry(entry: InsertStockEntry, createdBy?: string): Promise<StockEntry>;
  updateStockEntry(id: string, entry: Partial<InsertStockEntry>): Promise<StockEntry | undefined>;
  
  // Deliveries
  getAllDeliveries(): Promise<Delivery[]>;
  getDeliveriesByDate(date: string): Promise<Delivery[]>;
  getDeliveriesByStore(storeId: string): Promise<Delivery[]>;
  createDelivery(delivery: InsertDelivery, createdBy?: string): Promise<Delivery>;
  updateDelivery(id: string, delivery: Partial<InsertDelivery>): Promise<Delivery | undefined>;
  deleteDelivery(id: string): Promise<void>;
  
  // Predetermined Deliveries
  getPredeterminedDeliveriesByStore(storeId: string): Promise<Array<any>>;
  getAllPredeterminedDeliveries(): Promise<any[]>;
  createPredeterminedDelivery(data: { templateId: string; name: string; storeId: string; productId: string; defaultQuantity: number; frequency?: string }, createdBy?: string): Promise<PredeterminedDelivery>;
  deletePredeterminedDelivery(id: string): Promise<void>;
  
  // Sales
  getAllSales(): Promise<Sale[]>;
  getSalesByDate(date: string): Promise<Sale[]>;
  getSalesByStore(storeId: string): Promise<Sale[]>;
  getSalesByDateAndStore(date: string, storeId: string): Promise<Sale[]>;
  createSale(sale: InsertSale, createdBy?: string): Promise<Sale>;
  
  // Inventory
  getAllInventory(storeId?: string): Promise<Inventory[]>;
  getInventoryByProduct(productId: string, storeId?: string): Promise<Inventory[]>;
  getInventoryByStore(storeId: string): Promise<Inventory[]>;
  getInventoryByStoreAndProduct(storeId: string, productId: string): Promise<Inventory | undefined>;
  getLatestInventoryByProduct(productId: string, storeId?: string): Promise<Inventory | undefined>;
  getInventoryAsOfDate(productId: string, storeId: string, date: string): Promise<Inventory | undefined>;
  getCurrentInventoryLevels(storeId?: string): Promise<Map<string, number>>;
  recordProduction(entry: InsertInventory): Promise<Inventory>;
  updateInventoryStock(productId: string, quantity: number, storeId?: string, notes?: string, date?: string): Promise<void>;
  addInventoryToStore(productId: string, storeId: string, quantity: number, notes?: string): Promise<void>;
  getProductionCenterStoreId(): Promise<string>;
  
  // Analytics
  getProductsWithLowStock(): Promise<Array<Product & { currentStock: number }>>;
  getStockDiscrepancies(threshold?: number): Promise<Array<StockEntry & { productName: string; storeName: string }>>;
  
  // User Permissions
  getUserPermissions(userId: string): Promise<UserPermission[]>;
  setUserPermission(userId: string, pagePath: string, allowed: boolean, createdBy?: string): Promise<UserPermission>;
  deleteUserPermissions(userId: string): Promise<void>;
  
  // Needs Requests
  getAllNeedsRequests(): Promise<NeedsRequest[]>;
  getNeedsRequestsByStore(storeId: string): Promise<NeedsRequest[]>;
  createNeedsRequest(request: InsertNeedsRequest, createdBy?: string): Promise<NeedsRequest>;
  updateNeedsRequestStatus(id: string, status: string): Promise<NeedsRequest | undefined>;
  deleteNeedsRequest(id: string): Promise<void>;
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

  async createUser(user: InsertUser, createdBy?: string): Promise<User> {
    const result = await db.insert(users).values({ ...user, createdBy }).returning();
    return result[0];
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set({ ...user, updatedAt: new Date() }).where(eq(users.id, id)).returning();
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

  async createStore(store: InsertStore, createdBy?: string): Promise<Store> {
    const result = await db.insert(stores).values({ ...store, createdBy }).returning();
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

  async createProduct(product: InsertProduct, createdBy?: string): Promise<Product> {
    const result = await db.insert(products).values({ ...product, createdBy }).returning();
    return result[0];
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await db.update(products).set({ ...product, updatedAt: new Date() }).where(eq(products.id, id)).returning();
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

  async createIngredient(ingredient: InsertIngredient, createdBy?: string): Promise<Ingredient> {
    const result = await db.insert(ingredients).values({ ...ingredient, createdBy }).returning();
    return result[0];
  }

  async updateIngredient(id: string, ingredient: Partial<InsertIngredient>): Promise<Ingredient | undefined> {
    const result = await db.update(ingredients).set({ ...ingredient, updatedAt: new Date() }).where(eq(ingredients.id, id)).returning();
    return result[0];
  }

  async deleteIngredient(id: string): Promise<void> {
    await db.delete(ingredients).where(eq(ingredients.id, id));
  }

  // Recipes
  async getRecipesByProduct(productId: string): Promise<Recipe[]> {
    return await db.select().from(recipes).where(eq(recipes.productId, productId));
  }

  async createRecipe(recipe: InsertRecipe, createdBy?: string): Promise<Recipe> {
    const result = await db.insert(recipes).values({ ...recipe, createdBy }).returning();
    return result[0];
  }

  async deleteRecipe(id: string): Promise<void> {
    await db.delete(recipes).where(eq(recipes.id, id));
  }

  async deleteRecipesByProduct(productId: string): Promise<void> {
    await db.delete(recipes).where(eq(recipes.productId, productId));
  }

  async recalculateProductCost(productId: string): Promise<void> {
    // Get the product to access its batchYield
    const product = await this.getProduct(productId);
    if (!product) return;
    
    // Get all recipes for this product
    const productRecipes = await this.getRecipesByProduct(productId);
    
    if (productRecipes.length === 0) {
      // No recipes, set cost to 0
      await db.update(products)
        .set({ unitCost: 0 })
        .where(eq(products.id, productId));
      return;
    }
    
    // Calculate total batch cost from all ingredients
    let totalBatchCost = 0;
    for (const recipe of productRecipes) {
      const ingredient = await this.getIngredient(recipe.ingredientId);
      if (ingredient) {
        totalBatchCost += ingredient.costPerUnit * recipe.quantity;
      }
    }
    
    // Get batchYield from product (default to 1 to avoid division by zero)
    const batchYield = product.batchYield || 1;
    
    // Calculate unit cost: totalBatchCost / batchYield
    const unitCost = batchYield > 0 ? totalBatchCost / batchYield : 0;
    
    // Update the product's unit cost
    await db.update(products)
      .set({ unitCost })
      .where(eq(products.id, productId));
  }

  async getProductsUsingIngredient(ingredientId: string): Promise<string[]> {
    const recipeList = await db
      .select({ productId: recipes.productId })
      .from(recipes)
      .where(eq(recipes.ingredientId, ingredientId));
    
    // Return unique product IDs
    return Array.from(new Set(recipeList.map(r => r.productId)));
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

  async getPreviousStockEntry(date: string, productId: string, storeId: string): Promise<StockEntry | undefined> {
    const result = await db
      .select()
      .from(stockEntries)
      .where(and(
        eq(stockEntries.productId, productId), 
        eq(stockEntries.storeId, storeId),
        sql`${stockEntries.date} < ${date}`
      ))
      .orderBy(desc(stockEntries.date))
      .limit(1);
    return result[0];
  }

  async getStockEntryByDateProductStore(date: string, productId: string, storeId: string): Promise<StockEntry | undefined> {
    const result = await db
      .select()
      .from(stockEntries)
      .where(and(
        eq(stockEntries.date, date),
        eq(stockEntries.productId, productId),
        eq(stockEntries.storeId, storeId)
      ))
      .limit(1);
    return result[0];
  }

  async createStockEntry(entry: InsertStockEntry, createdBy?: string): Promise<StockEntry> {
    const result = await db.insert(stockEntries).values({ ...entry, createdBy }).returning();
    return result[0];
  }

  async updateStockEntry(id: string, entry: Partial<InsertStockEntry>): Promise<StockEntry | undefined> {
    const result = await db.update(stockEntries).set({ ...entry, updatedAt: new Date() }).where(eq(stockEntries.id, id)).returning();
    return result[0];
  }

  // Deliveries
  async getAllDeliveries(): Promise<Delivery[]> {
    return await db.select().from(deliveries).orderBy(desc(deliveries.date));
  }

  async getDeliveriesByDate(date: string): Promise<Delivery[]> {
    return await db.select().from(deliveries).where(eq(deliveries.date, date)).orderBy(deliveries.storeId);
  }

  async getDeliveriesByStore(storeId: string): Promise<Delivery[]> {
    return await db.select().from(deliveries).where(eq(deliveries.storeId, storeId)).orderBy(desc(deliveries.date));
  }

  async createDelivery(delivery: InsertDelivery, createdBy?: string): Promise<Delivery> {
    const productionStoreId = await this.getProductionCenterStoreId();
    const quantity = Number(delivery.quantitySent) || 0;
    
    // Deduct from production center inventory
    await this.updateInventoryStock(
      delivery.productId, 
      -quantity, 
      productionStoreId, 
      `Delivery to store: -${quantity}`
    );
    
    // Add to target store inventory
    await this.addInventoryToStore(
      delivery.productId,
      delivery.storeId,
      quantity,
      `Delivery received: +${quantity}`
    );
    
    // Create delivery record
    const result = await db.insert(deliveries).values({ ...delivery, createdBy }).returning();
    return result[0];
  }

  async updateDelivery(id: string, delivery: Partial<InsertDelivery>): Promise<Delivery | undefined> {
    const result = await db.update(deliveries).set({ ...delivery, updatedAt: new Date() }).where(eq(deliveries.id, id)).returning();
    return result[0];
  }

  async deleteDelivery(id: string): Promise<void> {
    await db.delete(deliveries).where(eq(deliveries.id, id));
  }

  // Sales
  async getAllSales(): Promise<Sale[]> {
    return await db.select().from(sales).orderBy(desc(sales.date));
  }

  async getSalesByDate(date: string): Promise<Sale[]> {
    return await db.select().from(sales).where(eq(sales.date, date)).orderBy(sales.productId);
  }

  async getSalesByStore(storeId: string): Promise<Sale[]> {
    return await db.select().from(sales).where(eq(sales.storeId, storeId)).orderBy(desc(sales.date));
  }

  async getSalesByDateAndStore(date: string, storeId: string): Promise<Sale[]> {
    return await db.select().from(sales)
      .where(and(eq(sales.date, date), eq(sales.storeId, storeId)))
      .orderBy(sales.productId);
  }

  async createSale(sale: InsertSale, createdBy?: string): Promise<Sale> {
    const result = await db.insert(sales).values({ ...sale, createdBy }).returning();
    return result[0];
  }

  // Inventory
  async getProductionCenterStoreId(): Promise<string> {
    const result = await db.select().from(stores)
      .where(eq(stores.name, "Delahey"))
      .limit(1);
    if (!result[0]) {
      throw new Error("Production center store (Delahey) not found");
    }
    return result[0].id;
  }

  async getAllInventory(storeId?: string): Promise<Inventory[]> {
    if (storeId) {
      return await db.select().from(inventory)
        .where(eq(inventory.storeId, storeId))
        .orderBy(desc(inventory.date));
    }
    return await db.select().from(inventory).orderBy(desc(inventory.date));
  }

  async getInventoryByStore(storeId: string): Promise<Inventory[]> {
    return await db.select().from(inventory)
      .where(eq(inventory.storeId, storeId))
      .orderBy(desc(inventory.date));
  }

  async getInventoryByProduct(productId: string, storeId?: string): Promise<Inventory[]> {
    if (storeId) {
      return await db.select().from(inventory)
        .where(and(eq(inventory.productId, productId), eq(inventory.storeId, storeId)))
        .orderBy(desc(inventory.date));
    }
    return await db.select().from(inventory)
      .where(eq(inventory.productId, productId))
      .orderBy(desc(inventory.date));
  }

  async getInventoryByStoreAndProduct(storeId: string, productId: string): Promise<Inventory | undefined> {
    const result = await db.select().from(inventory)
      .where(and(eq(inventory.storeId, storeId), eq(inventory.productId, productId)))
      .orderBy(desc(inventory.createdAt))
      .limit(1);
    return result[0];
  }

  async getLatestInventoryByProduct(productId: string, storeId?: string): Promise<Inventory | undefined> {
    if (storeId) {
      const result = await db.select().from(inventory)
        .where(and(eq(inventory.productId, productId), eq(inventory.storeId, storeId)))
        .orderBy(desc(inventory.createdAt))
        .limit(1);
      return result[0];
    }
    const result = await db.select().from(inventory)
      .where(eq(inventory.productId, productId))
      .orderBy(desc(inventory.createdAt))
      .limit(1);
    return result[0];
  }

  async getInventoryAsOfDate(productId: string, storeId: string, date: string): Promise<Inventory | undefined> {
    // Get the latest inventory entry on or before the specified date
    const result = await db.select().from(inventory)
      .where(and(
        eq(inventory.productId, productId), 
        eq(inventory.storeId, storeId),
        sql`${inventory.date} <= ${date}`
      ))
      .orderBy(desc(inventory.date), desc(inventory.createdAt))
      .limit(1);
    return result[0];
  }

  async getCurrentInventoryLevels(storeId?: string): Promise<Map<string, number>> {
    const allProducts = await this.getAllProducts();
    const inventoryLevels = new Map<string, number>();
    
    for (const product of allProducts) {
      const latestEntry = await this.getLatestInventoryByProduct(product.id, storeId);
      inventoryLevels.set(product.id, Number(latestEntry?.quantityInStock) || 0);
    }
    
    return inventoryLevels;
  }

  async recordProduction(entry: InsertInventory): Promise<Inventory> {
    const productionStoreId = await this.getProductionCenterStoreId();
    const latestEntry = await this.getLatestInventoryByProduct(entry.productId, productionStoreId);
    const currentStock = Number(latestEntry?.quantityInStock) || 0;
    const quantityProduced = Number(entry.quantityProduced) || 0;
    const newStock = currentStock + quantityProduced;
    
    const result = await db.insert(inventory).values({
      ...entry,
      storeId: productionStoreId,
      quantityProduced: String(quantityProduced),
      quantityInStock: String(newStock),
    }).returning();
    
    return result[0];
  }

  async updateInventoryStock(productId: string, quantity: number, storeId?: string, notes?: string, date?: string): Promise<void> {
    const targetStoreId = storeId || await this.getProductionCenterStoreId();
    const effectiveDate = date || new Date().toISOString().split('T')[0];
    
    // Get the stock as-of the specified date for historical consistency
    // If no date provided, use the latest entry (current stock)
    let baseStock: number;
    if (date) {
      const historicalEntry = await this.getInventoryAsOfDate(productId, targetStoreId, date);
      baseStock = Number(historicalEntry?.quantityInStock) || 0;
    } else {
      const latestEntry = await this.getLatestInventoryByProduct(productId, targetStoreId);
      baseStock = Number(latestEntry?.quantityInStock) || 0;
    }
    
    const newStock = baseStock + quantity;
    
    // Prevent negative inventory
    if (newStock < 0) {
      const product = await this.getProduct(productId);
      const productName = product?.name || productId;
      throw new Error(`Insufficient inventory for ${productName}. Available: ${baseStock}, Requested: ${Math.abs(quantity)}`);
    }
    
    await db.insert(inventory).values({
      date: effectiveDate,
      productId,
      storeId: targetStoreId,
      quantityInStock: String(newStock),
      quantityProduced: "0",
      notes: notes || `Inventory adjustment: ${quantity > 0 ? '+' : ''}${quantity}`,
    });
  }

  async addInventoryToStore(productId: string, storeId: string, quantity: number, notes?: string): Promise<void> {
    const latestEntry = await this.getLatestInventoryByProduct(productId, storeId);
    const currentStock = Number(latestEntry?.quantityInStock) || 0;
    const newStock = currentStock + quantity;
    
    const today = new Date().toISOString().split('T')[0];
    
    await db.insert(inventory).values({
      date: today,
      productId,
      storeId,
      quantityInStock: String(newStock),
      quantityProduced: "0",
      notes: notes || `Delivery received: +${quantity}`,
    });
  }

  // Analytics
  async getProductsWithLowStock(): Promise<Array<Product & { currentStock: number }>> {
    const latestStocks = await db
      .select({
        productId: stockEntries.productId,
        currentStock: sql<number>`MAX(${stockEntries.reportedStock})`.as('current_stock'),
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

  // Predetermined Deliveries
  async getPredeterminedDeliveriesByStore(storeId: string): Promise<Array<any>> {
    const results = await db.select({
      id: predeterminedDeliveries.id,
      templateId: predeterminedDeliveries.templateId,
      name: predeterminedDeliveries.name,
      storeId: predeterminedDeliveries.storeId,
      productId: predeterminedDeliveries.productId,
      defaultQuantity: predeterminedDeliveries.defaultQuantity,
      frequency: predeterminedDeliveries.frequency,
      productName: products.name,
    }).from(predeterminedDeliveries)
      .leftJoin(products, eq(predeterminedDeliveries.productId, products.id))
      .where(eq(predeterminedDeliveries.storeId, storeId));
    
    return results;
  }

  async getAllPredeterminedDeliveries(): Promise<any[]> {
    const results = await db.select({
      id: predeterminedDeliveries.id,
      templateId: predeterminedDeliveries.templateId,
      name: predeterminedDeliveries.name,
      storeId: predeterminedDeliveries.storeId,
      productId: predeterminedDeliveries.productId,
      defaultQuantity: predeterminedDeliveries.defaultQuantity,
      frequency: predeterminedDeliveries.frequency,
      productName: products.name,
      storeName: stores.name,
    }).from(predeterminedDeliveries)
      .leftJoin(products, eq(predeterminedDeliveries.productId, products.id))
      .leftJoin(stores, eq(predeterminedDeliveries.storeId, stores.id));
    
    return results;
  }

  async createPredeterminedDelivery(data: { templateId: string; name: string; storeId: string; productId: string; defaultQuantity: number; frequency?: string }, createdBy?: string): Promise<PredeterminedDelivery> {
    const result = await db.insert(predeterminedDeliveries).values({
      templateId: data.templateId,
      name: data.name,
      storeId: data.storeId,
      productId: data.productId,
      defaultQuantity: String(data.defaultQuantity),
      frequency: data.frequency || 'daily',
      createdBy,
    }).returning();
    return result[0];
  }

  async deletePredeterminedDelivery(id: string): Promise<void> {
    await db.delete(predeterminedDeliveries).where(eq(predeterminedDeliveries.id, id));
  }

  // User Permissions
  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    return await db.select().from(userPermissions).where(eq(userPermissions.userId, userId));
  }

  async setUserPermission(userId: string, pagePath: string, allowed: boolean, createdBy?: string): Promise<UserPermission> {
    // First check if permission already exists
    const existing = await db.select().from(userPermissions)
      .where(and(eq(userPermissions.userId, userId), eq(userPermissions.pagePath, pagePath)))
      .limit(1);
    
    if (existing[0]) {
      // Update existing permission
      const result = await db.update(userPermissions)
        .set({ allowed: allowed ? 1 : 0, updatedAt: new Date() })
        .where(eq(userPermissions.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      // Create new permission
      const result = await db.insert(userPermissions).values({
        userId,
        pagePath,
        allowed: allowed ? 1 : 0,
        createdBy,
      }).returning();
      return result[0];
    }
  }

  async deleteUserPermissions(userId: string): Promise<void> {
    await db.delete(userPermissions).where(eq(userPermissions.userId, userId));
  }

  // Needs Requests
  async getAllNeedsRequests(): Promise<NeedsRequest[]> {
    return await db.select().from(needsRequests).orderBy(desc(needsRequests.createdAt));
  }

  async getNeedsRequestsByStore(storeId: string): Promise<NeedsRequest[]> {
    return await db.select().from(needsRequests)
      .where(eq(needsRequests.storeId, storeId))
      .orderBy(desc(needsRequests.createdAt));
  }

  async createNeedsRequest(request: InsertNeedsRequest, createdBy?: string): Promise<NeedsRequest> {
    const result = await db.insert(needsRequests).values({ ...request, createdBy }).returning();
    return result[0];
  }

  async updateNeedsRequestStatus(id: string, status: string): Promise<NeedsRequest | undefined> {
    const result = await db.update(needsRequests)
      .set({ status, updatedAt: new Date() })
      .where(eq(needsRequests.id, id))
      .returning();
    return result[0];
  }

  async deleteNeedsRequest(id: string): Promise<void> {
    await db.delete(needsRequests).where(eq(needsRequests.id, id));
  }
}

export const storage = new DatabaseStorage();
