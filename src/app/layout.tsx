import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { getLocale } from "@/lib/i18n";
import { getTheme } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Uni Swap",
  description: "Обмен навыками между студентами",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);
  return (
    <html lang={locale} className={`h-full antialiased${theme === "dark" ? " dark" : ""}`}>
      <body className="min-h-full flex flex-col">
        <Nav />
        {children}
      </body>
    </html>
  );
}
