import { useRef, useState } from "react";
import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload } from "lucide-react";

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const title = formData.get("title") as string;
  const alt = formData.get("alt") as string;
  const category = formData.get("category") as string;
  const file = formData.get("file") as File;

  if (!file || file.size === 0) {
    return { error: "请选择图片" };
  }

  try {
    await api.images.upload(file, { title, alt, category: category || undefined }, request);
    throw redirect("/admin/images");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "上传失败" };
  }
}

export default function ImageUploadPage() {
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({ title: "", alt: "", category: "" });
  const isSubmitting = navigation.state === "submitting";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    if (!formData.title) {
      setFormData((prev) => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, "") }));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">上传图片</h1>
        <Button asChild variant="outline">
          <Link to="/admin/images">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回列表
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>图片信息</CardTitle>
        </CardHeader>
        <CardContent>
          <Form method="post" encType="multipart/form-data" className="space-y-4">
            <div className="space-y-2">
              <Label>选择图片</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors" onClick={() => fileInputRef.current?.click()}>
                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <img src={URL.createObjectURL(selectedFile)} alt="预览图" className="w-32 h-32 object-cover rounded mb-2" />
                    <span className="text-sm text-gray-600">{selectedFile.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">点击选择图片</span>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" name="file" accept="image/*" className="hidden" onChange={handleFileChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input id="title" name="title" value={formData.title} onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))} placeholder="图片标题" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alt">描述</Label>
              <Input id="alt" name="alt" value={formData.alt} onChange={(e) => setFormData((prev) => ({ ...prev, alt: e.target.value }))} placeholder="图片描述" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">分类</Label>
              <Select value={formData.category} onValueChange={(value) => value && setFormData((prev) => ({ ...prev, category: value }))}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="gallery">图库</SelectItem>
                  <SelectItem value="product">产品</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="category" value={formData.category} />
            </div>

            {actionData?.error ? (
              <p className="text-sm text-red-600">{actionData.error}</p>
            ) : null}

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={!selectedFile || isSubmitting}>
                {isSubmitting ? "上传中..." : "确认上传"}
              </Button>
              <Button asChild type="button" variant="outline">
                <Link to="/admin/images">取消</Link>
              </Button>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
