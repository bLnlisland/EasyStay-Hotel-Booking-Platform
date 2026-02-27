# EasyStay 酒店预订平台

EasyStay 是一个功能完整的酒店预订平台，包含用户前台、商户后台和管理员后台。项目采用前后端分离架构，前端基于 React，后端基于 Node.js + Express + MySQL。

---

## ✨ 核心功能

### 用户端 (user-web)
- **酒店搜索与浏览**  
  - 支持按城市、关键词、价格区间、星级、设施筛选酒店，**筛选条件自动同步至 URL**，刷新或分享可复现场景。
  - 获取热门城市、价格区间统计、设施选项，支持酒店推荐。
  - 查看酒店详情，包括房型、图片、最低价格、位置地图（基于**高德定位**：浏览器 Geolocation 获取经纬度，逆地理编码解析城市并回填，定位结果写入 URL 参数）。
- **用户账户管理**  
  - 注册、登录、修改密码、更新个人信息。

### 商户端 (admin-web)
- **酒店管理**  
  - 创建、编辑、删除自己的酒店。
  - 上传酒店图片，支持多图上传和主图设置。
  - 管理房型（价格、面积、库存等）。
  - 提交酒店审核（状态流转：**草稿 draft → 待审核 pending → 已通过 approved / 已拒绝 rejected**）。
  - **审核与上下线分离**：审核通过的酒店需管理员手动“上线”（`is_online: true`）才对用户端可见，支持“通过但暂不开放”的业务场景。
- **统计概览**  
  - 查看自己酒店的各类状态数量（草稿、待审核、已通过等）。

### 管理员端 (admin-web)
- **酒店审核**  
  - 查看待审核酒店列表，查看酒店详情（含商户信息）。
  - 审核通过/拒绝酒店，填写拒绝理由。
- **全局管理**  
  - 查看所有酒店（支持按状态筛选）。
  - **上线/下线控制**：对已审核酒店进行独立上下线操作。
  - **平台统计**：获取酒店总数、状态分布、星级分布、城市分布。
- **用户管理**（预留）

### 通用功能
- **认证与授权**  
  - 基于 JWT 的登录认证，角色分为 、`merchant`、`admin`，路由级权限控制。
- **文件上传**  
  - 支持上传酒店图片（商户/管理员），图片存储在 `server/uploads` 目录，访问路径为 `/uploads/文件名`。
- **数据验证**  
  - 使用 Joi 验证请求参数，确保数据完整性。

---

## 🛠 技术栈

### 后端 (server)
- **Node.js + Express**：RESTful API 服务
- **Sequelize ORM**：数据库操作
- **MySQL**：关系型数据库
- **JWT**：用户认证
- **Multer**：文件上传
- **Joi**：请求数据验证
- **bcryptjs**：密码加密

### 前端 (admin-web / user-web)
- **React 18 + Hooks**
- **React Router v6**：路由管理
- **Ant Design**：UI 组件库（admin-web）
- **Axios**：HTTP 请求
- **Create React App**：项目脚手架
- **高德地图 API**：位置选择与逆地理编码（user-web）

---

## 📁 项目结构
EasyStay-Hotel-Booking-Platform/
├── apps/
│ ├── admin-web/ # 管理后台前端
│ │ ├── public/
│ │ ├── src/
│ │ ├── .env.example
│ │ └── package.json
│ ├── server/ # 后端服务
│ │ ├── migrations/ # 数据库迁移脚本
│ │ ├── scripts/ # 工具脚本
│ │ ├── src/ # 源码（控制器、模型、路由等）
│ │ ├── uploads/ # 上传文件存储目录（需映射）
│ │ ├── .env.example
│ │ └── package.json
│ └── user-web/ # 用户前台前端
│ ├── public/
│ ├── src/
│ ├── .env.example
│ └── package.json
├── README.md
└── .gitignore

---

## 🚀 快速开始

### 环境要求
- **Node.js** 16+
- **MySQL** 5.7+
- **npm** 或 **yarn**

### 1. 克隆项目
```bash
git clone https://github.com/your-repo/EasyStay-Hotel-Booking-Platform.git
cd EasyStay-Hotel-Booking-Platform
2. 配置数据库
创建 MySQL 数据库（例如 hotel_booking），字符集建议 utf8mb4。

3. 后端配置与启动
bash
cd apps/server

# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，填写必要配置（见下方说明）
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=yourpassword
# DB_NAME=hotel_booking
# JWT_SECRET=your_jwt_secret
# PORT=3000

# 安装依赖
npm install

# 初始化数据库（创建表结构 + 初始种子数据）
npm run migrate   # 执行 migrations 中的 SQL
npm run seed      # 插入默认管理员/测试数据

# 启动开发服务器（支持热重启）
npm run dev
后端服务默认运行在 http://localhost:3000，API 基础路径为 /api。

种子数据说明：

默认管理员账号：admin / admin123（登录后可自行修改）

默认商户账号：merchant1 / 123456

包含若干测试酒店和房型数据，方便直接体验。

4. 管理后台配置与启动
bash
cd apps/admin-web

# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，至少设置：
# PORT=3001
# REACT_APP_API_BASE=http://localhost:3000/api

# 安装依赖
npm install

# 启动开发服务器
npm start
管理后台默认运行在 http://localhost:3001。

5. 用户前台配置与启动
bash
cd apps/user-web

# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，至少设置：
# PORT=3002
# REACT_APP_API_BASE=http://localhost:3000/api
# REACT_APP_AMAP_KEY=你的高德地图API Key（用于定位）

# 安装依赖
npm install

# 启动开发服务器
npm start
用户前台默认运行在 http://localhost:3002。

端口说明：

服务	      默认端口	           可修改位置
后端          server	3000	 server/.env 中的 PORT
管理后台      admin-web	3001	 admin-web/.env 中的 PORT
用户前台      user-web	3002	 user-web/.env 中的 PORT
若端口被占用，开发服务器会自动询问是否使用其他端口，但建议直接修改 .env 固定端口，避免混淆。

🔐 认证与授权
登录：POST /auth/login，返回包含 token 的 JSON。

认证方式：所有需要认证的接口，请求头中必须携带：

text
Authorization: Bearer <your_token>
角色：user（普通用户）、merchant（商户）、admin（管理员）。

权限控制：后端通过中间件验证角色，接口按模块区分权限（详见 API 文档）。

示例（使用 curl）：

bash
# 登录获取 token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 使用 token 访问需要认证的接口
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

📦 环境变量配置
后端 (server/.env)
ini
# 服务器
PORT=3000
NODE_ENV=development

# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=hotel_booking

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# 文件上传
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880   # 5MB

管理后台 (admin-web/.env)
ini
PORT=3001
REACT_APP_API_BASE=http://localhost:3000/api

用户前台 (user-web/.env)
ini
PORT=3002
REACT_APP_API_BASE=http://localhost:3000/api
REACT_APP_AMAP_KEY=your_amap_web_api_key   # 用于高德定位，需自行申请
注意：.env 文件不应提交到 Git，示例文件已提供 .env.example。本地开发可复制为 .env.development.local 并填入真实值。

📷 图片上传与访问
上传：商户/管理员通过 POST /hotels/:id/images（multipart/form-data）上传图片，成功返回图片对象（含 url 字段）。

存储路径：图片保存在 server/uploads/ 目录下。

访问规则：上传后返回的 url 为相对路径，例如 /uploads/xxx.jpg。开发环境下需确保后端静态服务已配置：

javascript
// server/src/app.js 中已添加
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
部署注意：生产环境需将 /uploads 路径反向代理到后端服务器的 uploads 目录，或使用独立对象存储。

🗺️ 高德定位（用户端亮点）
流程：用户访问时，浏览器请求地理位置权限 → 获取经纬度 → 调用高德逆地理编码 API 解析城市 → 自动填充搜索框并触发列表筛选。

结果同步：定位得到的城市会写入 URL 参数（如 ?city=上海），刷新页面或分享链接可保持状态。

兼容性：

HTTPS 环境：iOS 要求地理位置必须通过 HTTPS 访问，若在本地开发可使用 localhost 绕过，或使用 Chrome DevTools 的 Sensors 面板模拟定位。

降级处理：定位失败时静默忽略，用户可手动选择城市。

🧪 测试
后端测试

cd apps/server
npm test
测试文件位于 apps/server/tests，使用 Jest + Supertest 编写。


📄 API 文档
详细的接口列表、请求/响应格式请参阅：apps/server/API.md（需自行生成）或启动后端后访问 Swagger 文档（若集成）。
接口设计遵循 RESTful 风格，主要模块包括：

认证接口（注册/登录/个人信息/修改密码）

公共酒店接口（列表/详情/搜索/热门城市/价格区间/设施选项/推荐）

商户酒店管理接口（增删改查/提交审核）

管理员酒店管理接口（审核/统计/上下线）

酒店图片管理接口（上传/列表/删除）

🌐 部署指南
后端部署
设置生产环境变量（NODE_ENV=production），修改数据库连接为生产库。

安装依赖：npm install --production。

使用 PM2 或 systemd 管理进程：

bash
npm install -g pm2
pm2 start src/app.js --name hotel-backend
前端部署（以 Nginx 为例）
分别构建 admin-web 和 user-web：

bash
cd apps/admin-web
npm run build   # 生成 build/ 目录
# 将 build/ 目录部署到 Nginx 静态目录，例如 /var/www/admin
Nginx 配置示例（假设域名分别为 admin.example.com 和 www.example.com）：

nginx
# 管理后台
server {
    listen 80;
    server_name admin.example.com;
    root /var/www/admin;
    index index.html;
    location / {
        try_files $uri /index.html;
    }
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /uploads {
        proxy_pass http://localhost:3000/uploads;   # 图片访问
    }
}

# 用户前台
server {
    listen 80;
    server_name www.example.com;
    root /var/www/user;
    index index.html;
    location / {
        try_files $uri /index.html;
    }
    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /uploads {
        proxy_pass http://localhost:3000/uploads;
    }
}
🌐 线上生产环境部署
一、线上访问地址
项目已完成公网部署，您可以通过以下地址直接访问：

服务	地址	说明
用户主站	https://easy-stay.online	用户端前台
管理后台	https://easy-stay.online/admin	商户/管理员后台
后端 API	https://easy-stay.online/api	API 接口（可用于调试）
✅ 已启用 HTTPS（Let's Encrypt 证书），全站加密访问。

二、部署环境
组件	技术选型
云服务器	腾讯云 CVM (Ubuntu 20.04+)
Web 服务器	Nginx
后端运行	Node.js + Express
数据库	MySQL + Sequelize ORM
进程管理	systemd
SSL 证书	Certbot (Let's Encrypt)，自动续期
三、整体架构设计
text
https://easy-stay.online
├── /                → 用户端前端（静态文件，/var/www/user）
├── /admin           → 管理端前端（静态文件，/var/www/admin）
└── /api             → 反向代理到后端服务（127.0.0.1:3000）
架构亮点：

✅ 前后端同域部署：彻底规避跨域问题

✅ 统一 API 入口：前端统一使用 /api 作为接口前缀

✅ 多前端同域共存：通过路径区分用户端和管理端

✅ HTTPS 全站加密：安全可靠

四、后端部署说明
4.1 运行环境
后端服务运行在 127.0.0.1:3000

使用 systemd 保证常驻运行与自动重启

生产环境变量配置（NODE_ENV=production）

4.2 systemd 服务配置
创建服务文件 /etc/systemd/system/hotel-backend.service：

ini
[Unit]
Description=EasyStay Backend Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/path/to/your/server
ExecStart=/usr/bin/npm run start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
启用服务：
sudo systemctl enable hotel-backend
sudo systemctl start hotel-backend
五、前端部署说明
5.1 用户端 (user-web)
bash
cd apps/user-web
npm install
npm run build
# 将 build/ 目录部署到服务器 /var/www/user
5.2 管理端 (admin-web)
bash
cd apps/admin-web
npm install
npm run build
# 将 build/ 目录部署到服务器 /var/www/admin
六、Nginx 配置
nginx
server {
    listen 443 ssl http2;
    server_name easy-stay.online;

    # SSL 证书配置（Certbot 自动生成）
    ssl_certificate /etc/letsencrypt/live/easy-stay.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/easy-stay.online/privkey.pem;

    # 用户端
    location / {
        root /var/www/user;
        try_files $uri /index.html;
    }

    # 管理端
    location /admin {
        alias /var/www/admin;
        try_files $uri /admin/index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name easy-stay.online;
    return 301 https://$server_name$request_uri;
}
七、部署状态与验证
检查项	状态	验证方式
用户端访问	✅ 正常	访问 https://easy-stay.online
管理端访问	✅ 正常	访问 https://easy-stay.online/admin
API 响应	✅ 正常	访问 https://easy-stay.online/api/hotels/public
HTTPS 证书	✅ 有效	浏览器地址栏显示安全锁标志
证书自动续期	✅ 已配置	Certbot 定时任务运行中
八、部署亮点总结
✅ 完整生产化部署：从本地开发到云端上线的全流程实践
✅ 前后端同域架构：优雅解决跨域，简化前端配置
✅ 多前端同域共存：用户端与管理端共用同一域名
✅ HTTPS 安全加密：Let's Encrypt 证书，自动续期
✅ 进程守护：systemd 保证后端服务 7×24 小时可用
✅ 一键构建部署：前端构建脚本清晰，部署流程可复现
❓ 常见问题
Q：前端请求后端出现跨域错误？
A：后端已配置 CORS，允许所有来源。若使用 Nginx 反向代理，请确保 proxy_pass 正确。

Q：上传的图片无法显示（404）？
A：检查后端是否启动静态服务（app.use('/uploads', express.static(...))），或 Nginx 是否正确代理 /uploads 路径。

Q：如何创建管理员账号？
A：可通过 /auth/register/admin 接口注册（开发环境），或运行种子脚本（npm run seed）生成默认管理员。

Q：用户端定位在 iOS 上失败？
A：iOS 要求地理位置必须在 HTTPS 环境下获取。开发时可使用 localhost 或 Chrome DevTools 模拟。

Q：端口冲突怎么办？
A：修改对应 .env 文件中的 PORT 变量，重启服务。
