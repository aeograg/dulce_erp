import { DataTable } from "@/components/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function CostAnalysis() {
  const products = [
    {
      id: "P001",
      name: "Croissant",
      ingredientCost: 0.70,
      laborCost: 0.50,
      overheadCost: 0.30,
      totalCost: 1.50,
      sellingPrice: 3.50,
      margin: 57.1,
    },
    {
      id: "P002",
      name: "Danish Pastry",
      ingredientCost: 0.85,
      laborCost: 0.60,
      overheadCost: 0.35,
      totalCost: 1.80,
      sellingPrice: 4.00,
      margin: 55.0,
    },
    {
      id: "P003",
      name: "Sourdough Bread",
      ingredientCost: 1.00,
      laborCost: 1.00,
      overheadCost: 0.50,
      totalCost: 2.50,
      sellingPrice: 6.00,
      margin: 58.3,
    },
    {
      id: "P004",
      name: "Baguette",
      ingredientCost: 0.55,
      laborCost: 0.40,
      overheadCost: 0.25,
      totalCost: 1.20,
      sellingPrice: 2.50,
      margin: 52.0,
    },
  ];

  const columns = [
    { key: "id", label: "ID", sortable: true },
    { key: "name", label: "Product", sortable: true },
    {
      key: "ingredientCost",
      label: "Ingredients",
      sortable: true,
      render: (item: any) => `$${item.ingredientCost.toFixed(2)}`,
    },
    {
      key: "laborCost",
      label: "Labor",
      sortable: true,
      render: (item: any) => `$${item.laborCost.toFixed(2)}`,
    },
    {
      key: "overheadCost",
      label: "Overhead",
      sortable: true,
      render: (item: any) => `$${item.overheadCost.toFixed(2)}`,
    },
    {
      key: "totalCost",
      label: "Total Cost",
      sortable: true,
      render: (item: any) => `$${item.totalCost.toFixed(2)}`,
    },
    {
      key: "sellingPrice",
      label: "Selling Price",
      sortable: true,
      render: (item: any) => `$${item.sellingPrice.toFixed(2)}`,
    },
    {
      key: "margin",
      label: "Profit Margin",
      sortable: true,
      render: (item: any) => {
        const isHigh = item.margin > 55;
        return (
          <div className="flex items-center gap-1">
            <span className={isHigh ? "text-green-600 dark:text-green-400" : ""}>
              {item.margin.toFixed(1)}%
            </span>
            {isHigh ? (
              <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            )}
          </div>
        );
      },
    },
  ];

  const avgMargin = products.reduce((acc, p) => acc + p.margin, 0) / products.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Cost Analysis</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Detailed cost breakdown and profit margin analysis
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Across all products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Highest Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Sourdough Bread</div>
            <p className="text-xs text-muted-foreground mt-1">58.3% profit margin</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground mt-1">In cost analysis</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={products}
        columns={columns}
        searchPlaceholder="Search products..."
        onSearch={(query) => console.log("Search:", query)}
      />
    </div>
  );
}
