# 🎓 教学班级分组管理系统

一个现代化的教学班级分组选座系统，支持学生自主选座和管理员统一管理。

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)

## ✨ 功能特性

### 学生功能
- 🔐 学号/姓名登录
- 🪑 电影院式选座界面
- 🔒 座位锁定功能
- 👑 组长申请
- 📊 查看分组情况

### 管理员功能
- 👥 管理所有班级
- ➕ 分配学生到座位
- 🔄 移动学生座位
- 🗑️ 移除学生（包括已锁定）
- 🔐 锁定/解锁座位
- 👑 设置组长
- 📋 查看操作日志
- 📥 导出 Excel

### 技术亮点
- ⚡ 支持100+人并发选座
- 🔄 乐观锁防止座位冲突
- 📝 完整操作日志记录
- 🎨 马卡龙色主题
- 📱 响应式设计

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm 9+
- Supabase 账号

### 本地开发

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
# 创建 .env.local 文件，添加：
# SUPABASE_URL=你的_supabase_url
# SUPABASE_ANON_KEY=你的_supabase_anon_key

# 3. 启动开发服务器
pnpm dev

# 4. 打开浏览器访问
# http://localhost:5000
```

## 📦 部署

### 一键部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/class-group-system)

### 详细部署指南

- 📖 [新手部署指南](./DEPLOYMENT_GUIDE.md) - 图文详解，手把手教学
- ⚡ [快速参考卡片](./QUICK_REFERENCE.md) - 关键步骤速查
- 🛠️ [部署文档](./DEPLOYMENT.md) - 完整技术文档

## 📁 项目结构

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── auth/                 # 登录认证
│   │   │   ├── login/           # 学生登录
│   │   │   └── admin-login/     # 管理员登录
│   │   ├── groups/              # 分组操作
│   │   │   ├── join/            # 加入座位
│   │   │   ├── leave/           # 退出座位
│   │   │   ├── lock/            # 锁定座位
│   │   │   ├── leader/          # 设置组长
│   │   │   ├── assign/          # 管理员分配
│   │   │   └── move/            # 管理员移动
│   │   ├── classes/             # 班级列表
│   │   ├── logs/                # 操作日志
│   │   └── export/              # Excel 导出
│   ├── admin/                    # 管理员页面
│   ├── group/[className]/        # 学生分组页面
│   └── page.tsx                  # 登录首页
├── components/                   # UI 组件
│   └── ui/                       # shadcn/ui 组件
└── storage/                      # 数据库配置
    └── database/
        └── shared/
            └── schema.ts         # 数据库表结构
```

## 🗄️ 数据库设计

### 核心表

| 表名 | 说明 |
|------|------|
| `students` | 学生信息（学号、姓名、班级） |
| `group_slots` | 座位槽位（班级、组号、座位号、学生ID） |
| `admins` | 管理员账号 |
| `seat_logs` | 操作日志 |

### 关键约束

```sql
-- 一个座位只能有一个学生
UNIQUE (class_name, group_number, slot_number)

-- 一个学生只能占一个座位
UNIQUE (class_name, student_id)
```

## 🔒 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | `admin` | `admin123` |
| 学生 | 学号或姓名 | - |

> ⚠️ 部署后请立即修改管理员密码！

## 📸 界面预览

### 学生登录
![登录页面](https://via.placeholder.com/800x450?text=登录页面)

### 电影院式选座
![选座页面](https://via.placeholder.com/800x450?text=选座页面)

### 管理员控制台
![管理员页面](https://via.placeholder.com/800x450?text=管理员页面)

## 🛠️ 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 前端 | React 19 + TypeScript 5 |
| UI | shadcn/ui + Tailwind CSS 4 |
| 数据库 | Supabase (PostgreSQL) |
| 导出 | XLSX |
| 部署 | Vercel |

## 📖 开发文档

- [新手部署指南](./DEPLOYMENT_GUIDE.md) - 从零开始部署
- [快速参考卡片](./QUICK_REFERENCE.md) - 关键命令速查
- [部署文档](./DEPLOYMENT.md) - 完整技术文档

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

Made with ❤️ for education
