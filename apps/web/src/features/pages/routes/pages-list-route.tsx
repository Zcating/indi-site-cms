import { useState } from "react";
import { useFetcher } from "react-router";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, type Page } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Selector } from "@/components/internal/selector";
import {
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save } from "lucide-react";
import type { Route } from "./+types/pages-list-route";

import {
  pageFormSchema,
  pageCreateSchema,
  pageUpdateSchema,
  type PageFormValues,
  defaultSiteJson,
  transformToForm,
  transformFromForm
} from "../utils";
import {
  StringArrayField,
  ProductsArray,
  MediaArray,
  StatsArray
} from "../components";

// --- Loader & Action ---

export async function loader({ request }: Route.LoaderArgs) {
  const [pagesData, productsData] = await Promise.all([
    api.pages.list({ page: 1, limit: 10 }, request),
    api.products.list({ limit: 100 }, request),
  ]);
  return {
    pages: pagesData.data,
    pagination: pagesData.pagination,
    products: productsData.data,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const parsed = pageCreateSchema.safeParse({
      intent: formData.get("intent"),
      slug: formData.get("slug"),
      title: formData.get("title"),
      content: formData.get("content"),
      metaTitle: formData.get("metaTitle"),
      metaDescription: formData.get("metaDescription"),
      status: formData.get("status"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "表单校验失败" };
    }

    try {
      const { intent: _intent, ...data } = parsed.data;
      await api.pages.create(data, request);
      toast.success("页面创建成功");
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "操作失败" };
    }
  }

  if (intent === "update") {
    const parsed = pageUpdateSchema.safeParse({
      intent: formData.get("intent"),
      id: formData.get("id"),
      slug: formData.get("slug"),
      title: formData.get("title"),
      content: formData.get("content"),
      metaTitle: formData.get("metaTitle"),
      metaDescription: formData.get("metaDescription"),
      status: formData.get("status"),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message || "表单校验失败" };
    }

    try {
      const { id, intent: _intent, ...data } = parsed.data;
      await api.pages.update(id, data, request);
      toast.success("页面更新成功");
      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : "操作失败" };
    }
  }

  return { error: "未知操作" };
}

export default function PagesPage({
  loaderData,
}: Route.ComponentProps) {
  const { pages, products: availableProducts } = loaderData;
  const initialPage = pages[0] || null;
  const [editingPage] = useState<Page | null>(initialPage);

  const fetcher = useFetcher();

  let defaultValues: PageFormValues;
  if (initialPage) {
    let siteJson;
    try {
      siteJson = initialPage.content ? JSON.parse(initialPage.content) : defaultSiteJson;
    } catch (e) {
      siteJson = defaultSiteJson;
    }
    defaultValues = {
      slug: initialPage.slug,
      title: initialPage.title,
      siteJson: transformToForm(siteJson, availableProducts),
      metaTitle: initialPage.metaTitle || "",
      metaDescription: initialPage.metaDescription || "",
      status: initialPage.status,
    };
  } else {
    defaultValues = {
      slug: "index",
      title: "官网首页",
      siteJson: transformToForm(defaultSiteJson, availableProducts),
      metaTitle: "",
      metaDescription: "",
      status: "DRAFT",
    };
  }

  const methods = useForm<PageFormValues>({
    resolver: zodResolver(pageFormSchema),
    defaultValues,
  });

  const { control, register, formState: { errors } } = methods;

  function handleSubmit(values: PageFormValues) {
    const content = JSON.stringify(transformFromForm(values.siteJson));
    const payload = {
      slug: values.slug,
      title: values.title,
      content,
      metaTitle: values.metaTitle,
      metaDescription: values.metaDescription,
      status: values.status,
    };

    if (editingPage) {
      fetcher.submit(
        {
          intent: "update",
          id: editingPage.id,
          ...payload,
        },
        { method: "post" }
      );
    } else {
      fetcher.submit(
        {
          intent: "create",
          ...payload,
        },
        { method: "post" }
      );
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {editingPage ? "编辑官网页面" : "创建官网页面"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            配置官网的各个模块内容，保存后将即时生效。
          </p>
        </div>
        <Button onClick={methods.handleSubmit(handleSubmit)} disabled={fetcher.state !== "idle"}>
          <Save className="mr-2 h-4 w-4" />
          {fetcher.state !== "idle" ? "保存中..." : "保存更改"}
        </Button>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(handleSubmit)}>
          <Tabs defaultValue="basic" className="w-full space-y-6">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-2 border-b">
              <TabsList className="w-full justify-start overflow-x-auto h-auto p-1">
                <TabsTrigger value="basic" className="py-2">基础信息</TabsTrigger>
                <TabsTrigger value="hero" className="py-2">Hero 区域</TabsTrigger>
                <TabsTrigger value="products" className="py-2">产品列表</TabsTrigger>
                <TabsTrigger value="oem" className="py-2">OEM 服务</TabsTrigger>
                <TabsTrigger value="about" className="py-2">关于我们</TabsTrigger>
                <TabsTrigger value="consult" className="py-2">联系咨询</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="basic">
              <Card>
                <CardHeader><CardTitle>基础信息</CardTitle><CardDescription>配置页面基本属性和 SEO 信息</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>页面标题 *</FieldLabel>
                      <Input {...register("title")} />
                      <FieldError>{errors.title?.message}</FieldError>
                    </Field>
                    <Field>
                      <FieldLabel>Slug *</FieldLabel>
                      <Input placeholder="page-slug" {...register("slug")} />
                      <FieldError>{errors.slug?.message}</FieldError>
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>品牌名称</FieldLabel>
                      <Input {...register("siteJson.brand")} />
                    </Field>
                    <Field>
                      <FieldLabel>Slogan</FieldLabel>
                      <Input {...register("siteJson.tagline")} />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>SEO 标题</FieldLabel>
                      <Input {...register("metaTitle")} />
                    </Field>
                    <Field>
                      <FieldLabel>状态</FieldLabel>
                      <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                          <Selector
                            value={field.value}
                            onValueChange={field.onChange}
                            options={[
                              { value: "DRAFT", label: "草稿" },
                              { value: "PUBLISHED", label: "已发布" },
                              { value: "ARCHIVED", label: "已归档" },
                            ]}
                          />
                        )}
                      />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel>SEO 描述</FieldLabel>
                    <Input {...register("metaDescription")} />
                  </Field>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="hero">
              <Card>
                <CardHeader><CardTitle>Hero 区域</CardTitle><CardDescription>首页首屏展示的核心内容</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>Badge</FieldLabel>
                      <Input {...register("siteJson.hero.badge")} />
                    </Field>
                    <Field>
                      <FieldLabel>主标题</FieldLabel>
                      <Input {...register("siteJson.hero.title")} />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel>高亮文本</FieldLabel>
                    <Input {...register("siteJson.hero.highlight")} />
                  </Field>
                  <Field>
                    <FieldLabel>描述</FieldLabel>
                    <Textarea {...register("siteJson.hero.description")} />
                  </Field>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="products">
              <Card>
                <CardHeader><CardTitle>产品列表</CardTitle><CardDescription>展示主打产品信息</CardDescription></CardHeader>
                <CardContent>
                  <ProductsArray availableProducts={availableProducts} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="oem">
              <Card>
                <CardHeader><CardTitle>OEM 服务</CardTitle><CardDescription>代加工服务能力展示</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel>服务标题</FieldLabel>
                      <Input {...register("siteJson.oem.title")} />
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel>服务描述</FieldLabel>
                    <Textarea {...register("siteJson.oem.description")} />
                  </Field>
                  <StringArrayField control={control} name="siteJson.oem.features" label="服务特性" placeholder="特性描述" />
                  <MediaArray />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="about">
              <Card>
                <CardHeader><CardTitle>关于我们</CardTitle><CardDescription>品牌故事与统计数据</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <Field>
                    <FieldLabel>关于标题</FieldLabel>
                    <Input {...register("siteJson.about.title")} />
                  </Field>
                  <StringArrayField control={control} name="siteJson.about.content" label="段落内容" placeholder="段落文本" />
                  <StatsArray />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="consult">
              <Card>
                <CardHeader><CardTitle>联系咨询</CardTitle><CardDescription>底部联系方式配置</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <Field>
                    <FieldLabel>咨询标题</FieldLabel>
                    <Input {...register("siteJson.consult.title")} />
                  </Field>
                  <Field>
                    <FieldLabel>副标题</FieldLabel>
                    <Input {...register("siteJson.consult.subtitle")} />
                  </Field>
                  <StringArrayField control={control} name="siteJson.consult.channels" label="联系渠道" placeholder="渠道名称" />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </FormProvider>
    </div>
  );
}
