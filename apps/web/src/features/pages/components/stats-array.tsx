import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

export function StatsArray() {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "siteJson.about.stats",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">统计数据</h3>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ value: "", label: "" })}>
          <Plus className="mr-2 h-4 w-4" /> 添加统计
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {fields.map((field, index) => (
          <div key={field.id} className="relative rounded border p-2">
            <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-4 w-4" onClick={() => remove(index)}>
              <X className="h-3 w-3" />
            </Button>
            <div className="space-y-2 mt-2">
              <Input placeholder="数值 (e.g. 5+)" {...register(`siteJson.about.stats.${index}.value`)} />
              <Input placeholder="标签 (e.g. 年经验)" {...register(`siteJson.about.stats.${index}.label`)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
