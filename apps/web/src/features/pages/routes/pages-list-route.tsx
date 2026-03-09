import { useState } from "react";
import { useFetcher } from "react-router";
import { useForm, useFieldArray, Controller, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api, type Page, type Product } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Selector } from "@/components/internal/selector";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, X, Save } from "lucide-react";
import type { Route } from "./+types/pages-list-route";

// --- Schemas ---

// Helper for array of strings (mapped to objects for useFieldArray)
const stringArraySchema = z.array(z.object({ value: z.string() }));

const heroSchema = z.object({
  badge: z.string(),
  title: z.string(),
  highlight: z.string(),
  description: z.string(),
});

const productSchema = z.object({
  name: z.string(),
  flavor: z.string(),
  tone: z.string(),
  emoji: z.string(),
});

const oemMediaSchema = z.object({
  type: z.string(), // "video" | "image"
  title: z.string(),
  source: z.string(),
});

const oemSchema = z.object({
  title: z.string(),
  description: z.string(),
  features: stringArraySchema,
  media: z.array(oemMediaSchema),
});

const aboutStatsSchema = z.object({
  value: z.string(),
  label: z.string(),
});

const aboutSchema = z.object({
  title: z.string(),
  content: stringArraySchema,
  stats: z.array(aboutStatsSchema),
});

const consultSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  channels: stringArraySchema,
});

const siteJsonFormSchema = z.object({
  brand: z.string(),
  tagline: z.string(),
  hero: heroSchema,
  products: z.array(productSchema),
  oem: oemSchema,
  about: aboutSchema,
  consult: consultSchema,
});

// Main Page Form Schema
const pageFormSchema = z.object({
  slug: z.string().trim().min(1, "请输入 Slug"),
  title: z.string().trim().min(1, "请输入标题"),
  siteJson: siteJsonFormSchema,
  metaTitle: z.string().trim(),
  metaDescription: z.string().trim(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

type PageFormValues = z.infer<typeof pageFormSchema>;

// Backend Schemas (for Action)
const pageActionSchema = z.object({
  slug: z.string().trim().min(1, "请输入 Slug"),
  title: z.string().trim().min(1, "请输入标题"),
  content: z.string().trim(),
  metaTitle: z.string().trim(),
  metaDescription: z.string().trim(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});

const pageCreateSchema = pageActionSchema.extend({
  intent: z.literal("create"),
});

const pageUpdateSchema = pageActionSchema.extend({
  intent: z.literal("update"),
  id: z.string().min(1),
});

const pageDeleteSchema = z.object({
  intent: z.literal("delete"),
  id: z.string().min(1),
});

// --- Default Data ---

const defaultSiteJson = {
  brand: "mimoo",
  tagline: "Next Level Kawaii Bakery",
  hero: {
    badge: "MIMOO · 日式烘焙工坊",
    title: "日式手工烘焙",
    highlight: "遇见甜蜜的幸福滋味",
    description: "来自日本的手作温度，每一口都是心动的味道。严格选用优质原料，传统工艺与现代技术结合。"
  },
  products: [
    { name: "草莓大福", flavor: "软糯Q弹的和果子", tone: "from-pink-300 to-rose-300", emoji: "🍡" },
    { name: "奶油面包", flavor: "绵密奶香入口即化", tone: "from-amber-200 to-yellow-300", emoji: "🍞" },
    { name: "抹茶红豆", flavor: "宇治抹茶配甜蜜红豆", tone: "from-green-200 to-emerald-200", emoji: "🍰" },
    { name: "樱花麻薯", flavor: "春日限定的浪漫", tone: "from-pink-200 to-rose-200", emoji: "🌸" },
    { name: "黄油曲奇", flavor: "酥脆香浓的经典", tone: "from-amber-100 to-orange-100", emoji: "🍪" },
    { name: "卡斯特拉", flavor: "日式柔软的云朵蛋糕", tone: "from-yellow-100 to-amber-100", emoji: "🧁" }
  ],
  oem: {
    title: "代加工服务",
    description: "我们拥有专业的烘焙工厂和经验丰富的研发团队，为您提供从配方开发到量产的一站式服务。",
    features: ["📦 多种包装规格可选", "🔬 配方定制研发", "📋 品质检测认证", "🚚 物流配送支持"],
    media: [
      { type: "video", title: "和面到醒发", source: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
      { type: "image", title: "自动化烘焙线", source: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1400&q=80" },
      { type: "image", title: "蛋糕装饰工段", source: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1400&q=80" }
    ]
  },
  about: {
    title: "关于 Mimoo",
    content: [
      "Mimoo 创立于对甜点的热爱。我们相信，美食不仅仅是味觉的享受，更是心灵的治愈。",
      "每一款产品都倾注了我们对品质的坚持和对美学的追求。希望 Mimoo 的甜点能为您带来心动的时刻。"
    ],
    stats: [
      { value: "5+", label: "年经验" },
      { value: "50+", label: "款产品" },
      { value: "10k+", label: "忠实粉丝" }
    ]
  },
  consult: {
    title: "联系我们",
    subtitle: "有任何问题或合作意向，欢迎随时联系我们",
    channels: ["微信/企微", "电话回呼", "邮箱报价"]
  }
};

// --- Helper Functions ---

function transformToForm(json: any): any {
  const data = JSON.parse(JSON.stringify(json || defaultSiteJson));
  
  if (data.oem?.features) {
    data.oem.features = data.oem.features.map((s: string) => ({ value: s }));
  }
  if (data.about?.content) {
    data.about.content = data.about.content.map((s: string) => ({ value: s }));
  }
  if (data.consult?.channels) {
    data.consult.channels = data.consult.channels.map((s: string) => ({ value: s }));
  }
  
  return data;
}

function transformFromForm(formData: any): any {
  const data = JSON.parse(JSON.stringify(formData));
  
  if (data.oem?.features) {
    data.oem.features = data.oem.features.map((o: any) => o.value);
  }
  if (data.about?.content) {
    data.about.content = data.about.content.map((o: any) => o.value);
  }
  if (data.consult?.channels) {
    data.consult.channels = data.consult.channels.map((o: any) => o.value);
  }
  
  return data;
}

// --- Components ---

function StringArrayField({ control, name, label, placeholder }: { control: Control<any>, name: string, label: string, placeholder?: string }) {
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
      siteJson: transformToForm(siteJson),
      metaTitle: initialPage.metaTitle || "",
      metaDescription: initialPage.metaDescription || "",
      status: initialPage.status,
    };
  } else {
    defaultValues = {
      slug: "index",
      title: "官网首页",
      siteJson: transformToForm(defaultSiteJson),
      metaTitle: "",
      metaDescription: "",
      status: "DRAFT",
    };
  }

  const form = useForm<PageFormValues>({
    resolver: zodResolver(pageFormSchema),
    defaultValues,
  });

  const { control, register, formState: { errors } } = form;

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

  const ProductsArray = () => {
    const { fields, append, remove } = useFieldArray({
      control,
      name: "siteJson.products",
    });
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">产品列表</h3>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", flavor: "", tone: "", emoji: "" })}>
            <Plus className="mr-2 h-4 w-4" /> 添加产品
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {fields.map((field, index) => (
            <Card key={field.id} className="relative">
              <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-2 h-6 w-6" onClick={() => remove(index)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
              <CardContent className="pt-6 grid gap-2">
                <div className="mb-2">
                  <Select onValueChange={(value) => {
                    const p = availableProducts.find((p: Product) => p.id === value);
                    if (p) {
                      form.setValue(`siteJson.products.${index}.name`, p.name);
                      if (p.description) form.setValue(`siteJson.products.${index}.flavor`, p.description);
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="从产品库选择 (可选)" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProducts?.map((p: Product) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input placeholder="名称" {...register(`siteJson.products.${index}.name`)} />
                <Input placeholder="口味描述" {...register(`siteJson.products.${index}.flavor`)} />
                <Input placeholder="色调 (Tailwind)" {...register(`siteJson.products.${index}.tone`)} />
                <Input placeholder="Emoji" {...register(`siteJson.products.${index}.emoji`)} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const MediaArray = () => {
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
  };

  const StatsArray = () => {
    const { fields, append, remove } = useFieldArray({
      control,
      name: "siteJson.about.stats",
    });
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">统计数据</h3>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ value: "", label: "" })}>
            <Plus className="mr-2 h-4 w-4" /> 添加统计
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {fields.map((field, index) => (
            <div key={field.id} className="relative rounded border p-2">
              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-4 w-4" onClick={() => remove(index)}>
                <X className="h-3 w-3" />
              </Button>
              <div className="space-y-2 mt-2">
                <Input placeholder="数值 (e.g. 5+)" {...register(`siteJson.about.stats.${index}.value`)} />
                <Input placeholder="标签 (e.g. 年经验)" {...register(`siteJson.about.stats.${index}.label`)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

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
        <Button onClick={form.handleSubmit(handleSubmit)} disabled={fetcher.state !== "idle"}>
          <Save className="mr-2 h-4 w-4" />
          {fetcher.state !== "idle" ? "保存中..." : "保存更改"}
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)}>
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
                  <ProductsArray />
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
    </div>
  );
}
