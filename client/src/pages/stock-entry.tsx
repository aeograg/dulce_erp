import { StockEntryForm } from "@/components/stock-entry-form";

export default function StockEntry() {
  const stores = [
    { id: "1", name: "Store 1 (Main)" },
    { id: "2", name: "Store 2 (Daily Delivery)" },
    { id: "3", name: "Store 3 (Every 2 Days)" },
  ];

  const products = [
    { id: "P001", name: "Croissant" },
    { id: "P002", name: "Danish Pastry" },
    { id: "P003", name: "Sourdough Bread" },
    { id: "P004", name: "Baguette" },
    { id: "P005", name: "Muffin" },
  ];

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
          onSubmit={(entry) => {
            console.log("Stock entry submitted:", entry);
          }}
        />
      </div>
    </div>
  );
}
