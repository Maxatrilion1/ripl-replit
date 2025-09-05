import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSkeletonProps {
  variant: 'invite' | 'onboarding' | 'profile' | 'session';
  className?: string;
}

const LoadingSkeleton = ({ variant, className = '' }: LoadingSkeletonProps) => {
  switch (variant) {
    case 'invite':
      return (
        <div className={`min-h-screen bg-gradient-to-br from-background via-cowork-primary-light/10 to-cowork-accent-light/10 ${className}`}>
          <div className="container mx-auto px-4 py-8 max-w-2xl">
            {/* Event Card Skeleton */}
            <Card className="mb-8 shadow-lg border-0 bg-card/95 backdrop-blur">
              <CardHeader className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-3/4 mx-auto" />
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Skeleton className="w-5 h-5" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Skeleton className="w-5 h-5" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Skeleton className="h-4 w-20 mx-auto mb-3" />
                  <div className="flex justify-center -space-x-2 mb-2">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="w-10 h-10 rounded-full border-2 border-background" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Join Options Skeleton */}
            <Card className="shadow-lg border-0 bg-card/95 backdrop-blur">
              <CardHeader className="text-center">
                <Skeleton className="h-6 w-32 mx-auto" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );

    case 'onboarding':
      return (
        <div className={`min-h-screen bg-gradient-to-br from-background via-background to-cowork-primary-light/10 ${className}`}>
          <div className="w-full max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Progress Card Skeleton */}
            <Card className="lg:sticky lg:top-8 h-fit">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full mb-4" />
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <Skeleton className="w-24 h-24 rounded-full" />
                </div>

                <div className="space-y-4 text-center">
                  <div>
                    <Skeleton className="h-3 w-8 mx-auto mb-1" />
                    <Skeleton className="h-5 w-32 mx-auto" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-8 mx-auto mb-1" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </div>
                  <div>
                    <Skeleton className="h-3 w-8 mx-auto mb-1" />
                    <Skeleton className="h-4 w-40 mx-auto" />
                  </div>
                </div>

                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step Form Skeleton */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-16 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>

                <div className="flex justify-between pt-6">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );

    case 'profile':
      return (
        <div className={`container mx-auto px-4 py-8 max-w-4xl space-y-6 ${className}`}>
          <div className="flex items-center gap-3">
            <Skeleton className="w-6 h-6" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-6">
                <Skeleton className="w-24 h-24 rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i}>
                        <Skeleton className="h-3 w-16 mb-1" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );

    case 'session':
      return (
        <div className={`container mx-auto px-4 py-6 space-y-6 ${className}`}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <Skeleton className="h-32 w-full" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );

    default:
      return (
        <div className={`space-y-4 ${className}`}>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      );
  }
};

export default LoadingSkeleton;