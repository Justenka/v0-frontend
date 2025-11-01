export default function Loading() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 bg-muted rounded"></div>
        <div className="h-12 bg-muted rounded"></div>
        <div className="space-y-3">
          <div className="h-24 bg-muted rounded"></div>
          <div className="h-24 bg-muted rounded"></div>
          <div className="h-24 bg-muted rounded"></div>
        </div>
      </div>
    </div>
  )
}
