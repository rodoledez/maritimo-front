"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, FileText, Ship } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";

const tiles = [
  {
    title: "Crear solicitud de reserva",
    description: "Inicia una nueva solicitud de booking marítimo.",
    href: "/cliente/crear-solicitud-reserva",
    icon: FileText,
  },
  {
    title: "Ver mis reservas",
    description: "Estado de tus solicitudes enviadas.",
    href: "/cliente/ver-reservas",
    icon: ClipboardList,
  },
  {
    title: "Ver itinerarios",
    description: "Itinerarios disponibles por semana.",
    href: "/cliente/ver-itinerario",
    icon: Ship,
  },
];

export default function ClienteHomePage() {
  const { user } = useAuth();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          <span className="text-secondary">Bienvenido</span>
          {user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Portal de reservas marítimas
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(({ title, description, href, icon: Icon }) => (
          <Card key={href} className="flex flex-col">
            <CardHeader>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <CardTitle className="mt-3">{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild variant="outline" className="w-full">
                <Link href={href}>
                  Ir <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
