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

export default function Reports() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedStore, setSelectedStore] = useState("all");

  const stockData = [
    {
      id: "1",
      date: "2024-01-15",
      store: "Store 1",
      product: "Croissant",
      delivered: 50,
      sales: 42,
      waste: 1,
      expected: 47,
      reported: 45,
      discrepancy: 4.0,
    },
    {
      id: "2",
      date: "2024-01-15",
      store: "Store 2",
      product: "Baguette",
      delivered: 60,
      sales: 50,
      waste: 2,
      expected: 58,
      reported: 53,
      discrepancy: 8.3,
    },
    {
      id: "3",
      date: "2024-01-14",
      store: "Store 1",
      product: "Danish Pastry",
      delivered: 40,
      sales: 35,
      waste: 1,
      expected: 39,
      reported: 38,
      discrepancy: 2.5,
    },
  ];

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
                  <SelectItem value="1">Store 1 (Main)</SelectItem>
                  <SelectItem value="2">Store 2 (Daily Delivery)</SelectItem>
                  <SelectItem value="3">Store 3 (Every 2 Days)</SelectItem>
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
