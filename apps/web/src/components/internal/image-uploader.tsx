import { useEffect, useState } from "react";
import { Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  className
}: ImageUploaderProps) {
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    onChange(url);

    // Reset input value to allow selecting the same file again if needed
    e.target.value = "";
  }

  function handleRemove() {
    onChange("");
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-4">
        {value ? (
          <div className="relative group w-32 h-32 border rounded-lg overflow-hidden bg-muted/20">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/90"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="w-32 h-32 border border-dashed rounded-lg flex items-center justify-center bg-muted/10 hover:bg-muted/20 transition-colors relative">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer z-10 h-full w-full"
            />
            <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Upload className="h-8 w-8" />
              <span className="text-xs">上传图片</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
