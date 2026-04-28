import SimplePageLayout from "@/components/layout/SimplePageLayout";
import { RefreshCcw } from "lucide-react";

export const metadata = {
  title: "Cancellation & Refund Policy | LexRam",
  description:
    "Cancellation and refund policy for RAMASUBRAMANIAN AI SOFTWARE PRIVATE LIMITED",
};

export default function RefundPolicyPage() {
  return (
    <SimplePageLayout
      title="Cancellation & Refund Policy"
      icon={RefreshCcw}
      showLastUpdated
      lastUpdated="28-04-2026 14:47:21"
    >
      <p className="mb-8">
        <strong>RAMASUBRAMANIAN AI SOFTWARE PRIVATE LIMITED</strong> believes in helping
        its customers as far as possible, and has therefore a liberal cancellation policy.
        Under this policy:
      </p>

      <ul className="space-y-6 list-none pl-0">
        {[
          "Cancellations will be considered only if the request is made immediately after placing the order. However, the cancellation request may not be entertained if the orders have been communicated to the vendors/merchants and they have initiated the process of shipping them.",
          "RAMASUBRAMANIAN AI SOFTWARE PRIVATE LIMITED does not accept cancellation requests for perishable items like flowers, eatables etc. However, refund/replacement can be made if the customer establishes that the quality of product delivered is not good.",
          "In case of receipt of damaged or defective items please report the same to our Customer Service team. The request will, however, be entertained once the merchant has checked and determined the same at his own end. This should be reported within the same day of receipt of the products. In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within the same day of receiving the product. The Customer Service Team after looking into your complaint will take an appropriate decision.",
          "In case of complaints regarding products that come with a warranty from manufacturers, please refer the issue to them.",
          "In case of any Refunds approved by RAMASUBRAMANIAN AI SOFTWARE PRIVATE LIMITED, it will take 1–2 days for the refund to be processed to the end customer.",
        ].map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-4 p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)]"
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-[var(--accent)] text-xs font-bold">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{item}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 p-6 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] border border-[var(--accent)]/20">
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          For any queries related to cancellations or refunds, please reach out to our
          Customer Service team at{" "}
          <a
            href="mailto:hello@lexram.ai"
            className="font-semibold text-[var(--accent)] hover:underline"
          >
            hello@lexram.ai
          </a>{" "}
          or call us at{" "}
          <a
            href="tel:8754446066"
            className="font-semibold text-[var(--accent)] hover:underline"
          >
            8754446066
          </a>
          .
        </p>
      </div>
    </SimplePageLayout>
  );
}
