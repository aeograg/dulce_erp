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

interface TemplateGroup {
  templateId: string;
  name: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    defaultQuantity: number;
  }>;
}

export default function Deliveries() {
  const { toast } = useToast();
  const today = format(new Date(), "yyyy-MM-dd");
  
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({});
  
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateStore, setTemplateStore] = useState<string>("");
  const [templateName, setTemplateName] = useState("");
  const [templateQuantities, setTemplateQuantities] = useState<Record<string, number>>({});
  
  const [viewTemplatesStore, setViewTemplatesStore] = useState<string>("");
  const [executeModalOpen, setExecuteModalOpen] = useState(false);
  const [executeTemplateId, setExecuteTemplateId] = useState<string>("");
  const [executeDate, setExecuteDate] = useState(today);
  const [executeQuantities, setExecuteQuantities] = useState<Record<string, number>>({});

  const { data: stores = [], isLoading: storesLoading } = useQuery<any[]>({
    queryKey: ["/api/stores"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery<any[]>({
    queryKey: ["/api/deliveries"],
  });

  // Get production center store ID (Delahey)
  const { data: productionStoreData } = useQuery<{ storeId: string }>({
    queryKey: ["/api/inventory/production-store"],
  });

  const productionStoreId = productionStoreData?.storeId;

  // Fetch inventory specifically from production center (Delahey)
  const { data: currentInventory = {}, isLoading: inventoryLoading } = useQuery<Record<string, number>>({
    queryKey: ["/api/inventory/current", { storeId: productionStoreId }],
    queryFn: async () => {
      if (!productionStoreId) return {};
      const response = await fetch(`/api/inventory/current?storeId=${productionStoreId}`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      return response.json();
    },
    enabled: !!productionStoreId,
  });

  const { data: allTemplates = [] } = useQuery<any[]>({
    queryKey: [viewTemplatesStore ? `/api/predetermined-deliveries?storeId=${viewTemplatesStore}` : "/api/predetermined-deliveries"],
    enabled: !!viewTemplatesStore,
  });

  // Group templates by templateId and name
  const templateGroups: TemplateGroup[] = Array.from(
    allTemplates.reduce((map, template) => {
      const key = template.templateId;
      if (!map.has(key)) {
        map.set(key, {
          templateId: template.templateId,
          name: template.name,
          items: [],
        });
      }
      map.get(key)!.items.push(template);
      return map;
    }, new Map<string, TemplateGroup>()).values()
  );

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
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === "/api/inventory/current" || 
        query.queryKey[0] === "/api/inventory"
      });
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

  const saveTemplateMutation = useMutation({
    mutationFn: async (data: { templateName: string; storeId: string; products: Array<{ productId: string; defaultQuantity: number }> }) => {
      return await apiRequest("POST", "/api/predetermined-deliveries", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [viewTemplatesStore ? `/api/predetermined-deliveries?storeId=${viewTemplatesStore}` : "/api/predetermined-deliveries"] });
      toast({ title: "Template saved successfully" });
      setTemplateModalOpen(false);
      setTemplateName("");
      setTemplateQuantities({});
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save template",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const executeDeliveryMutation = useMutation({
    mutationFn: async (data: { date: string; storeId: string; products: Array<{ productId: string; quantity: number }> }) => {
      return await apiRequest("POST", "/api/deliveries/predetermined", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === "/api/inventory/current" || 
        query.queryKey[0] === "/api/inventory"
      });
      toast({ title: "Delivery executed successfully" });
      setExecuteModalOpen(false);
      setExecuteTemplateId("");
      setExecuteDate(today);
      setExecuteQuantities({});
    },
    onError: (error: any) => {
      toast({
        title: "Failed to execute delivery",
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

  const handleSaveTemplate = () => {
    if (!templateStore) {
      toast({
        title: "Please select a store",
        variant: "destructive",
      });
      return;
    }

    if (!templateName.trim()) {
      toast({
        title: "Please enter a template name",
        variant: "destructive",
      });
      return;
    }

    const productsToSave = Object.entries(templateQuantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({
        productId,
        defaultQuantity: Math.max(0, Math.floor(quantity)),
      }));

    if (productsToSave.length === 0) {
      toast({
        title: "Please select at least one product with quantity > 0",
        variant: "destructive",
      });
      return;
    }

    saveTemplateMutation.mutate({
      templateName: templateName.trim(),
      storeId: templateStore,
      products: productsToSave,
    });
  };

  const handleExecuteTemplate = (templateGroup: TemplateGroup) => {
    // Initialize quantities with template defaults
    const initialQuantities: Record<string, number> = {};
    templateGroup.items.forEach((item: any) => {
      initialQuantities[item.productId] = item.defaultQuantity;
    });
    setExecuteQuantities(initialQuantities);
    setExecuteTemplateId(templateGroup.templateId);
    setExecuteDate(today);
    setExecuteModalOpen(true);
  };

  const handleExecuteDelivery = () => {
    if (!viewTemplatesStore) return;

    const productsToDeliver = Object.entries(executeQuantities)
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

    executeDeliveryMutation.mutate({
      date: executeDate,
      storeId: viewTemplatesStore,
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

  const handleTemplateQuantityChange = (productId: string, value: string) => {
    const quantity = Math.max(0, parseInt(value) || 0);
    setTemplateQuantities(prev => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  const handleExecuteQuantityChange = (productId: string, value: string) => {
    const quantity = Math.max(0, parseInt(value) || 0);
    setExecuteQuantities(prev => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  const handleTemplateModalOpen = (open: boolean) => {
    setTemplateModalOpen(open);
    if (open) {
      setTemplateName("");
      setTemplateQuantities({});
    }
  };

  if (!storesLoading && !productsLoading) {
    const storeMap = new Map(stores.map(s => [s.id, s.name]));
    const productMap = new Map(products.map(p => [p.id, p.name]));
    const recentDeliveries = deliveries.slice(0, 10);

    return (
      <div className="space-y-4 md:space-y-6 px-2 md:px-0">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Delivery Module</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Record delivery quantities for stores
          </p>
        </div>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
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
                  <Label className="text-sm md:text-base">Product Quantities</Label>
                  <p className="text-xs text-muted-foreground">Stock from Delahey production center</p>
                  <div className="border rounded-md p-2 md:p-4 space-y-2 md:space-y-3 max-h-80 md:max-h-96 overflow-y-auto">
                    {productsLoading || inventoryLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : products.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No products available
                      </p>
                    ) : (
                      <div className="space-y-2 md:space-y-3">
                        <div className="grid grid-cols-[1.5fr_1fr_1fr] md:grid-cols-[2fr_1fr_1fr] gap-2 md:gap-4 pb-2 border-b font-medium text-xs md:text-sm">
                          <div>Product</div>
                          <div className="text-center">Stock</div>
                          <div className="text-center">Send</div>
                        </div>
                        {products.map((product) => {
                          const availableStock = currentInventory[product.id] || 0;
                          const requestedQty = productQuantities[product.id] || 0;
                          const exceedsStock = requestedQty > availableStock;
                          
                          return (
                            <div key={product.id} className="grid grid-cols-[1.5fr_1fr_1fr] md:grid-cols-[2fr_1fr_1fr] gap-2 md:gap-4 items-center">
                              <Label className="text-xs md:text-sm truncate" htmlFor={`qty-${product.id}`} title={product.name}>
                                {product.name}
                              </Label>
                              <div className={`text-center text-sm md:text-base font-semibold ${availableStock === 0 ? 'text-destructive' : 'text-foreground'}`} data-testid={`available-stock-${product.id}`}>
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
                                className={`w-full text-sm ${exceedsStock ? 'border-destructive' : ''}`}
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

          <div className="flex flex-col gap-4 md:gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Templates</CardTitle>
                <CardDescription>
                  View and execute saved delivery templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="view-store">Select Store</Label>
                    <Select
                      value={viewTemplatesStore}
                      onValueChange={setViewTemplatesStore}
                    >
                      <SelectTrigger id="view-store" data-testid="select-view-templates-store">
                        <SelectValue placeholder="Select store to view templates" />
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

                  {viewTemplatesStore && (
                    <div className="space-y-2">
                      <Label>Templates</Label>
                      {templateGroups.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-3 border rounded-md text-center">
                          No templates saved for this store
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {templateGroups.map((templateGroup) => (
                            <div
                              key={templateGroup.templateId}
                              className="flex items-center justify-between p-3 border rounded-md hover-elevate cursor-pointer"
                              data-testid={`template-${templateGroup.templateId}`}
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium" data-testid={`template-name-${templateGroup.templateId}`}>
                                  {templateGroup.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {templateGroup.items.length} product{templateGroup.items.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleExecuteTemplate(templateGroup)}
                                data-testid={`button-execute-${templateGroup.templateId}`}
                              >
                                Execute
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <Dialog open={executeModalOpen} onOpenChange={setExecuteModalOpen}>
                    <DialogContent className="max-w-[95vw] md:max-w-xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-lg md:text-xl">Execute Delivery Template</DialogTitle>
                        <DialogDescription>
                          Review and edit quantities before executing
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="exec-date">Delivery Date</Label>
                          <Input
                            id="exec-date"
                            type="date"
                            value={executeDate}
                            onChange={(e) => setExecuteDate(e.target.value)}
                            data-testid="input-execute-date"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm md:text-base">Product Quantities</Label>
                          <div className="border rounded-md p-2 md:p-4 space-y-2 md:space-y-3 max-h-52 md:max-h-64 overflow-y-auto">
                            <div className="grid grid-cols-[1.5fr_1fr_1fr] md:grid-cols-[2fr_1fr_1fr] gap-2 md:gap-4 pb-2 border-b font-medium text-xs md:text-sm">
                              <div>Product</div>
                              <div className="text-center">Stock</div>
                              <div className="text-center">Qty</div>
                            </div>
                            {Object.entries(executeQuantities).map(([productId, quantity]) => {
                              const product = products.find(p => p.id === productId);
                              const availableStock = currentInventory[productId] || 0;
                              const exceedsStock = quantity > availableStock;
                              
                              return (
                                <div key={productId} className="grid grid-cols-[1.5fr_1fr_1fr] md:grid-cols-[2fr_1fr_1fr] gap-2 md:gap-4 items-center">
                                  <Label className="text-xs md:text-sm truncate" title={product?.name || "Unknown"}>{product?.name || "Unknown"}</Label>
                                  <div className={`text-center text-sm font-semibold ${availableStock === 0 ? 'text-destructive' : 'text-foreground'}`}>
                                    {availableStock}
                                  </div>
                                  <Input
                                    type="number"
                                    min="0"
                                    value={quantity}
                                    onChange={(e) => handleExecuteQuantityChange(productId, e.target.value)}
                                    placeholder="0"
                                    className={`w-full text-sm ${exceedsStock ? 'border-destructive' : ''}`}
                                    data-testid={`input-execute-quantity-${productId}`}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <Button
                          onClick={handleExecuteDelivery}
                          className="w-full"
                          disabled={executeDeliveryMutation.isPending}
                          data-testid="button-execute-delivery"
                        >
                          {executeDeliveryMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Executing...
                            </>
                          ) : (
                            "Execute Delivery"
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Create New Template</CardTitle>
                <CardDescription>
                  Save product quantities as a named template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={templateModalOpen} onOpenChange={handleTemplateModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" data-testid="button-create-template">
                      + Create Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create Delivery Template</DialogTitle>
                      <DialogDescription>
                        Give this template a name and set default quantities
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="template-name">Template Name</Label>
                        <Input
                          id="template-name"
                          placeholder="e.g., Monday Delivery"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          data-testid="input-template-name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="create-store">Store</Label>
                        <Select
                          value={templateStore}
                          onValueChange={setTemplateStore}
                        >
                          <SelectTrigger id="create-store" data-testid="select-create-template-store">
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

                      {templateStore && (
                        <div className="space-y-2">
                          <Label className="text-sm md:text-base">Product Quantities</Label>
                          <p className="text-xs text-muted-foreground">
                            Set default quantities for products in this template
                          </p>
                          <div className="border rounded-md p-2 md:p-4 space-y-2 md:space-y-3 max-h-64 md:max-h-96 overflow-y-auto">
                            <div className="grid grid-cols-[1.5fr_1fr] md:grid-cols-[2fr_1fr] gap-2 md:gap-4 pb-2 border-b font-medium text-xs md:text-sm">
                              <div>Product</div>
                              <div className="text-center">Qty</div>
                            </div>
                            {productsLoading ? (
                              <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin" />
                              </div>
                            ) : products.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No products available
                              </p>
                            ) : (
                              <>
                                {products.map((product) => (
                                  <div key={product.id} className="grid grid-cols-[1.5fr_1fr] md:grid-cols-[2fr_1fr] gap-2 md:gap-4 items-center">
                                    <Label className="text-xs md:text-sm truncate" htmlFor={`tpl-qty-${product.id}`} title={product.name}>
                                      {product.name}
                                    </Label>
                                    <Input
                                      id={`tpl-qty-${product.id}`}
                                      type="number"
                                      min="0"
                                      value={templateQuantities[product.id] || ""}
                                      onChange={(e) => handleTemplateQuantityChange(product.id, e.target.value)}
                                      placeholder="0"
                                      className="text-sm"
                                      data-testid={`input-template-quantity-${product.id}`}
                                    />
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handleSaveTemplate}
                        className="w-full"
                        disabled={saveTemplateMutation.isPending || !templateStore || !templateName.trim()}
                        data-testid="button-save-template"
                      >
                        {saveTemplateMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save Template"
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
