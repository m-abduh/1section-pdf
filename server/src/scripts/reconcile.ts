import { prisma } from "../lib/prisma";
import { reconcilePaidOrders } from "../modules/webhooks/webhook.service";

async function main() {
  const repaired = await reconcilePaidOrders(200);
  console.log(`[reconcile] repaired ${repaired} order(s)`);
}

main()
  .catch((error) => {
    console.error("[reconcile] failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
