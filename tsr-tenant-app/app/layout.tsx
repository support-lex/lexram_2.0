import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { OrgProvider } from "./_components/OrgProvider";

export const metadata: Metadata = {
  title: "TSR Workspace",
  description: "Title Scrutiny Report workspace.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <OrgProvider>{children}</OrgProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
