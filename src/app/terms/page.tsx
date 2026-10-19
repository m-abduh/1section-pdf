import type { Metadata } from "next";
import { LegalLayout } from "@/components/site/legal-layout";
import { getNiches } from "@/lib/server-api";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms that govern your purchase and use of 1section resources.",
};

export default async function TermsPage() {
  const niches = (await getNiches()) ?? [];

  return (
    <LegalLayout
      title="Terms of service"
      niches={niches}
      intro="By purchasing or using a 1section resource, you agree to these terms. Please read them carefully."
    >
      <div>
        <h2>Digital products</h2>
        <p className="mt-3">
          1section resources are digital learning materials delivered
          electronically. Access is granted to the email provided at checkout.
          You are responsible for providing a valid email address.
        </p>
      </div>
      <div>
        <h2>License and permitted use</h2>
        <p className="mt-3">
          Unless stated otherwise on a resource page, you receive a personal,
          non-transferable license to use the materials for your own learning.
          You may not redistribute, resell, or publicly share the files.
        </p>
      </div>
      <div>
        <h2>Payments</h2>
        <p className="mt-3">
          Payments are processed by Paddle as merchant of record, which handles
          applicable taxes. Prices are shown at checkout and may change over
          time.
        </p>
      </div>
      <div>
        <h2>Educational content only</h2>
        <p className="mt-3">
          Resources are educational and general in nature. They do not
          constitute financial, legal, medical, or other professional advice, and
          no specific outcome is guaranteed.
        </p>
      </div>
      <div>
        <h2>Limitation of liability</h2>
        <p className="mt-3">
          To the extent permitted by law, 1section is not liable for indirect or
          consequential losses arising from your use of the resources. Decisions
          you make based on the materials remain your responsibility.
        </p>
      </div>
      <div>
        <h2>Changes</h2>
        <p className="mt-3">
          We may update these terms from time to time. Continued use of the
          service after changes take effect constitutes acceptance of the revised
          terms.
        </p>
      </div>
    </LegalLayout>
  );
}
