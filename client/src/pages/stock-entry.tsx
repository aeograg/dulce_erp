import { StockEntryForm } from "@/components/stock-entry-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

export default function StockEntry() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: stores = [] } = useQuery<any[]>({
    queryKey: ["/api/stores"],
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const createMutation = useMutation({
    mutationFn: (entry: any) => apiRequest("POST", "/api/stock-entries", entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/discrepancies"] });
      toast({ title: "Stock entry recorded successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to record stock entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredStores = user?.role === "Staff" && user.storeId 
    ? stores.filter((s: any) => s.id === user.storeId)
    : stores;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Stock Entry</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {user?.role === "Staff" 
            ? "Record end-of-day stock levels and waste for your store"
            : "Record daily stock levels and track discrepancies"}
        </p>
      </div>

      <div className="max-w-2xl">
        <StockEntryForm
          stores={filteredStores}
          products={products}
          onSubmit={(entry) => createMutation.mutate(entry)}
          userRole={user?.role || "Staff"}
        />
      </div>
    </div>
  );
}
