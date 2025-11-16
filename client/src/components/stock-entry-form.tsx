import { useState, useEffect } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StockEntry {
  productId: string;
  storeId: string;
  date: string;
  currentStock: number;
  waste: number;
}

interface StockEntryFormProps {
  stores: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string }>;
  onSubmit: (entry: StockEntry) => void;
  userRole: string;
}

export function StockEntryForm({ stores, products, onSubmit, userRole }: StockEntryFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    storeId: '',
  });

  const [entries, setEntries] = useState<{ [productId: string]: { currentStock: string; waste: string } }>({});

  useEffect(() => {
    const initialEntries: { [productId: string]: { currentStock: string; waste: string } } = {};
    products.forEach((product) => {
      initialEntries[product.id] = { currentStock: '', waste: '' };
    });
    setEntries(initialEntries);
  }, [products]);

  const handleFormChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleEntryChange = (productId: string, field: 'currentStock' | 'waste', value: string) => {
    setEntries((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.storeId) {
      // You could add a toast or alert here if needed
      return;
    }

    Object.keys(entries).forEach((productId) => {
      const { currentStock, waste } = entries[productId];
      // Submit only if at least one field is filled; otherwise skip to avoid unnecessary entries
      if (currentStock !== '' || waste !== '') {
        onSubmit({
          productId,
          storeId: formData.storeId,
          date: formData.date,
          currentStock: currentStock === '' ? 0 : Number(currentStock),
          waste: waste === '' ? 0 : Number(waste),
        });
      }
    });

    // Reset form after submit
    setFormData({
      date: new Date().toISOString().split("T")[0],
      storeId: '',
    });
    const resetEntries: { [productId: string]: { currentStock: string; waste: string } } = {};
    products.forEach((product) => {
      resetEntries[product.id] = { currentStock: '', waste: '' };
    });
    setEntries(resetEntries);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Stock Entry</CardTitle>
        <CardDescription>
          Record end-of-day current stock and waste quantities for all products
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleFormChange("date", e.target.value)}
                required
                data-testid="input-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store">Store</Label>
              <Select
                value={formData.storeId}
                onValueChange={(value) => handleFormChange("storeId", value)}
                required
              >
                <SelectTrigger id="store" data-testid="select-store">
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
                  <TableHead>Current Stock (End of Day)</TableHead>
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
                        value={entries[product.id]?.currentStock || ''}
                        onChange={(e) => handleEntryChange(product.id, 'currentStock', e.target.value)}
                        data-testid={`input-current-stock-${product.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={entries[product.id]?.waste || ''}
                        onChange={(e) => handleEntryChange(product.id, 'waste', e.target.value)}
                        data-testid={`input-waste-${product.id}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Button type="submit" className="w-full" data-testid="button-submit-stock">
            Submit All Stock Entries
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}