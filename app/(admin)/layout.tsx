"use client";

import { AuthShell } from "@/components/layout/auth-shell";
import { adminLinks } from "@/components/layout/nav-links";

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthShell role="admin" links={adminLinks}>
      {children}
    </AuthShell>
  );
}
