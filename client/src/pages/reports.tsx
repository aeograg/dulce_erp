import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export default function Reports() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedStore, setSelectedStore] = useState("all");

  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: allStockEntries = [] } = useQuery({
    queryKey: ["/api/stock-entries"],
  });

  const storeMap = new Map(stores.map((s: any) => [s.id, s.name]));
  const productMap = new Map(products.map((p: any) => [p.id, p.name]));

  const stockData = allStockEntries
    .filter((entry: any) => {
      if (selectedStore !== "all" && entry.storeId !== selectedStore) return false;
      if (dateFrom && entry.date < dateFrom) return false;
      if (dateTo && entry.date > dateTo) return false;
      return true;
    })
    .map((entry: any) => ({
      id: entry.id,
      date: entry.date,
      store: storeMap.get(entry.storeId) || "Unknown",
      product: productMap.get(entry.productId) || "Unknown",
      delivered: entry.delivered,
      sales: entry.sales,
      waste: entry.waste,
      expected: entry.expectedRemaining,
      reported: entry.reportedRemaining,
      discrepancy: entry.discrepancy,
    }));

  const columns = [
    { key: "date", label: "Date", sortable: true },
    { key: "store", label: "Store", sortable: true },
    { key: "product", label: "Product", sortable: true },
    { key: "delivered", label: "Delivered", sortable: true },
    { key: "sales", label: "Sales", sortable: true },
    { key: "waste", label: "Waste", sortable: true },
    { key: "expected", label: "Expected", sortable: true },
    { key: "reported", label: "Reported", sortable: true },
    {
      key: "discrepancy",
      label: "Discrepancy",
      sortable: true,
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <span>{item.discrepancy.toFixed(1)}%</span>
          {item.discrepancy > 5 && (
            <Badge variant="destructive" className="text-xs">High</Badge>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View stock summaries and discrepancy reports
          </p>
        </div>
        <Button data-testid="button-export-report">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Reports</CardTitle>
          <CardDescription>Select date range and store to filter results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                data-testid="input-date-from"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                data-testid="input-date-to"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="store">Store</Label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger id="store" data-testid="select-store-filter">
                  <SelectValue placeholder="Select store" />
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
        </CardContent>
      </Card>

      <DataTable
        data={stockData}
        columns={columns}
        searchPlaceholder="Search by product..."
        onSearch={(query) => console.log("Search:", query)}
      />
    </div>
  );
}
