import type { LearningLevel } from "@prisma/client";

export const niches = [
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
    sortOrder: 1,
  },
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
    sortOrder: 2,
  },
  {
    slug: "education",
    name: "Education",
    tagline: "Learn how to learn something difficult, on purpose.",
    description:
      "Learning for people who must master a hard subject without a teacher: breaking it down, practising deliberately, and checking real understanding.",
    audience:
      "Self-directed learners and students tackling a difficult subject alone.",
    problems: [
      "I do not know how to break a big subject into steps.",
      "I re-read and forget instead of actually understanding.",
      "I cannot tell whether I have really learned something.",
    ],
    accentColor: "#3B82F6",
    sortOrder: 3,
  },
  {
    slug: "health",
    name: "Health",
    tagline: "Build sustainable routines without chasing quick fixes.",
    description:
      "Practical, evidence-aware learning for people who want lasting sleep, movement, and nutrition habits rather than short-lived resets.",
    audience: "Adults who want a realistic, sustainable health routine.",
    problems: [
      "I start a routine and drop it once life gets busy.",
      "I cannot tell which advice is worth following.",
      "I want steady progress, not an all-or-nothing plan.",
    ],
    accentColor: "#EF4444",
    sortOrder: 4,
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
    sortOrder: 5,
  },
  {
    slug: "technology",
    name: "Technology",
    tagline: "Understand the tools before you depend on them.",
    description:
      "Learning for people who use technology daily but want to understand how it works, choose tools with confidence, and avoid common traps.",
    audience:
      "Non-specialists who want practical, working knowledge of everyday tech.",
    problems: [
      "I use tools I do not actually understand.",
      "I cannot judge which option fits my needs.",
      "I worry about privacy and security but do not know where to start.",
    ],
    accentColor: "#8B5CF6",
    sortOrder: 6,
  },
  {
    slug: "parenting",
    name: "Parenting",
    tagline: "Handle everyday parenting problems with a calmer plan.",
    description:
      "Practical learning for parents facing common, specific challenges: routines, boundaries, and behaviour, grounded in evidence rather than trends.",
    audience: "Parents who want practical approaches to everyday challenges.",
    problems: [
      "I react in the moment instead of responding with a plan.",
      "I cannot tell which advice is worth following.",
      "I want a routine that works for the whole family.",
    ],
    accentColor: "#F97316",
    sortOrder: 7,
  },
  {
    slug: "relationship",
    name: "Relationship",
    tagline: "Communicate better in the relationships that matter.",
    description:
      "Evidence-aware learning for improving communication, boundaries, and conflict in personal relationships without clinical jargon.",
    audience:
      "Adults who want to improve communication and handle conflict better.",
    problems: [
      "The same argument keeps repeating.",
      "I struggle to set and hold boundaries.",
      "I want to communicate clearly without escalating.",
    ],
    accentColor: "#F43F5E",
    sortOrder: 8,
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
    sortOrder: 9,
  },
  {
    slug: "investing",
    name: "Investing",
    tagline: "Think clearly about risk before you put money to work.",
    description:
      "Educational learning for beginners who want to understand risk, diversification, and their own goals before making investing decisions.",
    audience: "Beginners who want to understand investing fundamentals.",
    problems: [
      "I do not understand the risks behind an investment.",
      "I cannot tell speculation from a sound plan.",
      "I want to align decisions with my own goals.",
    ],
    accentColor: "#0EA5E9",
    sortOrder: 10,
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

export const products: SeedProduct[] = [
  {
    nicheSlug: "finance",
    slug: "budgeting-with-irregular-income",
    name: "Budgeting With Irregular Income",
    summary:
      "A practical method to plan and review money when income changes month to month.",
    description:
      "This guide walks you through building a budget that survives variable pay: understanding your real baseline, planning for low months, and running a short monthly review. It includes worked examples and a review routine you can reuse.",
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
      "Before investing heavily, run a focused discovery sprint: choose who to talk to, ask non-leading questions, and interpret what you hear. This guide includes scripts, a note-taking structure, and a decision checkpoint.",
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
      "This guide explains common habit mechanisms, helps you diagnose the pattern behind repeated abandonment, and guides you through testing a smaller, more realistic routine.",
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
  {
    nicheSlug: "education",
    slug: "learn-a-hard-subject-alone",
    name: "Learn a Hard Subject Alone",
    summary:
      "Break a difficult subject into steps you can study, practise, and verify.",
    description:
      "This guide shows how to turn a hard subject into a workable plan: define what understanding means for it, split it into smaller ideas, practise retrieval instead of re-reading, and check what you actually know before moving on.",
    audience:
      "Self-directed learners and students tackling a difficult subject without a teacher.",
    notFor: "People looking for subject-specific tutoring or exam guarantees.",
    outcome:
      "A study plan with practice checkpoints and a way to verify understanding.",
    learnings: [
      "How to define what understanding means for your subject.",
      "How to break it into sequenced, testable pieces.",
      "How to practise and verify recall instead of re-reading.",
    ],
    limitations:
      "Learning outcomes depend on consistent practice. No grade or result is guaranteed.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "PRACTICAL",
    priceAmount: 2400,
    compareAtAmount: 3900,
    features: [
      "Subject breakdown worksheet",
      "Retrieval practice schedule",
      "Self-check question templates",
      "Lifetime access to the files",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "health",
    slug: "routine-that-survives-a-busy-week",
    name: "Build a Routine That Survives a Busy Week",
    summary:
      "Design sleep, movement, and food routines that hold up when life gets busy.",
    description:
      "This guide walks through designing a baseline routine you can keep on a normal week: choosing one anchor habit at a time, setting a minimum version for hard days, and reviewing progress without slipping into an all-or-nothing cycle.",
    audience:
      "Adults who start health routines and drop them once work or family gets busy.",
    notFor:
      "Anyone seeking medical advice, diagnosis, or treatment for a health condition.",
    outcome:
      "A realistic weekly routine with a minimum version for difficult days.",
    learnings: [
      "How to pick one anchor habit instead of overhauling everything.",
      "How to define a minimum version for hard days.",
      "How to review progress without all-or-nothing thinking.",
    ],
    limitations:
      "Educational content only. It is not medical advice; consult a professional for health concerns.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "FOUNDATIONS",
    priceAmount: 1900,
    compareAtAmount: null,
    features: [
      "Anchor habit selector",
      "Hard-day minimum plan",
      "Weekly review template",
      "Lifetime access to the files",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "technology",
    slug: "choose-tools-with-confidence",
    name: "Choose Tools With Confidence",
    summary:
      "Compare everyday tools on the criteria that actually matter to you.",
    description:
      "A practical method for evaluating software and devices: clarify the job to be done, weigh costs beyond the sticker price, check privacy and lock-in, and run a short trial before committing.",
    audience:
      "Non-specialists who use technology daily and want to choose tools deliberately.",
    notFor:
      "People seeking enterprise procurement, security audits, or vendor negotiations.",
    outcome: "A shortlist built on your own requirements and a trial plan.",
    learnings: [
      "How to define requirements before comparing options.",
      "How to spot hidden costs and lock-in.",
      "How to run a time-boxed trial.",
    ],
    limitations:
      "Tool features and pricing change. Verify current terms with each vendor.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "PRACTICAL",
    priceAmount: 2400,
    compareAtAmount: 3900,
    features: [
      "Requirements checklist",
      "Cost and lock-in comparison sheet",
      "Two-week trial plan",
      "Lifetime access to the files",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "parenting",
    slug: "calmer-daily-routines",
    name: "Calmer Daily Routines",
    summary:
      "Set routines and boundaries that hold up on ordinary, messy days.",
    description:
      "This guide helps you design family routines around the transitions that usually go wrong: mornings, homework, screens, and bedtime. You will set clear expectations, plan for predictable friction, and respond consistently instead of reacting in the moment.",
    audience:
      "Parents who want calmer routines and clearer boundaries at home.",
    notFor:
      "Families seeking clinical or behavioural diagnosis or therapy.",
    outcome:
      "A routine plan with scripts and responses for the hardest moments.",
    learnings: [
      "How to identify where a routine actually breaks.",
      "How to set boundaries the whole family understands.",
      "How to respond consistently without escalating.",
    ],
    limitations:
      "Educational content only. Every child and family differs; it is not clinical advice.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "FOUNDATIONS",
    priceAmount: 1900,
    compareAtAmount: 2900,
    features: [
      "Morning and bedtime routine map",
      "Boundary-setting scripts",
      "Friction planning worksheet",
      "Lifetime access to the files",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "relationship",
    slug: "break-the-repeating-argument",
    name: "Break the Argument That Keeps Repeating",
    summary:
      "Find the pattern behind recurring conflict and change how the conversation runs.",
    description:
      "A structured way to examine a recurring argument: mapping the trigger, the assumptions underneath, and the point where it escalates. You will practise a repair conversation and set boundaries that hold without escalation.",
    audience:
      "Adults stuck in the same recurring argument with a partner or family member.",
    notFor:
      "Anyone in an unsafe relationship or seeking couples therapy; contact a professional or support service.",
    outcome:
      "A mapped conflict pattern and a plan for a repair conversation.",
    learnings: [
      "How to map a recurring conflict without assigning blame.",
      "How to surface the assumptions that keep the loop going.",
      "How to open a repair conversation and set boundaries.",
    ],
    limitations:
      "Educational content only. It is not therapy and cannot assess safety or clinical needs.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "PRACTICAL",
    priceAmount: 2400,
    compareAtAmount: null,
    features: [
      "Conflict pattern map",
      "Repair conversation script",
      "Boundary statements worksheet",
      "Lifetime access to the files",
    ],
    sortOrder: 1,
  },
  {
    nicheSlug: "investing",
    slug: "understand-risk-before-returns",
    name: "Understand Risk Before Returns",
    summary:
      "Assess what you could lose, how long you can wait, and what a plan must survive.",
    description:
      "This guide builds a beginner's framework for risk: separating speculation from a deliberate plan, checking concentration and liquidity, matching decisions to your time horizon, and writing down the conditions under which you would change course.",
    audience:
      "Beginners who want to understand investing risk before committing money.",
    notFor:
      "People seeking personalized investment advice, stock tips, or return guarantees.",
    outcome:
      "A written risk assessment tied to your goals and time horizon.",
    learnings: [
      "How to separate speculation from a deliberate plan.",
      "How to evaluate concentration, liquidity, and time horizon.",
      "How to pre-commit to a review rule.",
    ],
    limitations:
      "Educational content only. It is not financial advice; investments can lose value.",
    license: "Personal use. Do not redistribute or resell the files.",
    level: "FOUNDATIONS",
    priceAmount: 2400,
    compareAtAmount: 3900,
    features: [
      "Risk assessment worksheet",
      "Goal and time-horizon mapping",
      "Pre-commitment review rule template",
      "Lifetime access to the files",
    ],
    sortOrder: 1,
  },
];
