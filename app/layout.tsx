import type { Metadata } from "next";
import "./globals.css";
import { SWRProvider } from "@/components/SWRProvider";
import { SportProvider } from "@/contexts/SportContext";

export const metadata: Metadata = {
  title: "Curly Sports",
  description: "Your ultimate sports companion — live scores, teams, players, news & more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SWRProvider>
          <SportProvider>{children}</SportProvider>
        </SWRProvider>
      </body>
    </html>
  );
}
