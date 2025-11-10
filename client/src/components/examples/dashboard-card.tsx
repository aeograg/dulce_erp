import { DashboardCard } from "../dashboard-card";
import { Package, AlertTriangle, TrendingUp } from "lucide-react";

export default function DashboardCardExample() {
  return (
    <div className="grid gap-4 md:grid-cols-3 p-4">
      <DashboardCard
        title="Total Products"
        value="24"
        icon={Package}
        description="Active inventory items"
      />
      <DashboardCard
        title="Low Stock Alerts"
        value="3"
        icon={AlertTriangle}
        description="Items below minimum level"
      />
      <DashboardCard
        title="Avg Profit Margin"
        value="42%"
        icon={TrendingUp}
        trend="+2% from last week"
      />
    </div>
  );
}
