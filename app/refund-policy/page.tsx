import LegalPageLayout from "@/components/layout/LegalPageLayout";

export const metadata = {
  title: "Cancellation & Refund Policy | LexRam",
  description:
    "Cancellation and refund policy for RAMASUBRAMANIAN AI SOFTWARE PRIVATE LIMITED",
};

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      title="Cancellation & Refund Policy"
      icon="RefreshCcw"
    >
      <p className="mb-6 text-sm text-[#680318]/60">Last updated: 28-04-2026 14:47:21</p>

      <p className="mb-8 text-[#680318]/70">
        <strong className="text-[#680318]">RAMASUBRAMANIAN AI SOFTWARE PRIVATE LIMITED</strong> believes in helping
        its customers as far as possible, and has therefore a liberal cancellation policy.
        Under this policy:
      </p>

      <ul className="space-y-4 list-none pl-0">
        {[
          "Cancellations will be considered only if the request is made immediately after placing the order. However, the cancellation request may not be entertained if the orders have been communicated to the vendors/merchants and they have initiated the process of shipping them.",
          "RAMASUBRAMANIAN AI SOFTWARE PRIVATE LIMITED does not accept cancellation requests for perishable items like flowers, eatables etc. However, refund/replacement can be made if the customer establishes that the quality of product delivered is not good.",
          "In case of receipt of damaged or defective items please report the same to our Customer Service team. The request will, however, be entertained once the merchant has checked and determined the same at his own end. This should be reported within the same day of receipt of the products. In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within the same day of receiving the product. The Customer Service Team after looking into your complaint will take an appropriate decision.",
          "In case of complaints regarding products that come with a warranty from manufacturers, please refer the issue to them.",
          "In case of any Refunds approved by RAMASUBRAMANIAN AI SOFTWARE PRIVATE LIMITED, it will take 1–2 days for the refund to be processed to the end customer.",
        ].map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-4 p-4 rounded-xl bg-white border border-[#680318]/10"
          >
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#b94826]/15 text-[#b94826] text-xs font-bold">
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed text-[#680318]/70">{item}</p>
          </li>
        ))}
      </ul>

      <div className="mt-8 p-5 rounded-xl bg-[#b94826]/8 border border-[#b94826]/20">
        <p className="text-sm text-[#680318]/70 leading-relaxed">
          For any queries related to cancellations or refunds, please reach out to our
          Customer Service team at{" "}
          <a href="mailto:hello@lexram.ai" className="font-semibold text-[#b94826] hover:underline">
            hello@lexram.ai
          </a>{" "}
          or call us at{" "}
          <a href="tel:8754446066" className="font-semibold text-[#b94826] hover:underline">
            8754446066
          </a>.
        </p>
      </div>
    </LegalPageLayout>
  );
}
