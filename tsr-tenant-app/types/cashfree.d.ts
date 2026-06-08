// The Cashfree browser SDK ships without type declarations. We use it via a
// narrow inline cast in TsrPaymentModal, so a minimal ambient module suffices.
declare module "@cashfreepayments/cashfree-js" {
  export function load(opts: { mode: "sandbox" | "production" }): Promise<unknown>;
}
