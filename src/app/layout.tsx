import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { getLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Uni Swap",
  description: "Обмен навыками между студентами",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Nav />
        {children}
      </body>
    </html>
  );
}
