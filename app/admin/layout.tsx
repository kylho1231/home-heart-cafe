import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Home ❤️ Cafe",
  description: "Internal kitchen queue, order verification desk, and sales management portal.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
