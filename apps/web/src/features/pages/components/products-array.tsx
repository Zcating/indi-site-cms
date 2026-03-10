import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { type Product } from "@/lib/api";
import { Selector } from "@/components/internal/selector";
import { Image } from "@/components/internal/image";

interface ProductsArrayProps {
  availableProducts: Product[];
}

export function ProductsArray({ availableProducts }: ProductsArrayProps) {
  const { control, register, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "siteJson.products",
  });

  const products = useWatch({
    control,
    name: "siteJson.products",
  });

  const handleSelect = (index: number, value: string | null) => {
    const p = availableProducts.find((p: Product) => p.id === value);
    if (!p) {
      return;
    }
    setValue(`siteJson.products.${index}.id`, p.id);
    setValue(`siteJson.products.${index}.name`, p.name);
    setValue(`siteJson.products.${index}.flavor`, p.description || "");
    if (p.images && p.images.length > 0) {
      setValue(`siteJson.products.${index}.image`, p.images[0].url);
    } else if (p.imageUrl) {
      setValue(`siteJson.products.${index}.image`, p.imageUrl);
    } else {
      setValue(`siteJson.products.${index}.image`, "");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">产品列表</h3>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", flavor: "", image: "" })}>
          <Plus className="mr-2 h-4 w-4" /> 添加产品
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map((field, index) => {
          const currentProduct = products?.[index];
          const imageUrl = currentProduct?.image;

          return (
            <Card key={field.id} className="relative" data-testid="product-card">
              <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-2 h-6 w-6 z-10" onClick={() => remove(index)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
              <CardContent className="pt-6 grid gap-4">
                <div className="grid gap-2">
                  <Selector
                    value={currentProduct?.id || ""}
                    onValueChange={(value) => handleSelect(index, value)}
                    options={availableProducts.map((p: Product) => ({ value: p.id, label: p.name }))}
                    placeholder="从产品库选择 (可选)"
                  />
                </div>

                <Image
                  src={currentProduct?.image}
                  alt={currentProduct?.name || "Product"}
                />

                <div className="grid gap-1">
                  <div className="font-medium">{currentProduct?.name || "未选择产品"}</div>
                  <div className="text-sm text-muted-foreground line-clamp-2" title={currentProduct?.flavor}>
                    {currentProduct?.flavor || "暂无描述"}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
