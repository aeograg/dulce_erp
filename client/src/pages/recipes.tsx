import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash, Plus } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Recipes() {
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState("");
  const [newRecipe, setNewRecipe] = useState({
    ingredientId: "",
    quantity: 0,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ["/api/ingredients"],
  });

  const { data: recipes = [] } = useQuery({
    queryKey: [`/api/products/${selectedProductId}/recipes`],
    enabled: !!selectedProductId,
  });

  const createMutation = useMutation({
    mutationFn: (recipe: any) => apiRequest("POST", "/api/recipes", recipe),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${selectedProductId}/recipes`] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Recipe ingredient added successfully" });
      setNewRecipe({ ingredientId: "", quantity: 0 });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add recipe ingredient",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/recipes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${selectedProductId}/recipes`] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Recipe ingredient removed successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove recipe ingredient",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const selectedProduct = products.find((p: any) => p.id === selectedProductId);
  const ingredientMap = new Map(ingredients.map((i: any) => [i.id, i]));

  const handleAddIngredient = () => {
    if (!selectedProductId || !newRecipe.ingredientId || newRecipe.quantity <= 0) {
      toast({
        title: "Invalid input",
        description: "Please select an ingredient and enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      productId: selectedProductId,
      ingredientId: newRecipe.ingredientId,
      quantity: newRecipe.quantity,
    });
  };

  const totalIngredientCost = recipes.reduce((acc: number, recipe: any) => {
    const ingredient = ingredientMap.get(recipe.ingredientId);
    return acc + (ingredient ? ingredient.costPerUnit * recipe.quantity : 0);
  }, 0);

  const batchYield = selectedProduct?.batchYield || 1;
  const unitCost = batchYield > 0 ? totalIngredientCost / batchYield : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Product Recipes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage ingredient recipes for your products
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Product</CardTitle>
          <CardDescription>Choose a product to manage its recipe</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger data-testid="select-product">
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product: any) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.code} - {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProductId && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Recipe for {selectedProduct?.name}</CardTitle>
              <CardDescription>Manage ingredients and quantities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm">
                  <span className="font-medium">Batch Yield: </span>
                  <span>{batchYield} units per batch</span>
                  <span className="text-muted-foreground ml-2">(configured in product settings)</span>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label>Ingredient</Label>
                  <Select
                    value={newRecipe.ingredientId}
                    onValueChange={(value) => setNewRecipe({ ...newRecipe, ingredientId: value })}
                  >
                    <SelectTrigger data-testid="select-ingredient">
                      <SelectValue placeholder="Select ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients.map((ingredient: any) => (
                        <SelectItem key={ingredient.id} value={ingredient.id}>
                          {ingredient.name} (${ingredient.costPerUnit.toFixed(2)}/{ingredient.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="any"
                      min="0.01"
                      value={newRecipe.quantity}
                      onChange={(e) => setNewRecipe({ ...newRecipe, quantity: Number(e.target.value) })}
                      placeholder="0.00"
                      data-testid="input-quantity"
                    />
                    <Button onClick={handleAddIngredient} data-testid="button-add-ingredient-to-recipe">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {recipes.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Current Recipe</h3>
                  <div className="border rounded-md">
                    {recipes.map((recipe: any) => {
                      const ingredient = ingredientMap.get(recipe.ingredientId);
                      const cost = ingredient ? ingredient.costPerUnit * recipe.quantity : 0;
                      return (
                        <div
                          key={recipe.id}
                          className="flex items-center justify-between p-3 border-b last:border-0"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{ingredient?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {recipe.quantity} {ingredient?.unit} × ${ingredient?.costPerUnit.toFixed(2)} = ${cost.toFixed(2)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm("Remove this ingredient from the recipe?")) {
                                deleteMutation.mutate(recipe.id);
                              }
                            }}
                            data-testid={`button-delete-recipe-${recipe.id}`}
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-3 bg-muted rounded-md">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total Batch Cost:</span>
                        <span className="text-lg font-bold">${totalIngredientCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-muted-foreground">
                        <span>Batch Yield:</span>
                        <span>{batchYield} units</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-semibold">Unit Cost:</span>
                        <span className="text-lg font-bold">${unitCost.toFixed(2)}</span>
                      </div>
                    </div>
                    {selectedProduct && (
                      <div className="mt-2 pt-2 border-t text-sm space-y-1">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Selling Price:</span>
                          <span>${selectedProduct.sellingPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-green-600 dark:text-green-400 font-semibold">
                          <span>Profit per unit:</span>
                          <span>${(selectedProduct.sellingPrice - unitCost).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
