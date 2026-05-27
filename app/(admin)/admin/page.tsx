"use client";

import { ClipboardList, Ship } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth/auth-context";

import { ReservasDashboard } from "./_components/reservas-dashboard";
import { ShipmentsDashboard } from "./_components/shipments-dashboard";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bienvenido${user?.name ? `, ${user.name}` : ""}`}
        description="Resumen de reservas y embarques activos"
      />

      <Tabs defaultValue="reservas">
        <TabsList>
          <TabsTrigger value="reservas">
            <ClipboardList />
            Reservas
          </TabsTrigger>
          <TabsTrigger value="embarques">
            <Ship />
            Embarques
          </TabsTrigger>
        </TabsList>
        <TabsContent value="reservas" className="mt-4">
          <ReservasDashboard />
        </TabsContent>
        <TabsContent value="embarques" className="mt-4">
          <ShipmentsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
