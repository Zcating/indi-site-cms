# INDI Site CMS

基于 pnpm 的 monorepo CMS 项目

## 技术栈

- **后端**: Fastify + Prisma + PostgreSQL
- **前端**: React Router v7 + Tailwind CSS + shadcn/ui
- **认证**: JWT + Session

## 项目结构

``` text
indi-site-cms/
├── apps/
│   ├── web/          # 前端应用
│   ├── server/       # 后端服务
│   └── main-site/       # 官网前端应用
├── pnpm-workspace.yaml
└── package.json
```

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置数据库

安装 docker 并启动 postgresql 容器

```bash
docker compose -f 'docker-compose.yml' up -d --build 'postgres'
cp packages/server/.env.example packages/server/.env
```

复制环境变量文件：

```bash
cp packages/server/.env.example packages/server/.env
```

修改 `packages/server/.env` 中的 `DATABASE_URL` 为你的 PostgreSQL 连接字符串。

### 3. 初始化数据库

```bash
# 生成 Prisma 客户端
pnpm db:generate

# 同步数据库表
pnpm db:push

# (可选) 打开 Prisma Studio
pnpm db:studio
```

### 4. 启动开发服务器

```bash
# 启动后端 (端口 3001)
cd packages/server && pnpm dev

# 启动前端 (端口 5173)
cd apps/web && pnpm dev
```

或者使用根目录命令同时启动：

```bash
pnpm dev
```

## 功能模块

- **用户管理**: 管理员和普通用户角色
- **客户管理**: 客户信息的 CRUD 操作
- **图片管理**: 图片上传和管理
- **官网管理**: 页面内容管理 (SEO 设置)

## API 端点

- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `POST /api/auth/logout` - 登出
- `GET /api/auth/me` - 获取当前用户
- `GET/POST /api/users` - 用户管理
- `GET/POST /api/customers` - 客户管理
- `GET/POST /api/images` - 图片管理
- `GET/POST /api/pages` - 页面管理
