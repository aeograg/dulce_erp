import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { ProductForm } from "@/components/product-form";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Products() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: products = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: lowStockProducts = [] } = useQuery<any[]>({
    queryKey: ["/api/analytics/low-stock"],
  });

  const createMutation = useMutation({
    mutationFn: (product: any) => apiRequest("POST", "/api/products", product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/low-stock"] });
      toast({ title: "Product created successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, product }: { id: string; product: any }) =>
      apiRequest("PATCH", `/api/products/${id}`, product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/low-stock"] });
      toast({ title: "Product updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/low-stock"] });
      toast({ title: "Product deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const lowStockIds = new Set(lowStockProducts.map((p: any) => p.id));
  const filteredProducts = products.filter((p: any) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { key: "name", label: "Product Name", sortable: true },
    {
      key: "batchYield",
      label: "Batch Yield",
      sortable: true,
      render: (item: any) => `${item.batchYield} units`,
    },
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
      key: "minStockLevel",
      label: "Min Stock",
      sortable: true,
      render: (item: any) => (
        <div className="flex items-center gap-2">
          <span>{item.minStockLevel}</span>
          {lowStockIds.has(item.id) && (
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
          onSubmit={(product) => createMutation.mutate(product)}
        />
      </div>

      <DataTable
        data={filteredProducts}
        columns={columns}
        searchPlaceholder="Search products..."
        onSearch={setSearchQuery}
        actions={(item) => (
          <div className="flex gap-2">
            <ProductForm
              product={item}
              onSubmit={(product) => updateMutation.mutate({ id: item.id, product })}
              trigger={
                <Button size="sm" variant="ghost" data-testid={`button-edit-${item.id}`}>
                  <Edit className="w-4 h-4" />
                </Button>
              }
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (confirm("Are you sure you want to delete this product?")) {
                  deleteMutation.mutate(item.id);
                }
              }}
              data-testid={`button-delete-${item.id}`}
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        )}
      />
    </div>
  );
}
