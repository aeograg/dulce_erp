import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package, AlertTriangle, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function StockControl() {
  const [filterDate, setFilterDate] = useState("");
  const [filterStore, setFilterStore] = useState("all");

  const { data: stockEntries = [], isLoading, error } = useQuery<any[]>({
    queryKey: ["/api/stock-entries"],
  });

  const { data: stores = [], isLoading: storesLoading } = useQuery<any[]>({
    queryKey: ["/api/stores"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery<any[]>({
    queryKey: ["/api/deliveries"],
  });

  const { data: salesData = [], isLoading: salesLoading } = useQuery<any[]>({
    queryKey: ["/api/sales"],
  });

  const storeMap = new Map(stores.map((s: any) => [s.id, s.name]));
  const productMap = new Map(products.map((p: any) => [p.id, p.name]));

  // Calculate delivered amounts from deliveries data
  const getDeliveredAmount = (date: string, storeId: string, productId: string) => {
    return deliveries
      .filter((d: any) => 
        d.date === date && 
        d.storeId === storeId && 
        d.productId === productId
      )
      .reduce((sum: number, d: any) => sum + (d.quantitySent || 0), 0);
  };

  // Calculate sales amounts from sales data
  const getSalesAmount = (date: string, storeId: string, productId: string) => {
    return salesData
      .filter((s: any) => 
        s.date === date && 
        s.storeId === storeId && 
        s.productId === productId
      )
      .reduce((sum: number, s: any) => sum + (s.quantity || 0), 0);
  };

  const filteredEntries = stockEntries.filter((entry) => {
    if (filterDate && filterDate.trim() !== "" && entry.date !== filterDate) return false;
    if (filterStore !== "all" && entry.storeId.toString() !== filterStore) return false;
    return true;
  });

  const enrichedEntries = filteredEntries.map((entry) => {
    const product = products.find((p: any) => p.id === entry.productId);
    const deliveredAmount = getDeliveredAmount(entry.date, entry.storeId, entry.productId);
    const salesAmount = getSalesAmount(entry.date, entry.storeId, entry.productId);
    
    // Total inventory = current stock + waste + sales (what we had during the day)
    const totalDayInventory = (entry.currentStock || 0) + (entry.waste || 0) + salesAmount;
    
    // Calculate waste percentage based on total inventory available
    const wastePercent = totalDayInventory > 0 ? ((entry.waste || 0) / totalDayInventory) * 100 : 0;
    const maxWastePercent = product?.maxWastePercent || 5.0;
    const isWasteExcessive = (entry.waste || 0) > 0 && wastePercent > maxWastePercent;

    return {
      ...entry,
      storeName: storeMap.get(entry.storeId) || "Unknown",
      productName: productMap.get(entry.productId) || "Unknown",
      deliveredAmount,
      salesAmount,
      wastePercent,
      maxWastePercent,
      isWasteExcessive,
    };
  });

  const columns = [
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (item: any) => format(new Date(item.date), "MMM dd, yyyy"),
    },
    {
      key: "storeName",
      label: "Store",
      sortable: true,
    },
    {
      key: "productName",
      label: "Product",
      sortable: true,
    },
    {
      key: "deliveredAmount",
      label: "Delivered",
      sortable: true,
      render: (item: any) => (
        <span data-testid={`delivered-${item.id}`}>
          {item.deliveredAmount}
        </span>
      ),
    },
    {
      key: "currentStock",
      label: "Current Stock",
      sortable: true,
      render: (item: any) => (
        <span data-testid={`current-stock-${item.id}`}>
          {item.currentStock}
        </span>
      ),
    },
    {
      key: "waste",
      label: "Waste",
      sortable: true,
      render: (item: any) => (
        <div className="flex flex-col">
          <span className={item.isWasteExcessive ? "text-destructive font-semibold" : item.waste > 0 ? "text-destructive" : ""} data-testid={`waste-${item.id}`}>
            {item.waste || 0}
          </span>
          {item.waste > 0 && (
            <span className={`text-xs ${item.isWasteExcessive ? "text-destructive" : "text-muted-foreground"}`}>
              {item.wastePercent.toFixed(1)}%
            </span>
          )}
        </div>
      ),
    },
    {
      key: "salesAmount",
      label: "Sales",
      sortable: true,
      render: (item: any) => (
        <span data-testid={`sales-${item.id}`}>
          {item.salesAmount}
        </span>
      ),
    },
    {
      key: "expectedRemaining",
      label: "Expected Remaining",
      sortable: true,
      render: (item: any) => (
        <span className="font-medium" data-testid={`expected-${item.id}`}>
          {item.expectedRemaining}
        </span>
      ),
    },
    {
      key: "discrepancy",
      label: "Discrepancy",
      sortable: true,
      render: (item: any) => {
        const discrepancy = Math.abs(item.discrepancy);
        const isHigh = discrepancy >= 5;
        return (
          <Badge
            variant={isHigh ? "destructive" : "secondary"}
            data-testid={`discrepancy-${item.id}`}
          >
            {item.discrepancy >= 0 ? "+" : ""}
            {item.discrepancy.toFixed(1)}%
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Stock Control Module</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and analyze stock entry data with calculated metrics
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="filter-date">Filter by Date</Label>
          <Input
            id="filter-date"
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            data-testid="input-filter-date"
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="filter-store">Filter by Store</Label>
          <Select value={filterStore} onValueChange={setFilterStore}>
            <SelectTrigger id="filter-store" data-testid="select-filter-store">
              <SelectValue placeholder="All stores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stores</SelectItem>
              {stores.map((store: any) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading || storesLoading || productsLoading || deliveriesLoading || salesLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-destructive">
              <p>Failed to load stock data. Please try refreshing the page.</p>
            </div>
          </CardContent>
        </Card>
      ) : enrichedEntries.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p data-testid="empty-stock-entries">No stock entries found</p>
              <p className="text-sm mt-1">Adjust filters or add stock entries to see data</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <DataTable
            data={enrichedEntries}
            columns={columns}
            searchPlaceholder="Search stock entries..."
          />

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-entries">
                  {filteredEntries.length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Discrepancies</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive" data-testid="stat-high-discrepancies">
                  {filteredEntries.filter(e => Math.abs(e.discrepancy) >= 5).length}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Excessive Waste</CardTitle>
                <Trash2 className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive" data-testid="stat-excessive-waste">
                  {enrichedEntries.filter(e => e.isWasteExcessive).length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Entries exceeding limit
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
