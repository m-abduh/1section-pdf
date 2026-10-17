import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout } from "@/components/site/legal-layout";
import { getNiches } from "@/lib/server-api";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with an order, payment, or a file from 1section.",
};

export default async function SupportPage() {
  const niches = (await getNiches()) ?? [];

  return (
    <LegalLayout
      title="Support"
      niches={niches}
      intro="We are happy to help with orders, access links, payments, and files. Reach out using the details below."
    >
      <div>
        <h2>Email us</h2>
        <p className="mt-3">
          The fastest way to get help is by email. Include your order number and
          as much detail as possible so we can resolve things quickly.
        </p>
        <p className="mt-3">
          <a
            href="mailto:support@1section.com"
            className="font-medium text-fg hover:underline"
          >
            support@1section.com
          </a>
        </p>
      </div>
      <div>
        <h2>Common issues</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>
            <span className="font-medium text-fg">Cannot find your access link:</span>{" "}
            check the email used at checkout, then use the{" "}
            <Link
              href="/checkout/success"
              className="font-medium text-fg hover:underline"
            >
              Retrieve a purchase
            </Link>{" "}
            page with your order details.
          </li>
          <li>
            <span className="font-medium text-fg">Payment problem:</span> contact
            us with your order number and the email used for the payment.
          </li>
          <li>
            <span className="font-medium text-fg">File issue:</span> tell us which
            resource and what went wrong, and we will help.
          </li>
        </ul>
      </div>
      <div>
        <h2>Refunds</h2>
        <p className="mt-3">
          Refund requests are handled according to our{" "}
          <Link href="/refund" className="font-medium text-fg hover:underline">
            refund policy
          </Link>
          .
        </p>
      </div>
    </LegalLayout>
  );
}
