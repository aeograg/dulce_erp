import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword, requireAuth, requireRole } from "./auth";
import { insertProductSchema, insertIngredientSchema, insertRecipeSchema, insertStockEntrySchema, insertDeliverySchema, insertSaleSchema, insertInventorySchema, recipes } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // User Management Routes (Admin only)
  app.get("/api/users", requireRole("Admin"), async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();
      const usersWithoutPasswords = allUsers.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireRole("Admin"), async (req, res) => {
    try {
      const { username, password, role, storeId } = req.body;
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        role,
        storeId: storeId || null,
      });
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", requireRole("Admin"), async (req, res) => {
    try {
      const { password, ...otherData } = req.body;
      const updateData: any = otherData;
      if (password) {
        updateData.password = await hashPassword(password);
      }
      const user = await storage.updateUser(req.params.id, updateData);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", requireRole("Admin"), async (req, res) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Auth Routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await verifyPassword(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session!.userId = user.id;
      req.session!.userRole = user.role;

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session?.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session!.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Store Routes
  app.get("/api/stores", requireAuth, async (req, res) => {
    try {
      const stores = await storage.getAllStores();
      res.json(stores);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stores" });
    }
  });

  // Product Routes
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error: any) {
      console.error("Create product error:", error);
      res.status(400).json({ error: error.message || "Failed to create product" });
    }
  });

  app.patch("/api/products/:id", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, productData);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Ingredient Routes
  app.get("/api/ingredients", requireAuth, async (req, res) => {
    try {
      const ingredients = await storage.getAllIngredients();
      res.json(ingredients);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ingredients" });
    }
  });

  app.post("/api/ingredients", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const ingredientData = insertIngredientSchema.parse(req.body);
      const ingredient = await storage.createIngredient(ingredientData);
      res.status(201).json(ingredient);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create ingredient" });
    }
  });

  app.patch("/api/ingredients/:id", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const ingredientData = insertIngredientSchema.partial().parse(req.body);
      const ingredient = await storage.updateIngredient(req.params.id, ingredientData);
      if (!ingredient) {
        return res.status(404).json({ error: "Ingredient not found" });
      }
      
      // Recalculate costs for all products using this ingredient
      const affectedProducts = await storage.getProductsUsingIngredient(req.params.id);
      for (const productId of affectedProducts) {
        await storage.recalculateProductCost(productId);
      }
      
      res.json(ingredient);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update ingredient" });
    }
  });

  app.delete("/api/ingredients/:id", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      // Get affected products before deletion
      const affectedProducts = await storage.getProductsUsingIngredient(req.params.id);
      
      await storage.deleteIngredient(req.params.id);
      
      // Recalculate costs for all products that used this ingredient
      for (const productId of affectedProducts) {
        await storage.recalculateProductCost(productId);
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete ingredient" });
    }
  });

  // Recipe Routes
  app.get("/api/products/:productId/recipes", requireAuth, async (req, res) => {
    try {
      const recipes = await storage.getRecipesByProduct(req.params.productId);
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });

  app.post("/api/recipes", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const recipeData = insertRecipeSchema.parse(req.body);
      const recipe = await storage.createRecipe(recipeData);
      
      // Recalculate product cost based on new recipe
      await storage.recalculateProductCost(recipeData.productId);
      
      res.status(201).json(recipe);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create recipe" });
    }
  });

  app.delete("/api/recipes/:id", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      // Get the recipe to know which product to recalculate
      const recipeToDelete = await db.select().from(recipes).where(eq(recipes.id, req.params.id)).limit(1);
      const productId = recipeToDelete[0]?.productId;
      
      await storage.deleteRecipe(req.params.id);
      
      // Recalculate product cost after deletion
      if (productId) {
        await storage.recalculateProductCost(productId);
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete recipe" });
    }
  });

  // Stock Entry Routes
  app.get("/api/stock-entries", requireAuth, async (req, res) => {
    try {
      const { date, storeId, productId } = req.query;
      
      let entries;
      if (date) {
        entries = await storage.getStockEntriesByDate(date as string);
      } else if (storeId) {
        entries = await storage.getStockEntriesByStore(storeId as string);
      } else if (productId) {
        entries = await storage.getStockEntriesByProduct(productId as string);
      } else {
        entries = await storage.getAllStockEntries();
      }
      
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stock entries" });
    }
  });

  app.post("/api/stock-entries", requireRole("Admin", "Manager", "Staff"), async (req, res) => {
    try {
      const entryData = insertStockEntrySchema.parse(req.body);
      
      // Get previous stock entry for calculations
      const prevEntry = await storage.getLatestStockEntry(entryData.productId, entryData.storeId);
      const previousExpected = prevEntry?.expectedRemaining || 0;
      
      // Calculate expected remaining
      const delivered = entryData.delivered || 0;
      const waste = entryData.waste || 0;
      const sales = entryData.sales || 0;
      const currentStock = entryData.currentStock || 0;
      
      const expectedRemaining = previousExpected + delivered - waste - sales;
      
      // Calculate discrepancy percentage
      const discrepancy = delivered > 0 
        ? ((currentStock - expectedRemaining) / delivered) * 100 
        : 0;
      
      const entry = await storage.createStockEntry({
        ...entryData,
        expectedRemaining,
        reportedRemaining: entryData.currentStock,
        discrepancy,
      });
      
      res.status(201).json(entry);
    } catch (error: any) {
      console.error("Create stock entry error:", error);
      res.status(400).json({ error: error.message || "Failed to create stock entry" });
    }
  });

  app.patch("/api/stock-entries/:id", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const { delivered, sales } = req.body;
      const entry = await storage.updateStockEntry(req.params.id, { delivered, sales });
      
      if (!entry) {
        return res.status(404).json({ error: "Stock entry not found" });
      }
      
      // Recalculate expected remaining and discrepancy
      const previousExpected = 0; // You may want to get the actual previous stock
      const expectedRemaining = previousExpected + (entry.delivered || 0) - (entry.waste || 0) - (entry.sales || 0);
      const discrepancy = (entry.delivered || 0) > 0 
        ? ((entry.currentStock - expectedRemaining) / (entry.delivered || 1)) * 100 
        : 0;
      
      const updatedEntry = await storage.updateStockEntry(req.params.id, {
        expectedRemaining,
        discrepancy,
      });
      
      res.json(updatedEntry);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update stock entry" });
    }
  });

  // Delivery Routes
  app.get("/api/deliveries", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const { date, storeId } = req.query;
      
      let deliveries;
      if (date) {
        deliveries = await storage.getDeliveriesByDate(date as string);
      } else if (storeId) {
        deliveries = await storage.getDeliveriesByStore(storeId as string);
      } else {
        deliveries = await storage.getAllDeliveries();
      }
      
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deliveries" });
    }
  });

  app.post("/api/deliveries", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const deliveryData = insertDeliverySchema.parse(req.body);
      const delivery = await storage.createDelivery(deliveryData);
      res.status(201).json(delivery);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create delivery" });
    }
  });

  app.patch("/api/deliveries/:id", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const updateData = insertDeliverySchema.partial().parse(req.body);
      const delivery = await storage.updateDelivery(req.params.id, updateData);
      if (!delivery) {
        return res.status(404).json({ error: "Delivery not found" });
      }
      res.json(delivery);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update delivery" });
    }
  });

  app.delete("/api/deliveries/:id", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      await storage.deleteDelivery(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete delivery" });
    }
  });

  // Sales Routes
  app.get("/api/sales", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const allSales = await storage.getAllSales();
      res.json(allSales);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sales" });
    }
  });

  app.post("/api/sales", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const validatedData = insertSaleSchema.parse(req.body);
      const sale = await storage.createSale(validatedData);
      res.status(201).json(sale);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create sale" });
    }
  });

  // Inventory Routes
  app.get("/api/inventory", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const allInventory = await storage.getAllInventory();
      res.json(allInventory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/current", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const currentLevels = await storage.getCurrentInventoryLevels();
      const levelsObject = Object.fromEntries(currentLevels);
      res.json(levelsObject);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch current inventory levels" });
    }
  });

  app.get("/api/inventory/product/:productId", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const inventoryHistory = await storage.getInventoryByProduct(req.params.productId);
      res.json(inventoryHistory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product inventory" });
    }
  });

  app.post("/api/inventory/production", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const validatedData = insertInventorySchema.parse(req.body);
      const entry = await storage.recordProduction(validatedData);
      res.status(201).json(entry);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to record production" });
    }
  });

  // Analytics Routes
  app.get("/api/analytics/low-stock", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const products = await storage.getProductsWithLowStock();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch low stock products" });
    }
  });

  app.get("/api/analytics/discrepancies", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const threshold = req.query.threshold ? Number(req.query.threshold) : 5;
      const discrepancies = await storage.getStockDiscrepancies(threshold);
      res.json(discrepancies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch discrepancies" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
