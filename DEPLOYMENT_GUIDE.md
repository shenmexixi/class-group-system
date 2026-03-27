# 🚀 新手部署指南 - 教学班级分组管理系统

> 本指南将手把手教你把项目部署到互联网上，让其他人也能访问。
> 预计完成时间：20-30分钟

---

## 📋 部署前准备

你需要准备：
- ✅ 一个 GitHub 账号（没有的话去 [github.com](https://github.com) 注册）
- ✅ 一个邮箱（用于注册其他服务）
- ✅ 一个浏览器（推荐 Chrome 或 Edge）

---

## 第一步：推送代码到 GitHub（5分钟）

### 1.1 创建 GitHub 仓库

1. 打开浏览器，访问 [github.com](https://github.com)
2. 登录你的 GitHub 账号
3. 点击右上角的 **"+"** 号，选择 **"New repository"**（新建仓库）

![创建仓库](https://docs.github.com/assets/cb-29662/mw-1440/images/help/repository/repo-create.webp)

4. 填写仓库信息：
   - **Repository name**: `class-group-system`（或你喜欢的名字）
   - **Description**: `教学班级分组管理系统`（可选）
   - **⚠️ 重要**：选择 **Public**（公开）
   - **⚠️ 重要**：**不要勾选** "Add a README file"
   - **⚠️ 重要**：**不要勾选** ".gitignore" 和 "license"
   
5. 点击 **"Create repository"**（创建仓库）

### 1.2 获取仓库地址

创建成功后，你会看到一个页面，找到 **HTTPS** 地址，类似：
```
https://github.com/你的用户名/class-group-system.git
```

**复制这个地址**，后面会用到。

### 1.3 推送代码（在开发环境中操作）

> 以下操作在当前开发环境的终端中执行

```bash
# 1. 进入项目目录
cd /workspace/projects

# 2. 添加远程仓库（把下面的地址换成你的）
git remote add origin https://github.com/你的用户名/class-group-system.git

# 3. 推送代码到 GitHub
git push -u origin main
```

如果提示输入用户名和密码：
- **Username**: 输入你的 GitHub 用户名
- **Password**: 需要使用 **Personal Access Token**（不是你的登录密码）

> 💡 **如何获取 Token**：
> 1. 点击 GitHub 右上角头像 → Settings
> 2. 左侧菜单最下方 → Developer settings
> 3. Personal access tokens → Tokens (classic)
> 4. Generate new token (classic)
> 5. Note 填 "deploy"，勾选 "repo"，点击 Generate token
> 6. **复制 token**（只显示一次，妥善保存）

推送成功后，刷新你的 GitHub 仓库页面，应该能看到代码文件了。

---

## 第二步：创建 Supabase 数据库（10分钟）

### 2.1 注册 Supabase

1. 访问 [supabase.com](https://supabase.com)
2. 点击 **"Start your project"**
3. 选择 **"Continue with GitHub"**（用 GitHub 登录更方便）
4. 授权 Supabase 访问你的 GitHub

### 2.2 创建组织

第一次使用需要创建组织：
1. 点击 **"New organization"**
2. Name 填：`my-organization`（或你喜欢的名字）
3. Plan 选择 **Free**（免费版）
4. 点击 **"Create organization"**

### 2.3 创建项目

1. 点击 **"New project"**
2. 填写信息：
   - **Name**: `class-group-system`
   - **Database Password**: 设置一个强密码（**务必保存好！**）
   - **Region**: 选择 `Northeast Asia (Tokyo)` 或 `Southeast Asia (Singapore)`
3. 点击 **"Create new project"**
4. 等待约 2 分钟，项目创建完成

### 2.4 获取连接信息

项目创建完成后：

1. 点击左侧菜单的 **"Settings"**（齿轮图标）
2. 点击 **"API"**
3. 找到并复制以下两个值（**一会要用**）：

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> 💡 **提示**：这两个值非常重要，请妥善保存！

### 2.5 初始化数据库表

1. 点击左侧菜单的 **"SQL Editor"**
2. 点击 **"New query"**
3. 复制下面的 SQL 代码，粘贴到编辑器中：

```sql
-- ============================================
-- 教学班级分组管理系统 - 数据库初始化脚本
-- ============================================

-- 1. 创建学生表
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

-- 2. 创建分组槽位表
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

-- 3. 创建管理员表
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- 4. 创建选座日志表
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

-- 5. 创建索引（提高查询速度）
CREATE INDEX IF NOT EXISTS students_class_name_idx ON students(class_name);
CREATE INDEX IF NOT EXISTS students_student_id_idx ON students(student_id);
CREATE INDEX IF NOT EXISTS group_slots_class_name_idx ON group_slots(class_name);
CREATE INDEX IF NOT EXISTS seat_logs_class_name_idx ON seat_logs(class_name);
CREATE INDEX IF NOT EXISTS seat_logs_created_at_idx ON seat_logs(created_at);

-- 6. 插入默认管理员账号
-- 用户名: admin  密码: admin123
INSERT INTO admins (username, password_hash) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.iW8jY9D6aV3xV9xKCu')
ON CONFLICT (username) DO NOTHING;

-- ============================================
-- 7. 插入测试学生数据（可选，可删除）
-- ============================================
INSERT INTO students (student_id, name, gender, class_name) VALUES
-- 材料A2511班
('2025020301', '张三', '男', '材料A2511'),
('2025020302', '李四', '女', '材料A2511'),
('2025020303', '王五', '男', '材料A2511'),
('2025020304', '赵六', '女', '材料A2511'),
('2025020305', '孙七', '男', '材料A2511'),
-- 材料A2512班
('2025020401', '周八', '男', '材料A2512'),
('2025020402', '吴九', '女', '材料A2512')
ON CONFLICT (student_id) DO NOTHING;
```

4. 点击右下角的 **"Run"** 按钮
5. 看到 "Success. No rows returned" 表示执行成功

### 2.6 导入真实学生数据

如果你有真实的学生名单（Excel文件），需要导入：

**方法一：手动添加**
```sql
-- 在 SQL Editor 中运行，添加更多学生
INSERT INTO students (student_id, name, gender, class_name) VALUES
('2025020306', '学生姓名', '男', '材料A2511'),
('2025020307', '学生姓名', '女', '材料A2511');
-- 继续添加...
```

**方法二：批量导入**
1. 点击左侧菜单 **"Table Editor"**
2. 选择 **"students"** 表
3. 点击右上角 **"Insert"** → **"Insert row"** 手动添加
4. 或点击 **"Import data from CSV"** 批量导入

---

## 第三步：部署到 Vercel（10分钟）

### 3.1 注册 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 点击 **"Sign Up"**
3. 选择 **"Continue with GitHub"**（用 GitHub 登录）
4. 授权 Vercel 访问你的 GitHub

### 3.2 导入项目

1. 登录后，点击 **"Add New..."** → **"Project"**
2. 在 "Import Git Repository" 中找到你刚才创建的仓库
3. 点击 **"Import"**

### 3.3 配置项目

在 "Configure Project" 页面：

1. **Project Name**: 保持默认或自定义
2. **Framework Preset**: 自动检测为 **Next.js**
3. **Root Directory**: `./`（保持默认）

### 3.4 添加环境变量（⚠️ 重要！）

在 "Environment Variables" 部分，添加两个变量：

| Name | Value |
|------|-------|
| `SUPABASE_URL` | 你的 Supabase Project URL |
| `SUPABASE_ANON_KEY` | 你的 Supabase anon public key |

**操作步骤**：
1. 在第一个输入框输入 `SUPABASE_URL`
2. 在第二个输入框粘贴你的 Project URL
3. 点击 **"Add"**
4. 重复以上步骤添加 `SUPABASE_ANON_KEY`

### 3.5 开始部署

1. 点击 **"Deploy"** 按钮
2. 等待部署完成（约 2-5 分钟）
3. 看到庆祝动画 🎉 表示部署成功！

### 3.6 访问你的网站

部署完成后：

1. 点击 **"Continue to Dashboard"**
2. 在 Dashboard 顶部找到你的网站地址，类似：
   ```
   https://class-group-system-xxx.vercel.app
   ```
3. 点击这个地址，你的网站就上线了！

---

## 第四步：测试你的网站

### 4.1 测试管理员登录

1. 打开你的网站
2. 选择班级：`材料A2511`
3. 选择"管理员登录"
4. 输入用户名：`admin`
5. 输入密码：`admin123`
6. 点击登录

✅ 成功进入管理员页面！

### 4.2 测试学生登录

1. 退出管理员账号
2. 选择班级：`材料A2511`
3. 输入学号：`2025020301` 或 姓名：`张三`
4. 点击登录

✅ 成功进入学生分组页面！

### 4.3 测试选座功能

1. 点击一个空座位
2. 座位变成绿色"已选中"
3. 点击"确认选座"
4. 刷新页面，座位显示你的名字

---

## 常见问题解决

### Q1: 推送代码到 GitHub 时提示 "Authentication failed"

**解决方法**：
1. 你需要使用 Personal Access Token 而不是密码
2. 按照 "第一步 1.3节" 的说明创建 Token
3. 在密码处粘贴 Token

### Q2: Vercel 部署失败，显示 "Build Error"

**解决方法**：
1. 检查是否添加了环境变量
2. 检查 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY` 是否正确
3. 在 Vercel Dashboard → Settings → Environment Variables 中重新添加

### Q3: 网站打开显示 "500 Internal Server Error"

**解决方法**：
1. 检查 Supabase 数据库表是否创建成功
2. 在 Supabase SQL Editor 中重新运行初始化脚本
3. 检查环境变量是否正确配置

### Q4: 登录时提示 "未找到该学生"

**解决方法**：
1. 确认 Supabase 中 students 表有数据
2. 确认登录时选择的班级与学生的 `class_name` 一致
3. 尝试用学号登录而不是姓名

### Q5: 如何修改管理员密码？

**解决方法**：
1. 访问任意在线 bcrypt 生成器，如 [bcrypt-generator.com](https://bcrypt-generator.com)
2. 输入新密码，生成哈希值
3. 在 Supabase SQL Editor 中运行：
```sql
UPDATE admins SET password_hash = '新生成的哈希值' WHERE username = 'admin';
```

### Q6: 如何添加更多班级？

**解决方法**：
在 Supabase SQL Editor 中运行：
```sql
-- 添加新班级的学生
INSERT INTO students (student_id, name, gender, class_name) VALUES
('学号1', '姓名1', '性别', '新班级名称'),
('学号2', '姓名2', '性别', '新班级名称');
-- 继续添加该班级的其他学生...
```

---

## 安全建议（生产环境必读）

1. **修改默认管理员密码**（非常重要！）
2. **不要把 `SUPABASE_ANON_KEY` 提交到公开仓库**
3. **定期备份数据**：Supabase Dashboard → Database → Backups
4. **限制访问**：如果只在学校使用，可以在 Vercel 中设置密码保护

---

## 获取帮助

- 📧 问题反馈：在你的 GitHub 仓库创建 Issue
- 📖 Vercel 文档：[vercel.com/docs](https://vercel.com/docs)
- 📖 Supabase 文档：[supabase.com/docs](https://supabase.com/docs)

---

## 总结

恭喜你完成了部署！你现在拥有：

✅ 一个在线的班级分组管理系统
✅ 管理员可以分配和移动学生
✅ 学生可以自主选座
✅ 支持导出 Excel
✅ 完整的操作日志

**你的网站地址**：`https://你的项目名.vercel.app`

把这个地址分享给学生，他们就可以开始选座了！🎉
