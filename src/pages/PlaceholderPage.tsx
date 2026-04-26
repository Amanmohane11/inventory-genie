export function PlaceholderPage({ title, description }: { title: string; description?: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground">
        {description ?? "This module is coming soon. Navigation and Redux state are wired up."}
      </p>
      <div className="mt-8 rounded-xl border bg-card p-10 text-center text-muted-foreground card-elevated">
        Build this screen next.
      </div>
    </div>
  );
}
