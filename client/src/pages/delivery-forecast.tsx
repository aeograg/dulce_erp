import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/data-table";
import { TrendingUp, Package, Calendar } from "lucide-react";

export default function DeliveryForecast() {
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [forecastDays, setForecastDays] = useState("7");

  const { data: stores = [] } = useQuery<any[]>({
    queryKey: ["/api/stores"],
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: stockEntries = [] } = useQuery<any[]>({
    queryKey: ["/api/stock-entries"],
  });

  const storeMap = new Map(stores.map((s: any) => [s.id, s]));
  const productMap = new Map(products.map((p: any) => [p.id, p]));

  const calculateForecast = () => {
    if (!selectedStore || !selectedProduct) return null;

    const relevantEntries = stockEntries.filter(
      (e: any) =>
        e.storeId === selectedStore &&
        e.productId === selectedProduct &&
        e.sales > 0
    );

    if (relevantEntries.length === 0) return null;

    const avgSales =
      relevantEntries.reduce((sum: number, e: any) => sum + e.sales, 0) /
      relevantEntries.length;
    const avgWaste =
      relevantEntries.reduce((sum: number, e: any) => sum + e.waste, 0) /
      relevantEntries.length;

    const days = parseInt(forecastDays);
    const forecastedSales = avgSales * days;
    const forecastedWaste = avgWaste * days;
    const recommendedDelivery = Math.ceil(forecastedSales + forecastedWaste);

    const store = storeMap.get(selectedStore);
    const deliveryFrequency = store?.deliverySchedule || "daily";
    const deliveryCount =
      deliveryFrequency === "daily"
        ? days
        : deliveryFrequency === "every-2-days"
        ? Math.ceil(days / 2)
        : Math.ceil(days / 3);

    return {
      avgDailySales: avgSales.toFixed(1),
      avgDailyWaste: avgWaste.toFixed(1),
      forecastPeriod: days,
      totalForecastedSales: forecastedSales.toFixed(1),
      totalForecastedWaste: forecastedWaste.toFixed(1),
      recommendedDelivery,
      deliveryFrequency,
      deliveryCount,
      perDeliveryQuantity: Math.ceil(recommendedDelivery / deliveryCount),
      dataPoints: relevantEntries.length,
    };
  };

  const forecast = calculateForecast();

  const historicalColumns = [
    {
      key: "date",
      label: "Date",
      sortable: true,
    },
    {
      key: "delivered",
      label: "Delivered",
      sortable: true,
    },
    {
      key: "sales",
      label: "Sales",
      sortable: true,
    },
    {
      key: "waste",
      label: "Waste",
      sortable: true,
    },
    {
      key: "currentStock",
      label: "End Stock",
      sortable: true,
    },
  ];

  const historicalData = stockEntries
    .filter(
      (e: any) =>
        (!selectedStore || e.storeId === selectedStore) &&
        (!selectedProduct || e.productId === selectedProduct) &&
        e.sales > 0
    )
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Delivery Forecast</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Plan deliveries based on historical sales data and trends
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forecast Parameters</CardTitle>
          <CardDescription>
            Select store and product to generate delivery forecast
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="store">Store</Label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger id="store" data-testid="select-forecast-store">
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store: any) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger id="product" data-testid="select-forecast-product">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product: any) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="days">Forecast Period</Label>
              <Select value={forecastDays} onValueChange={setForecastDays}>
                <SelectTrigger id="days" data-testid="select-forecast-days">
                  <SelectValue placeholder="Select days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {forecast && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recommended Delivery
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{forecast.recommendedDelivery} units</div>
              <p className="text-xs text-muted-foreground">
                {forecast.perDeliveryQuantity} per delivery ({forecast.deliveryCount} deliveries)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Forecasted Sales
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{forecast.totalForecastedSales} units</div>
              <p className="text-xs text-muted-foreground">
                {forecast.avgDailySales} per day average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expected Waste
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{forecast.totalForecastedWaste} units</div>
              <p className="text-xs text-muted-foreground">
                {forecast.avgDailyWaste} per day average
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {forecast && (
        <Card>
          <CardHeader>
            <CardTitle>Forecast Summary</CardTitle>
            <CardDescription>
              Based on {forecast.dataPoints} historical data points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Schedule:</span>
                <span className="font-medium capitalize">{forecast.deliveryFrequency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Forecast Period:</span>
                <span className="font-medium">{forecast.forecastPeriod} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Number of Deliveries:</span>
                <span className="font-medium">{forecast.deliveryCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Units per Delivery:</span>
                <span className="font-medium">{forecast.perDeliveryQuantity}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!forecast && selectedStore && selectedProduct && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No historical data available for this store and product combination.
              <br />
              Add stock entries with sales data to generate forecasts.
            </p>
          </CardContent>
        </Card>
      )}

      {historicalData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historical Data</CardTitle>
            <CardDescription>
              Recent stock entries for analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              data={historicalData}
              columns={historicalColumns}
              searchPlaceholder="Search historical data..."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
