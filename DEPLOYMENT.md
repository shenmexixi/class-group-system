# 教学班级分组管理系统 - 部署指南

## 技术栈

- **前端**: Next.js 16 + React 19 + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **部署平台**: Vercel (推荐) / Netlify / Railway

## 部署步骤

### 1. 推送代码到 GitHub

```bash
# 1. 在 GitHub 创建新仓库（不要初始化 README）

# 2. 添加远程仓库
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# 3. 推送代码
git push -u origin main
```

### 2. 配置 Supabase 数据库

如果还没有 Supabase 项目，需要先创建：

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 获取数据库连接信息：
   - `SUPABASE_URL`: 项目设置 > API > Project URL
   - `SUPABASE_ANON_KEY`: 项目设置 > API > anon public key

4. 执行数据库初始化脚本（在 Supabase SQL Editor 中运行）：

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

-- 选座日志表
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

-- 创建索引
CREATE INDEX IF NOT EXISTS students_class_name_idx ON students(class_name);
CREATE INDEX IF NOT EXISTS group_slots_class_name_idx ON group_slots(class_name);
CREATE INDEX IF NOT EXISTS seat_logs_class_name_idx ON seat_logs(class_name);
CREATE INDEX IF NOT EXISTS seat_logs_created_at_idx ON seat_logs(created_at);

-- 插入默认管理员 (密码: admin123)
INSERT INTO admins (username, password_hash) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.iW8jY9D6aV3xV9xKCu')
ON CONFLICT (username) DO NOTHING;
```

5. 导入学生数据（示例）：

```sql
-- 插入测试学生数据
INSERT INTO students (student_id, name, gender, class_name) VALUES
('2025020301', '张三', '男', '材料A2511'),
('2025020302', '李四', '女', '材料A2511'),
-- ... 更多学生
('2025020401', '王五', '男', '材料A2512');
-- ... 更多班级
```

### 3. 部署到 Vercel

#### 方式一：通过 Vercel Dashboard（推荐）

1. 访问 [Vercel](https://vercel.com)
2. 使用 GitHub 账号登录
3. 点击 "Add New..." > "Project"
4. 选择你的 GitHub 仓库
5. 配置环境变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | Supabase 项目 URL |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Supabase anon key |
| `COZE_PROJECT_DOMAIN_DEFAULT` | `https://your-app.vercel.app` | 部署后的域名 |

6. 点击 "Deploy"
7. 等待部署完成（约 2-3 分钟）

#### 方式二：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel --prod
```

### 4. 配置域名（可选）

1. 在 Vercel 项目设置中添加自定义域名
2. 更新 `COZE_PROJECT_DOMAIN_DEFAULT` 环境变量

## 环境变量清单

| 变量名 | 必需 | 说明 |
|--------|------|------|
| `SUPABASE_URL` | ✅ | Supabase 项目 URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase 匿名密钥 |
| `COZE_PROJECT_DOMAIN_DEFAULT` | ⚪ | 项目域名（用于显示） |

## 默认账号

- **管理员**: `admin` / `admin123`
- **学生**: 使用学号或姓名登录

## 常见问题

### Q: 部署后页面显示 500 错误？
A: 检查环境变量是否正确配置，特别是 Supabase 连接信息。

### Q: 登录提示"未找到该学生"？
A: 确认 Supabase 中已导入学生数据，且 `class_name` 字段与登录时选择的班级一致。

### Q: 如何修改管理员密码？
A: 在 Supabase SQL Editor 中运行：
```sql
-- 生成新密码哈希后更新
UPDATE admins SET password_hash = '新的bcrypt哈希值' WHERE username = 'admin';
```

## 项目结构

```
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── auth/          # 登录认证
│   │   │   ├── groups/        # 分组操作
│   │   │   ├── logs/          # 日志查询
│   │   │   └── export/        # Excel 导出
│   │   ├── admin/             # 管理员页面
│   │   ├── group/             # 学生分组页面
│   │   └── page.tsx           # 首页
│   ├── components/            # UI 组件
│   └── storage/               # 数据库配置
├── package.json
├── vercel.json
└── DEPLOYMENT.md
```

## 安全建议

1. **修改默认管理员密码**
2. **启用 Supabase RLS（行级安全）**：生产环境建议启用
3. **配置 Supabase 防火墙规则**：限制数据库访问
4. **定期备份数据**：在 Supabase Dashboard 中配置自动备份

## 许可证

MIT License
