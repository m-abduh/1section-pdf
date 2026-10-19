import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/site/legal-layout";
import { getNiches } from "@/lib/server-api";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Refund policy",
  description: "How refunds work for digital resources purchased from 1section.",
};

export default async function RefundPage() {
  const niches = (await getNiches()) ?? [];

  return (
    <LegalLayout
      title="Refund policy"
      niches={niches}
      intro="Because our resources are digital and delivered instantly, refunds are limited. This policy explains how they work."
    >
      <div>
        <h2>General position</h2>
        <p className="mt-3">
          Digital resources are delivered immediately after purchase and cannot
          be returned. As a result, all sales are generally final. We still want
          you to be treated fairly, so the situations below are handled on a
          case-by-case basis.
        </p>
      </div>
      <div>
        <h2>When we will help</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            You were charged more than once for the same order due to a
            technical error.
          </li>
          <li>
            You cannot access the files you purchased and we cannot resolve the
            issue.
          </li>
          <li>
            The resource you received is materially different from its
            description.
          </li>
        </ul>
      </div>
      <div>
        <h2>Duplicate purchases</h2>
        <p className="mt-3">
          If you accidentally buy the same resource twice, contact support with
          your order numbers and we will arrange a refund for the duplicate.
        </p>
      </div>
      <div>
        <h2>How to request a refund</h2>
        <p className="mt-3">
          Contact us through the{" "}
          <Link href="/support" className="font-medium text-fg hover:underline">
            support page
          </Link>{" "}
          with your order number and a short description of the issue. Refunds,
          where approved, are returned to the original payment method by Paddle.
        </p>
      </div>
    </LegalLayout>
  );
}
