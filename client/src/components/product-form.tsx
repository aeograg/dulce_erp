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
  maxWastePercent: number;
  batchYield: number;
}
interface ProductFormProps {
  product?: Product;
  onSubmit: (product: Product) => void;
  trigger?: React.ReactNode;
}
export function ProductForm({ product, onSubmit, trigger }: ProductFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: product?.code || "",
    name: product?.name || "",
    unitCost: product ? String(product.unitCost) : "",
    sellingPrice: product ? String(product.sellingPrice) : "",
    minStockLevel: product ? String(product.minStockLevel) : "",
    maxWastePercent: product ? String(product.maxWastePercent) : "5.0",
    batchYield: product ? String(product.batchYield) : "1",
  });
  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submittedData: Product = {
      ...formData,
      unitCost: formData.unitCost === '' ? 0 : Number(formData.unitCost),
      sellingPrice: formData.sellingPrice === '' ? 0 : Number(formData.sellingPrice),
      minStockLevel: formData.minStockLevel === '' ? 0 : Number(formData.minStockLevel),
      maxWastePercent: formData.maxWastePercent === '' ? 5.0 : Number(formData.maxWastePercent),
      batchYield: formData.batchYield === '' ? 1 : Number(formData.batchYield),
    };
    if (product?.id) {
      submittedData.id = product.id;
    }
    onSubmit(submittedData);
    setOpen(false);
    if (!product) {
      setFormData({
        code: "",
        name: "",
        unitCost: "",
        sellingPrice: "",
        minStockLevel: "",
        maxWastePercent: "5.0",
        batchYield: "1",
      });
    }
  };
  const unitCostNum = formData.unitCost === '' ? 0 : Number(formData.unitCost);
  const sellingPriceNum = formData.sellingPrice === '' ? 0 : Number(formData.sellingPrice);
  const profitMargin =
    sellingPriceNum > 0
      ? ((sellingPriceNum - unitCostNum) / sellingPriceNum) * 100
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
                  onChange={(e) => handleChange("unitCost", e.target.value)}
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
                  onChange={(e) => handleChange("sellingPrice", e.target.value)}
                  required
                  data-testid="input-selling-price"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minStockLevel">Min Stock Level</Label>
                <Input
                  id="minStockLevel"
                  type="number"
                  min="0"
                  value={formData.minStockLevel}
                  onChange={(e) => handleChange("minStockLevel", e.target.value)}
                  required
                  data-testid="input-min-stock"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batchYield">Batch Yield (Units per Batch)</Label>
                <Input
                  id="batchYield"
                  type="number"
                  step="1"
                  min="0.01"
                  value={formData.batchYield}
                  onChange={(e) => handleChange("batchYield", e.target.value)}
                  placeholder="1"
                  required
                  data-testid="input-batch-yield"
                  title="Number of units produced per batch (e.g., 12 croissants per batch)"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-1">
              <div className="space-y-2">
                <Label htmlFor="maxWastePercent">Max Waste % (Acceptable Waste)</Label>
                <Input
                  id="maxWastePercent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.maxWastePercent}
                  onChange={(e) => handleChange("maxWastePercent", e.target.value)}
                  placeholder="5.0"
                  required
                  data-testid="input-max-waste-percent"
                />
              </div>
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