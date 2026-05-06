import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";

export function StubPage({
  title,
  description,
  reference = "/admin/clientes",
}: {
  title: string;
  description?: string;
  reference?: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <Card>
        <CardHeader>
          <CardTitle>Pendiente de implementación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Esta pantalla aún no se ha migrado al nuevo stack (Next.js +
            shadcn/ui).
          </p>
          <p>
            Replicar siguiendo el patrón de{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
              {reference}
            </code>
            : DataTable + Dialog para crear/editar + AlertDialog para eliminar +
            hooks de TanStack Query.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
