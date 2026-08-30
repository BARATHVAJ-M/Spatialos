import { SummaryCards, PublishingSummary } from '@/components/OverviewCards';
import { SystemHealth, QuickActions, RecentActivity } from '@/components/OverviewWidgets';

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Overview</h1>
          <p className="text-slate-400 mt-1 text-sm">SpatialOS Environment Health and Activity</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Top Row: Summary Cards */}
        <SummaryCards />

        {/* Middle Row: Complex Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <RecentActivity />
          </div>
          
          <div className="flex flex-col gap-6">
            <PublishingSummary />
            <SystemHealth />
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
}
