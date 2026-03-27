# 🇨🇳 国内部署指南 - 教学班级分组管理系统

> 使用 Zeabur 部署，国内可直接访问，无需翻墙

---

## 方案对比

| 平台 | 国内访问 | 难度 | 费用 |
|------|----------|------|------|
| **Zeabur** ✅ | ⭐⭐⭐⭐⭐ | 简单 | 免费额度 |
| 阿里云 | ⭐⭐⭐⭐⭐ | 中等 | 按量付费 |
| 腾讯云 | ⭐⭐⭐⭐⭐ | 中等 | 按量付费 |
| Vercel | ⭐⭐（需代理） | 简单 | 免费 |

**推荐：Zeabur**（部署简单，国内访问快）

---

## 第一步：部署到 Zeabur（10分钟）

### 1.1 注册 Zeabur

1. 访问 [zeabur.com](https://zeabur.com)
2. 点击 **"开始使用"**
3. 选择 **"Continue with GitHub"**（用 GitHub 登录）
4. 授权 Zeabur 访问你的 GitHub

### 1.2 创建项目

1. 登录后，点击 **"Create Project"**
2. 项目名称：`class-group-system`
3. 选择区域：**Hong Kong** 或 **Singapore**（亚洲节点）
4. 点击 **"Create"**

### 1.3 部署服务

1. 在项目中点击 **"Add Service"**
2. 选择 **"Git"**
3. 选择你的 GitHub 仓库：`shenmexixi/class-group-system`
4. 点击 **"Deploy"**

Zeabur 会自动检测到 Next.js 项目并开始构建。

### 1.4 配置环境变量

在部署过程中或部署完成后：

1. 点击你的服务名称
2. 切换到 **"Variables"** 标签
3. 添加环境变量：

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | 你的 Supabase URL |
| `SUPABASE_ANON_KEY` | 你的 Supabase Key |

4. 点击 **"Save"**
5. 点击 **"Redeploy"** 重新部署

### 1.5 绑定域名

1. 点击服务 → **"Domains"** 标签
2. 点击 **"Generate Domain"**
3. 获得免费域名：`xxx.zeabur.app`
4. 或绑定自定义域名

---

## 第二步：创建 Supabase 数据库（与之前相同）

### 2.1 注册 Supabase

1. 访问 [supabase.com](https://supabase.com)
2. 用 GitHub 登录

### 2.2 创建项目

1. 创建组织（第一次需要）
2. 创建项目：
   - Name: `class-group-system`
   - Password: 设置密码（保存好！）
   - Region: **Singapore**（亚洲节点，国内访问快）

### 2.3 获取连接信息

Settings → API：
- `Project URL`
- `anon public key`

### 2.4 初始化数据库

SQL Editor → New query → 粘贴执行：

```sql
-- 学生表
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  gender VARCHAR(10),
  grade VARCHAR(20),
  major VARCHAR(100),
  class_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 分组槽位表
CREATE TABLE IF NOT EXISTS group_slots (
  id SERIAL PRIMARY KEY,
  class_name VARCHAR(50) NOT NULL,
  group_number INTEGER NOT NULL,
  slot_number INTEGER NOT NULL,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  is_locked BOOLEAN DEFAULT FALSE,
  is_leader BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_class_group_slot UNIQUE (class_name, group_number, slot_number),
  CONSTRAINT unique_class_student UNIQUE (class_name, student_id)
);

-- 管理员表
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 日志表
CREATE TABLE IF NOT EXISTS seat_logs (
  id SERIAL PRIMARY KEY,
  class_name VARCHAR(50) NOT NULL,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  student_name VARCHAR(50) NOT NULL,
  group_number INTEGER,
  slot_number INTEGER,
  action VARCHAR(20) NOT NULL,
  details VARCHAR(500),
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS students_class_name_idx ON students(class_name);
CREATE INDEX IF NOT EXISTS group_slots_class_name_idx ON group_slots(class_name);

-- 默认管理员 (admin / admin123)
INSERT INTO admins (username, password_hash) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.iW8jY9D6aV3xV9xKCu')
ON CONFLICT (username) DO NOTHING;

-- 测试学生数据
INSERT INTO students (student_id, name, gender, class_name) VALUES
('2025020301', '张三', '男', '材料A2511'),
('2025020302', '李四', '女', '材料A2511'),
('2025020303', '王五', '男', '材料A2511'),
('2025020401', '赵六', '男', '材料A2512')
ON CONFLICT (student_id) DO NOTHING;
```

---

## 完整流程图

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   GitHub        │ ──▶ │   Zeabur        │ ──▶ │  国内可访问域名  │
│  (代码托管)     │     │  (自动部署)     │     │  xxx.zeabur.app │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   Supabase      │
                        │  (数据库)       │
                        │  Singapore节点  │
                        └─────────────────┘
```

---

## 备选方案：阿里云部署

如果你需要更稳定的服务，可以使用阿里云：

### 方案一：阿里云函数计算 FC

1. 开通 [阿里云函数计算](https://www.aliyun.com/product/fc)
2. 使用 Serverless Devs 工具部署
3. 绑定自定义域名

### 方案二：阿里云 ECS 服务器

1. 购买 ECS 服务器（最低配置即可）
2. 安装 Node.js + PM2
3. 部署 Next.js 应用

---

## 费用说明

| 平台 | 费用 |
|------|------|
| Zeabur | 免费额度（$5/月），超出按量付费 |
| Supabase | 免费版（500MB数据库） |
| 阿里云 | 按量付费（约 50-100元/月） |

---

## 常见问题

### Q: Zeabur 部署失败？

检查构建日志，常见原因：
1. 环境变量未配置 → 添加后重新部署
2. 依赖安装失败 → 检查 package.json

### Q: 数据库连接失败？

1. 确认 Supabase Region 选择 Singapore
2. 检查环境变量是否正确
3. 在 Supabase 中检查表是否创建成功

### Q: 访问速度慢？

1. Zeabur 选择 Hong Kong 或 Singapore 区域
2. Supabase 选择 Singapore 区域
3. 考虑使用阿里云 CDN 加速

---

## 下一步

1. ✅ 部署到 Zeabur
2. ✅ 创建 Supabase 数据库
3. ✅ 配置环境变量
4. ✅ 测试网站功能
5. 🔧 修改管理员密码
6. 📊 导入真实学生数据
