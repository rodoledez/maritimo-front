"use client";

import { BookingWizard } from "@/components/booking/booking-wizard";
import { PageHeader } from "@/components/page-header";

export default function AdminCrearReservaPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Crear reserva"
        description="Crea una nueva reserva en nombre de un cliente."
      />
      <BookingWizard
        mode="admin"
        onSuccessHref="/admin/reservas"
        onSuccessLabel="Ver reservas"
        onHomeHref="/admin"
        onHomeLabel="Ir al inicio"
      />
    </div>
  );
}
