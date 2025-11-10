import { ProductForm } from "../product-form";

export default function ProductFormExample() {
  return (
    <div className="p-4">
      <ProductForm
        onSubmit={(product) => {
          console.log("Product submitted:", product);
        }}
      />
    </div>
  );
}
