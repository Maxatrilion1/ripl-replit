import { Skeleton } from '@/components/ui/skeleton';

export const SprintParticipantsSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Participant count and button */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Participant avatars */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <div className="flex flex-wrap gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};