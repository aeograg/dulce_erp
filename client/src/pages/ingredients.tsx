import { useState } from "react";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Ingredients() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    costPerUnit: 0,
    unit: "",
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ["/api/ingredients"],
  });

  const createMutation = useMutation({
    mutationFn: (ingredient: any) => apiRequest("POST", "/api/ingredients", ingredient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      toast({ title: "Ingredient created successfully" });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create ingredient",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ingredient }: { id: string; ingredient: any }) =>
      apiRequest("PATCH", `/api/ingredients/${id}`, ingredient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      toast({ title: "Ingredient updated successfully" });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update ingredient",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/ingredients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      toast({ title: "Ingredient deleted successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete ingredient",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", costPerUnit: 0, unit: "" });
    setEditingIngredient(null);
  };

  const handleEdit = (ingredient: any) => {
    setEditingIngredient(ingredient);
    setFormData({
      name: ingredient.name,
      costPerUnit: ingredient.costPerUnit,
      unit: ingredient.unit,
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIngredient) {
      updateMutation.mutate({ id: editingIngredient.id, ingredient: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const columns = [
    { key: "name", label: "Ingredient Name", sortable: true },
    {
      key: "costPerUnit",
      label: "Cost Per Unit",
      sortable: true,
      render: (item: any) => `$${item.costPerUnit.toFixed(2)}`,
    },
    { key: "unit", label: "Unit", sortable: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Ingredients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage ingredients for product recipes
          </p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-ingredient">Add Ingredient</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingIngredient ? "Edit Ingredient" : "Add New Ingredient"}</DialogTitle>
              <DialogDescription>
                {editingIngredient ? "Update ingredient details" : "Create a new ingredient"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Ingredient Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Flour"
                    required
                    data-testid="input-ingredient-name"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="costPerUnit">Cost Per Unit ($)</Label>
                    <Input
                      id="costPerUnit"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costPerUnit}
                      onChange={(e) => setFormData({ ...formData, costPerUnit: Number(e.target.value) })}
                      required
                      data-testid="input-cost-per-unit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="e.g., kg, liter"
                      required
                      data-testid="input-unit"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => { setOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" data-testid="button-save-ingredient">
                  {editingIngredient ? "Update" : "Add"} Ingredient
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={ingredients}
        columns={columns}
        searchPlaceholder="Search ingredients..."
        actions={(item) => (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(item)}
              data-testid={`button-edit-${item.id}`}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (confirm("Are you sure you want to delete this ingredient?")) {
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
