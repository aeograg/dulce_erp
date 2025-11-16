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
import { Loader2 } from "lucide-react";

interface ProductQuantity {
  productId: string;
  productName: string;
  quantity: number;
}

export default function Deliveries() {
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");
  
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});

  const { data: stores = [], isLoading: storesLoading, error: storesError } = useQuery<any[]>({
    queryKey: ["/api/stores"],
  });

  const { data: products = [], isLoading: productsLoading, error: productsError } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: deliveries = [], isLoading: deliveriesLoading, error: deliveriesError } = useQuery<any[]>({
    queryKey: ["/api/deliveries"],
  });

  const saveMutation = useMutation({
    mutationFn: async (deliveryData: any[]) => {
      const results = [];
      const errors = [];
      
      for (const delivery of deliveryData) {
        try {
          const result = await apiRequest("POST", "/api/deliveries", delivery);
          results.push(result);
        } catch (error: any) {
          errors.push({ product: delivery.productId, error: error.message });
        }
      }
      
      if (errors.length > 0) {
        throw new Error(`${errors.length} delivery entries failed to save`);
      }
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      toast({ title: "Deliveries saved successfully" });
      setProductQuantities({});
      setSelectedStore("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save deliveries",
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

    const deliveryData = Object.entries(productQuantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({
        date: selectedDate,
        storeId: selectedStore,
        productId,
        quantitySent: quantity,
      }));

    if (deliveryData.length === 0) {
      toast({
        title: "Please enter at least one product quantity",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate(deliveryData);
  };

  const handleQuantityChange = (productId: string, value: string) => {
    const quantity = Math.max(0, parseInt(value) || 0);
    setProductQuantities(prev => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  if (storesError || productsError || deliveriesError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Delivery Module</h1>
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

  const recentDeliveries = deliveries.slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Delivery Module</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Record delivery quantities for stores
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>New Delivery Entry</CardTitle>
            <CardDescription>
              Enter quantities for all products delivered to a store
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  data-testid="input-delivery-date"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="store">Store</Label>
                <Select
                  value={selectedStore}
                  onValueChange={setSelectedStore}
                  required
                >
                  <SelectTrigger id="store" data-testid="select-delivery-store">
                    <SelectValue placeholder="Select store" />
                  </SelectTrigger>
                  <SelectContent>
                    {storesLoading ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : (
                      stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Product Quantities</Label>
                <div className="border rounded-md p-4 space-y-3 max-h-96 overflow-y-auto">
                  {productsLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : products.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No products available
                    </p>
                  ) : (
                    products.map((product) => (
                      <div key={product.id} className="flex items-center gap-4">
                        <Label className="flex-1 text-sm" htmlFor={`qty-${product.id}`}>
                          {product.name}
                        </Label>
                        <Input
                          id={`qty-${product.id}`}
                          type="number"
                          min="0"
                          value={productQuantities[product.id] || ""}
                          onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                          placeholder="0"
                          className="w-24"
                          data-testid={`input-quantity-${product.id}`}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={saveMutation.isPending}
                data-testid="button-save-delivery"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Delivery"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Deliveries</CardTitle>
            <CardDescription>Latest delivery records</CardDescription>
          </CardHeader>
          <CardContent>
            {deliveriesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : recentDeliveries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8" data-testid="empty-deliveries">
                No deliveries recorded yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentDeliveries.map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                    data-testid={`delivery-item-${delivery.id}`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium" data-testid={`product-name-${delivery.id}`}>
                        {productMap.get(delivery.productId) || "Unknown Product"}
                      </p>
                      <p className="text-xs text-muted-foreground" data-testid={`store-date-${delivery.id}`}>
                        {storeMap.get(delivery.storeId) || "Unknown Store"} • {delivery.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold" data-testid={`quantity-${delivery.id}`}>
                        {delivery.quantitySent} units
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
