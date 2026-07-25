import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join Curly Sports — Invitation",
  description:
    "You've been invited to join Curly Sports! Sign up for free live scores, news, and sports predictions.",
};

export default function InviteCodeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
