import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const niches = [
  {
    slug: "finance",
    name: "Finance",
    tagline: "Take control of your money with ready-to-use financial playbooks.",
    description:
      "A curated bundle of PDF guides covering budgeting, investing basics, and building lasting wealth habits.",
    accentColor: "#10B981",
    featured: true,
    sortOrder: 1,
  },
  {
    slug: "business",
    name: "Business",
    tagline: "Launch, validate, and scale your business with proven frameworks.",
    description:
      "Everything from business model canvas to operations checklists, packaged as actionable PDF playbooks.",
    accentColor: "#6366F1",
    featured: true,
    sortOrder: 2,
  },
  {
    slug: "marketing",
    name: "Marketing",
    tagline: "Grow your audience and sell more with practical marketing systems.",
    description:
      "Content calendars, funnel templates, and copywriting frameworks you can apply today.",
    accentColor: "#F59E0B",
    featured: false,
    sortOrder: 3,
  },
  {
    slug: "productivity",
    name: "Productivity",
    tagline: "Do focused work and get more done in less time.",
    description:
      "Templates and systems for planning, note-taking, and building habits that stick.",
    accentColor: "#EC4899",
    featured: false,
    sortOrder: 4,
  },
];

const products = [
  {
    nicheSlug: "finance",
    slug: "personal-finance-starter-bundle",
    name: "Personal Finance Starter Bundle",
    summary: "5 PDF playbooks to budget, save, and start investing with confidence.",
    description:
      "Includes: Budget Blueprint, Emergency Fund Formula, Debt Payoff Planner, Investing 101, and a 90-day money tracker. Delivered instantly as downloadable PDFs.",
    priceAmount: 2900,
    compareAtAmount: 5900,
    features: [
      "5 downloadable PDF guides",
      "Budget and debt payoff templates",
      "Beginner-friendly investing primer",
      "Lifetime access to the bundle",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "business",
    slug: "business-launch-toolkit",
    name: "Business Launch Toolkit",
    summary: "Validated frameworks to go from idea to first paying customers.",
    description:
      "Includes: Business Model Canvas, Validation Checklist, Pricing Playbook, and a 30-day launch plan. Instant PDF download after purchase.",
    priceAmount: 3900,
    compareAtAmount: 7900,
    features: [
      "4 in-depth PDF playbooks",
      "Validation and pricing frameworks",
      "30-day launch checklist",
      "Lifetime access to the toolkit",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "marketing",
    slug: "content-marketing-system",
    name: "Content Marketing System",
    summary: "A repeatable system to create content that consistently converts.",
    description:
      "Includes: Content Calendar Template, Funnel Blueprint, and Copywriting Swipe File as PDFs.",
    priceAmount: 2400,
    compareAtAmount: null,
    features: [
      "3 downloadable PDFs",
      "12-month content calendar",
      "Proven copywriting frameworks",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "productivity",
    slug: "deep-work-planner",
    name: "Deep Work Planner",
    summary: "Plan your weeks, protect your focus, and ship meaningful work.",
    description:
      "Includes: Weekly Planning System, Focus Sprint Template, and Habit Tracker as PDFs.",
    priceAmount: 1900,
    compareAtAmount: null,
    features: [
      "3 downloadable PDFs",
      "Weekly and daily planning system",
      "Habit tracking templates",
    ],
    sortOrder: 1,
  },
];

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
        accentColor: nicheData.accentColor,
        featured: nicheData.featured,
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
          name: rest.name,
          summary: rest.summary,
          description: rest.description,
          priceAmount: rest.priceAmount,
          compareAtAmount: rest.compareAtAmount ?? null,
          features: rest.features,
          sortOrder: rest.sortOrder,
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
