import { Link, useRouteError, isRouteErrorResponse } from "react-router";
import { api } from "@/lib/api";

export async function loader({ params, request }: { params: { slug?: string }; request: Request }) {
  const slug = params.slug;
  if (!slug) {
    throw new Response("页面不存在", { status: 404 });
  }

  try {
    const page = await api.pages.getBySlug(slug, request);
    if (page.status !== "PUBLISHED") {
      throw new Response("页面不存在", { status: 404 });
    }
    return { page };
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    throw new Response("页面不存在", { status: 404 });
  }
}

export default function SitePage({ loaderData }: { loaderData: { page: { title: string; content?: string } } }) {
  const { page } = loaderData;

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <article className="prose max-w-none">
          <h1>{page.title}</h1>
          {page.content ? <div dangerouslySetInnerHTML={{ __html: page.content }} /> : <p>暂无页面内容</p>}
        </article>
      </main>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="rounded-lg border bg-white p-8 text-center shadow-sm">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">{notFound ? "页面不存在" : "页面加载失败"}</h1>
        <p className="mb-6 text-sm text-gray-600">{notFound ? "请检查访问地址是否正确。" : "请稍后重试。"}</p>
        <Link to="/admin/pages" className="text-sm font-medium text-blue-600 hover:text-blue-500">
          返回官网管理
        </Link>
      </div>
    </div>
  );
}
