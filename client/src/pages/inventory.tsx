import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Package, CheckCircle, ArrowUpDown, ArrowUp, ArrowDown, Store, Factory } from "lucide-react";
import { useAuth } from "@/lib/auth";

type SortField = "name" | "stock";
type SortDirection = "asc" | "desc";

// Helper function to format numbers and remove trailing zeros
const formatQuantity = (value: any): string => {
  if (value === null || value === undefined) return "0";
  const num = parseFloat(value);
  if (isNaN(num)) return "0";
  return num % 1 === 0 ? num.toString() : num.toFixed(3).replace(/\.?0+$/, "");
};

export default function Inventory() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantityProduced, setQuantityProduced] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");

  const isAdminOrManager = user?.role === "Admin" || user?.role === "Manager";

  const { data: stores = [], isLoading: storesLoading } = useQuery<any[]>({
    queryKey: ["/api/stores"],
  });

  const { data: productionStoreData } = useQuery<{ storeId: string }>({
    queryKey: ["/api/inventory/production-store"],
    enabled: isAdminOrManager,
  });

  const productionStoreId = productionStoreData?.storeId;

  useEffect(() => {
    if (productionStoreId && !selectedStoreId) {
      setSelectedStoreId(productionStoreId);
    }
  }, [productionStoreId, selectedStoreId]);

  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: currentInventory = {}, isLoading: inventoryLoading } = useQuery<Record<string, number>>({
    queryKey: ["/api/inventory/current", selectedStoreId],
    queryFn: async () => {
      const url = selectedStoreId 
        ? `/api/inventory/current?storeId=${selectedStoreId}`
        : "/api/inventory/current";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch inventory");
      return response.json();
    },
  });

  const { data: inventory = [], isLoading: inventoryHistoryLoading } = useQuery<any[]>({
    queryKey: ["/api/inventory", selectedStoreId],
    queryFn: async () => {
      const url = selectedStoreId 
        ? `/api/inventory?storeId=${selectedStoreId}`
        : "/api/inventory";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch inventory");
      return response.json();
    },
  });

  const recordProductionMutation = useMutation({
    mutationFn: async (productionData: any) => {
      return await apiRequest("POST", "/api/inventory/production", productionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/current"] });
      toast({ title: "Production recorded successfully" });
      setSelectedProduct("");
      setQuantityProduced(0);
      setNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to record production",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      toast({
        title: "Please select a product",
        variant: "destructive",
      });
      return;
    }
    if (!quantityProduced || quantityProduced <= 0) {
      toast({
        title: "Please enter a positive quantity",
        description: "Production quantity must be greater than zero",
        variant: "destructive",
      });
      return;
    }
    recordProductionMutation.mutate({
      date: selectedDate,
      productId: selectedProduct,
      quantityProduced: quantityProduced,
      notes: notes || undefined,
    });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 inline opacity-30" />;
    }
    return sortDirection === "asc" ?
      <ArrowUp className="w-4 h-4 ml-1 inline" /> :
      <ArrowDown className="w-4 h-4 ml-1 inline" />;
  };

  const productMap = new Map(products.map((p: any) => [p.id, p.name]));
  const storeMap = new Map(stores.map((s: any) => [s.id, s.name]));

  const recentProduction = inventory
    .filter((entry: any) => entry.quantityProduced > 0)
    .slice(0, 10);

  const latestInventoryDates = new Map<string, string>();
  inventory.forEach((entry: any) => {
    const currentDate = latestInventoryDates.get(entry.productId);
    if (!currentDate || entry.date > currentDate) {
      latestInventoryDates.set(entry.productId, entry.date);
    }
  });

  const inventoryList = products.map((product: any) => ({
    id: product.id,
    name: product.name,
    stock: currentInventory[product.id] || 0,
    lastUpdated: latestInventoryDates.get(product.id) || "N/A",
  }));

  const filteredInventory = inventoryList.filter(item => item.stock > 0);

  const sortedInventory = [...filteredInventory].sort((a, b) => {
    let comparison = 0;

    if (sortField === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === "stock") {
      comparison = a.stock - b.stock;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const isLoading = productsLoading || inventoryLoading;
  const selectedStoreName = selectedStoreId ? storeMap.get(selectedStoreId) : "All Stores";
  const isProductionCenter = selectedStoreId === productionStoreId;

  const totalInventoryValue = sortedInventory.reduce((sum, item) => {
    const product = products.find((p: any) => p.id === item.id);
    return sum + (item.stock * (product?.unitCost || 0));
  }, 0);

  const totalItems = sortedInventory.reduce((sum, item) => sum + item.stock, 0);

  return (
    <div className="space-y-4 md:space-y-6 p-2 md:p-6">
      <div className="flex flex-col gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-foreground" data-testid="text-page-title">Inventory Management</h1>
          <p className="text-xs md:text-base text-muted-foreground mt-1 md:mt-2">
            {isProductionCenter ? "Manage production center inventory and production" : `View ${selectedStoreName} inventory`}
          </p>
        </div>
        
        {isAdminOrManager && (
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
            <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
              <SelectTrigger className="w-full md:w-[200px]" data-testid="select-store-filter">
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                {storesLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  stores.map((store: any) => (
                    <SelectItem key={store.id} value={store.id} data-testid={`option-store-${store.id}`}>
                      {store.id === productionStoreId && <Factory className="w-4 h-4 inline mr-1" />}
                      {store.name}
                      {store.id === productionStoreId && " (Production)"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-items">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products with Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-products-count">{sortedInventory.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-value">${totalInventoryValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {isProductionCenter && isAdminOrManager && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Record Production
              </CardTitle>
              <CardDescription>Enter the quantity of products manufactured</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Production Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    data-testid="input-production-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger id="product" data-testid="select-product">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {productsLoading ? (
                        <SelectItem value="loading" disabled>Loading products...</SelectItem>
                      ) : (
                        products.map((product: any) => (
                          <SelectItem key={product.id} value={product.id} data-testid={`option-product-${product.id}`}>
                            {product.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity Produced</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantityProduced || ""}
                    onChange={(e) => setQuantityProduced(parseInt(e.target.value) || 0)}
                    placeholder="Enter quantity (must be > 0)"
                    data-testid="input-quantity-produced"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any production notes..."
                    rows={3}
                    data-testid="input-notes"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={recordProductionMutation.isPending}
                  data-testid="button-submit-production"
                >
                  {recordProductionMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Record Production
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Recent Production</CardTitle>
              <CardDescription>Last 10 production entries</CardDescription>
            </CardHeader>
            <CardContent>
              {inventoryHistoryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : recentProduction.length === 0 ? (
                <p className="text-muted-foreground text-center py-8" data-testid="text-no-production">
                  No production recorded yet
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {recentProduction.map((entry: any) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-3 bg-card border rounded-md"
                      data-testid={`production-entry-${entry.id}`}
                    >
                      <div>
                        <p className="font-medium text-foreground" data-testid={`product-${entry.id}`}>
                          {productMap.get(entry.productId) || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`date-${entry.id}`}>
                          {entry.date}
                        </p>
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground italic mt-1">{entry.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground" data-testid={`quantity-${entry.id}`}>
                          +{formatQuantity(entry.quantityProduced)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Stock: {formatQuantity(entry.quantityInStock)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isProductionCenter ? <Factory className="w-5 h-5" /> : <Store className="w-5 h-5" />}
            {isProductionCenter ? "Production Center Inventory" : `${selectedStoreName} Inventory`}
          </CardTitle>
          <CardDescription>
            {isProductionCenter ? "Current stock levels at production center" : `Current stock levels at ${selectedStoreName}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : inventoryList.length === 0 ? (
            <p className="text-muted-foreground text-center py-8" data-testid="text-no-inventory">
              No products in system
            </p>
          ) : sortedInventory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8" data-testid="text-no-inventory">
              No products with current stock at this location
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th
                      className="text-left py-3 px-4 font-medium text-foreground cursor-pointer hover-elevate"
                      onClick={() => toggleSort("name")}
                      data-testid="header-product-name"
                    >
                      Product Name
                      {getSortIcon("name")}
                    </th>
                    <th
                      className="text-right py-3 px-4 font-medium text-foreground cursor-pointer hover-elevate"
                      onClick={() => toggleSort("stock")}
                      data-testid="header-quantity"
                    >
                      Quantity in Stock
                      {getSortIcon("stock")}
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-foreground">
                      Last Updated
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedInventory.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b hover-elevate"
                      data-testid={`inventory-row-${item.id}`}
                    >
                      <td className="py-3 px-4 font-medium text-foreground" data-testid={`product-${item.id}`}>
                        {item.name}
                      </td>
                      <td className="text-right py-3 px-4 text-lg font-semibold" data-testid={`stock-${item.id}`}>
                        {formatQuantity(item.stock)}
                      </td>
                      <td className="text-right py-3 px-4 text-muted-foreground" data-testid={`date-${item.id}`}>
                        {item.lastUpdated}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
