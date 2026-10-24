import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { niches, products } from "./seed-data";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@1section.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";
  const adminName = process.env.ADMIN_NAME ?? "Administrator";

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { name: adminName, passwordHash },
    create: { email: adminEmail, name: adminName, passwordHash, role: "admin" },
  });
  console.log(`[seed] admin ready: ${adminEmail}`);

  for (const nicheData of niches) {
    const niche = await prisma.niche.upsert({
      where: { slug: nicheData.slug },
      update: {
        name: nicheData.name,
        tagline: nicheData.tagline,
        description: nicheData.description,
        audience: nicheData.audience,
        problems: nicheData.problems,
        accentColor: nicheData.accentColor,
        sortOrder: nicheData.sortOrder,
        active: true,
      },
      create: { ...nicheData, active: true },
    });

    const nicheProducts = products.filter((p) => p.nicheSlug === nicheData.slug);
    for (const productData of nicheProducts) {
      const { nicheSlug: _nicheSlug, ...rest } = productData;
      await prisma.product.upsert({
        where: { slug: productData.slug },
        update: {
          nicheId: niche.id,
          ...rest,
          features: rest.features,
          active: true,
        },
        create: {
          nicheId: niche.id,
          ...rest,
          currency: "USD",
          features: rest.features,
          active: true,
        },
      });
    }
    console.log(`[seed] niche "${nicheData.slug}" with ${nicheProducts.length} product(s)`);
  }

  console.log("[seed] done");
}

main()
  .catch((error) => {
    console.error("[seed] failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
