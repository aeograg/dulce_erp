import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Plus, ArrowUpDown, Filter, Package } from "lucide-react";
import { StockEntryForm } from "@/components/stock-entry-form";
import type { StockEntry } from "@shared/schema";

type SortField = "date" | "store" | "product" | "reportedStock";
type SortOrder = "asc" | "desc";

export default function StockEntry() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterStore, setFilterStore] = useState<string>("all");
  const [filterProduct, setFilterProduct] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const { data: stores = [], isLoading: storesLoading } = useQuery<any[]>({
    queryKey: ["/api/stores"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: stockEntries = [], isLoading: stockEntriesLoading } = useQuery<StockEntry[]>({
    queryKey: ["/api/stock-entries"],
  });

  const createMutation = useMutation({
    mutationFn: (entry: any) => apiRequest("POST", "/api/stock-entries", entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/discrepancies"] });
      toast({ title: "Stock entry recorded successfully" });
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to record stock entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredStores = user?.role === "Staff" && user.storeId 
    ? stores.filter((s: any) => s.id === user.storeId)
    : stores;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const storeMap = useMemo(() => new Map(stores.map(s => [s.id, s.name])), [stores]);
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p.name])), [products]);

  const filteredAndSortedEntries = useMemo(() => {
    let filtered = [...stockEntries];

    if (filterStore && filterStore !== "all") {
      filtered = filtered.filter(entry => entry.storeId === filterStore);
    }

    if (filterProduct && filterProduct !== "all") {
      filtered = filtered.filter(entry => entry.productId === filterProduct);
    }

    if (dateFrom) {
      filtered = filtered.filter(entry => entry.date >= dateFrom);
    }

    if (dateTo) {
      filtered = filtered.filter(entry => entry.date <= dateTo);
    }

    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case "date":
          aVal = a.date;
          bVal = b.date;
          break;
        case "store":
          aVal = storeMap.get(a.storeId) || "";
          bVal = storeMap.get(b.storeId) || "";
          break;
        case "product":
          aVal = productMap.get(a.productId) || "";
          bVal = productMap.get(b.productId) || "";
          break;
        case "reportedStock":
          aVal = a.reportedStock || 0;
          bVal = b.reportedStock || 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [stockEntries, filterStore, filterProduct, dateFrom, dateTo, sortField, sortOrder, storeMap, productMap]);

  const totalEntries = filteredAndSortedEntries.length;
  const totalWaste = filteredAndSortedEntries.reduce((sum, entry) => sum + (entry.waste || 0), 0);
  const highDiscrepancies = filteredAndSortedEntries.filter(entry => 
    Math.abs(entry.discrepancy || 0) >= 5
  ).length;

  const isLoading = storesLoading || productsLoading || stockEntriesLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Stock Entry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {user?.role === "Staff" 
              ? "Record end-of-day stock levels and waste for your store"
              : "Record daily stock levels and track discrepancies"}
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-stock-entry">
              <Plus className="h-4 w-4 mr-2" />
              Add Stock Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Daily Stock Entry</DialogTitle>
              <DialogDescription>
                Record end-of-day stock levels and waste
              </DialogDescription>
            </DialogHeader>
            <StockEntryForm
              stores={filteredStores}
              products={products}
              onSubmit={(entry) => createMutation.mutate(entry)}
              userRole={user?.role || "Staff"}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-entries">{totalEntries}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Discrepancies</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-high-discrepancies">{highDiscrepancies}</div>
            <p className="text-xs text-muted-foreground">≥5% variance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Waste</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-waste">{totalWaste}</div>
            <p className="text-xs text-muted-foreground">All filtered entries</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="filter-store">Store</Label>
              <Select value={filterStore} onValueChange={setFilterStore}>
                <SelectTrigger id="filter-store" data-testid="select-filter-store">
                  <SelectValue placeholder="All Stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-product">Product</Label>
              <Select value={filterProduct} onValueChange={setFilterProduct}>
                <SelectTrigger id="filter-product" data-testid="select-filter-product">
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                data-testid="input-date-from"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                data-testid="input-date-to"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Entries</CardTitle>
          <CardDescription>
            Showing {filteredAndSortedEntries.length} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAndSortedEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No stock entries found. Click "Add Stock Entry" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("date")}
                        className="hover-elevate active-elevate-2"
                        data-testid="button-sort-date"
                      >
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("store")}
                        className="hover-elevate active-elevate-2"
                        data-testid="button-sort-store"
                      >
                        Store
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("product")}
                        className="hover-elevate active-elevate-2"
                        data-testid="button-sort-product"
                      >
                        Product
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Delivered</TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("reportedStock")}
                        className="hover-elevate active-elevate-2"
                        data-testid="button-sort-reported-stock"
                      >
                        Reported Stock
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Waste</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Expected Stock</TableHead>
                    <TableHead className="text-right">Discrepancy</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedEntries.map((entry) => {
                    const discrepancy = entry.discrepancy || 0;
                    const isHighDiscrepancy = Math.abs(discrepancy) >= 5;
                    
                    return (
                      <TableRow key={entry.id} data-testid={`row-stock-entry-${entry.id}`}>
                        <TableCell>{format(new Date(entry.date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>{storeMap.get(entry.storeId)}</TableCell>
                        <TableCell>{productMap.get(entry.productId)}</TableCell>
                        <TableCell className="text-right">{entry.delivered || 0}</TableCell>
                        <TableCell className="text-right">{entry.reportedStock || 0}</TableCell>
                        <TableCell className="text-right">{entry.waste || 0}</TableCell>
                        <TableCell className="text-right">{entry.sales || 0}</TableCell>
                        <TableCell className="text-right">{entry.expectedStock || 0}</TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={isHighDiscrepancy ? "destructive" : "secondary"}
                            data-testid={`badge-discrepancy-${entry.id}`}
                          >
                            {discrepancy.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
