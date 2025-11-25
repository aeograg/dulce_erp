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
import { Package, Leaf, Plus, Clock, CheckCircle, XCircle, Trash } from "lucide-react";
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

interface NeedsRequest {
  id: string;
  storeId: string;
  requestType: string;
  itemId?: string;
  itemName?: string;
  quantity: string;
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
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [customItemName, setCustomItemName] = useState("");
  const [quantity, setQuantity] = useState("");
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
    setSelectedItemId("");
    setCustomItemName("");
    setQuantity("");
    setNotes("");
  };

  const handleOpenDialog = (type: "product" | "raw") => {
    setRequestType(type);
    resetForm();
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const storeId = user?.storeId || selectedStoreId;
    if (!storeId) {
      toast({ title: "Please select a store", variant: "destructive" });
      return;
    }
    
    const itemName = requestType === "product" 
      ? (selectedItemId ? products.find(p => p.id === selectedItemId)?.name : customItemName)
      : (selectedItemId ? ingredients.find(i => i.id === selectedItemId)?.name : customItemName);
    
    createRequestMutation.mutate({
      storeId,
      requestType,
      itemId: selectedItemId || null,
      itemName: itemName || customItemName,
      quantity,
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

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No requests yet. Create a new request using the buttons above.
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} data-testid={`card-request-${request.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {request.requestType === "product" ? (
                      <Package className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Leaf className="w-5 h-5 text-green-500" />
                    )}
                    <CardTitle className="text-lg">
                      {request.itemName || "Unknown Item"}
                    </CardTitle>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="flex items-center gap-2">
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
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">Store:</span>
                    <span>{getStoreName(request.storeId)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">Quantity:</span>
                    <span>{request.quantity}</span>
                  </div>
                  {request.notes && (
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">Notes:</span>
                      <span>{request.notes}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">Requested by:</span>
                    <span>{request.createdBy || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
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

            <div className="space-y-2">
              <Label htmlFor="item">
                {requestType === "product" ? "Product" : "Ingredient"}
              </Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger data-testid="select-item">
                  <SelectValue placeholder={`Select a ${requestType === "product" ? "product" : "ingredient"} or leave empty for custom`} />
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

            {!selectedItemId && (
              <div className="space-y-2">
                <Label htmlFor="customItem">Or enter custom item name</Label>
                <Input
                  id="customItem"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  placeholder="e.g., Paper bags, Coffee cups..."
                  data-testid="input-custom-item"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                required
                data-testid="input-quantity"
              />
            </div>

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
