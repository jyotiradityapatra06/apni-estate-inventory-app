import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Starting Godown Data Backfill ===");
  const businesses = await prisma.business.findMany();

  for (const biz of businesses) {
    console.log(`Processing Business: ${biz.name} (${biz.id})...`);

    // 1. Find or create default godown
    let defaultGodown = await prisma.godown.findFirst({
      where: { businessId: biz.id, isDefault: true }
    });

    if (!defaultGodown) {
      // Look for any godown to make default
      defaultGodown = await prisma.godown.findFirst({
        where: { businessId: biz.id }
      });
      if (defaultGodown) {
        await prisma.godown.update({
          where: { id: defaultGodown.id },
          data: { isDefault: true, isActive: true }
        });
      } else {
        defaultGodown = await prisma.godown.create({
          data: {
            businessId: biz.id,
            godownCode: "MAIN",
            name: "Main Godown",
            isDefault: true,
            isActive: true,
            address: biz.address || "Main Site"
          }
        });
        console.log(`Created new default godown: ${defaultGodown.name} (${defaultGodown.id})`);
      }
    } else {
      console.log(`Found existing default godown: ${defaultGodown.name} (${defaultGodown.id})`);
    }

    // 2. Find all inventory items for this business
    const items = await prisma.inventoryItem.findMany({
      where: { businessId: biz.id }
    });

    for (const item of items) {
      // Find or create GodownStock for this item in the default godown
      const stock = await prisma.godownStock.findUnique({
        where: {
          businessId_godownId_inventoryItemId: {
            businessId: biz.id,
            godownId: defaultGodown.id,
            inventoryItemId: item.id
          }
        }
      });

      if (!stock) {
        await prisma.godownStock.create({
          data: {
            businessId: biz.id,
            godownId: defaultGodown.id,
            inventoryItemId: item.id,
            quantity: item.quantity,
            reservedQuantity: 0,
            reorderLevel: item.reorderLevel || 0
          }
        });
        console.log(`Created GodownStock for material ${item.materialName} with quantity ${item.quantity}`);
      } else {
        // Reconcile if quantity matches
        if (stock.quantity !== item.quantity) {
          await prisma.godownStock.update({
            where: { id: stock.id },
            data: { quantity: item.quantity }
          });
          console.log(`Reconciled GodownStock quantity for material ${item.materialName} to ${item.quantity}`);
        }
      }

      // Update null godownId in stock transactions
      const txCount = await prisma.stockTransaction.updateMany({
        where: {
          businessId: biz.id,
          inventoryItemId: item.id,
          godownId: null
        },
        data: {
          godownId: defaultGodown.id
        }
      });
      if (txCount.count > 0) {
        console.log(`Updated ${txCount.count} stock transactions to default godown for material ${item.materialName}`);
      }
    }
  }

  console.log("=== Godown Data Backfill Completed Successfully ===");
}

main()
  .catch((e) => {
    console.error("Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
