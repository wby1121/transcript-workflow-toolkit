export default function Loading() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-16">
      <div className="animate-pulse space-y-8">
        <div className="h-12 bg-muted rounded-lg w-3/4 mx-auto" />
        <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
        <div className="flex justify-center gap-4 mt-8">
          <div className="h-10 bg-muted rounded-lg w-40" />
          <div className="h-10 bg-muted rounded-lg w-32" />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-12">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
