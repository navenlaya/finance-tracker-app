import { Skeleton } from "@/components/ui/skeleton";

export function TransactionsSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, groupIndex) => (
        <div key={groupIndex}>
          <Skeleton className="h-4 w-48 mb-3" />
          <div className="space-y-1 rounded-lg border bg-card">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 border-b last:border-b-0"
              >
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
