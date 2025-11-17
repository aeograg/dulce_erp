import { useState } from "react";
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
import { format } from "date-fns";
import { Loader2, Save } from "lucide-react";

export default function SalesDataEntry() {
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");
  
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [salesQuantities, setSalesQuantities] = useState<Record<string, number>>({});

  const { data: stores = [], isLoading: storesLoading, error: storesError } = useQuery<any[]>({
    queryKey: ["/api/stores"],
  });

  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery<any[]>({
    queryKey: ["/api/products"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/discrepancies"] });
      toast({ title: "Sales data saved successfully" });
      setSalesQuantities({});
      setSelectedStore("");
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

  if (storesError || productsError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Sales Data Entry</h1>
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-destructive">
              <p>Failed to load data. Please try refreshing the page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const storeMap = new Map(stores.map(s => [s.id, s.name]));
  const productMap = new Map(products.map(p => [p.id, p.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sales Data Entry</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter daily sales quantities for each product (will be integrated with Square POS)
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Record Sales</CardTitle>
              <CardDescription>Enter sales quantities for products</CardDescription>
            </CardHeader>
            <CardContent>
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
                        <div className="grid gap-3">
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
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">Daily Sales Entry</p>
                <p>Enter the number of units sold for each product today.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Enter Any Product</p>
                <p>Sales data is stored separately and linked to inventory calculations automatically.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Future Integration</p>
                <p>This will eventually sync automatically with Square POS system.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
