# EasyStay 酒店预订平台
EasyStay 是一个功能完整的酒店预订平台，包含用户前台、商户后台和管理员后台。项目采用前后端分离架构，前端基于 React，后端基于 Node.js + Express + MySQL。

## 技术栈
### 后端 (server)

**Node.js + Express**：RESTful API 服务

**Sequelize ORM**：数据库操作

**MySQL**：关系型数据库

**JWT**：用户认证

**Multer**：文件上传

**Joi**：请求数据验证

**bcryptjs**：密码加密

### 前端 (admin-web / user-web)

**React 18 + Hooks**

**React Router v6**：路由管理

**Ant Design**：UI 组件库（admin-web）

**Axios**：HTTP 请求

**Create React App**：项目脚手架

## 项目结构
text
EasyStay-Hotel-Booking-Platform/
├── apps/
│   ├── admin-web/          # 管理后台前端
│   │   ├── public/         # 静态资源
│   │   ├── src/            # 源码（组件、页面、路由等）
│   │   ├── .env            # 环境变量
│   │   ├── package.json
│   │   └── ...
│   ├── server/             # 后端服务
│   │   ├── migrations/     # 数据库迁移脚本
│   │   ├── scripts/        # 工具脚本
│   │   ├── src/            # 源码（控制器、模型、路由等）
│   │   ├── uploads/        # 上传文件存储目录
│   │   ├── .env.example    # 环境变量示例
│   │   ├── package.json
│   │   └── ...
│   └── user-web/           # 用户前台前端
│       ├── public/
│       ├── src/
│       ├── .env
│       ├── package.json
│       └── ...
├── README.md               # 项目总说明
## 环境要求
Node.js 16 或更高版本

MySQL 5.7 或更高版本

npm 或 yarn

## 快速开始
### 克隆项目

git clone https://github.com/your-repo/EasyStay-Hotel-Booking-Platform.git
cd EasyStay-Hotel-Booking-Platform
### 配置数据库
创建 MySQL 数据库（例如 hotel_booking）

根据需要修改字符集：utf8mb4

### 后端配置与运行

cd apps/server

#### 复制环境变量示例文件
cp .env.example .env

**编辑 .env 文件，填写数据库连接信息及其他配置**

**服务器配置**
PORT=3000
NODE_ENV=development

**数据库配置**
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=hotel_booking

**JWT 配置**
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

**文件上传**
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880  # 5MB

#### 安装依赖
npm install

#### 初始化数据库（创建表结构）
npm run migrate

#### （可选）插入初始数据
npm run seed

#### 启动开发服务器（支持热重启）
npm run dev
后端服务默认运行在 http://localhost:3000，API 基础路径为 /api。

### 管理后台配置与运行

cd apps/admin-web

#### 安装依赖
npm install

#### 启动开发服务器
npm start
管理后台默认运行在 http://localhost:3001（若 3000 端口被后端占用）。可在 .env 中修改端口。

### 用户前台配置与运行

cd apps/user-web

#### 安装依赖
npm install

#### 启动开发服务器
npm start
用户前台默认运行在 http://localhost:3002。

## API 文档
详细的 API 文档请参考：API.md

接口设计遵循 RESTful 风格，认证使用 Bearer Token。

## 测试
### 后端测试

cd apps/server
npm test
测试文件位于 apps/server/tests，使用 Jest + Supertest 编写。

## 部署
### 后端部署
#### 设置生产环境变量（NODE_ENV=production）

#### 安装依赖：npm install --production

#### 使用 PM2 或 systemd 管理进程：
npm install -g pm2
pm2 start src/app.js --name hotel-backend

### 前端部署
#### 分别构建 admin-web 和 user-web：
cd apps/admin-web
npm run build
#### 将 build/ 目录部署到 Nginx 或静态服务器

**Nginx 配置示例**：

nginx
server {
    listen 80;
    server_name admin.example.com;
    root /path/to/admin-web/build;
    index index.html;
    location / {
        try_files $uri /index.html;
    }
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

## ✨ 核心功能
### 用户端 (user-web)

**酒店搜索与浏览**

支持按城市、关键词、价格区间、星级、设施筛选酒店。

获取热门城市、价格区间统计、设施选项。

查看酒店详情，包括房型、图片、最低价格等。

**用户账户管理**

注册、登录、修改密码、更新个人信息。

### 商户端 (admin-web)

**酒店管理**

创建、编辑、删除自己的酒店。

上传酒店图片，支持多图上传和主图设置。

管理房型（价格、折扣、库存等）。

提交酒店审核（状态流转：草稿 → 待审核 → 已通过/已拒绝）。

**统计概览**

查看自己酒店的各类状态数量（草稿、待审核、已通过等）。

### 管理员端 (admin-web)

**酒店审核**

查看待审核酒店列表，查看酒店详情（含商户信息）。

审核通过/拒绝酒店，填写拒绝理由。

**全局管理**

查看所有酒店（支持按状态筛选）。

获取平台统计：酒店总数、状态分布、星级分布、城市分布。

### 通用功能

**认证与授权**

基于 JWT 的登录认证，角色分为 user、merchant、admin。

路由权限控制（普通用户、商户、管理员各自可访问不同接口）。

**文件上传**

支持上传酒店图片（商户/管理员），图片存储在 server/uploads 目录。

**数据验证**

使用 Joi 验证请求参数，确保数据完整性。

📦 模块划分
模块	           说明	                                    主要技术点
用户前台	供普通用户搜索酒店、查看详情、预订（预留）	React, Ant Design, Axios
商户后台	供酒店商户管理自己的酒店和房型	           React, Ant Design, Axios
管理后台	供系统管理员审核酒店、查看统计	           React, Ant Design, Axios
后端服务	提供 RESTful API，处理业务逻辑和数据存储   Node.js, Express, Sequelize, MySQL, JWT
🔍 已完成接口（后端）
详细 API 列表请参考 API 文档，涵盖：

认证接口（注册/登录/个人信息/修改密码）

公共酒店接口（列表/详情/搜索/热门城市/价格区间/设施选项/推荐）

商户酒店管理接口（增删改查/提交审核）

管理员酒店管理接口（审核/统计）

酒店图片管理接口（上传/列表/删除）
## 常见问题
Q：前端请求后端出现跨域错误？
A：后端已配置 CORS，允许来自所有来源的请求。如果使用 Nginx 反向代理，需确保代理配置正确。

Q：如何创建管理员账号？
A：可通过 /auth/register/admin 接口注册（开发环境），或直接插入数据库（生产环境需加密密码）。