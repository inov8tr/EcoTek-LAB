export default function BinderTestsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 w-48 rounded bg-muted" />
          <div className="mt-2 h-4 w-72 rounded bg-muted" />
        </div>
        <div className="h-9 w-32 rounded bg-muted" />
      </div>
      <div className="rounded-xl border bg-card p-4">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="mt-4 space-y-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-10 rounded bg-muted/70" />
          ))}
        </div>
      </div>
    </div>
  );
}
