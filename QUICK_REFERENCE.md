# ⚡ 快速部署卡片

> 配合 `DEPLOYMENT_GUIDE.md` 使用，这是关键步骤的快速参考

---

## 📍 关键地址

| 服务 | 地址 | 用途 |
|------|------|------|
| GitHub | https://github.com | 代码托管 |
| Supabase | https://supabase.com | 数据库 |
| Vercel | https://vercel.com | 网站部署 |

---

## 🔑 需要保存的信息

创建完成后，把以下信息保存在安全的地方：

```
┌─────────────────────────────────────────────────────┐
│ GitHub 仓库地址：https://github.com/xxx/xxx.git     │
├─────────────────────────────────────────────────────┤
│ Supabase Project URL：https://xxx.supabase.co       │
│ Supabase anon key：eyJhbGciOiJI...                  │
│ Supabase 数据库密码：__________                      │
├─────────────────────────────────────────────────────┤
│ 管理员账号：admin / admin123                         │
├─────────────────────────────────────────────────────┤
│ 网站地址：https://xxx.vercel.app                     │
└─────────────────────────────────────────────────────┘
```

---

## 📋 三步部署清单

### ☐ 第一步：GitHub（5分钟）

```bash
cd /workspace/projects
git remote add origin https://github.com/你的用户名/你的仓库.git
git push -u origin main
```

### ☐ 第二步：Supabase（10分钟）

1. 创建项目
2. 复制 `Project URL` 和 `anon public key`
3. 在 SQL Editor 运行初始化脚本
4. 添加学生数据

### ☐ 第三步：Vercel（5分钟）

1. Import GitHub 仓库
2. 添加环境变量：
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. 点击 Deploy
4. 获取网站地址

---

## 🛠️ 环境变量配置

在 Vercel 中添加：

| 变量名 | 值示例 |
|--------|--------|
| `SUPABASE_URL` | `https://abcdefghijk.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

---

## 🔧 快速测试命令

```bash
# 测试 API 是否正常
curl https://你的域名.vercel.app/api/classes

# 测试登录
curl -X POST https://你的域名.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"className":"材料A2511","identifier":"admin"}'
```

---

## 🚨 部署失败排查

| 错误信息 | 可能原因 | 解决方法 |
|----------|----------|----------|
| Authentication failed | GitHub Token 未设置 | 创建 Personal Access Token |
| Build failed | 环境变量未配置 | 检查 Vercel 环境变量 |
| 500 Error | 数据库未初始化 | 在 Supabase 运行 SQL 脚本 |
| 未找到该学生 | 学生数据未导入 | 在 Supabase 添加学生 |

---

## 📞 获取帮助

- 详细步骤：查看 `DEPLOYMENT_GUIDE.md`
- 数据库脚本：查看 `DEPLOYMENT.md`
