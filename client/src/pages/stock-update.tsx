import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { DataTable } from "@/components/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function StockUpdate() {
  const { toast } = useToast();
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [formData, setFormData] = useState({ delivered: 0, sales: 0 });
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
  const [filterStore, setFilterStore] = useState<string>("");

  const { data: stockEntries = [] } = useQuery<any[]>({
    queryKey: ["/api/stock-entries"],
  });

  const { data: stores = [] } = useQuery<any[]>({
    queryKey: ["/api/stores"],
  });

  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/stock-entries/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/discrepancies"] });
      toast({ title: "Stock entry updated successfully" });
      setSelectedEntry(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update stock entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (entry: any) => {
    setSelectedEntry(entry);
    setFormData({
      delivered: entry.delivered || 0,
      sales: entry.sales || 0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEntry) {
      updateMutation.mutate({
        id: selectedEntry.id,
        data: formData,
      });
    }
  };

  const storeMap = new Map(stores.map((s: any) => [s.id, s]));
  const productMap = new Map(products.map((p: any) => [p.id, p]));

  const filteredEntries = stockEntries.filter((entry: any) => {
    const matchesDate = !filterDate || entry.date === filterDate;
    const matchesStore = !filterStore || filterStore === "all" || entry.storeId === filterStore;
    return matchesDate && matchesStore;
  });

  const pendingEntries = filteredEntries.filter(
    (e: any) => e.delivered === 0 || e.sales === 0
  );

  const calculateDiscrepancy = (entry: any) => {
    if (!entry.delivered || entry.delivered === 0) return null;
    const previousStock = entry.currentStock - entry.delivered + entry.waste + entry.sales;
    const expectedRemaining = previousStock + entry.delivered - entry.waste - entry.sales;
    const discrepancy = ((entry.currentStock - expectedRemaining) / entry.delivered) * 100;
    return Math.abs(discrepancy);
  };

  const columns = [
    {
      key: "date",
      label: "Date",
      sortable: true,
    },
    {
      key: "storeId",
      label: "Store",
      sortable: true,
      render: (item: any) => storeMap.get(item.storeId)?.name || "Unknown",
    },
    {
      key: "productId",
      label: "Product",
      sortable: true,
      render: (item: any) => productMap.get(item.productId)?.name || "Unknown",
    },
    {
      key: "currentStock",
      label: "Current Stock",
      sortable: true,
    },
    {
      key: "waste",
      label: "Waste",
      sortable: true,
    },
    {
      key: "delivered",
      label: "Delivered",
      sortable: true,
      render: (item: any) => (
        <span className={item.delivered === 0 ? "text-muted-foreground" : ""}>
          {item.delivered || "Pending"}
        </span>
      ),
    },
    {
      key: "sales",
      label: "Sales",
      sortable: true,
      render: (item: any) => (
        <span className={item.sales === 0 ? "text-muted-foreground" : ""}>
          {item.sales || "Pending"}
        </span>
      ),
    },
  ];

  const discrepancy = selectedEntry ? calculateDiscrepancy({
    ...selectedEntry,
    ...formData,
  }) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Update Stock Entries</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add delivered quantities and sales data to staff-entered stock records
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Entries</CardTitle>
          <CardDescription>Filter stock entries by date and store</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="filter-date">Date</Label>
              <Input
                id="filter-date"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                data-testid="input-filter-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-store">Store</Label>
              <Select value={filterStore} onValueChange={setFilterStore}>
                <SelectTrigger id="filter-store" data-testid="select-filter-store">
                  <SelectValue placeholder="All stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All stores</SelectItem>
                  {stores.map((store: any) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {pendingEntries.length > 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {pendingEntries.length} {pendingEntries.length === 1 ? "entry" : "entries"} pending completion
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <DataTable
        data={filteredEntries}
        columns={columns}
        searchPlaceholder="Search entries..."
        actions={(item) => (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(item)}
            data-testid={`button-edit-${item.id}`}
          >
            <Edit className="w-4 h-4" />
          </Button>
        )}
      />

      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock Entry</DialogTitle>
            <DialogDescription>
              Add delivered quantity and sales data
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-md">
                  <div>
                    <p className="text-sm text-muted-foreground">Product</p>
                    <p className="font-medium">{productMap.get(selectedEntry.productId)?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Store</p>
                    <p className="font-medium">{storeMap.get(selectedEntry.storeId)?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Stock</p>
                    <p className="font-medium">{selectedEntry.currentStock}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Waste</p>
                    <p className="font-medium">{selectedEntry.waste}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivered">Delivered Quantity</Label>
                  <Input
                    id="delivered"
                    type="number"
                    min="0"
                    value={formData.delivered}
                    onChange={(e) => setFormData({ ...formData, delivered: Number(e.target.value) })}
                    required
                    data-testid="input-delivered"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sales">Sales Quantity</Label>
                  <Input
                    id="sales"
                    type="number"
                    min="0"
                    value={formData.sales}
                    onChange={(e) => setFormData({ ...formData, sales: Number(e.target.value) })}
                    required
                    data-testid="input-sales"
                  />
                </div>

                {discrepancy !== null && discrepancy > 5 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      High discrepancy detected: {discrepancy.toFixed(1)}% (threshold: 5%)
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setSelectedEntry(null)}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save-update">
                  Update Entry
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
