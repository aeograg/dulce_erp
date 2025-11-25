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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface ProductQuantity {
  productId: string;
  productName: string;
  quantity: number;
}

interface PredeterminedItem {
  productId: string;
  productName: string;
  defaultQuantity: number;
}

export default function Deliveries() {
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");
  
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  
  const [predeterminedModalOpen, setPredeterminedModalOpen] = useState(false);
  const [predeterminedDate, setPredeterminedDate] = useState(today);
  const [predeterminedStore, setPredeterminedStore] = useState<string>("");
  const [predeterminedQuantities, setPredeterminedQuantities] = useState<Record<string, number>>({});

  const { data: stores = [], isLoading: storesLoading } = useQuery<any[]>({
    queryKey: ["/api/stores"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery<any[]>({
    queryKey: ["/api/deliveries"],
  });

  const { data: currentInventory = {}, isLoading: inventoryLoading } = useQuery<Record<string, number>>({
    queryKey: ["/api/inventory/current"],
  });

  const { data: predeterminedDeliveries = [] } = useQuery<any[]>({
    queryKey: ["/api/predetermined-deliveries", predeterminedStore],
    enabled: !!predeterminedStore,
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

  const predeterminedMutation = useMutation({
    mutationFn: async (data: { date: string; storeId: string; products: Array<{ productId: string; quantity: number }> }) => {
      return await apiRequest("POST", "/api/deliveries/predetermined", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      toast({ title: "Predetermined deliveries processed successfully" });
      setPredeterminedModalOpen(false);
      setPredeterminedStore("");
      setPredeterminedQuantities({});
      setPredeterminedDate(today);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to process predetermined deliveries",
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

    // Validate against available inventory
    const insufficientStock = deliveryData.filter(item => {
      const available = currentInventory[item.productId] || 0;
      return item.quantitySent > available;
    });

    if (insufficientStock.length > 0) {
      const product = products.find(p => p.id === insufficientStock[0].productId);
      const available = currentInventory[insufficientStock[0].productId] || 0;
      toast({
        title: "Insufficient inventory stock",
        description: `Cannot send ${insufficientStock[0].quantitySent} units of ${product?.name}. Only ${available} available. Produce more first.`,
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate(deliveryData);
  };

  const handlePredeterminedSubmit = () => {
    if (!predeterminedStore) {
      toast({
        title: "Please select a store",
        variant: "destructive",
      });
      return;
    }

    const productsToDeliver = Object.entries(predeterminedQuantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({
        productId,
        quantity: Math.max(0, Math.floor(quantity)),
      }));

    if (productsToDeliver.length === 0) {
      toast({
        title: "Please select at least one product with quantity > 0",
        variant: "destructive",
      });
      return;
    }

    // Validate against available inventory
    const insufficientStock = productsToDeliver.filter(item => {
      const available = currentInventory[item.productId] || 0;
      return item.quantity > available;
    });

    if (insufficientStock.length > 0) {
      const product = products.find(p => p.id === insufficientStock[0].productId);
      const available = currentInventory[insufficientStock[0].productId] || 0;
      toast({
        title: "Insufficient inventory stock",
        description: `Cannot send ${insufficientStock[0].quantity} units of ${product?.name}. Only ${available} available.`,
        variant: "destructive",
      });
      return;
    }

    predeterminedMutation.mutate({
      date: predeterminedDate,
      storeId: predeterminedStore,
      products: productsToDeliver,
    });
  };

  const handleQuantityChange = (productId: string, value: string) => {
    const quantity = Math.max(0, parseInt(value) || 0);
    setProductQuantities(prev => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  const handlePredeterminedQuantityChange = (productId: string, value: string) => {
    const quantity = Math.max(0, parseInt(value) || 0);
    setPredeterminedQuantities(prev => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  const handlePredeterminedModalOpen = (open: boolean) => {
    setPredeterminedModalOpen(open);
    if (open) {
      // Initialize quantities with default values when modal opens
      const initialQuantities: Record<string, number> = {};
      predeterminedDeliveries.forEach((item: any) => {
        initialQuantities[item.productId] = item.defaultQuantity;
      });
      setPredeterminedQuantities(initialQuantities);
    }
  };

  if (!storesLoading && !productsLoading) {
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
                    {productsLoading || inventoryLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : products.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No products available
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 pb-2 border-b font-medium text-sm">
                          <div>Product</div>
                          <div className="text-center">Available Stock</div>
                          <div className="text-center">Quantity to Send</div>
                        </div>
                        {products.map((product) => {
                          const availableStock = currentInventory[product.id] || 0;
                          const requestedQty = productQuantities[product.id] || 0;
                          const exceedsStock = requestedQty > availableStock;
                          
                          return (
                            <div key={product.id} className="grid grid-cols-[2fr_1fr_1fr] gap-4 items-center">
                              <Label className="text-sm" htmlFor={`qty-${product.id}`}>
                                {product.name}
                              </Label>
                              <div className={`text-center font-semibold ${availableStock === 0 ? 'text-destructive' : 'text-foreground'}`} data-testid={`available-stock-${product.id}`}>
                                {availableStock}
                              </div>
                              <Input
                                id={`qty-${product.id}`}
                                type="number"
                                min="0"
                                max={availableStock}
                                value={productQuantities[product.id] || ""}
                                onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                placeholder="0"
                                className={`w-full ${exceedsStock ? 'border-destructive' : ''}`}
                                data-testid={`input-quantity-${product.id}`}
                              />
                            </div>
                          );
                        })}
                      </div>
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

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Predetermined Deliveries</CardTitle>
                <CardDescription>
                  Process recurring delivery schedules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={predeterminedModalOpen} onOpenChange={handlePredeterminedModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" data-testid="button-predetermined-delivery">
                      Create Predetermined Delivery
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Predetermined Delivery</DialogTitle>
                      <DialogDescription>
                        Set up a recurring delivery with pre-filled quantities
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="pred-date">Date</Label>
                          <Input
                            id="pred-date"
                            type="date"
                            value={predeterminedDate}
                            onChange={(e) => setPredeterminedDate(e.target.value)}
                            data-testid="input-predetermined-date"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="pred-store">Store</Label>
                          <Select
                            value={predeterminedStore}
                            onValueChange={(val) => {
                              setPredeterminedStore(val);
                              // Initialize quantities when store changes
                              const initialQuantities: Record<string, number> = {};
                              predeterminedDeliveries.forEach((item: any) => {
                                initialQuantities[item.productId] = item.defaultQuantity;
                              });
                              setPredeterminedQuantities(initialQuantities);
                            }}
                          >
                            <SelectTrigger id="pred-store" data-testid="select-predetermined-store">
                              <SelectValue placeholder="Select store" />
                            </SelectTrigger>
                            <SelectContent>
                              {stores.map((store) => (
                                <SelectItem key={store.id} value={store.id}>
                                  {store.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {predeterminedStore && (
                        <div className="space-y-2">
                          <Label>Product Quantities</Label>
                          {predeterminedDeliveries.length === 0 ? (
                            <p className="text-sm text-muted-foreground p-3 border rounded-md text-center">
                              No predetermined deliveries set for this store
                            </p>
                          ) : (
                            <div className="border rounded-md p-4 space-y-3 max-h-96 overflow-y-auto">
                              <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 pb-2 border-b font-medium text-sm">
                                <div>Product</div>
                                <div className="text-center">Default</div>
                                <div className="text-center">Available</div>
                                <div className="text-center">Quantity</div>
                              </div>
                              {predeterminedDeliveries.map((item: any) => {
                                const availableStock = currentInventory[item.productId] || 0;
                                const requestedQty = predeterminedQuantities[item.productId] || 0;
                                const exceedsStock = requestedQty > availableStock;
                                
                                return (
                                  <div key={item.productId} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 items-center">
                                    <Label className="text-sm">{item.productName}</Label>
                                    <div className="text-center text-sm font-medium">{item.defaultQuantity}</div>
                                    <div className={`text-center text-sm font-semibold ${availableStock === 0 ? 'text-destructive' : 'text-foreground'}`}>
                                      {availableStock}
                                    </div>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={predeterminedQuantities[item.productId] || ""}
                                      onChange={(e) => handlePredeterminedQuantityChange(item.productId, e.target.value)}
                                      placeholder="0"
                                      className={`w-full ${exceedsStock ? 'border-destructive' : ''}`}
                                      data-testid={`input-predetermined-quantity-${item.productId}`}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      <Button
                        onClick={handlePredeterminedSubmit}
                        className="w-full"
                        disabled={predeterminedMutation.isPending || predeterminedDeliveries.length === 0}
                        data-testid="button-submit-predetermined"
                      >
                        {predeterminedMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          "Process Delivery"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
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
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
}
