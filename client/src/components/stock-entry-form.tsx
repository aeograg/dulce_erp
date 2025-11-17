import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
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
  reportedStock: number;
  waste: number;
}

interface StockEntryFormProps {
  stores: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string; maxWastePercent?: number }>;
  onSubmit: (entry: StockEntry) => void;
  userRole: string;
}

export function StockEntryForm({ stores, products, onSubmit, userRole }: StockEntryFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    storeId: '',
  });

  const [entries, setEntries] = useState<{ [productId: string]: { reportedStock: string; waste: string } }>({});

  useEffect(() => {
    const initialEntries: { [productId: string]: { reportedStock: string; waste: string } } = {};
    products.forEach((product) => {
      initialEntries[product.id] = { reportedStock: '', waste: '' };
    });
    setEntries(initialEntries);
  }, [products]);

  const handleFormChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleEntryChange = (productId: string, field: 'reportedStock' | 'waste', value: string) => {
    setEntries((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value,
      },
    }));
  };

  const calculateWastePercent = (productId: string) => {
    const entry = entries[productId];
    if (!entry) return 0;
    
    const waste = Number(entry.waste) || 0;
    if (waste === 0) return 0;
    
    const reportedStock = Number(entry.reportedStock) || 0;
    // Total inventory for the day = reported stock + waste
    // (assuming no sales data at stock entry time)
    const totalInventory = waste + reportedStock;
    
    if (totalInventory === 0) return 0;
    return (waste / totalInventory) * 100;
  };

  const isWasteExcessive = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.maxWastePercent === undefined) return false;
    
    const entry = entries[productId];
    const waste = Number(entry?.waste) || 0;
    
    // At entry time, we don't have full data (delivered/sales) so we show a warning
    // if waste seems high relative to current stock, but this is just informational
    const wastePercent = calculateWastePercent(productId);
    return waste > 0 && wastePercent > product.maxWastePercent;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.storeId) {
      // You could add a toast or alert here if needed
      return;
    }

    Object.keys(entries).forEach((productId) => {
      const { reportedStock, waste } = entries[productId];
      // Submit only if at least one field is filled; otherwise skip to avoid unnecessary entries
      if (reportedStock !== '' || waste !== '') {
        onSubmit({
          productId,
          storeId: formData.storeId,
          date: formData.date,
          reportedStock: reportedStock === '' ? 0 : Number(reportedStock),
          waste: waste === '' ? 0 : Number(waste),
        });
      }
    });

    // Reset form after submit
    setFormData({
      date: new Date().toISOString().split("T")[0],
      storeId: '',
    });
    const resetEntries: { [productId: string]: { reportedStock: string; waste: string } } = {};
    products.forEach((product) => {
      resetEntries[product.id] = { reportedStock: '', waste: '' };
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
                  <TableHead>Waste %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const wastePercent = calculateWastePercent(product.id);
                  const excessive = isWasteExcessive(product.id);
                  const hasData = (entries[product.id]?.waste || '') !== '';
                  
                  return (
                    <TableRow key={product.id} className={excessive ? "bg-destructive/10" : ""}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={entries[product.id]?.reportedStock || ''}
                          onChange={(e) => handleEntryChange(product.id, 'reportedStock', e.target.value)}
                          data-testid={`input-reported-stock-${product.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          value={entries[product.id]?.waste || ''}
                          onChange={(e) => handleEntryChange(product.id, 'waste', e.target.value)}
                          className={excessive ? "border-destructive" : ""}
                          data-testid={`input-waste-${product.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        {hasData && (
                          <div className="flex items-center gap-2">
                            <span className={excessive ? "text-destructive font-semibold" : ""}>
                              {wastePercent.toFixed(1)}%
                            </span>
                            {excessive && (
                              <Badge variant="destructive" className="text-xs gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Check: Limit {product.maxWastePercent}%
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
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