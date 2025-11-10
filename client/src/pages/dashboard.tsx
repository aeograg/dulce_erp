import { DashboardCard } from "@/components/dashboard-card";
import { AlertCard } from "@/components/alert-card";
import { Package, AlertTriangle, TrendingUp, ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: lowStockProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/analytics/low-stock"],
    enabled: user?.role === "Admin" || user?.role === "Manager",
  });

  const { data: discrepanciesData = [] } = useQuery<any[]>({
    queryKey: ["/api/analytics/discrepancies"],
    enabled: user?.role === "Admin" || user?.role === "Manager",
  });

  const lowStockItems = lowStockProducts.map((item: any) => ({
    id: item.id,
    name: item.name,
    details: `Current: ${item.currentStock} units, Min: ${item.minStockLevel} units`,
  }));

  const discrepancies = discrepanciesData.slice(0, 5).map((item: any) => ({
    id: item.id,
    name: `${item.storeName} - ${item.productName}`,
    details: `Discrepancy: ${Math.abs(item.discrepancy).toFixed(1)}% (Expected: ${item.expectedRemaining}, Reported: ${item.reportedRemaining})`,
  }));

  const avgMargin = products.length > 0
    ? products.reduce((acc: number, p: any) => {
        const margin = ((p.sellingPrice - p.unitCost) / p.sellingPrice) * 100;
        return acc + margin;
      }, 0) / products.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your bakery operations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Total Products"
          value={products.length}
          icon={Package}
          description="Active inventory items"
        />
        <DashboardCard
          title="Low Stock Alerts"
          value={lowStockProducts.length}
          icon={AlertTriangle}
          description="Items below minimum level"
        />
        <DashboardCard
          title="Avg Profit Margin"
          value={`${avgMargin.toFixed(1)}%`}
          icon={TrendingUp}
          description="Across all products"
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
