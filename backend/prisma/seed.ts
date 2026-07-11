import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Find or create Business
  let business = await prisma.business.findFirst({
    where: { name: "Shri Krishna Traders" },
  });

  if (!business) {
    business = await prisma.business.create({
      data: {
        name: "Shri Krishna Traders",
        gstNumber: "27AABFR5987M1ZP",
        phone: "+91 98765 00001",
        address: "Plot 14, Bhosari MIDC, Pune 411026",
      },
    });
    console.log(`Created Business: ${business.name} (${business.id})`);
  } else {
    console.log(`Found existing Business: ${business.name} (${business.id})`);
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash("Admin@123", salt);

  // Setup Users to seed
  const usersToSeed = [
    {
      email: "admin@shrikrishnatraders.com",
      name: "Ramank Kumar",
      role: "OWNER",
      phone: "+91 98765 00001",
    },
    {
      email: "owner@apniestate.com",
      name: "Owner User",
      role: "OWNER",
      phone: "+91 98765 00002",
    },
    {
      email: "manager@apniestate.com",
      name: "Manager User",
      role: "MANAGER",
      phone: "+91 98765 00003",
    },
    {
      email: "staff@apniestate.com",
      name: "Staff User",
      role: "STAFF",
      phone: "+91 98765 00004",
    },
    {
      email: "driver@apniestate.com",
      name: "Driver User",
      role: "DRIVER",
      phone: "+91 98765 00005",
    },
  ];

  const seededUsers: Record<string, any> = {};

  for (const u of usersToSeed) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        phone: u.phone,
        isActive: true,
        businessId: business.id,
      },
      create: {
        name: u.name,
        email: u.email,
        phone: u.phone,
        passwordHash,
        role: u.role,
        isActive: true,
        businessId: business.id,
      },
    });
    seededUsers[u.email] = user;
    console.log(`Upserted User: ${user.name} (${user.email}) as ${user.role}`);
  }

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
    let existingItem = await prisma.inventoryItem.findFirst({
      where: {
        sku: item.sku,
        businessId: business.id,
      },
    });

    if (!existingItem) {
      existingItem = await prisma.inventoryItem.create({
        data: {
          ...item,
          businessId: business.id,
        },
      });
      console.log(`Created Inventory Item: ${existingItem.materialName} (${existingItem.sku})`);

      // Create a matching starting stock-in transaction
      await prisma.stockTransaction.create({
        data: {
          type: "IN",
          quantity: item.quantity,
          note: "Initial system seeding",
          inventoryItemId: existingItem.id,
          userId: seededUsers["owner@apniestate.com"].id,
        },
      });
    } else {
      console.log(`Found existing Inventory Item: ${existingItem.materialName} (${existingItem.sku})`);
    }
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
