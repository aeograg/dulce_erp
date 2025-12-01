import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Plus, ArrowUpDown, Filter, Package, Pencil } from "lucide-react";
import type { StockEntry } from "@shared/schema";

const formatQuantity = (value: any): string => {
  if (value == null) return "0";
  const num = Number(value);
  return isNaN(num) ? "0" : Math.round(num).toString();
};

type SortField = "date" | "store" | "product" | "reportedStock";
type SortOrder = "asc" | "desc";

interface EditStockEntryData {
  date: string;
  storeId: string;
  entries: Array<{ id: string; productId: string; reportedStock: number; waste: number }>;
}

export default function StockEntry() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<EditStockEntryData | null>(null);
  
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterStore, setFilterStore] = useState<string>("all");
  const [filterProduct, setFilterProduct] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const { data: stores = [], isLoading: storesLoading } = useQuery<any[]>({
    queryKey: ["/api/stores"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const { data: stockEntries = [], isLoading: stockEntriesLoading } = useQuery<StockEntry[]>({
    queryKey: ["/api/stock-entries"],
  });

  const createMutation = useMutation({
    mutationFn: async (entries: any[]) => {
      const results = [];
      const errors = [];
      
      for (const entry of entries) {
        try {
          const result = await apiRequest("POST", "/api/stock-entries", entry);
          results.push(result);
        } catch (error: any) {
          // If duplicate detected, switch to edit mode
          if (error.message?.includes("already exists")) {
            errors.push({ entry, isDuplicate: true });
          } else {
            errors.push({ entry, error: error.message });
          }
        }
      }
      
      // If all errors are duplicates, switch to edit mode
      if (errors.length > 0 && errors.every(e => e.isDuplicate)) {
        throw new Error("DUPLICATE_DETECTED");
      }
      
      if (errors.length > 0 && !errors.every(e => e.isDuplicate)) {
        throw new Error(`${errors.length} entries failed to save`);
      }
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/discrepancies"] });
      toast({ title: "Stock entries recorded successfully" });
      setIsModalOpen(false);
      setEditMode(false);
      setEditData(null);
    },
    onError: (error: any) => {
      if (error.message === "DUPLICATE_DETECTED") {
        // Don't close modal, just show message
        toast({
          title: "Entry already exists",
          description: "Switching to edit mode for this date and store",
          variant: "default",
        });
        // The modal stays open and we'll handle switching to edit mode
      } else {
        toast({
          title: "Failed to save stock entries",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Array<{ id: string; data: any }>) => {
      const results = [];
      for (const update of updates) {
        const result = await apiRequest("PATCH", `/api/stock-entries/${update.id}`, update.data);
        results.push(result);
      }
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/low-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/discrepancies"] });
      toast({ title: "Stock entries updated successfully" });
      setIsModalOpen(false);
      setEditMode(false);
      setEditData(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update stock entries",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredStores = user?.role === "Staff" && user.storeId 
    ? stores.filter((s: any) => s.id === user.storeId)
    : stores;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleEdit = (date: string, storeId: string) => {
    // Find all entries for this date/store combination
    const entriesForEdit = stockEntries.filter(
      e => e.date === date && e.storeId === storeId
    );
    
    setEditData({
      date,
      storeId,
      entries: entriesForEdit.map(e => ({
        id: e.id,
        productId: e.productId,
        reportedStock: e.reportedStock || 0,
        waste: e.waste || 0,
      })),
    });
    setEditMode(true);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditMode(false);
    setEditData(null);
    setIsModalOpen(true);
  };

  const storeMap = useMemo(() => new Map(stores.map(s => [s.id, s.name])), [stores]);
  const productMap = useMemo(() => new Map(products.map(p => [p.id, p.name])), [products]);

  const filteredAndSortedEntries = useMemo(() => {
    let filtered = [...stockEntries];

    if (filterStore && filterStore !== "all") {
      filtered = filtered.filter(entry => entry.storeId === filterStore);
    }

    if (filterProduct && filterProduct !== "all") {
      filtered = filtered.filter(entry => entry.productId === filterProduct);
    }

    if (dateFrom) {
      filtered = filtered.filter(entry => entry.date >= dateFrom);
    }

    if (dateTo) {
      filtered = filtered.filter(entry => entry.date <= dateTo);
    }

    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case "date":
          aVal = a.date;
          bVal = b.date;
          break;
        case "store":
          aVal = storeMap.get(a.storeId) || "";
          bVal = storeMap.get(b.storeId) || "";
          break;
        case "product":
          aVal = productMap.get(a.productId) || "";
          bVal = productMap.get(b.productId) || "";
          break;
        case "reportedStock":
          aVal = a.reportedStock || 0;
          bVal = b.reportedStock || 0;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [stockEntries, filterStore, filterProduct, dateFrom, dateTo, sortField, sortOrder, storeMap, productMap]);

  // Group entries by date and store for easy editing
  const groupedEntries = useMemo(() => {
    const groups = new Map<string, StockEntry[]>();
    filteredAndSortedEntries.forEach(entry => {
      const key = `${entry.date}_${entry.storeId}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(entry);
    });
    return groups;
  }, [filteredAndSortedEntries]);

  const totalEntries = filteredAndSortedEntries.length;
  const totalWaste = filteredAndSortedEntries.reduce((sum, entry) => sum + (entry.waste || 0), 0);
  const highDiscrepancies = filteredAndSortedEntries.filter(entry => 
    Math.abs(entry.discrepancy || 0) >= 5
  ).length;

  const isLoading = storesLoading || productsLoading || stockEntriesLoading;

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Stock Entry</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            {user?.role === "Staff" 
              ? "Record end-of-day stock levels and waste for your store"
              : "Record daily stock levels and track discrepancies"}
          </p>
        </div>
        <Button onClick={handleAddNew} data-testid="button-add-stock-entry" className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Stock Entry
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-entries">{totalEntries}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Discrepancies</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-high-discrepancies">{highDiscrepancies}</div>
            <p className="text-xs text-muted-foreground">≥5% variance</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Waste</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-waste">{totalWaste}</div>
            <p className="text-xs text-muted-foreground">All filtered entries</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="filter-store">Store</Label>
              <Select value={filterStore} onValueChange={setFilterStore}>
                <SelectTrigger id="filter-store" data-testid="select-filter-store">
                  <SelectValue placeholder="All Stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filter-product">Product</Label>
              <Select value={filterProduct} onValueChange={setFilterProduct}>
                <SelectTrigger id="filter-product" data-testid="select-filter-product">
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-from">Date From</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                data-testid="input-date-from"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">Date To</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                data-testid="input-date-to"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stock Entries</CardTitle>
          <CardDescription>
            Showing {filteredAndSortedEntries.length} entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAndSortedEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No stock entries found. Click "Add Stock Entry" to create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("date")}
                        className="hover-elevate active-elevate-2"
                        data-testid="button-sort-date"
                      >
                        Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("store")}
                        className="hover-elevate active-elevate-2"
                        data-testid="button-sort-store"
                      >
                        Store
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("product")}
                        className="hover-elevate active-elevate-2"
                        data-testid="button-sort-product"
                      >
                        Product
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Inventory Stock</TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("reportedStock")}
                        className="hover-elevate active-elevate-2"
                        data-testid="button-sort-reported-stock"
                      >
                        Reported Stock
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Waste</TableHead>
                    <TableHead className="text-right">Sales</TableHead>
                    <TableHead className="text-right">Expected Stock</TableHead>
                    <TableHead className="text-right">Discrepancy</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedEntries.map((entry) => {
                    const discrepancy = entry.discrepancy || 0;
                    const isHighDiscrepancy = Math.abs(discrepancy) >= 5;
                    
                    return (
                      <TableRow key={entry.id} data-testid={`row-stock-entry-${entry.id}`}>
                        <TableCell>{format(new Date(entry.date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>{storeMap.get(entry.storeId)}</TableCell>
                        <TableCell>{productMap.get(entry.productId)}</TableCell>
                        <TableCell className="text-right">{formatQuantity(entry.delivered)}</TableCell> {/* Inventory Stock */}
                        <TableCell className="text-right">{formatQuantity(entry.reportedStock)}</TableCell>
                        <TableCell className="text-right">{formatQuantity(entry.waste)}</TableCell>
                        <TableCell className="text-right">{formatQuantity(entry.sales)}</TableCell>
                        <TableCell className="text-right">{formatQuantity(entry.expectedStock)}</TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={isHighDiscrepancy ? "destructive" : "secondary"}
                            data-testid={`badge-discrepancy-${entry.id}`}
                          >
                            {discrepancy.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(entry.date, entry.storeId)}
                            data-testid={`button-edit-${entry.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <StockEntryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditMode(false);
          setEditData(null);
        }}
        stores={filteredStores}
        products={products}
        editMode={editMode}
        editData={editData}
        onSubmit={(entries) => {
          if (editMode && editData) {
            // Update mode
            const updates = entries.map(entry => ({
              id: entry.id!,
              data: {
                reportedStock: entry.reportedStock,
                waste: entry.waste,
              }
            }));
            updateMutation.mutate(updates);
          } else {
            // Create mode
            const newEntries = entries.map(entry => ({
              date: entry.date,
              storeId: entry.storeId,
              productId: entry.productId,
              reportedStock: entry.reportedStock,
              waste: entry.waste,
            }));
            createMutation.mutate(newEntries);
          }
        }}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

interface StockEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: any[];
  products: any[];
  editMode: boolean;
  editData: EditStockEntryData | null;
  onSubmit: (entries: Array<{ id?: string; date: string; storeId: string; productId: string; reportedStock: number; waste: number }>) => void;
  isPending: boolean;
}

function StockEntryModal({ isOpen, onClose, stores, products, editMode, editData, onSubmit, isPending }: StockEntryModalProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [date, setDate] = useState(editData?.date || today);
  const [storeId, setStoreId] = useState(editData?.storeId || "");
  const [entries, setEntries] = useState<Record<string, { reportedStock: string; waste: string }>>({});

  // Initialize entries when editData changes
  useState(() => {
    if (editMode && editData) {
      setDate(editData.date);
      setStoreId(editData.storeId);
      const initialEntries: Record<string, { reportedStock: string; waste: string }> = {};
      editData.entries.forEach(e => {
        initialEntries[e.productId] = {
          reportedStock: e.reportedStock.toString(),
          waste: e.waste.toString(),
        };
      });
      setEntries(initialEntries);
    } else {
      setDate(today);
      setStoreId("");
      setEntries({});
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !storeId) {
      return;
    }

    const submissionEntries = Object.entries(entries)
      .filter(([_, val]) => val.reportedStock !== '' || val.waste !== '')
      .map(([productId, val]) => {
        const existingEntry = editMode && editData 
          ? editData.entries.find(e => e.productId === productId)
          : null;
        
        return {
          id: existingEntry?.id,
          date,
          storeId,
          productId,
          reportedStock: val.reportedStock === '' ? 0 : Number(val.reportedStock),
          waste: val.waste === '' ? 0 : Number(val.waste),
        };
      });

    if (submissionEntries.length === 0) {
      return;
    }

    onSubmit(submissionEntries);
  };

  const handleEntryChange = (productId: string, field: 'reportedStock' | 'waste', value: string) => {
    setEntries(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId] || { reportedStock: '', waste: '' },
        [field]: value,
      },
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editMode ? "Edit" : "Add"} Daily Stock Entry</DialogTitle>
          <DialogDescription>
            {editMode ? "Update stock levels and waste for this date and store" : "Record end-of-day stock levels and waste"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="modal-date">Date</Label>
              <Input
                id="modal-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={editMode}
                required
                data-testid="input-modal-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-store">Store</Label>
              <Select
                value={storeId}
                onValueChange={setStoreId}
                disabled={editMode}
                required
              >
                <SelectTrigger id="modal-store" data-testid="select-modal-store">
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

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Waste Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={entries[product.id]?.reportedStock || ''}
                        onChange={(e) => handleEntryChange(product.id, 'reportedStock', e.target.value)}
                        data-testid={`input-modal-reported-stock-${product.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={entries[product.id]?.waste || ''}
                        onChange={(e) => handleEntryChange(product.id, 'waste', e.target.value)}
                        data-testid={`input-modal-waste-${product.id}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-testid="button-submit-modal"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editMode ? "Update" : "Submit"} Entries
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
