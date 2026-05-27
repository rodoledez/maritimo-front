"use client";

import { BookingWizard } from "@/components/booking/booking-wizard";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/lib/auth/auth-context";

export default function CrearSolicitudReservaPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crear solicitud de reserva"
        description="Completa los pasos para enviar tu solicitud."
      />
      <BookingWizard
        mode="client"
        defaultClientId={user?.Client?.id}
        onSuccessHref="/cliente/ver-reservas"
        onSuccessLabel="Ver mis reservas"
        onHomeHref="/cliente"
        onHomeLabel="Ir al inicio"
      />
    </div>
  );
}
