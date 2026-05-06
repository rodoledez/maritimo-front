"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/auth-context";
import { Skeleton } from "@/components/ui/skeleton";

export default function RootPage() {
  const router = useRouter();
  const { isHydrating, loggedIn, isClient } = useAuth();

  useEffect(() => {
    if (isHydrating) return;
    if (!loggedIn) {
      router.replace("/login");
    } else if (isClient) {
      router.replace("/cliente");
    } else {
      router.replace("/admin");
    }
  }, [isHydrating, loggedIn, isClient, router]);

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
