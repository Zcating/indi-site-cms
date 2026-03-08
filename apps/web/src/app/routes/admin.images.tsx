import { useState, useRef } from "react";
import { useLoaderData, useFetcher } from "react-router";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Upload, Search, Image as ImageIcon } from "lucide-react";

export async function loader({ request }: { request: Request }) {
  const data = await api.images.list({ page: 1, limit: 20 }, request);
  return { images: data.data, pagination: data.pagination };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "upload") {
    const title = formData.get("title") as string;
    const alt = formData.get("alt") as string;
    const category = formData.get("category") as string;

    const file = formData.get("file") as File;
    if (!file || file.size === 0) {
      return { error: "请选择图片" };
    }

    try {
      await api.images.upload(file, { title, alt, category: category || undefined }, request);
      toast.success("图片上传成功");
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "上传失败" };
    }
  }

  if (intent === "delete") {
    const id = formData.get("id") as string;
    try {
      await api.images.delete(id, request);
      toast.success("图片删除成功");
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "删除失败" };
    }
  }

  return { error: "未知操作" };
}

export default function ImagesPage({ loaderData }: { loaderData: { images: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } } }) {
  const { images: initialImages } = loaderData;
  const [images] = useState(initialImages);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [formData, setFormData] = useState({ title: "", alt: "", category: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetcher = useFetcher();

  function openUploadDialog() {
    setFormData({ title: "", alt: "", category: "" });
    setSelectedFile(null);
    setDialogOpen(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("请选择图片文件");
        return;
      }
      setSelectedFile(file);
      if (!formData.title) {
        setFormData({ ...formData, title: file.name.replace(/\.[^/.]+$/, "") });
      }
    }
  }

  function handleUpload() {
    if (!selectedFile) {
      toast.error("请选择图片");
      return;
    }
    const form = new FormData();
    form.append("intent", "upload");
    form.append("file", selectedFile);
    form.append("title", formData.title);
    form.append("alt", formData.alt);
    if (formData.category) {
      form.append("category", formData.category);
    }
    fetcher.submit(form, { method: "post", encType: "multipart/form-data" });
  }

  function handleDelete(id: string) {
    if (!confirm("确定要删除这张图片吗？")) return;
    const form = new FormData();
    form.append("intent", "delete");
    form.append("id", id);
    fetcher.submit(form, { method: "post" });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">图片管理</h1>
        <Button onClick={openUploadDialog}>
          <Upload className="w-4 h-4 mr-2" />
          上传图片
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>图片列表</CardTitle>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <ImageIcon className="w-12 h-12 mb-2" />
              <p>暂无图片</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {images.map((image) => (
                <div key={image.id} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img src={image.url} alt={image.alt || image.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="secondary" size="icon" className="w-8 h-8" onClick={() => navigator.clipboard.writeText(image.url)}>
                      <span className="text-xs">复制</span>
                    </Button>
                    <Button variant="destructive" size="icon" className="w-8 h-8" onClick={() => handleDelete(image.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-xs truncate">
                    {image.title}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>上传图片</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>选择图片</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors" onClick={() => fileInputRef.current?.click()}>
                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-32 h-32 object-cover rounded mb-2" />
                    <span className="text-sm text-gray-600">{selectedFile.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">点击选择图片</span>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="图片标题" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alt">描述</Label>
              <Input id="alt" value={formData.alt} onChange={(e) => setFormData({ ...formData, alt: e.target.value })} placeholder="图片描述" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">分类</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger><SelectValue placeholder="选择分类" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="gallery">图库</SelectItem>
                  <SelectItem value="product">产品</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleUpload} disabled={!selectedFile}>上传</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
