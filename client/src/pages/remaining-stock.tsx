import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, Loader2 } from "lucide-react";

interface StockSummary {
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  reportedStock: number;
  expectedStock: number;
  minStockLevel: number;
  isLowStock: boolean;
  date: string;
}

export default function RemainingStock() {
  const { data: stockEntries = [], isLoading: entriesLoading, error: entriesError } = useQuery<any[]>({
    queryKey: ["/api/stock-entries"],
  });

  const { data: stores = [], isLoading: storesLoading, error: storesError } = useQuery<any[]>({
    queryKey: ["/api/stores"],
  });

  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const storeMap = new Map(stores.map((s: any) => [s.id, s]));
  const productMap = new Map(products.map((p: any) => [p.id, p]));

  const getLatestStockByStoreAndProduct = (): StockSummary[] => {
    const latestByKey = new Map<string, any>();

    stockEntries.forEach((entry) => {
      const key = `${entry.storeId}-${entry.productId}`;
      const existing = latestByKey.get(key);
      
      if (!existing || new Date(entry.date) > new Date(existing.date)) {
        latestByKey.set(key, entry);
      }
    });

    const summaries: StockSummary[] = [];
    latestByKey.forEach((entry) => {
      const store = storeMap.get(entry.storeId);
      const product = productMap.get(entry.productId);
      
      if (store && product) {
        summaries.push({
          storeId: entry.storeId,
          storeName: store.name,
          productId: entry.productId,
          productName: product.name,
          reportedStock: entry.reportedStock,
          expectedStock: entry.expectedStock,
          minStockLevel: product.minStockLevel,
          isLowStock: entry.reportedStock < product.minStockLevel,
          date: entry.date,
        });
      }
    });

    return summaries.sort((a, b) => {
      if (a.storeName !== b.storeName) {
        return a.storeName.localeCompare(b.storeName);
      }
      return a.productName.localeCompare(b.productName);
    });
  };

  const stockSummaries = getLatestStockByStoreAndProduct();
  const groupedByStore = stockSummaries.reduce((acc, item) => {
    if (!acc[item.storeName]) {
      acc[item.storeName] = [];
    }
    acc[item.storeName].push(item);
    return acc;
  }, {} as Record<string, StockSummary[]>);

  const totalLowStock = stockSummaries.filter(s => s.isLowStock).length;
  const totalProducts = stockSummaries.length;

  const isLoading = entriesLoading || storesLoading || productsLoading;
  const hasError = entriesError || storesError || productsError;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Remaining Stock Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Current stock levels across all stores
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          </CardContent>
        </Card>
      ) : hasError ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-destructive">
              <p>Failed to load data. Please try refreshing the page.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-products">
              {totalProducts}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="stat-low-stock">
              {totalLowStock}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stores Monitored</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-stores">
              {Object.keys(groupedByStore).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {stockSummaries.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p data-testid="empty-stock-data">No stock data available yet</p>
              <p className="text-sm mt-1">Record stock entries to see remaining stock levels here</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByStore).map(([storeName, items]) => (
            <Card key={storeName}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{storeName}</span>
                  <Badge variant="outline">
                    {items.length} products
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 text-sm font-medium">Product</th>
                        <th className="text-right py-2 px-2 text-sm font-medium">Reported</th>
                        <th className="text-right py-2 px-2 text-sm font-medium">Expected</th>
                        <th className="text-right py-2 px-2 text-sm font-medium">Min Level</th>
                        <th className="text-right py-2 px-2 text-sm font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr
                          key={`${item.storeId}-${item.productId}`}
                          className="border-b last:border-0"
                          data-testid={`row-${item.storeId}-${item.productId}`}
                        >
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium text-sm">{item.productName}</p>
                              <p className="text-xs text-muted-foreground">
                                Last updated: {item.date}
                              </p>
                            </div>
                          </td>
                          <td className="text-right py-3 px-2 font-medium" data-testid={`reported-${item.storeId}-${item.productId}`}>
                            {item.reportedStock}
                          </td>
                          <td className="text-right py-3 px-2 text-muted-foreground" data-testid={`expected-${item.storeId}-${item.productId}`}>
                            {item.expectedStock}
                          </td>
                          <td className="text-right py-3 px-2 text-muted-foreground" data-testid={`min-${item.storeId}-${item.productId}`}>
                            {item.minStockLevel}
                          </td>
                          <td className="text-right py-3 px-2">
                            {item.isLowStock ? (
                              <Badge variant="destructive" data-testid={`alert-${item.storeId}-${item.productId}`}>
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Low Stock
                              </Badge>
                            ) : (
                              <Badge variant="secondary" data-testid={`ok-${item.storeId}-${item.productId}`}>
                                OK
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
}
