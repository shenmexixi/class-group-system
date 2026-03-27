#!/bin/bash

# ============================================
# 🚀 一键部署脚本 - 教学班级分组管理系统
# ============================================
# 使用方法：
# 1. 先在 GitHub 创建一个新仓库（不要初始化 README）
# 2. 修改下面的 GITHUB_REPO 变量为你的仓库地址
# 3. 运行此脚本：bash deploy.sh
# ============================================

# ⚠️ 请修改为你的 GitHub 仓库地址
GITHUB_REPO="https://github.com/你的用户名/class-group-system.git"

echo "============================================"
echo "🚀 开始部署教学班级分组管理系统"
echo "============================================"
echo ""

# 进入项目目录
cd /workspace/projects

# 检查是否已经添加远程仓库
if git remote | grep -q "origin"; then
    echo "📦 远程仓库已存在，跳过添加步骤"
else
    echo "📦 添加远程仓库..."
    git remote add origin $GITHUB_REPO
fi

# 推送代码
echo "📤 推送代码到 GitHub..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 代码推送成功！"
    echo ""
    echo "============================================"
    echo "📋 接下来的步骤："
    echo "============================================"
    echo ""
    echo "1️⃣  创建 Supabase 数据库"
    echo "   访问: https://supabase.com"
    echo "   - 创建新项目"
    echo "   - 复制 Project URL 和 anon key"
    echo "   - 在 SQL Editor 运行初始化脚本"
    echo ""
    echo "2️⃣  部署到 Vercel"
    echo "   访问: https://vercel.com"
    echo "   - Import 你的 GitHub 仓库"
    echo "   - 添加环境变量："
    echo "     * SUPABASE_URL"
    echo "     * SUPABASE_ANON_KEY"
    echo "   - 点击 Deploy"
    echo ""
    echo "3️⃣  测试网站"
    echo "   - 访问分配的域名"
    echo "   - 用 admin/admin123 登录管理员"
    echo ""
    echo "============================================"
    echo "📖 详细步骤请查看:"
    echo "   - DEPLOYMENT_GUIDE.md (新手指南)"
    echo "   - QUICK_REFERENCE.md (快速参考)"
    echo "============================================"
else
    echo ""
    echo "❌ 推送失败，请检查："
    echo "   1. GitHub 仓库地址是否正确"
    echo "   2. 是否有推送权限"
    echo "   3. 是否需要配置 Personal Access Token"
    echo ""
    echo "💡 如果需要 Token，请在 GitHub 创建："
    echo "   Settings → Developer settings → Personal access tokens"
    echo ""
fi
