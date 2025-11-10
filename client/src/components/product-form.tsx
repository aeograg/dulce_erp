import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Product {
  id?: string;
  code: string;
  name: string;
  unitCost: number;
  sellingPrice: number;
  minStockLevel: number;
}

interface ProductFormProps {
  product?: Product;
  onSubmit: (product: Product) => void;
  trigger?: React.ReactNode;
}

export function ProductForm({ product, onSubmit, trigger }: ProductFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Product>(
    product || {
      code: "",
      name: "",
      unitCost: 0,
      sellingPrice: 0,
      minStockLevel: 0,
    }
  );

  const handleChange = (field: keyof Product, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setOpen(false);
    if (!product) {
      setFormData({
        code: "",
        name: "",
        unitCost: 0,
        sellingPrice: 0,
        minStockLevel: 0,
      });
    }
  };

  const profitMargin =
    formData.sellingPrice > 0
      ? ((formData.sellingPrice - formData.unitCost) / formData.sellingPrice) * 100
      : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button data-testid="button-add-product">Add Product</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add New Product"}</DialogTitle>
          <DialogDescription>
            {product ? "Update product details" : "Create a new product in your inventory"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Product Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange("code", e.target.value)}
                placeholder="e.g., CROIS-001"
                required
                data-testid="input-product-code"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="e.g., Croissant"
                required
                data-testid="input-product-name"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="unitCost">Unit Cost ($)</Label>
                <Input
                  id="unitCost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitCost}
                  onChange={(e) => handleChange("unitCost", Number(e.target.value))}
                  required
                  data-testid="input-unit-cost"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price ($)</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sellingPrice}
                  onChange={(e) => handleChange("sellingPrice", Number(e.target.value))}
                  required
                  data-testid="input-selling-price"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStockLevel">Min Stock Level</Label>
              <Input
                id="minStockLevel"
                type="number"
                min="0"
                value={formData.minStockLevel}
                onChange={(e) => handleChange("minStockLevel", Number(e.target.value))}
                required
                data-testid="input-min-stock"
              />
            </div>

            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm font-medium">Profit Margin: {profitMargin.toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground mt-1">
                Based on selling price and unit cost
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" data-testid="button-save-product">
              {product ? "Update Product" : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
