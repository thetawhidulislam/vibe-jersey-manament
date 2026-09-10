import { prisma } from "../src/lib/prisma";

function asMoney(value: number) {
  return Number(value.toFixed(2));
}

async function main() {
  const items = await prisma.orderItem.findMany({
    where: {
      order: { status: { not: "RETURNED" } },
    },
    include: {
      order: {
        select: {
          orderNumber: true,
          status: true,
          createdAt: true,
        },
      },
      jersey: {
        select: {
          name: true,
          team: true,
        },
      },
    },
    orderBy: [{ order: { createdAt: "asc" } }, { jerseyId: "asc" }, { size: "asc" }],
  });

  const rows = items.map((item) => {
    const quantity = Number(item.quantity);
    const buyingPrice = Number(item.buyingPrice);
    const sellingPrice = Number(item.sellingPrice);
    const lineProfit = (sellingPrice - buyingPrice) * quantity;

    return {
      orderNumber: item.order.orderNumber,
      status: item.order.status,
      jerseyName: item.jersey.name,
      team: item.jersey.team,
      size: item.size,
      quantity,
      buyingPrice,
      sellingPrice,
      lineProfit: asMoney(lineProfit),
      suspicious:
        !Number.isFinite(buyingPrice) ||
        !Number.isFinite(sellingPrice) ||
        buyingPrice == null ||
        sellingPrice == null ||
        buyingPrice === 0 ||
        sellingPrice === 0,
    };
  });

  const duplicateKeys = new Map<string, number>();
  for (const row of items) {
    const key = `${row.orderId}::${row.jerseyId}::${row.size}`;
    duplicateKeys.set(key, (duplicateKeys.get(key) ?? 0) + 1);
  }

  const duplicateRows = [...duplicateKeys.entries()]
    .filter(([, count]) => count > 1)
    .map(([key, count]) => ({ key, count }));

  const suspiciousRows = rows.filter((row) => row.suspicious);
  const grandTotal = asMoney(rows.reduce((sum, row) => sum + row.lineProfit, 0));

  console.log("=== Profit Verification Debug ===");
  console.log("Filter used: order.status != 'RETURNED'");
  console.log("Rows included:", rows.length);
  console.log("Dashboard Total Profit target: 4110");
  console.log("Computed grand total from itemized profit rows:", grandTotal);
  console.log("Matches dashboard total?", grandTotal === 4110);
  console.log("");

  console.log("Itemized breakdown:");
  console.table(
    rows.map((row) => ({
      orderNumber: row.orderNumber,
      jersey: row.jerseyName,
      size: row.size,
      qty: row.quantity,
      buyingPrice: row.buyingPrice,
      sellingPrice: row.sellingPrice,
      lineProfit: row.lineProfit,
      suspicious: row.suspicious,
    }))
  );

  console.log("");
  console.log("Duplicate jersey/size in same order:");
  console.table(duplicateRows);

  console.log("");
  console.log("Suspicious/null/zero price rows:");
  if (suspiciousRows.length === 0) {
    console.log("No suspicious price rows found.");
  } else {
    console.table(
      suspiciousRows.map((row) => ({
        orderNumber: row.orderNumber,
        jersey: row.jerseyName,
        size: row.size,
        quantity: row.quantity,
        buyingPrice: row.buyingPrice,
        sellingPrice: row.sellingPrice,
        lineProfit: row.lineProfit,
      }))
    );
  }
}

main().catch((error) => {
  console.error("Debug script failed:", error);
  process.exit(1);
});
