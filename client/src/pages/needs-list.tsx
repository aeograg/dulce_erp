import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Package, Leaf, Plus, Clock, CheckCircle, XCircle, Trash, X } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface Product {
  id: string;
  name: string;
  code: string;
}

interface Ingredient {
  id: string;
  name: string;
  unit: string;
}

interface Store {
  id: string;
  name: string;
}

interface RequestItem {
  itemId?: string;
  itemName: string;
  quantity: string;
}

interface NeedsRequest {
  id: string;
  storeId: string;
  requestType: string;
  items: string;
  status: string;
  notes?: string;
  createdBy?: string;
  createdAt: string;
}

export default function NeedsList() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requestType, setRequestType] = useState<"product" | "raw">("product");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [items, setItems] = useState<RequestItem[]>([{ itemId: "", itemName: "", quantity: "" }]);
  const [notes, setNotes] = useState("");

  const { data: requests = [], isLoading } = useQuery<NeedsRequest[]>({
    queryKey: ["/api/needs-requests"],
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: ingredients = [] } = useQuery<Ingredient[]>({
    queryKey: ["/api/ingredients"],
  });

  const { data: stores = [] } = useQuery<Store[]>({
    queryKey: ["/api/stores"],
  });

  const createRequestMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/needs-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/needs-requests"] });
      toast({ title: "Request created successfully" });
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/needs-requests/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/needs-requests"] });
      toast({ title: "Status updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRequestMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/needs-requests/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/needs-requests"] });
      toast({ title: "Request deleted" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedStoreId("");
    setItems([{ itemId: "", itemName: "", quantity: "" }]);
    setNotes("");
  };

  const handleOpenDialog = (type: "product" | "raw") => {
    setRequestType(type);
    resetForm();
    setDialogOpen(true);
  };

  const handleAddItem = () => {
    setItems([...items, { itemId: "", itemName: "", quantity: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const storeId = user?.storeId || selectedStoreId;
    if (!storeId) {
      toast({ title: "Please select a store", variant: "destructive" });
      return;
    }

    if (items.some(item => !item.quantity)) {
      toast({ title: "All items must have a quantity", variant: "destructive" });
      return;
    }

    if (items.some(item => !item.itemId && !item.itemName)) {
      toast({ title: "Each item must be selected or have a custom name", variant: "destructive" });
      return;
    }

    const processedItems = items.map(item => {
      let itemName = "";
      if (item.itemId) {
        itemName = requestType === "product" 
          ? (products.find(p => p.id === item.itemId)?.name || "")
          : (ingredients.find(i => i.id === item.itemId)?.name || "");
      } else {
        itemName = item.itemName;
      }
      
      return {
        itemId: item.itemId || null,
        itemName: itemName,
        quantity: parseFloat(item.quantity) > 0 ? item.quantity : "0",
      };
    });

    createRequestMutation.mutate({
      storeId,
      requestType,
      items: JSON.stringify(processedItems),
      notes,
    });
  };

  const getStoreName = (storeId: string) => {
    return stores.find(s => s.id === storeId)?.name || storeId;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
      case "approved":
        return <Badge className="flex items-center gap-1 bg-green-500"><CheckCircle className="w-3 h-3" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
      case "completed":
        return <Badge className="flex items-center gap-1 bg-blue-500"><CheckCircle className="w-3 h-3" /> Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Needs List</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Request products or raw materials for your store
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenDialog("product")} data-testid="button-request-products">
            <Package className="w-4 h-4 mr-2" />
            Request Products
          </Button>
          <Button onClick={() => handleOpenDialog("raw")} variant="outline" data-testid="button-request-raw">
            <Leaf className="w-4 h-4 mr-2" />
            Request Raw Materials
          </Button>
        </div>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No requests yet. Create a new request using the buttons above.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-foreground">Type</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">Items</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">Store</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">Requested By</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">Date</th>
                <th className="text-left py-3 px-4 font-medium text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => {
                const requestItems = JSON.parse(request.items || "[]");
                return (
                  <tr key={request.id} className="border-b hover-elevate" data-testid={`row-request-${request.id}`}>
                    <td className="py-3 px-4">
                      {request.requestType === "product" ? (
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-500" />
                          <span>Product</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Leaf className="w-4 h-4 text-green-500" />
                          <span>Material</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {requestItems.map((item: any, idx: number) => (
                          <div key={idx} className="text-sm">
                            {item.itemName} - <span className="font-semibold">{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{getStoreName(request.storeId)}</td>
                    <td className="py-3 px-4 text-sm">{request.createdBy || "Unknown"}</td>
                    <td className="py-3 px-4">{getStatusBadge(request.status)}</td>
                    <td className="py-3 px-4 text-sm">{new Date(request.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 space-x-2 flex">
                      {user?.role !== "Staff" && request.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateStatusMutation.mutate({ id: request.id, status: "approved" })}
                            data-testid={`button-approve-${request.id}`}
                          >
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateStatusMutation.mutate({ id: request.id, status: "rejected" })}
                            data-testid={`button-reject-${request.id}`}
                          >
                            <XCircle className="w-4 h-4 text-red-500" />
                          </Button>
                        </>
                      )}
                      {user?.role !== "Staff" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this request?")) {
                              deleteRequestMutation.mutate(request.id);
                            }
                          }}
                          data-testid={`button-delete-${request.id}`}
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {requestType === "product" ? (
                <>
                  <Package className="w-5 h-5" />
                  Request Products
                </>
              ) : (
                <>
                  <Leaf className="w-5 h-5" />
                  Request Raw Materials
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {requestType === "product" 
                ? "Request products for your store"
                : "Request raw materials (ingredients) for production"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {!user?.storeId && (
              <div className="space-y-2">
                <Label htmlFor="store">Store</Label>
                <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                  <SelectTrigger data-testid="select-store">
                    <SelectValue placeholder="Select a store" />
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
            )}

            <div className="space-y-3 max-h-64 overflow-y-auto">
              <Label>Items</Label>
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end p-3 border rounded-md bg-card">
                  <div className="flex-1 space-y-2">
                    <Select value={item.itemId} onValueChange={(val) => handleItemChange(index, "itemId", val)}>
                      <SelectTrigger data-testid={`select-item-${index}`}>
                        <SelectValue placeholder={`Select a ${requestType === "product" ? "product" : "ingredient"}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {requestType === "product" 
                          ? products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} ({product.code})
                              </SelectItem>
                            ))
                          : ingredients.map((ingredient) => (
                              <SelectItem key={ingredient.id} value={ingredient.id}>
                                {ingredient.name} ({ingredient.unit})
                              </SelectItem>
                            ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                      placeholder="Or custom item name"
                      data-testid={`input-custom-item-${index}`}
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Input
                      type="number"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      placeholder="Qty"
                      data-testid={`input-quantity-${index}`}
                    />
                  </div>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveItem(index)}
                      data-testid={`button-remove-item-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddItem}
              data-testid="button-add-item"
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Item
            </Button>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                data-testid="input-notes"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRequestMutation.isPending} data-testid="button-submit-request">
                {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
