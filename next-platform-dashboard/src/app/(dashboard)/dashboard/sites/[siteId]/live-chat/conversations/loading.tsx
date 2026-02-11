import { Skeleton } from '@/components/ui/skeleton'

export default function ConversationsLoading() {
  return (
    <div className="container py-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-14 rounded-lg" />
      <div className="space-y-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-none" />
        ))}
      </div>
    </div>
  )
}
