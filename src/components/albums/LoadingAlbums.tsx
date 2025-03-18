
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingAlbums() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="border rounded-lg p-5 space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-10" />
          </div>
          <Skeleton className="h-6 w-3/4 mt-2" />
          <Skeleton className="h-4 w-full" />
          <div className="space-y-3 pt-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
          <Skeleton className="h-9 w-full mt-6" />
        </div>
      ))}
    </div>
  );
}
