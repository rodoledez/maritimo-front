"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Ship } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { NavLink } from "./nav-links";

function matchPath(pathname: string, href: string): boolean {
  if (href === "/admin" || href === "/cliente") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupHasActiveChild(pathname: string, link: NavLink): boolean {
  return (
    link.children?.some(
      (child) => child.href !== undefined && matchPath(pathname, child.href)
    ) ?? false
  );
}

export function AppSidebar({ links }: { links: NavLink[] }) {
  const pathname = usePathname();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const link of links) {
      if (link.children) {
        initial[link.label] = groupHasActiveChild(pathname, link);
      }
    }
    return initial;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border/50">
        <Link
          href="/"
          className="flex items-center gap-2 px-2 py-3 text-sidebar-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Ship className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Marítimo Reservas
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((link) => {
                if (link.children && link.children.length > 0) {
                  const Icon = link.icon;
                  const isOpen = openGroups[link.label] ?? false;
                  const hasActive = groupHasActiveChild(pathname, link);
                  const submenuId = `submenu-${link.label
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`;
                  return (
                    <SidebarMenuItem key={link.label}>
                      <SidebarMenuButton
                        onClick={() => toggleGroup(link.label)}
                        isActive={hasActive}
                        tooltip={link.label}
                        aria-expanded={isOpen}
                        aria-controls={submenuId}
                      >
                        <Icon />
                        <span>{link.label}</span>
                        <ChevronRight
                          className={cn(
                            "ml-auto transition-transform group-data-[collapsible=icon]:hidden",
                            isOpen && "rotate-90"
                          )}
                        />
                      </SidebarMenuButton>
                      {isOpen ? (
                        <SidebarMenuSub id={submenuId}>
                          {link.children.map((child) => {
                            if (!child.href) return null;
                            return (
                              <SidebarMenuSubItem key={child.href}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={matchPath(pathname, child.href)}
                                >
                                  <Link href={child.href}>
                                    <span>{child.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuItem>
                  );
                }

                if (!link.href) return null;
                const Icon = link.icon;
                return (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={matchPath(pathname, link.href)}
                      tooltip={link.label}
                    >
                      <Link href={link.href}>
                        <Icon />
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/50 px-3 py-3 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
        © Acosta &amp; Aguayo
      </SidebarFooter>
    </Sidebar>
  );
}
