import { DashboardCard } from "@/components/dashboard-card";
import { AlertCard } from "@/components/alert-card";
import { Package, AlertTriangle, TrendingUp, DollarSign, ShoppingCart, Users } from "lucide-react";

export default function Dashboard() {
  const lowStockItems = [
    { id: "1", name: "Croissant", details: "Current: 5 units, Min: 10 units" },
    { id: "2", name: "Danish Pastry", details: "Current: 3 units, Min: 8 units" },
    { id: "3", name: "Sourdough Bread", details: "Current: 2 units, Min: 6 units" },
  ];

  const discrepancies = [
    { id: "1", name: "Store 1 - Baguette", details: "Discrepancy: 8% (Expected: 25, Reported: 23)" },
    { id: "2", name: "Store 2 - Muffins", details: "Discrepancy: 6% (Expected: 40, Reported: 38)" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your bakery operations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <DashboardCard
          title="Daily Sales"
          value="$1,247"
          icon={ShoppingCart}
          trend="Across all stores"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AlertCard
          title="Low Stock Alerts"
          items={lowStockItems}
          type="warning"
          viewAllLink="/products"
        />
        <AlertCard
          title="Stock Discrepancies"
          items={discrepancies}
          type="info"
          viewAllLink="/reports"
        />
      </div>
    </div>
  );
}
