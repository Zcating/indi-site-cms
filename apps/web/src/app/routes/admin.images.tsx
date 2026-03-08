import { useState } from "react";
import { Link, useFetcher } from "react-router";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Upload, Image as ImageIcon } from "lucide-react";

export async function loader({ request }: { request: Request }) {
  const data = await api.images.list({ page: 1, limit: 20 }, request);
  return { images: data.data, pagination: data.pagination };
}

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

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
  const fetcher = useFetcher();

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
        <Button asChild>
          <Link to="/admin/images/upload">
            <Upload className="w-4 h-4 mr-2" />
            上传图片
          </Link>
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
    </div>
  );
}
