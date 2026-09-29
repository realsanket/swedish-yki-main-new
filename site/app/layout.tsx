import type { Metadata } from "next";
import "./globals.css";
import "./course.css";
// Loaded last so phone rules win over layered desktop rules in course.css.
import "./responsive.css";

export const metadata: Metadata = {
  title: "Stigen · Swedish, one story at a time",
  description: "A story-led Swedish course for life in Finland, from first sounds to independent B1 practice across all four YKI skills.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><a className="skip-link" href="#main-content">Skip to learning content</a>{children}</body>
    </html>
  );
}
