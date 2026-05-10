export function EmailCell({ email }: { email?: string | null }) {
  if (!email) return <span className="text-muted-foreground">—</span>;
  return (
    <a
      href={`mailto:${email}`}
      className="text-primary underline underline-offset-2 hover:text-primary/80"
      onClick={(e) => e.stopPropagation()}
    >
      {email}
    </a>
  );
}
