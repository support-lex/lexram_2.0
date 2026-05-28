import type { Metadata } from "next";
import FAQClient from "./FAQClient";

export const metadata: Metadata = {
  title: "FAQ | LexRam",
  description: "Frequently asked questions about LexRam",
};

export default function FAQPage() {
  return <FAQClient />;
}
