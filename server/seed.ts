import { db } from "../db";
import { users, stores, products, ingredients, recipes } from "@shared/schema";
import { hashPassword } from "./auth";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  // Create admin user only
  const hashedPassword = await hashPassword("9744aeo");
  
  await db.insert(users).values([
    { username: "admin", password: hashedPassword, role: "Admin" },
  ]).onConflictDoNothing();

  console.log("✓ Admin user created");

  // Create stores
  await db.insert(stores).values([
    { name: "Store 1 (Main)", deliverySchedule: "daily" },
    { name: "Store 2 (Daily Delivery)", deliverySchedule: "daily" },
    { name: "Store 3 (Every 2 Days)", deliverySchedule: "every-2-days" },
  ]).onConflictDoNothing();

  console.log("✓ Stores created");

  // Create sample ingredients
  await db.insert(ingredients).values([
    { name: "Flour", costPerUnit: 0.50, unit: "kg" },
    { name: "Butter", costPerUnit: 3.00, unit: "kg" },
    { name: "Sugar", costPerUnit: 1.00, unit: "kg" },
    { name: "Eggs", costPerUnit: 0.20, unit: "piece" },
    { name: "Yeast", costPerUnit: 2.00, unit: "kg" },
    { name: "Milk", costPerUnit: 1.50, unit: "liter" },
  ]).onConflictDoNothing();

  console.log("✓ Ingredients created");

  // Create sample products with batch yields
  await db.insert(products).values([
    {
      code: "P001",
      name: "Croissant",
      unitCost: 1.50,
      sellingPrice: 3.50,
      minStockLevel: 10,
      batchYield: 12, // One batch produces 12 croissants
    },
    {
      code: "P002",
      name: "Danish Pastry",
      unitCost: 1.80,
      sellingPrice: 4.00,
      minStockLevel: 8,
      batchYield: 10, // One batch produces 10 pastries
    },
    {
      code: "P003",
      name: "Sourdough Bread",
      unitCost: 2.50,
      sellingPrice: 6.00,
      minStockLevel: 15,
      batchYield: 4, // One batch produces 4 loaves
    },
    {
      code: "P004",
      name: "Baguette",
      unitCost: 1.20,
      sellingPrice: 2.50,
      minStockLevel: 20,
      batchYield: 6, // One batch produces 6 baguettes
    },
    {
      code: "P005",
      name: "Muffin",
      unitCost: 0.80,
      sellingPrice: 2.00,
      minStockLevel: 25,
      batchYield: 12, // One batch produces 12 muffins
    },
  ]).onConflictDoNothing();

  console.log("✓ Products created");

  // Get product and ingredient IDs for recipes
  const croissant = await db.select().from(products).where(eq(products.code, "P001")).limit(1);
  const baguette = await db.select().from(products).where(eq(products.code, "P004")).limit(1);
  const muffin = await db.select().from(products).where(eq(products.code, "P005")).limit(1);

  const flour = await db.select().from(ingredients).where(eq(ingredients.name, "Flour")).limit(1);
  const butter = await db.select().from(ingredients).where(eq(ingredients.name, "Butter")).limit(1);
  const sugar = await db.select().from(ingredients).where(eq(ingredients.name, "Sugar")).limit(1);
  const eggs = await db.select().from(ingredients).where(eq(ingredients.name, "Eggs")).limit(1);
  const yeast = await db.select().from(ingredients).where(eq(ingredients.name, "Yeast")).limit(1);
  const milk = await db.select().from(ingredients).where(eq(ingredients.name, "Milk")).limit(1);

  // Create sample recipes (batchYield is now on product level)
  if (croissant[0] && flour[0] && butter[0] && milk[0]) {
    await db.insert(recipes).values([
      { productId: croissant[0].id, ingredientId: flour[0].id, quantity: 2 }, // 2kg flour per batch
      { productId: croissant[0].id, ingredientId: butter[0].id, quantity: 0.5 }, // 0.5kg butter per batch
      { productId: croissant[0].id, ingredientId: milk[0].id, quantity: 0.3 }, // 0.3L milk per batch
    ]).onConflictDoNothing();
  }

  if (baguette[0] && flour[0] && yeast[0]) {
    await db.insert(recipes).values([
      { productId: baguette[0].id, ingredientId: flour[0].id, quantity: 3 }, // 3kg flour per batch
      { productId: baguette[0].id, ingredientId: yeast[0].id, quantity: 0.02 }, // 20g yeast per batch
    ]).onConflictDoNothing();
  }

  if (muffin[0] && flour[0] && sugar[0] && eggs[0] && butter[0]) {
    await db.insert(recipes).values([
      { productId: muffin[0].id, ingredientId: flour[0].id, quantity: 1.5 }, // 1.5kg flour per batch
      { productId: muffin[0].id, ingredientId: sugar[0].id, quantity: 0.8 }, // 0.8kg sugar per batch
      { productId: muffin[0].id, ingredientId: eggs[0].id, quantity: 6 }, // 6 eggs per batch
      { productId: muffin[0].id, ingredientId: butter[0].id, quantity: 0.3 }, // 0.3kg butter per batch
    ]).onConflictDoNothing();
  }

  console.log("✓ Sample recipes created with batch yields");

  console.log("\nDatabase seeded successfully!");
  console.log("\nAdmin account: admin");
  console.log("\nSample recipes:");
  console.log("  - Croissant: Batch yields 12 units");
  console.log("  - Baguette: Batch yields 6 units");
  console.log("  - Muffin: Batch yields 12 units");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
