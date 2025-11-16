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

  const storeMap = new Map(stores.map((s: any) => [s.id, s.name]));
  const productMap = new Map(products.map((p: any) => [p.id, p.name]));

  const filteredEntries = stockEntries.filter((entry) => {
    if (filterDate && filterDate.trim() !== "" && entry.date !== filterDate) return false;
    if (filterStore !== "all" && entry.storeId.toString() !== filterStore) return false;
    return true;
  });

  const enrichedEntries = filteredEntries.map((entry) => ({
    ...entry,
    storeName: storeMap.get(entry.storeId) || "Unknown",
    productName: productMap.get(entry.productId) || "Unknown",
  }));

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
      key: "delivered",
      label: "Delivered",
      sortable: true,
      render: (item: any) => (
        <span data-testid={`delivered-${item.id}`}>
          {item.delivered || 0}
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
        <span className={item.waste > 0 ? "text-destructive" : ""} data-testid={`waste-${item.id}`}>
          {item.waste || 0}
        </span>
      ),
    },
    {
      key: "sales",
      label: "Sales",
      sortable: true,
      render: (item: any) => (
        <span data-testid={`sales-${item.id}`}>
          {item.sales || 0}
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

      {isLoading || storesLoading || productsLoading ? (
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
                <CardTitle className="text-sm font-medium">Total Waste</CardTitle>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="stat-total-waste">
                  {filteredEntries.reduce((sum, e) => sum + (e.waste || 0), 0)} units
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
