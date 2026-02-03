# Cloudflare Pages 部署指南

## 项目信息

- **项目名**: immersa-3d
- **域名**: immersa3d.top
- **框架**: Vite + React + TypeScript + Three.js
- **Cloudflare 账户**: 0f8f1da12e94b759dbb330c45ef4f8c0

---

## 部署方式选择

### 方式一: Git 集成自动部署（推荐）

通过连接 GitHub/GitLab 仓库，每次推送自动部署。

### 方式二: Wrangler CLI 手动部署

使用命令行工具手动上传构建文件。

---

## 方式一: Git 集成自动部署

### 1. 确保代码已推送到 Git 仓库

```bash
# 检查当前 git 状态
git status

# 添加所有更改
git add .

# 提交更改
git commit -m "Prepare for Cloudflare Pages deployment"

# 推送到远程仓库
git push origin main
```

### 2. 在 Cloudflare Dashboard 配置

1. 访问 https://dash.cloudflare.com/0f8f1da12e94b759dbb330c45ef4f8c0/pages
2. 点击 "Create a project"
3. 选择 "Connect to Git"
4. 选择你的 GitHub/GitLab 账户和 immersa-3d 仓库
5. 构建配置:
   - **Framework preset**: None (或选择 Vite)
   - **Build command**: `npm ci && npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
6. 点击 "Save and Deploy"

### 3. 配置环境变量

在 Cloudflare Dashboard > Pages > immersa-3d > Settings > Environment variables:

```
VITE_GEMINI_API_KEY = your_api_key_here
NODE_ENV = production
```

### 4. 绑定自定义域名

1. 访问 immersa-3d 项目的 "Custom domains" 页面
2. 点击 "Set up a custom domain"
3. 输入 `immersa3d.top`
4. 按照提示完成 DNS 配置

---

## 方式二: Wrangler CLI 手动部署

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler login
# 会打开浏览器让你授权
```

### 3. 构建项目

```bash
npm ci
npm run build
```

### 4. 部署到 Pages

```bash
# 部署到生产环境
wrangler pages deploy dist --project-name=immersa-3d --branch=main

# 或者创建预览部署
wrangler pages deploy dist --project-name=immersa-3d --branch=preview
```

---

## 重要注意事项

### API Key 安全

⚠️ **不要将 VITE_GEMINI_API_KEY 提交到 Git！**

当前 `.env` 文件包含 API key，部署前需要:

1. 在 Cloudflare Dashboard 中设置环境变量
2. 本地保留 `.env` 用于开发
3. 确保 `.env` 在 `.gitignore` 中

检查 `.gitignore`:

```bash
# 确保包含这些行
.env
.env.local
.env.*.local
dist/
node_modules/
```

### 域名配置

#### 方式一: 一键自动配置（推荐）

使用脚本自动绑定域名：

**步骤 1: 获取 Cloudflare API Token**

1. 访问 https://dash.cloudflare.com/profile/api-tokens
2. 点击 "Create Token"
3. 选择 "Custom token"
4. 配置权限:
   - **Zone:Read** (必需)
   - **Zone:Edit** (必需)
   - **Page Rules:Edit** (可选)
5. **区域资源**: 选择 "Include" → "Specific zone" → "immersa3d.top"
6. 点击 "Continue" → "Create Token"
7. **复制生成的 Token** (只显示一次!)

**步骤 2: 运行域名配置脚本**

**Windows (PowerShell):**

```powershell
.\setup-domain.ps1 YOUR_API_TOKEN
```

**Linux/Mac:**

```bash
chmod +x setup-domain.sh
./setup-domain.sh YOUR_API_TOKEN
```

**脚本会自动完成:**

- ✓ 验证 API Token
- ✓ 查找 immersa3d.top 的 Zone ID
- ✓ 添加域名到 Pages 项目
- ✓ 显示当前绑定的域名列表

#### 方式二: 手动配置

如果一键脚本无法使用，可以手动配置:

1. 访问 https://dash.cloudflare.com/0f8f1da12e94b759dbb330c45ef4f8c0/pages/view/immersa-3d/domains
2. 点击 "Set up a custom domain"
3. 输入: `immersa3d.top`
4. 点击 "Continue"
5. 等待 SSL 证书自动签发
6. 访问 https://immersa3d.top 验证

---

## 故障排除

### 构建失败

```bash
# 清理并重新构建
npm run clean
rm -rf node_modules
npm ci
npm run build
```

### 内存不足

如果遇到内存错误，在 `package.json` 中添加:

```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' tsc --noEmit && vite build"
  }
}
```

### 资源加载 404

确保 `vite.config.ts` 中的 `base` 配置正确:

- 使用根域名: `base: '/'`
- 使用子路径: `base: '/your-path/'`

当前配置已是 `base: '/'`，适用于 immersa3d.top

---

## 部署后验证清单

- [ ] 访问 https://immersa3d.top 正常显示
- [ ] 3D 场景加载正常
- [ ] 文件上传功能正常
- [ ] API 调用正常（如果有）
- [ ] 移动端响应式正常
- [ ] 控制台无错误

---

## 快速部署命令

```bash
# 完整部署流程
npm ci
npm run build
wrangler pages deploy dist --project-name=immersa-3d --branch=main

# 或者使用项目脚本（如果已配置）
npm run deploy
```

## 查看部署

- **生产环境**: https://immersa3d.top
- **Cloudflare Dashboard**: https://dash.cloudflare.com/0f8f1da12e94b759dbb330c45ef4f8c0/pages
