import "../globals.css";

import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Trans & Dance",
  description: "Generated by 3 smart asses",
};

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background">
        <main>
          <Toaster position="bottom-right" />
          {children}
        </main>
      </body>
    </html>
  );
}
