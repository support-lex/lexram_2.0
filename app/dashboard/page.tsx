import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardStats from "@/components/dashboard/DashboardStats";
import QuickActions from "@/components/dashboard/QuickActions";
import QuickUpload from "@/components/dashboard/QuickUpload";
import RecentActivity from "@/components/dashboard/RecentActivity";
import RecentDocuments from "@/components/dashboard/RecentDocuments";
import UpcomingDeadlines from "@/components/dashboard/UpcomingDeadlines";

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <DashboardHeader today={new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} />
      <DashboardStats />
      <QuickActions />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RecentDocuments />
          <RecentActivity />
        </div>
        <div className="space-y-6">
          <UpcomingDeadlines />
          <QuickUpload />
        </div>
      </div>
    </div>
  );
}
