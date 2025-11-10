import { DataTable } from "@/components/data-table";
import { ProductForm } from "@/components/product-form";
import { Button } from "@/components/ui/button";
import { Edit, Trash, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Products() {
  const products = [
    { id: "P001", name: "Croissant", unitCost: 1.50, sellingPrice: 3.50, stock: 5, minStock: 10, minStockLevel: 10, laborCost: 0.50, overheadCost: 0.30 },
    { id: "P002", name: "Danish Pastry", unitCost: 1.80, sellingPrice: 4.00, stock: 8, minStock: 8, minStockLevel: 8, laborCost: 0.60, overheadCost: 0.35 },
    { id: "P003", name: "Sourdough Bread", unitCost: 2.50, sellingPrice: 6.00, stock: 20, minStock: 15, minStockLevel: 15, laborCost: 1.00, overheadCost: 0.50 },
    { id: "P004", name: "Baguette", unitCost: 1.20, sellingPrice: 2.50, stock: 25, minStock: 20, minStockLevel: 20, laborCost: 0.40, overheadCost: 0.25 },
    { id: "P005", name: "Muffin", unitCost: 0.80, sellingPrice: 2.00, stock: 30, minStock: 25, minStockLevel: 25, laborCost: 0.30, overheadCost: 0.20 },
  ];

  const columns = [
    { key: "id", label: "ID", sortable: true },
    { key: "name", label: "Product Name", sortable: true },
    {
      key: "unitCost",
      label: "Unit Cost",
      sortable: true,
      render: (item: any) => `$${item.unitCost.toFixed(2)}`,
    },
    {
      key: "sellingPrice",
      label: "Selling Price",
      sortable: true,
      render: (item: any) => `$${item.sellingPrice.toFixed(2)}`,
    },
    {
      key: "stock",
      label: "Current Stock",
      sortable: true,
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <span>{item.stock}</span>
          {item.stock < item.minStock && (
            <Badge variant="destructive" className="text-xs">Low</Badge>
          )}
        </div>
      ),
    },
    {
      key: "margin",
      label: "Profit Margin",
      sortable: false,
      render: (item: any) => {
        const margin = ((item.sellingPrice - item.unitCost) / item.sellingPrice) * 100;
        return `${margin.toFixed(1)}%`;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your bakery product inventory
          </p>
        </div>
        <ProductForm
          onSubmit={(product) => {
            console.log("Product added:", product);
          }}
        />
      </div>

      <DataTable
        data={products}
        columns={columns}
        searchPlaceholder="Search products..."
        onSearch={(query) => console.log("Search:", query)}
        actions={(item) => (
          <div className="flex gap-2">
            <ProductForm
              product={item}
              onSubmit={(product) => console.log("Product updated:", product)}
              trigger={
                <Button size="sm" variant="ghost" data-testid={`button-edit-${item.id}`}>
                  <Edit className="w-4 h-4" />
                </Button>
              }
            />
            <Button size="sm" variant="ghost" data-testid={`button-delete-${item.id}`}>
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        )}
      />
    </div>
  );
}
