import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing records
  await prisma.stockTransaction.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();

  // Create Business
  const business = await prisma.business.create({
    data: {
      name: "Shri Krishna Traders",
      gstNumber: "27AABFR5987M1ZP",
      phone: "+91 98765 00001",
      address: "Plot 14, Bhosari MIDC, Pune 411026",
    },
  });

  console.log(`Created Business: ${business.name} (${business.id})`);

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("Admin@123", salt);

  // Create Admin User
  const admin = await prisma.user.create({
    data: {
      name: "Ramank Kumar",
      email: "admin@shrikrishnatraders.com",
      passwordHash,
      role: "ADMIN",
      businessId: business.id,
    },
  });

  console.log(`Created User: ${admin.name} (${admin.email})`);

  // Seed 8 Inventory Items
  const items = [
    {
      materialName: "OPC 53 Grade Cement",
      category: "Cement",
      sku: "CEM-OPC-53",
      unit: "Bags",
      quantity: 840,
      reorderLevel: 500,
      location: "Godown A",
      costPrice: 350,
      sellingPrice: 420,
    },
    {
      materialName: "Fe500 TMT Bar 12mm",
      category: "TMT Bars",
      sku: "TMT-500-12",
      unit: "Tonnes",
      quantity: 18.5,
      reorderLevel: 10,
      location: "Main Yard",
      costPrice: 52000,
      sellingPrice: 58000,
    },
    {
      materialName: "M-Sand (Zone II)",
      category: "Sand",
      sku: "SND-MSAND-2",
      unit: "Cu.Ft",
      quantity: 320,
      reorderLevel: 400,
      location: "Main Yard",
      costPrice: 45,
      sellingPrice: 60,
    },
    {
      materialName: "Red Bricks (Wire Cut)",
      category: "Bricks",
      sku: "BRK-RED-WC",
      unit: "Pcs",
      quantity: 45000,
      reorderLevel: 20000,
      location: "Godown B",
      costPrice: 6,
      sellingPrice: 9,
    },
    {
      materialName: "20mm Aggregate",
      category: "Aggregate",
      sku: "AGG-20MM-CR",
      unit: "Tonnes",
      quantity: 85,
      reorderLevel: 60,
      location: "Main Yard",
      costPrice: 1200,
      sellingPrice: 1500,
    },
    {
      materialName: "Commercial Plywood 19mm",
      category: "Plywood",
      sku: "PLY-COM-19",
      unit: "Sheets",
      quantity: 120,
      reorderLevel: 50,
      location: "Godown A",
      costPrice: 1800,
      sellingPrice: 2200,
    },
    {
      materialName: "Asian Paints Apex White",
      category: "Paint",
      sku: "PNT-APX-WH",
      unit: "Liters",
      quantity: 240,
      reorderLevel: 100,
      location: "Godown B",
      costPrice: 180,
      sellingPrice: 220,
    },
    {
      materialName: "Finolex 2.5 Sqmm Wire",
      category: "Electrical Wire",
      sku: "WIR-FIN-2.5",
      unit: "Coils",
      quantity: 80,
      reorderLevel: 20,
      location: "Godown A",
      costPrice: 850,
      sellingPrice: 1100,
    },
  ];

  for (const item of items) {
    const createdItem = await prisma.inventoryItem.create({
      data: {
        ...item,
        businessId: business.id,
      },
    });

    // Create a matching starting stock-in transaction
    await prisma.stockTransaction.create({
      data: {
        type: "IN",
        quantity: item.quantity,
        note: "Initial system seeding",
        inventoryItemId: createdItem.id,
        userId: admin.id,
      },
    });
  }

  console.log("Database seeded successfully with 8 inventory items.");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
