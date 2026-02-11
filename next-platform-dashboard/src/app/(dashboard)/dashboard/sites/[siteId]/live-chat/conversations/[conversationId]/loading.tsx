import { Skeleton } from '@/components/ui/skeleton'

export default function ConversationViewLoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)]">
      <div className="flex-1 flex flex-col border-r">
        <div className="border-b p-4 flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`flex gap-2 ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
            >
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-16 w-48 rounded-lg" />
            </div>
          ))}
        </div>
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="w-80 p-4 space-y-4 hidden lg:block">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    </div>
  )
}
