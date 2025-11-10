import { StockEntryForm } from "../stock-entry-form";

export default function StockEntryFormExample() {
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
  ];

  return (
    <div className="p-4 max-w-2xl">
      <StockEntryForm
        stores={stores}
        products={products}
        onSubmit={(entry) => {
          console.log("Stock entry submitted:", entry);
        }}
      />
    </div>
  );
}
