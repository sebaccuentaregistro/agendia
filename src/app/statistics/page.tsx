import { Suspense } from 'react';
import StatisticsPageContent from './statistics-page-content';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';

function StatisticsSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeader title="Estadísticas del Estudio" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Skeleton className="h-[380px] w-full rounded-2xl" />
        <Skeleton className="h-[380px] w-full rounded-2xl" />
        <Skeleton className="lg:col-span-2 h-[280px] w-full rounded-2xl" />
        <Skeleton className="lg:col-span-2 h-[430px] w-full rounded-2xl" />
      </div>
    </div>
  )
}

export default function StatisticsPage() {
    return (
        <Suspense fallback={<StatisticsSkeleton />}>
            <StatisticsPageContent />
        </Suspense>
    );
}
