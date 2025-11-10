import { DataTable } from "../data-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";

export default function DataTableExample() {
  const products = [
    { id: "P001", name: "Croissant", unitCost: 1.50, sellingPrice: 3.50, stock: 15 },
    { id: "P002", name: "Danish Pastry", unitCost: 1.80, sellingPrice: 4.00, stock: 8 },
    { id: "P003", name: "Sourdough Bread", unitCost: 2.50, sellingPrice: 6.00, stock: 20 },
    { id: "P004", name: "Baguette", unitCost: 1.20, sellingPrice: 2.50, stock: 25 },
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
    { key: "stock", label: "Stock", sortable: true },
  ];

  return (
    <div className="p-4">
      <DataTable
        data={products}
        columns={columns}
        searchPlaceholder="Search products..."
        onSearch={(query) => console.log("Search:", query)}
        actions={(item) => (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" data-testid={`button-edit-${item.id}`}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" data-testid={`button-delete-${item.id}`}>
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        )}
      />
    </div>
  );
}
