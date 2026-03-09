import { Image as ImageIcon } from "lucide-react";

interface ImageProps {
  src?: string;
  alt?: string;
  className?: string;
  emptyText?: string;
}

export function Image({ src, alt = "Image", className, emptyText = "暂无图片" }: ImageProps) {
  return (
    <div className={`aspect-video w-full relative overflow-hidden rounded-md border bg-muted/20 flex items-center justify-center ${className || ""}`}>
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
          <ImageIcon className="h-8 w-8 opacity-20" />
          <span className="text-xs opacity-50">{emptyText}</span>
        </div>
      )}
    </div>
  );
}
