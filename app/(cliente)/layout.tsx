"use client";

import { AuthShell } from "@/components/layout/auth-shell";
import { clienteLinks } from "@/components/layout/nav-links";

export default function ClienteGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthShell role="client" links={clienteLinks}>
      {children}
    </AuthShell>
  );
}
