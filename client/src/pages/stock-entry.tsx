import { StockEntryForm } from "@/components/stock-entry-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function StockEntry() {
  const { toast } = useToast();

  const { data: stores = [] } = useQuery({
    queryKey: ["/api/stores"],
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const createMutation = useMutation({
    mutationFn: (entry: any) => apiRequest("/api/stock-entries", "POST", entry),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Stock Entry</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Record daily stock levels and track discrepancies
        </p>
      </div>

      <div className="max-w-2xl">
        <StockEntryForm
          stores={stores}
          products={products}
          onSubmit={(entry) => createMutation.mutate(entry)}
        />
      </div>
    </div>
  );
}
