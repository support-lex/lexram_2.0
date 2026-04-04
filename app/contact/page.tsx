import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Us | LexRam",
  description: "Get in touch with the LexRam team",
};

export default function ContactPage() {
  return <ContactClient />;
}
