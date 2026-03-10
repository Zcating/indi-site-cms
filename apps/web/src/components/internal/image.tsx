import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImageProps {
  src?: string;
  alt?: string;
  className?: string;
  emptyText?: string;
  clickable?: boolean;
}

export function Image({ src, alt = "Image", className, emptyText = "暂无图片", clickable = false }: ImageProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={`aspect-video w-full relative overflow-hidden rounded-md border bg-muted/20 flex items-center justify-center ${className || ""} ${clickable && src ? "cursor-pointer hover:opacity-90 transition-opacity" : ""}`}
        onClick={() => clickable && src && setOpen(true)}
      >
        {src ? (
          <img src={src} alt={alt} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
            <ImageIcon className="h-8 w-8 opacity-20" />
            <span className="text-xs opacity-50">{emptyText}</span>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{alt}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4 pt-0">
            {src && (
              <img src={src} alt={alt} className="max-w-full max-h-[80vh] object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
