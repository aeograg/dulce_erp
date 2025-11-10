import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword, requireAuth, requireRole } from "./auth";
import { insertProductSchema, insertIngredientSchema, insertRecipeSchema, insertStockEntrySchema, recipes } from "@shared/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
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
