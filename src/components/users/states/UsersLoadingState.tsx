
import { Skeleton } from "@/components/ui/skeleton";
import { ViewMode } from "@/components/ui/ViewToggle";

interface UsersLoadingStateProps {
  viewMode: ViewMode;
}

export function UsersLoadingState({ viewMode }: UsersLoadingStateProps) {
  if (viewMode === "card") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="bg-white shadow-sm rounded-lg p-6 border border-border">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      <Skeleton className="h-12 w-full mb-4" />
      {[1, 2, 3, 4, 5].map((item) => (
        <Skeleton key={item} className="h-16 w-full mb-2" />
      ))}
    </div>
  );
}
