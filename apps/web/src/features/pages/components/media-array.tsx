import { useFieldArray, Controller, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Selector } from "@/components/internal/selector";
import { Plus, Trash2 } from "lucide-react";

export function MediaArray() {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "siteJson.oem.media",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">媒体展示</h3>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ type: "image", title: "", source: "" })}>
          <Plus className="mr-2 h-4 w-4" /> 添加媒体
        </Button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2 items-start rounded border p-2">
          <div className="grid grid-cols-3 gap-2 flex-1">
            <Controller
              control={control}
              name={`siteJson.oem.media.${index}.type`}
              render={({ field }) => (
                <Selector
                  value={field.value}
                  onValueChange={field.onChange}
                  options={[
                    { value: "image", label: "图片" },
                    { value: "video", label: "视频" },
                  ]}
                />
              )}
            />
            <Input placeholder="标题" {...register(`siteJson.oem.media.${index}.title`)} />
            <Input placeholder="资源链接" {...register(`siteJson.oem.media.${index}.source`)} />
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
    </div>
  );
}
