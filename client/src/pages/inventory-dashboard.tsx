import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, TrendingUp, AlertTriangle } from "lucide-react";

export default function InventoryDashboard() {
  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: currentInventory = {}, isLoading: inventoryLoading } = useQuery<Record<string, number>>({
    queryKey: ["/api/inventory/current"],
  });

  const { data: sales = [], isLoading: salesLoading } = useQuery<any[]>({
    queryKey: ["/api/sales"],
  });

  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery<any[]>({
    queryKey: ["/api/deliveries"],
  });

  // Calculate weekly sales average per product
  const calculateWeeklySales = (productId: string) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentSales = sales.filter((sale: any) => {
      const saleDate = new Date(sale.date);
      return sale.productId === productId && saleDate >= oneWeekAgo;
    });
    
    return recentSales.reduce((sum: number, sale: any) => sum + (sale.quantity || 0), 0);
  };

  // Calculate weekly deliveries per product
  const calculateWeeklyDeliveries = (productId: string) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentDeliveries = deliveries.filter((delivery: any) => {
      const deliveryDate = new Date(delivery.date);
      return delivery.productId === productId && deliveryDate >= oneWeekAgo;
    });
    
    return recentDeliveries.reduce((sum: number, delivery: any) => sum + (delivery.quantitySent || 0), 0);
  };

  // Calculate suggested production
  const calculateSuggestedProduction = (productId: string, currentStock: number) => {
    const weeklySales = calculateWeeklySales(productId);
    const weeklyDeliveries = calculateWeeklyDeliveries(productId);
    const weeklyDemand = weeklySales + weeklyDeliveries;
    
    // Suggest production to maintain 2 weeks of stock
    const targetStock = weeklyDemand * 2;
    const suggestedProduction = Math.max(0, targetStock - currentStock);
    
    return {
      weeklySales,
      weeklyDeliveries,
      weeklyDemand,
      suggestedProduction,
      stockLevel: currentStock >= targetStock ? "good" : currentStock >= weeklyDemand ? "medium" : "low",
    };
  };

  const enrichedProducts = products.map((product: any) => {
    const currentStock = currentInventory[product.id] || 0;
    const forecast = calculateSuggestedProduction(product.id, currentStock);
    
    return {
      ...product,
      currentStock,
      ...forecast,
    };
  });

  const lowStockProducts = enrichedProducts.filter((p: any) => p.stockLevel === "low");
  const totalInventoryValue = enrichedProducts.reduce(
    (sum: number, p: any) => sum + (p.currentStock * (p.unitCost || 0)),
    0
  );

  const isLoading = productsLoading || inventoryLoading || salesLoading || deliveriesLoading;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">Inventory Dashboard</h1>
        <p className="text-muted-foreground mt-2">Production center inventory levels and production forecasts</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-total-products">
                  {products.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  In production center
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                <AlertTriangle className="w-4 h-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive" data-testid="text-low-stock-count">
                  {lowStockProducts.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Need production
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-inventory-value">
                  ${totalInventoryValue.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total cost value
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Levels & Production Forecast</CardTitle>
              <CardDescription>Current stock and suggested weekly production based on demand</CardDescription>
            </CardHeader>
            <CardContent>
              {enrichedProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8" data-testid="text-no-products">
                  No products in system
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-foreground">Product</th>
                        <th className="text-right py-3 px-4 font-medium text-foreground">Current Stock</th>
                        <th className="text-right py-3 px-4 font-medium text-foreground">Weekly Sales</th>
                        <th className="text-right py-3 px-4 font-medium text-foreground">Weekly Deliveries</th>
                        <th className="text-right py-3 px-4 font-medium text-foreground">Weekly Demand</th>
                        <th className="text-right py-3 px-4 font-medium text-foreground">Suggested Production</th>
                        <th className="text-center py-3 px-4 font-medium text-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrichedProducts.map((product: any) => (
                        <tr
                          key={product.id}
                          className="border-b hover-elevate"
                          data-testid={`inventory-row-${product.id}`}
                        >
                          <td className="py-3 px-4 font-medium text-foreground" data-testid={`product-${product.id}`}>
                            {product.name}
                          </td>
                          <td className="text-right py-3 px-4" data-testid={`stock-${product.id}`}>
                            {product.currentStock}
                          </td>
                          <td className="text-right py-3 px-4 text-muted-foreground" data-testid={`sales-${product.id}`}>
                            {product.weeklySales}
                          </td>
                          <td className="text-right py-3 px-4 text-muted-foreground" data-testid={`deliveries-${product.id}`}>
                            {product.weeklyDeliveries}
                          </td>
                          <td className="text-right py-3 px-4 font-medium" data-testid={`demand-${product.id}`}>
                            {product.weeklyDemand}
                          </td>
                          <td className="text-right py-3 px-4 font-bold" data-testid={`suggested-${product.id}`}>
                            {product.suggestedProduction}
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge
                              variant={
                                product.stockLevel === "good"
                                  ? "default"
                                  : product.stockLevel === "medium"
                                  ? "secondary"
                                  : "destructive"
                              }
                              data-testid={`status-${product.id}`}
                            >
                              {product.stockLevel === "good"
                                ? "Good"
                                : product.stockLevel === "medium"
                                ? "Medium"
                                : "Low"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="font-medium text-foreground mb-1">Forecast Calculation</p>
                  <p>Based on last 7 days of sales and deliveries</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Stock Levels</p>
                  <p>Good: 2+ weeks stock | Medium: 1-2 weeks | Low: &lt;1 week</p>
                </div>
                <div>
                  <p className="font-medium text-foreground mb-1">Auto-Updates</p>
                  <p>Inventory automatically adjusts when deliveries are sent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
