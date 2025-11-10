import { AlertCard } from "../alert-card";

export default function AlertCardExample() {
  const lowStockItems = [
    { id: "1", name: "Croissant", details: "Current: 5 units, Min: 10 units" },
    { id: "2", name: "Danish Pastry", details: "Current: 3 units, Min: 8 units" },
    { id: "3", name: "Sourdough Bread", details: "Current: 2 units, Min: 6 units" },
  ];

  const discrepancies = [
    { id: "1", name: "Store 1 - Baguette", details: "Discrepancy: 8% (Expected: 25, Reported: 23)" },
    { id: "2", name: "Store 2 - Muffins", details: "Discrepancy: 6% (Expected: 40, Reported: 38)" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 p-4">
      <AlertCard
        title="Low Stock Alerts"
        items={lowStockItems}
        type="warning"
        viewAllLink="/products"
      />
      <AlertCard
        title="Stock Discrepancies"
        items={discrepancies}
        type="info"
        viewAllLink="/reports"
      />
    </div>
  );
}
