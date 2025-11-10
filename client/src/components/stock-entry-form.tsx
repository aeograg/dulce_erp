import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface StockEntry {
  productId: string;
  storeId: string;
  date: string;
  delivered: number;
  currentStock: number;
  waste: number;
  sales: number;
}

interface StockEntryFormProps {
  stores: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string }>;
  onSubmit: (entry: StockEntry) => void;
}

export function StockEntryForm({ stores, products, onSubmit }: StockEntryFormProps) {
  const [formData, setFormData] = useState<Partial<StockEntry>>({
    date: new Date().toISOString().split("T")[0],
    delivered: 0,
    currentStock: 0,
    waste: 0,
    sales: 0,
  });
  const [discrepancy, setDiscrepancy] = useState<number | null>(null);

  const handleChange = (field: keyof StockEntry, value: any) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    if (field === "delivered" || field === "currentStock" || field === "waste" || field === "sales") {
      const expected = (formData.currentStock || 0) + (newData.delivered || 0) - (newData.waste || 0) - (newData.sales || 0);
      const reported = newData.currentStock || 0;
      const disc = ((reported - expected) / (newData.delivered || 1)) * 100;
      setDiscrepancy(Math.abs(disc));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.productId && formData.storeId) {
      onSubmit(formData as StockEntry);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        delivered: 0,
        currentStock: 0,
        waste: 0,
        sales: 0,
      });
      setDiscrepancy(null);
    }
  };

  const wastePercent = formData.delivered ? ((formData.waste || 0) / formData.delivered) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Stock Entry</CardTitle>
        <CardDescription>Record daily stock levels for your stores</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                required
                data-testid="input-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store">Store</Label>
              <Select
                value={formData.storeId}
                onValueChange={(value) => handleChange("storeId", value)}
                required
              >
                <SelectTrigger id="store" data-testid="select-store">
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

          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <Select
              value={formData.productId}
              onValueChange={(value) => handleChange("productId", value)}
              required
            >
              <SelectTrigger id="product" data-testid="select-product">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="delivered">Delivered Quantity</Label>
              <Input
                id="delivered"
                type="number"
                min="0"
                value={formData.delivered}
                onChange={(e) => handleChange("delivered", Number(e.target.value))}
                required
                data-testid="input-delivered"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentStock">Current Stock</Label>
              <Input
                id="currentStock"
                type="number"
                min="0"
                value={formData.currentStock}
                onChange={(e) => handleChange("currentStock", Number(e.target.value))}
                required
                data-testid="input-current-stock"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="waste">Waste Quantity</Label>
              <Input
                id="waste"
                type="number"
                min="0"
                value={formData.waste}
                onChange={(e) => handleChange("waste", Number(e.target.value))}
                required
                data-testid="input-waste"
              />
              {wastePercent > 3 && (
                <p className="text-xs text-destructive">Warning: Waste exceeds 3% limit ({wastePercent.toFixed(1)}%)</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sales">Sales Quantity</Label>
              <Input
                id="sales"
                type="number"
                min="0"
                value={formData.sales}
                onChange={(e) => handleChange("sales", Number(e.target.value))}
                required
                data-testid="input-sales"
              />
            </div>
          </div>

          {discrepancy !== null && discrepancy > 5 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                High discrepancy detected: {discrepancy.toFixed(1)}% (threshold: 5%)
              </AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" data-testid="button-submit-stock">
            Submit Stock Entry
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
