import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { type Product } from "@/lib/api";

interface ProductsArrayProps {
  availableProducts: Product[];
}

export function ProductsArray({ availableProducts }: ProductsArrayProps) {
  const { control, register, setValue } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "siteJson.products",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">产品列表</h3>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", flavor: "", tone: "", emoji: "" })}>
          <Plus className="mr-2 h-4 w-4" /> 添加产品
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map((field, index) => (
          <Card key={field.id} className="relative">
            <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-2 h-6 w-6" onClick={() => remove(index)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
            <CardContent className="pt-6 grid gap-2">
              <div className="mb-2">
                <Select onValueChange={(value) => {
                  const p = availableProducts.find((p: Product) => p.id === value);
                  if (p) {
                    setValue(`siteJson.products.${index}.id`, p.id);
                    setValue(`siteJson.products.${index}.name`, p.name);
                    if (p.description) setValue(`siteJson.products.${index}.flavor`, p.description);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="从产品库选择 (可选)" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts?.map((p: Product) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="名称" {...register(`siteJson.products.${index}.name`)} />
              <Input placeholder="口味描述" {...register(`siteJson.products.${index}.flavor`)} />
              <Input placeholder="色调 (Tailwind)" {...register(`siteJson.products.${index}.tone`)} />
              <Input placeholder="Emoji" {...register(`siteJson.products.${index}.emoji`)} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
