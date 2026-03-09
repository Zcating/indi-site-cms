import { useFieldArray, Controller, type Control } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FieldLabel,
  FieldGroup,
} from "@/components/ui/field";
import { Plus, Trash2 } from "lucide-react";

interface StringArrayFieldProps {
  control: Control<any>;
  name: string;
  label: string;
  placeholder?: string;
}

export function StringArrayField({ control, name, label, placeholder }: StringArrayFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <FieldGroup className="space-y-2">
      <div className="flex items-center justify-between">
        <FieldLabel>{label}</FieldLabel>
        <Button type="button" variant="ghost" size="sm" onClick={() => append({ value: "" })}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2">
          <Controller
            control={control}
            name={`${name}.${index}.value`}
            render={({ field }) => (
              <Input {...field} placeholder={placeholder} />
            )}
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}
    </FieldGroup>
  );
}
