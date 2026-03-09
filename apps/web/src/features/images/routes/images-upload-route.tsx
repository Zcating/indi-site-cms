import { useRef, useState } from "react";
import { Form, Link, redirect, useActionData, useNavigation, useSubmit } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

const imageUploadSchema = z.object({
  title: z.string().trim(),
  alt: z.string().trim(),
  category: z.string().trim(),
  file: z
    .custom<File>((value) => value instanceof File && value.size > 0, "请选择图片")
    .refine((file) => file.type.startsWith("image/"), "请选择图片文件"),
});

type ImageUploadValues = z.infer<typeof imageUploadSchema>;

export async function action({ request }: { request: Request }) {
  const formData = await request.formData();
  const parsed = imageUploadSchema.safeParse({
    title: formData.get("title"),
    alt: formData.get("alt"),
    category: formData.get("category"),
    file: formData.get("file"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "请选择图片" };
  }

  try {
    const { file, title, alt, category } = parsed.data;
    await api.images.upload(file, { title, alt, category: category || undefined }, request);
    throw redirect("/admin/images");
  } catch (error) {
    return { error: error instanceof Error ? error.message : "上传失败" };
  }
}

export default function ImageUploadPage() {
  const actionData = useActionData<{ error?: string }>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const form = useForm<ImageUploadValues>({
    resolver: zodResolver(imageUploadSchema),
    defaultValues: { title: "", alt: "", category: "", file: undefined as unknown as File },
  });
  const isSubmitting = navigation.state === "submitting";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setSelectedFile(null);
      form.setError("file", { message: "请选择图片文件" });
      return;
    }
    setSelectedFile(file);
    form.setValue("file", file, { shouldValidate: true });
    if (!form.getValues("title")) {
      form.setValue("title", file.name.replace(/\.[^/.]+$/, ""));
    }
  }

  function onSubmit(values: ImageUploadValues) {
    const submitFormData = new FormData();
    submitFormData.append("title", values.title);
    submitFormData.append("alt", values.alt);
    submitFormData.append("category", values.category);
    submitFormData.append("file", values.file);
    submit(submitFormData, { method: "post", encType: "multipart/form-data" });
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
          <Form method="post" encType="multipart/form-data" className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
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
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {form.formState.errors.file ? (
                <p className="text-sm text-red-500">{form.formState.errors.file.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">标题</Label>
              <Input id="title" placeholder="图片标题" {...form.register("title")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alt">描述</Label>
              <Input id="alt" placeholder="图片描述" {...form.register("alt")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">分类</Label>
              <Controller
                name="category"
                control={form.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="banner">Banner</SelectItem>
                      <SelectItem value="gallery">图库</SelectItem>
                      <SelectItem value="product">产品</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
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
