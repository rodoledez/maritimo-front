"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { EnvIndicator } from "@/components/layout/env-indicator";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/error-boundary";
import { useAuth } from "@/lib/auth/auth-context";
import type { NavLink } from "@/components/layout/nav-links";

type Role = "admin" | "client";

export function AuthShell({
  role,
  links,
  children,
}: {
  role: Role;
  links: NavLink[];
  children: React.ReactNode;
}) {
  const { user, loggedIn, isHydrating, isAdmin, isClient } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isHydrating) return;
    if (!loggedIn) {
      router.replace("/login");
      return;
    }
    if (role === "admin" && !isAdmin) {
      router.replace("/cliente");
      return;
    }
    if (role === "client" && !isClient) {
      router.replace("/admin");
    }
  }, [isHydrating, loggedIn, isAdmin, isClient, role, router]);

  if (isHydrating || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (role === "admin" && !isAdmin) return null;
  if (role === "client" && !isClient) return null;

  return (
    <SidebarProvider>
      <AppSidebar links={links} />
      <SidebarInset>
        <EnvIndicator />
        <AppHeader />
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 bg-muted/30 p-4 outline-none md:p-6"
        >
          <div className="mx-auto max-w-7xl">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
