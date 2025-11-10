import { db } from "../db";
import { users, stores, products, ingredients } from "@shared/schema";
import { hashPassword } from "./auth";

async function seed() {
  console.log("Seeding database...");

  // Create default users
  const hashedPassword = await hashPassword("password");
  
  await db.insert(users).values([
    { username: "admin", password: hashedPassword, role: "Admin" },
    { username: "manager", password: hashedPassword, role: "Manager" },
    { username: "staff", password: hashedPassword, role: "Staff" },
  ]).onConflictDoNothing();

  console.log("✓ Users created");

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

  // Create sample products
  await db.insert(products).values([
    {
      code: "P001",
      name: "Croissant",
      unitCost: 1.50,
      sellingPrice: 3.50,
      minStockLevel: 10,
      laborCost: 0.50,
      overheadCost: 0.30,
    },
    {
      code: "P002",
      name: "Danish Pastry",
      unitCost: 1.80,
      sellingPrice: 4.00,
      minStockLevel: 8,
      laborCost: 0.60,
      overheadCost: 0.35,
    },
    {
      code: "P003",
      name: "Sourdough Bread",
      unitCost: 2.50,
      sellingPrice: 6.00,
      minStockLevel: 15,
      laborCost: 1.00,
      overheadCost: 0.50,
    },
    {
      code: "P004",
      name: "Baguette",
      unitCost: 1.20,
      sellingPrice: 2.50,
      minStockLevel: 20,
      laborCost: 0.40,
      overheadCost: 0.25,
    },
    {
      code: "P005",
      name: "Muffin",
      unitCost: 0.80,
      sellingPrice: 2.00,
      minStockLevel: 25,
      laborCost: 0.30,
      overheadCost: 0.20,
    },
  ]).onConflictDoNothing();

  console.log("✓ Products created");
  console.log("\nDatabase seeded successfully!");
  console.log("\nDemo accounts:");
  console.log("  - admin/password (Admin)");
  console.log("  - manager/password (Manager)");
  console.log("  - staff/password (Staff)");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
