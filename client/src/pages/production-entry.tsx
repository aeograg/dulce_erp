import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Package, CheckCircle } from "lucide-react";

export default function ProductionEntry() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [quantityProduced, setQuantityProduced] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: inventory = [], isLoading: inventoryLoading } = useQuery<any[]>({
    queryKey: ["/api/inventory"],
  });

  const recordProductionMutation = useMutation({
    mutationFn: async (productionData: any) => {
      return await apiRequest("POST", "/api/inventory/production", productionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
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

    if (quantityProduced <= 0) {
      toast({
        title: "Please enter a valid quantity",
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

  const productMap = new Map(products.map((p: any) => [p.id, p.name]));

  const recentProduction = inventory
    .filter((entry: any) => entry.quantityProduced > 0)
    .slice(0, 10);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground" data-testid="text-page-title">Production Entry</h1>
        <p className="text-muted-foreground mt-2">Record daily or weekly production from the production center</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Record Production
            </CardTitle>
            <CardDescription>Enter the quantity of products manufactured today</CardDescription>
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
                  min="0"
                  value={quantityProduced}
                  onChange={(e) => setQuantityProduced(parseInt(e.target.value) || 0)}
                  placeholder="Enter quantity"
                  data-testid="input-quantity-produced"
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
            {inventoryLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : recentProduction.length === 0 ? (
              <p className="text-muted-foreground text-center py-8" data-testid="text-no-production">
                No production recorded yet
              </p>
            ) : (
              <div className="space-y-3">
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
                        +{entry.quantityProduced}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Stock: {entry.quantityInStock}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="font-medium text-foreground mb-1">Production Center</p>
              <p>Record finished products ready for delivery or sale</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Inventory Updates</p>
              <p>Production is automatically added to inventory stock levels</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Track History</p>
              <p>View production history in the Inventory Dashboard</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
