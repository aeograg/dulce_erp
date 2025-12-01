import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { format } from "date-fns";
import { Loader2, Save, Plus, ArrowUpDown, Filter } from "lucide-react";
import type { Sale } from "@shared/schema";

type SortField = "date" | "store" | "product" | "quantity";
type SortOrder = "asc" | "desc";

export default function SalesDataEntry() {
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [salesQuantities, setSalesQuantities] = useState<Record<string, number>>({});
  
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterStore, setFilterStore] = useState<string>("");
  const [filterProduct, setFilterProduct] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const { data: stores = [], isLoading: storesLoading } = useQuery<any[]>({
    queryKey: ["/api/stores"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: allSales = [], isLoading: salesLoading } = useQuery<Sale[]>({
    queryKey: ["/api/sales"],
  });

  const saveMutation = useMutation({
    mutationFn: async (salesData: any[]) => {
      const results = [];
      const errors = [];
      
      for (const sale of salesData) {
        try {
          const result = await apiRequest("POST", "/api/sales", sale);
          results.push(result);
        } catch (error: any) {
          errors.push({ product: sale.productId, error: error.message });
        }
      }
      
      if (errors.length > 0) {
        throw new Error(`${errors.length} sales entries failed to save`);
      }
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/discrepancies"] });
      toast({ 
        title: "Sales data saved successfully",
        description: "Inventory has been updated automatically"
      });
      setSalesQuantities({});
      setSelectedStore("");
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save sales data",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStore) {
      toast({
        title: "Please select a store",
        variant: "destructive",
      });
      return;
    }

    const salesData = Object.entries(salesQuantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({
        date: selectedDate,
        storeId: selectedStore,
        productId: productId,
        quantity: quantity,
        source: "manual",
      }));

    if (salesData.length === 0) {
      toast({
        title: "Please enter at least one sales quantity",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate(salesData);
  };

  const handleQuantityChange = (productId: string, value: string) => {
    const quantity = Math.max(0, parseInt(value) || 0);
    setSalesQuantities(prev => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  const handleReset = () => {
    setSalesQuantities({});
  };

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

  const filteredAndSortedSales = useMemo(() => {
    let filtered = [...allSales];

    if (filterStore && filterStore !== "all") {
      filtered = filtered.filter(sale => sale.storeId === filterStore);
    }

    if (filterProduct && filterProduct !== "all") {
      filtered = filtered.filter(sale => sale.productId === filterProduct);
    }

    if (dateFrom) {
      filtered = filtered.filter(sale => sale.date >= dateFrom);
    }

    if (dateTo) {
      filtered = filtered.filter(sale => sale.date <= dateTo);
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
        case "quantity":
          aVal = a.quantity;
          bVal = b.quantity;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allSales, filterStore, filterProduct, dateFrom, dateTo, sortField, sortOrder, storeMap, productMap]);

  const totalSales = filteredAndSortedSales.reduce((sum, sale) => sum + sale.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sales Data Entry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage daily sales records across all stores
          </p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-sales">
              <Plus className="w-4 h-4 mr-2" />
              Add Sales
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Sales Data</DialogTitle>
              <DialogDescription>
                Enter sales quantities for multiple products at once
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sales-date">Date</Label>
                  <Input
                    id="sales-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                    data-testid="input-sales-date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sales-store">Store *</Label>
                  <Select value={selectedStore} onValueChange={setSelectedStore} required>
                    <SelectTrigger id="sales-store" data-testid="select-sales-store">
                      <SelectValue placeholder="Select store" />
                    </SelectTrigger>
                    <SelectContent>
                      {storesLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : (
                        stores.map((store: any) => (
                          <SelectItem key={store.id} value={store.id.toString()}>
                            {store.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedStore && (
                <>
                  <div>
                    <h3 className="text-sm font-medium mb-3">Sales Quantities</h3>
                    {productsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : (
                      <div className="grid gap-3 max-h-96 overflow-y-auto pr-2">
                        {products.map((product: any) => (
                          <div
                            key={product.id}
                            className="grid grid-cols-[1fr,120px] gap-3 items-center p-3 border rounded-md"
                            data-testid={`product-row-${product.id}`}
                          >
                            <div>
                              <Label htmlFor={`qty-${product.id}`} className="font-normal">
                                {product.name}
                              </Label>
                            </div>
                            <Input
                              id={`qty-${product.id}`}
                              type="number"
                              min="0"
                              placeholder="0"
                              value={salesQuantities[product.id] || ""}
                              onChange={(e) => handleQuantityChange(product.id.toString(), e.target.value)}
                              data-testid={`input-sales-${product.id}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      disabled={saveMutation.isPending}
                      data-testid="button-reset"
                    >
                      Clear All
                    </Button>
                    <Button
                      type="submit"
                      disabled={saveMutation.isPending || !selectedStore}
                      data-testid="button-save-sales"
                    >
                      {saveMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Sales Data
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Sales Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-records">
              {filteredAndSortedSales.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Units Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-total-units">
              {totalSales}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Stores Tracked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-stores">
              {new Set(filteredAndSortedSales.map(s => s.storeId)).size}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Products Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="stat-products">
              {new Set(filteredAndSortedSales.map(s => s.productId)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter sales records by date range, store, or product</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="filter-date-from">Date From</Label>
              <Input
                id="filter-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                data-testid="input-filter-date-from"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="filter-date-to">Date To</Label>
              <Input
                id="filter-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                data-testid="input-filter-date-to"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-store">Store</Label>
              <Select value={filterStore || "all"} onValueChange={setFilterStore}>
                <SelectTrigger id="filter-store" data-testid="select-filter-store">
                  <SelectValue placeholder="All stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stores</SelectItem>
                  {stores.map((store: any) => (
                    <SelectItem key={store.id} value={store.id.toString()}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-product">Product</Label>
              <Select value={filterProduct || "all"} onValueChange={setFilterProduct}>
                <SelectTrigger id="filter-product" data-testid="select-filter-product">
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  {products.map((product: any) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {((filterStore && filterStore !== "all") || (filterProduct && filterProduct !== "all") || dateFrom || dateTo) && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterStore("all");
                  setFilterProduct("all");
                  setDateFrom("");
                  setDateTo("");
                }}
                data-testid="button-clear-filters"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales Records</CardTitle>
          <CardDescription>
            {filteredAndSortedSales.length} record{filteredAndSortedSales.length !== 1 ? 's' : ''}
            {((filterStore && filterStore !== "all") || (filterProduct && filterProduct !== "all") || dateFrom || dateTo) && ' (filtered)'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {salesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredAndSortedSales.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No sales records found</p>
              <p className="text-sm mt-1">Add your first sales entry to get started</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("date")}
                        data-testid="sort-date"
                        className="hover-elevate"
                      >
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("store")}
                        data-testid="sort-store"
                        className="hover-elevate"
                      >
                        Store
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("product")}
                        data-testid="sort-product"
                        className="hover-elevate"
                      >
                        Product
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort("quantity")}
                        data-testid="sort-quantity"
                        className="hover-elevate"
                      >
                        Quantity
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="w-24">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedSales.map((sale) => (
                    <TableRow key={sale.id} data-testid={`row-sale-${sale.id}`}>
                      <TableCell className="font-medium" data-testid={`cell-date-${sale.id}`}>
                        {format(new Date(sale.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell data-testid={`cell-store-${sale.id}`}>
                        {storeMap.get(sale.storeId) || sale.storeId}
                      </TableCell>
                      <TableCell data-testid={`cell-product-${sale.id}`}>
                        {productMap.get(sale.productId) || sale.productId}
                      </TableCell>
                      <TableCell className="text-right" data-testid={`cell-quantity-${sale.id}`}>
                        {sale.quantity}
                      </TableCell>
                      <TableCell data-testid={`cell-source-${sale.id}`}>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-muted">
                          {sale.source}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
