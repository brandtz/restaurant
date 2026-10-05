import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrandtWorks Restaurant Platform",
  description: "Development foundation for direct restaurant ordering.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
