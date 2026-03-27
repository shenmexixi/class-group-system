# 🖥️ 腾讯云服务器部署指南

> 完全自主控制，稳定可靠，适合生产环境

---

## 一、购买腾讯云服务器

### 1.1 选择配置

| 配置项 | 推荐选择 | 说明 |
|--------|----------|------|
| **地域** | 广州/上海/北京 | 选择离用户最近的 |
| **机型** | 轻量应用服务器 | 性价比高 |
| **CPU/内存** | 2核2G | 足够使用 |
| **带宽** | 4Mbps | 支持约100人同时在线 |
| **系统** | Ubuntu 22.04 LTS | 稳定易用 |
| **时长** | 按需选择 | 建议至少3个月 |

### 1.2 购买步骤

1. 打开 [腾讯云官网](https://cloud.tencent.com)
2. 登录/注册账号
3. 产品 → **轻量应用服务器** → 立即购买
4. 选择配置：
   - 地域：**广州**（华南）或 **上海**（华东）
   - 镜像：**Ubuntu 22.04 LTS**
   - 套餐：**2核2G**（约 50-60元/月）
5. 勾选"同意协议" → 立即购买
6. 完成支付

### 1.3 费用预估

| 项目 | 费用 |
|------|------|
| 轻量应用服务器 2核2G | 约 50-60元/月 |
| 域名（可选） | 约 50元/年 |
| SSL证书（可选） | 免费 |
| **总计** | **约 60元/月** |

---

## 二、配置服务器

### 2.1 重置密码

1. 进入 [腾讯云控制台](https://console.cloud.tencent.com)
2. 点击 **轻量应用服务器**
3. 找到刚购买的服务器 → **更多** → **重置密码**
4. 设置一个强密码（保存好！）
5. 重启服务器

### 2.2 连接服务器

**方式一：网页终端（推荐新手）**

1. 在服务器列表点击 **登录**
2. 选择 **标准登录**
3. 输入用户名：`root`
4. 输入刚才设置的密码

**方式二：SSH 终端（推荐）**

Windows 用户下载 [PuTTY](https://www.putty.org/) 或使用 Windows Terminal

```bash
# 替换为你的服务器公网IP
ssh root@你的服务器IP

# 输入密码登录
```

---

## 三、安装环境

### 3.1 一键安装脚本

登录服务器后，复制以下命令执行：

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 PM2（进程管理）
npm install -g pm2

# 安装 Nginx（反向代理）
apt install -y nginx

# 安装 Git
apt install -y git

# 验证安装
node -v      # 应显示 v20.x.x
pnpm -v      # 应显示 9.x.x
pm2 -v       # 应显示 5.x.x
nginx -v     # 应显示 nginx version
```

### 3.2 配置防火墙

在腾讯云控制台：

1. 服务器详情 → **防火墙** 标签
2. 添加规则：

| 协议 | 端口 | 说明 |
|------|------|------|
| TCP | 22 | SSH |
| TCP | 80 | HTTP |
| TCP | 443 | HTTPS |
| TCP | 3000 | Next.js（可选，调试用） |

---

## 四、部署项目

### 4.1 创建项目目录

```bash
# 创建目录
mkdir -p /www/class-group-system
cd /www/class-group-system
```

### 4.2 下载项目代码

```bash
# 克隆代码
git clone https://github.com/shenmexixi/class-group-system.git .

# 安装依赖
pnpm install

# 创建环境变量文件
nano .env.local
```

### 4.3 配置环境变量

在 `.env.local` 文件中添加：

```bash
# Supabase 配置（替换为你的）
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# 端口配置
PORT=3000
NODE_ENV=production
```

按 `Ctrl+O` 保存，`Ctrl+X` 退出。

### 4.4 构建并启动

```bash
# 构建项目
pnpm run build

# 启动服务（端口3000）
pm2 start pnpm --name "class-group" -- run start

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

### 4.5 验证运行

```bash
# 查看运行状态
pm2 status

# 查看日志
pm2 logs class-group

# 测试访问
curl http://localhost:3000
```

---

## 五、配置 Nginx

### 5.1 创建配置文件

```bash
nano /etc/nginx/sites-available/class-group
```

粘贴以下内容：

```nginx
server {
    listen 80;
    server_name _;  # 替换为你的域名或服务器IP

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 5.2 启用配置

```bash
# 创建软链接
ln -s /etc/nginx/sites-available/class-group /etc/nginx/sites-enabled/

# 删除默认配置
rm /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

### 5.3 验证访问

在浏览器打开：`http://你的服务器IP`

---

## 六、绑定域名（可选）

### 6.1 购买域名

1. 腾讯云 → **域名注册**
2. 搜索想要的域名（如 `xxx.com`）
3. 购买并实名认证

### 6.2 解析域名

1. 进入 **DNS 解析**
2. 添加记录：

| 主机记录 | 记录类型 | 记录值 |
|----------|----------|--------|
| @ | A | 你的服务器IP |
| www | A | 你的服务器IP |

### 6.3 修改 Nginx 配置

```bash
nano /etc/nginx/sites-available/class-group
```

将 `server_name _;` 改为：
```nginx
server_name your-domain.com www.your-domain.com;
```

重启 Nginx：
```bash
systemctl restart nginx
```

### 6.4 配置 HTTPS（免费 SSL）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 申请证书（替换域名）
certbot --nginx -d your-domain.com -d www.your-domain.com

# 按提示输入邮箱，同意条款
# 选择是否重定向 HTTP 到 HTTPS（建议选 2 重定向）
```

自动续期：
```bash
# 测试续期
certbot renew --dry-run

# 系统会自动添加定时任务，证书到期前自动续期
```

---

## 七、创建 Supabase 数据库

### 7.1 注册并创建项目

1. 访问 [supabase.com](https://supabase.com)
2. 用 GitHub 登录
3. 创建项目：
   - Name: `class-group-system`
   - Password: 设置密码
   - **Region: Singapore**（亚洲节点）

### 7.2 获取连接信息

Settings → API：
- `Project URL`
- `anon public key`

### 7.3 初始化数据库

SQL Editor → New query → 执行：

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

### 7.4 更新服务器环境变量

```bash
# 编辑环境变量
nano /www/class-group-system/.env.local

# 更新 Supabase 信息
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# 重启服务
pm2 restart class-group
```

---

## 八、常用命令

### 服务管理

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs class-group

# 重启服务
pm2 restart class-group

# 停止服务
pm2 stop class-group

# 重新部署（更新代码后）
cd /www/class-group-system
git pull
pnpm install
pnpm run build
pm2 restart class-group
```

### Nginx 管理

```bash
# 重启
systemctl restart nginx

# 查看状态
systemctl status nginx

# 测试配置
nginx -t
```

### 系统管理

```bash
# 查看磁盘
df -h

# 查看内存
free -h

# 查看 CPU
top
```

---

## 九、故障排查

### 9.1 网站打不开

```bash
# 1. 检查服务是否运行
pm2 status

# 2. 检查端口
netstat -tlnp | grep 3000

# 3. 检查 Nginx
systemctl status nginx

# 4. 检查日志
pm2 logs class-group
tail -f /var/log/nginx/error.log
```

### 9.2 数据库连接失败

```bash
# 1. 检查环境变量
cat /www/class-group-system/.env.local

# 2. 测试网络连接
ping xxx.supabase.co

# 3. 重启服务
pm2 restart class-group
```

### 9.3 构建失败

```bash
# 清除缓存重新构建
rm -rf node_modules .next
pnpm install
pnpm run build
```

---

## 十、安全加固

```bash
# 1. 修改 SSH 端口（可选）
nano /etc/ssh/sshd_config
# 将 Port 22 改为其他端口

# 2. 禁用密码登录（推荐，使用密钥）
# 先配置密钥登录后再执行

# 3. 安装防火墙
apt install -y ufw
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable

# 4. 定期更新系统
apt update && apt upgrade -y
```

---

## 十一、总结

### 访问地址

| 类型 | 地址 |
|------|------|
| 无域名 | `http://服务器IP` |
| 有域名 | `https://your-domain.com` |

### 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | `admin` | `admin123` |

### 总费用

| 项目 | 费用 |
|------|------|
| 服务器 2核2G | ~60元/月 |
| 域名（可选） | ~50元/年 |
| Supabase | 免费 |
| **总计** | **~60元/月** |

---

部署完成后，把这个地址分享给学生就可以使用了！🎉
