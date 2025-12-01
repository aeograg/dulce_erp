import type { Express } from "express";
import { storage } from "./storage";
import { hashPassword, verifyPassword, requireAuth, requireRole } from "./auth";
import { insertProductSchema, insertIngredientSchema, insertRecipeSchema, insertStockEntrySchema, insertDeliverySchema, insertSaleSchema, insertInventorySchema, insertPredeterminedDeliverySchema, recipes } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<void> {
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
      }, (req.session as any).username);
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
      (req.session as any).username = user.username;
      req.session!.userRole = user.role;
      req.session!.userStoreId = user.storeId || undefined;

      // Explicitly save session to database before responding
      await new Promise<void>((resolve, reject) => {
        req.session!.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

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
      const product = await storage.createProduct(productData, (req.session as any).username);
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
      const ingredient = await storage.createIngredient(ingredientData, (req.session as any).username);
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
      const recipe = await storage.createRecipe(recipeData, (req.session as any).username);
      
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
      
      // Check for duplicate entry (same date, product, store)
      const existingEntry = await storage.getStockEntryByDateProductStore(
        entryData.date,
        entryData.productId,
        entryData.storeId
      );
      
      if (existingEntry) {
        return res.status(400).json({ 
          error: "Entry already exists for this date, product, and store. Please edit the existing entry instead."
        });
      }
      
      // Get the store's inventory stock for this product
      const storeInventory = await storage.getInventoryByStoreAndProduct(entryData.storeId, entryData.productId);
      const inventoryStock = Number(storeInventory?.quantityInStock) || 0;
      
      // Calculate expected stock: Inventory Stock - sales - waste
      const waste = Number(entryData.waste) || 0;
      const sales = Number(entryData.sales) || 0;
      const reportedStock = Number(entryData.reportedStock) || 0;
      
      // Expected stock = Inventory Stock of the store - sales - waste
      const expectedStock = inventoryStock - sales - waste;
      
      // Calculate discrepancy percentage based on inventory stock
      const discrepancy = inventoryStock > 0 
        ? ((reportedStock - expectedStock) / inventoryStock) * 100 
        : 0;
      
      const entry = await storage.createStockEntry({
        ...entryData,
        delivered: inventoryStock,
        expectedStock: expectedStock,
        reportedRemaining: entryData.reportedStock,
        discrepancy,
      }, (req.session as any).username);
      
      res.status(201).json(entry);
    } catch (error: any) {
      console.error("Create stock entry error:", error);
      res.status(400).json({ error: error.message || "Failed to create stock entry" });
    }
  });

  app.patch("/api/stock-entries/:id", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const updateData = req.body;
      const entry = await storage.updateStockEntry(req.params.id, updateData);
      
      if (!entry) {
        return res.status(404).json({ error: "Stock entry not found" });
      }
      
      // Get the store's inventory stock for this product
      const storeInventory = await storage.getInventoryByStoreAndProduct(entry.storeId, entry.productId);
      const inventoryStock = Number(storeInventory?.quantityInStock) || 0;
      
      // Recalculate expected stock and discrepancy
      const waste = Number(entry.waste) || 0;
      const sales = Number(entry.sales) || 0;
      const reportedStock = Number(entry.reportedStock) || 0;
      
      // Expected stock = Inventory Stock of the store - sales - waste
      const expectedStock = inventoryStock - sales - waste;
      
      // Calculate discrepancy percentage based on inventory stock
      const discrepancy = inventoryStock > 0 
        ? ((reportedStock - expectedStock) / inventoryStock) * 100 
        : 0;
      
      const updatedEntry = await storage.updateStockEntry(req.params.id, {
        delivered: inventoryStock,
        expectedStock: expectedStock,
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
      
      // createDelivery handles all inventory operations:
      // 1. Deducts from production center inventory
      // 2. Adds to target store inventory
      const delivery = await storage.createDelivery(deliveryData, (req.session as any).username);
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

  // Predetermined Delivery Routes
  app.get("/api/predetermined-deliveries", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const storeId = req.query.storeId as string | undefined;
      let deliveries;
      if (storeId) {
        deliveries = await storage.getPredeterminedDeliveriesByStore(storeId);
      } else {
        deliveries = await storage.getAllPredeterminedDeliveries();
      }
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch predetermined deliveries" });
    }
  });

  app.post("/api/predetermined-deliveries", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const { templateName, storeId, products } = req.body;
      
      if (!templateName || !storeId || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ 
          error: "Missing templateName, storeId, or products array" 
        });
      }
      
      const templateId = Math.random().toString(36).substring(7);
      const savedTemplates = [];
      const errors = [];
      
      for (const { productId, defaultQuantity } of products) {
        if (defaultQuantity <= 0) continue;
        
        try {
          const template = await storage.createPredeterminedDelivery({
            templateId,
            name: templateName,
            storeId,
            productId,
            defaultQuantity,
            frequency: 'daily',
          }, (req.session as any).username);
          savedTemplates.push(template);
        } catch (error: any) {
          errors.push({
            productId,
            error: error.message,
          });
        }
      }
      
      if (errors.length > 0 && savedTemplates.length === 0) {
        console.error("Template save errors:", errors);
        return res.status(400).json({
          error: "Failed to save any templates",
          details: errors,
        });
      }
      
      res.status(201).json({
        created: savedTemplates,
        failed: errors.length > 0 ? errors : undefined,
      });
    } catch (error: any) {
      console.error("Template save exception:", error);
      res.status(500).json({ error: error.message || "Failed to save predetermined delivery template" });
    }
  });

  app.delete("/api/predetermined-deliveries/:id", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      await storage.deletePredeterminedDelivery(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete predetermined delivery" });
    }
  });

  app.post("/api/deliveries/predetermined", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const { date, storeId, products } = req.body;
      
      if (!date || !storeId || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ 
          error: "Missing date, storeId, or products array" 
        });
      }
      
      const deliveryRecords = [];
      const errors = [];
      
      for (const { productId, quantity } of products) {
        if (quantity <= 0) continue;
        
        try {
          const delivery = await storage.createDelivery({
            date,
            storeId,
            productId,
            quantitySent: quantity,
          });
          deliveryRecords.push(delivery);
        } catch (error: any) {
          errors.push({
            productId,
            error: error.message,
          });
        }
      }
      
      if (errors.length > 0 && deliveryRecords.length === 0) {
        return res.status(400).json({
          error: "Failed to create any deliveries",
          details: errors,
        });
      }
      
      res.status(201).json({
        created: deliveryRecords,
        failed: errors.length > 0 ? errors : undefined,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to process predetermined delivery" });
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
      const sale = await storage.createSale(validatedData, (req.session as any).username);
      res.status(201).json(sale);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create sale" });
    }
  });

  // Inventory Routes
  app.get("/api/inventory/production-store", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const storeId = await storage.getProductionCenterStoreId();
      res.json({ storeId });
    } catch (error) {
      res.status(500).json({ error: "Failed to get production center store" });
    }
  });

  app.get("/api/inventory", requireAuth, async (req, res) => {
    try {
      const storeId = req.query.storeId as string | undefined;
      const userRole = req.session.userRole;
      const userStoreId = req.session.userStoreId;
      
      // Staff can only see their assigned store inventory
      let effectiveStoreId = storeId;
      if (userRole === "Staff" && userStoreId) {
        effectiveStoreId = userStoreId;
      }
      
      const allInventory = await storage.getAllInventory(effectiveStoreId);
      res.json(allInventory);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });

  app.get("/api/inventory/current", requireAuth, async (req, res) => {
    try {
      const storeId = req.query.storeId as string | undefined;
      const userRole = req.session.userRole;
      const userStoreId = req.session.userStoreId;
      
      // Staff can only see their assigned store inventory
      let effectiveStoreId = storeId;
      if (userRole === "Staff" && userStoreId) {
        effectiveStoreId = userStoreId;
      }
      
      const currentLevels = await storage.getCurrentInventoryLevels(effectiveStoreId);
      const levelsObject = Object.fromEntries(currentLevels);
      res.json(levelsObject);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch current inventory levels" });
    }
  });

  app.get("/api/inventory/product/:productId", requireAuth, async (req, res) => {
    try {
      const storeId = req.query.storeId as string | undefined;
      const userRole = req.session.userRole;
      const userStoreId = req.session.userStoreId;
      
      // Staff can only see their assigned store inventory
      let effectiveStoreId = storeId;
      if (userRole === "Staff" && userStoreId) {
        effectiveStoreId = userStoreId;
      }
      
      const inventoryHistory = await storage.getInventoryByProduct(req.params.productId, effectiveStoreId);
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

  // User Permissions Routes (Admin only)
  app.get("/api/permissions/:userId", requireRole("Admin"), async (req, res) => {
    try {
      const permissions = await storage.getUserPermissions(req.params.userId);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  app.post("/api/permissions", requireRole("Admin"), async (req, res) => {
    try {
      const { userId, pagePath, allowed } = req.body;
      const permission = await storage.setUserPermission(
        userId, 
        pagePath, 
        allowed, 
        (req.session as any).username
      );
      res.status(201).json(permission);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to set permission" });
    }
  });

  app.post("/api/permissions/batch", requireRole("Admin"), async (req, res) => {
    try {
      const { userId, permissions } = req.body;
      const results = [];
      for (const perm of permissions) {
        const result = await storage.setUserPermission(
          userId, 
          perm.pagePath, 
          perm.allowed, 
          (req.session as any).username
        );
        results.push(result);
      }
      res.status(201).json(results);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to set permissions" });
    }
  });

  app.delete("/api/permissions/:userId", requireRole("Admin"), async (req, res) => {
    try {
      await storage.deleteUserPermissions(req.params.userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete permissions" });
    }
  });

  // Needs Requests Routes
  app.get("/api/needs-requests", requireAuth, async (req, res) => {
    try {
      const { storeId } = req.query;
      const userRole = req.session.userRole;
      const userStoreId = req.session.userStoreId;
      
      // Staff can only see their assigned store requests
      let effectiveStoreId = storeId as string | undefined;
      if (userRole === "Staff" && userStoreId) {
        effectiveStoreId = userStoreId;
      }
      
      let requests;
      if (effectiveStoreId) {
        requests = await storage.getNeedsRequestsByStore(effectiveStoreId);
      } else {
        requests = await storage.getAllNeedsRequests();
      }
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch needs requests" });
    }
  });

  app.post("/api/needs-requests", requireAuth, async (req, res) => {
    try {
      const { storeId, requestType, items, notes } = req.body;
      
      if (!storeId || !requestType || !items) {
        return res.status(400).json({ error: "Missing required fields: storeId, requestType, items" });
      }

      const request = await storage.createNeedsRequest({
        storeId,
        requestType,
        items,
        notes: notes || null,
        status: "pending",
      }, (req.session as any).username);
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create needs request" });
    }
  });

  app.patch("/api/needs-requests/:id/status", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      const { status } = req.body;
      const request = await storage.updateNeedsRequestStatus(req.params.id, status);
      if (!request) {
        return res.status(404).json({ error: "Needs request not found" });
      }
      res.json(request);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update request status" });
    }
  });

  app.delete("/api/needs-requests/:id", requireRole("Admin", "Manager"), async (req, res) => {
    try {
      await storage.deleteNeedsRequest(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete needs request" });
    }
  });
}
