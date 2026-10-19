import "dotenv/config";
import { PrismaClient, type LearningLevel } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const niches = [
  {
    slug: "finance",
    name: "Finance",
    tagline: "Make better money decisions, one clear section at a time.",
    description:
      "Practical learning for people facing a specific money problem: irregular income, competing savings and debt goals, or the fear of getting it wrong.",
    audience:
      "Adults who understand their situation but are unsure what to do first with their money.",
    problems: [
      "I cannot reconcile irregular income with fixed monthly expenses.",
      "I do not know whether to pay off debt or build savings first.",
      "I want a realistic method, not generic advice.",
    ],
    accentColor: "#10B981",
    sortOrder: 1,
  },
  {
    slug: "business",
    name: "Business",
    tagline: "Test the idea before you invest heavily in it.",
    description:
      "Learning for first-time founders and small sellers who must reduce uncertainty before spending time and money.",
    audience: "First-time founders and solo sellers validating a new idea.",
    problems: [
      "I have an idea but no evidence that customers need it.",
      "I do not understand my costs or a reasonable price.",
      "I am unsure which validation step to take first.",
    ],
    accentColor: "#6366F1",
    sortOrder: 2,
  },
  {
    slug: "psychology",
    name: "Psychology",
    tagline: "Understand behavior well enough to change it.",
    description:
      "Evidence-aware learning for people who repeatedly abandon habits and want to understand the mechanisms behind that pattern.",
    audience: "People who want to understand and rebuild a personal habit.",
    problems: [
      "I start a habit and abandon it within weeks.",
      "I do not understand why the same pattern repeats.",
      "I want a realistic routine, not motivation quotes.",
    ],
    accentColor: "#EC4899",
    sortOrder: 3,
  },
  {
    slug: "career",
    name: "Career",
    tagline: "Turn a target role into a concrete learning plan.",
    description:
      "Learning for beginners who know the role they want but are unsure which skills matter and in what order to build them.",
    audience: "Early-career professionals and career switchers.",
    problems: [
      "I am unsure which skills a target role actually requires.",
      "I cannot tell which gaps matter most.",
      "I need a plan I can start this week.",
    ],
    accentColor: "#F59E0B",
    sortOrder: 4,
  },
];

type SeedProduct = {
  nicheSlug: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  audience: string;
  notFor: string;
  outcome: string;
  learnings: string[];
  limitations: string;
  license: string;
  level: LearningLevel;
  priceAmount: number;
  compareAtAmount: number | null;
  features: string[];
  sortOrder: number;
};

const products: SeedProduct[] = [
  {
    nicheSlug: "finance",
    slug: "budgeting-with-irregular-income",
    name: "Budgeting With Irregular Income",
    summary:
      "A practical method to plan and review money when income changes month to month.",
    description:
      "This bundle walks you through building a budget that survives variable pay: understanding your real baseline, planning for low months, and running a short monthly review. It includes worked examples and a review routine you can reuse.",
    audience:
      "Freelancers, gig workers, and anyone whose monthly income is not fixed.",
    notFor:
      "People looking for investment or tax advice, or personalized financial recommendations.",
    outcome:
      "Leave with a working budgeting method you can review each month.",
    learnings: [
      "How to find your true minimum monthly baseline.",
      "How to plan spending across high and low months.",
      "A repeatable monthly review routine.",
    ],
    limitations:
      "Educational material only. It does not provide personalized financial advice.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "PRACTICAL",
    priceAmount: 2900,
    compareAtAmount: 4900,
    features: [
      "The full budgeting method explained step by step",
      "Worked example with irregular monthly income",
      "A one-page monthly review checklist",
      "Lifetime access to the files",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "finance",
    slug: "debt-or-savings-priorities",
    name: "Debt or Savings: Choosing Your Priority",
    summary:
      "A framework to compare debt repayment and savings goals using your own numbers.",
    description:
      "A structured way to compare the trade-offs between paying down debt and building savings. You will map your options, account for risk, and choose a priority you can explain and revisit.",
    audience: "People juggling debt repayment and savings at the same time.",
    notFor:
      "Anyone seeking a guarantee about returns or personalized investment guidance.",
    outcome:
      "A defensible priority order for debt and savings based on your constraints.",
    learnings: [
      "How to compare trade-offs instead of relying on rules of thumb.",
      "How to account for risk and flexibility in your plan.",
      "How to explain and revisit your chosen priority.",
    ],
    limitations:
      "Educational material only. Individual circumstances vary and are not assessed.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "FOUNDATIONS",
    priceAmount: 2400,
    compareAtAmount: null,
    features: [
      "A decision framework for debt vs savings",
      "Comparison worksheet with your own inputs",
      "Common misconceptions corrected",
      "Lifetime access to the files",
    ],
    sortOrder: 2,
  },
  {
    nicheSlug: "business",
    slug: "customer-discovery-sprint",
    name: "Customer Discovery Sprint",
    summary:
      "A short, focused process to test whether customers actually need your idea.",
    description:
      "Before investing heavily, run a focused discovery sprint: choose who to talk to, ask non-leading questions, and interpret what you hear. This bundle includes scripts, a note-taking structure, and a decision checkpoint.",
    audience: "First-time founders and solo builders with an early idea.",
    notFor: "Teams looking for a full go-to-market or fundraising plan.",
    outcome: "Evidence-based decision on whether to continue, pivot, or stop.",
    learnings: [
      "How to recruit the right people to interview.",
      "How to ask questions that reveal real behavior.",
      "How to read the signals and make a decision.",
    ],
    limitations:
      "A small sample can mislead. Interpret findings with source and sample size in mind.",
    license: "Personal and internal business use. Do not resell.",
    level: "PRACTICAL",
    priceAmount: 3900,
    compareAtAmount: 6900,
    features: [
      "Interview scripts and question bank",
      "Note-taking and synthesis structure",
      "A clear go / pivot / stop decision checkpoint",
      "Lifetime access to the files",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "psychology",
    slug: "habit-rebuild-kit",
    name: "Habit Rebuild Kit",
    summary:
      "Understand why habits break, then test a routine that fits your real life.",
    description:
      "This bundle explains common habit mechanisms, helps you diagnose the pattern behind repeated abandonment, and guides you through testing a smaller, more realistic routine.",
    audience: "People who repeatedly abandon a personal habit.",
    notFor:
      "Anyone seeking clinical, diagnostic, or therapeutic support.",
    outcome: "A smaller habit routine and a plan to test it for two weeks.",
    learnings: [
      "Common mechanisms behind habit breakdown.",
      "How to shrink a habit to something you can repeat.",
      "How to review and adjust without self-blame.",
    ],
    limitations:
      "Educational content only. It is not a substitute for professional mental-health care.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "FOUNDATIONS",
    priceAmount: 1900,
    compareAtAmount: null,
    features: [
      "Habit breakdown diagnosis",
      "A two-week testing plan",
      "Review prompts that avoid self-blame",
      "Lifetime access to the files",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "career",
    slug: "skill-plan-for-target-role",
    name: "Skill Plan For a Target Role",
    summary:
      "Compare the skills a role requires and build a learning plan you can start now.",
    description:
      "A practical way to break a target role into required skills, spot your most important gaps, and sequence a learning plan that fits limited time.",
    audience: "Early-career professionals and career switchers.",
    notFor: "People seeking guaranteed job placement or interview coaching.",
    outcome: "A prioritized skill development plan for a specific role.",
    learnings: [
      "How to break a role into concrete skills.",
      "How to find and rank your gaps.",
      "How to sequence a plan with limited time.",
    ],
    limitations:
      "Outcomes depend on your effort, market, and circumstances. No result is guaranteed.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "PRACTICAL",
    priceAmount: 2900,
    compareAtAmount: 4900,
    features: [
      "Role-to-skills breakdown template",
      "Gap ranking worksheet",
      "A 30-day start plan",
      "Lifetime access to the files",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "business",
    slug: "pricing-your-first-offer",
    name: "Pricing Your First Offer",
    summary:
      "Work out what to charge, what your costs really are, and how to test a price.",
    description:
      "A practical walkthrough for pricing an early offer: understanding your true costs, choosing a starting price, and testing it with real customers instead of guessing.",
    audience: "First-time founders and solo sellers launching an offer.",
    notFor: "Businesses wanting financial forecasting or tax advice.",
    outcome: "A starting price you can explain and a plan to test it.",
    learnings: [
      "How to calculate your real cost per sale.",
      "How to choose a starting price with a margin.",
      "How to test price changes without losing trust.",
    ],
    limitations:
      "Educational material only. It is not financial or tax advice.",
    license: "Personal and internal business use. Do not resell.",
    level: "FOUNDATIONS",
    priceAmount: 2400,
    compareAtAmount: null,
    features: [
      "Cost-per-sale worksheet",
      "Pricing starting-point guide",
      "A simple price-testing plan",
      "Lifetime access to the files",
    ],
    sortOrder: 2,
  },
  {
    nicheSlug: "psychology",
    slug: "focus-without-willpower",
    name: "Focus Without Willpower",
    summary:
      "Design your environment and routine so focus needs less effort.",
    description:
      "A practical approach to attention: reducing friction, shaping your environment, and building short focus blocks that survive a normal, distracted day.",
    audience: "People who struggle to focus on one task at a time.",
    notFor: "Anyone seeking clinical or therapeutic support.",
    outcome: "A focus routine built around your environment, not willpower.",
    learnings: [
      "How environment shapes attention.",
      "How to remove friction before you need focus.",
      "How to structure short focus blocks.",
    ],
    limitations:
      "Educational content only. Not a substitute for professional care.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "PRACTICAL",
    priceAmount: 1900,
    compareAtAmount: 2900,
    features: [
      "Environment and friction checklist",
      "Focus block template",
      "A one-week experiment",
      "Lifetime access to the files",
    ],
    sortOrder: 2,
  },
  {
    nicheSlug: "career",
    slug: "interview-evidence-stories",
    name: "Interview Evidence Stories",
    summary:
      "Turn your real experience into clear stories you can use in interviews.",
    description:
      "A structured way to collect and shape your own examples into interview stories, so you can answer behavioral questions with concrete evidence.",
    audience: "Candidates preparing for behavioral interviews.",
    notFor: "People seeking guaranteed job offers or coaching.",
    outcome: "A set of ready, evidence-based interview stories.",
    learnings: [
      "How to find strong examples in your own history.",
      "How to structure a story interviewers trust.",
      "How to adapt one story to several questions.",
    ],
    limitations:
      "Outcomes depend on your experience and the role. No result is guaranteed.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "PRACTICAL",
    priceAmount: 2400,
    compareAtAmount: null,
    features: [
      "Story collection template",
      "A structure for evidence-based answers",
      "Adaptation examples",
      "Lifetime access to the files",
    ],
    sortOrder: 2,
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
