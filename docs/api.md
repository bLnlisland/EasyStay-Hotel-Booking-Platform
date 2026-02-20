# 🏨 酒店管理系统 API 文档

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **认证方式**: Bearer Token (JWT)
- **响应格式**: JSON
- **状态码说明**:
  - `200`: 请求成功
  - `201`: 创建成功
  - `400`: 请求参数错误
  - `401`: 未认证
  - `403`: 权限不足
  - `404`: 资源不存在
  - `500`: 服务器内部错误

---

## 目录

### 认证接口
1. [用户注册](#用户注册)
2. [商户注册](#商户注册)
3. [管理员注册](#管理员注册)
4. [用户登录](#用户登录)
5. [获取当前用户信息](#获取当前用户信息)

### 公开接口（无需认证）
6. [获取酒店列表](#获取酒店列表)
7. [获取酒店详情](#获取酒店详情)
8. [搜索酒店](#搜索酒店)
9. [快速搜索](#快速搜索)
10. [获取价格区间](#获取价格区间)
11. [获取设施选项](#获取设施选项)
12. [获取推荐酒店](#获取推荐酒店)

### 商户接口（需商户或管理员认证）
13. [获取我的酒店列表](#获取我的酒店列表)
14. [获取我的酒店详情](#获取我的酒店详情)
15. [创建酒店](#创建酒店)
16. [更新酒店信息](#更新酒店信息)
17. [提交酒店审核](#提交酒店审核)
18. [删除酒店](#删除酒店)
19. [获取酒店图片列表](#获取酒店图片列表)
20. [上传酒店图片](#上传酒店图片)
21. [删除酒店图片](#删除酒店图片)

### 管理员接口（需管理员认证）
22. [获取所有酒店](#获取所有酒店)
23. [获取酒店详情（管理员）](#获取酒店详情管理员)
24. [更新酒店状态](#更新酒店状态)
25. [获取管理员统计](#获取管理员统计)

---

## 认证接口

### 用户注册
- **URL**: `/api/auth/register`
- **方法**: `POST`
- **权限**: 公开
- **请求体**:
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "merchant|user",
  "full_name": "string",
  "phone": "string"
}
```
- **成功响应**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "integer",
      "username": "string",
      "email": "string",
      "role": "string",
      "full_name": "string",
      "phone": "string",
      "avatar": "string",
      "is_active": "boolean"
    },
    "token": "string"
  }
}
```
- **失败响应**:
```json
{
  "success": false,
  "message": "请求数据验证失败",
  "errors": ["错误信息"]
}
```

### 商户注册上传营业执照图片
- **URL**: `POST /api/auth/upload/license`
- **权限**: 公开（注册前上传，无需登录）
- **请求**: `multipart/form-data`，字段名 `license`，单张图片（JPG/PNG 等）
- **响应**: `{ "success": true, "url": "/uploads/xxx.jpg" }`，注册时将该 `url` 作为 `license_image` 提交。

### 商户注册
- **URL**: `/api/auth/register/merchant`
- **方法**: `POST`
- **权限**: 公开
- **请求参数（JSON）**:
```json
{
  "username": "用户名",
  "email": "邮箱",
  "password": "密码",
  "business_name": "商户名称",
  "business_license": "统一社会信用代码（18位）",
  "license_image": "营业执照图片 URL",
  "contact_name": "联系人姓名",
  "phone": "联系电话",
  "address": "经营地址（可选）",
  "full_name": "负责人姓名（可选）"
}
```
- **响应示例（成功）**:
```json
{
  "success": true,
  "message": "商户注册成功，请等待管理员审核",
  "data": {
    "id": 2,
    "username": "merchant1",
    "email": "merchant@test.com",
    "role": "merchant",
    "approval_status": "pending",
    "business_name": "测试酒店"
  }
}
```
- **说明**: 注册后 approval_status 为 pending，需管理员审核通过后方可登录。

### 管理员注册
- **URL**: `/api/auth/register/admin`
- **方法**: `POST`
- **权限**: 公开（管理员自助注册，与商户注册一样无需登录）
- **请求参数（JSON）**:
```json
{
  "username": "用户名",
  "email": "邮箱",
  "password": "密码",
  "full_name": "姓名（可选）",
  "phone": "手机号（可选）"
}
```
- **响应示例（成功）**:
```json
{
  "success": true,
  "message": "管理员创建成功",
  "data": {
    "id": 3,
    "username": "admin1",
    "email": "admin@test.com",
    "role": "admin"
  }
}
```

### 用户登录
- **URL**: `/api/auth/login`
- **方法**: `POST`
- **权限**: 公开
- **请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```
- **成功响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "integer",
      "username": "string",
      "email": "string",
      "role": "string",
      "full_name": "string",
      "phone": "string",
      "avatar": "string",
      "is_active": "boolean"
    },
    "token": "string"
  }
}
```
- **失败响应**:
```json
{
  "success": false,
  "message": "用户名或密码错误"
}
```

### 获取当前用户信息
- **URL**: `/api/auth/profile`
- **方法**: `GET`
- **权限**: 需要认证
- **响应**:
```json
{
  "success": true,
  "data": {
    "id": "integer",
    "username": "string",
    "email": "string",
    "role": "string",
    "full_name": "string",
    "phone": "string",
    "avatar": "string",
    "is_active": "boolean",
    "last_login": "date"
  }
}
```

---

## 酒店接口

### 获取酒店列表（公开接口）
- **URL**: `/api/hotels/public`
- **方法**: `GET`
- **权限**: 公开
- **查询参数**:
  - `city`: 城市
  - `check_in`: 入住日期
  - `check_out`: 离店日期
  - `guests`: 客人数量（默认2人）
  - `min_price`: 最低价格
  - `max_price`: 最高价格
  - `star_rating`: 星级评分
  - `facilities`: 设施（逗号分隔）
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认10）
- **响应**:
```json
{
  "success": true,
  "data": {
    "hotels": [
      {
        "id": "integer",
        "name_zh": "string",
        "city": "string",
        "star_rating": "integer",
        "min_price": "float",
        "images": [
          {
            "url": "string"
          }
        ]
      }
    ],
    "pagination": {
      "total": "integer",
      "page": "integer",
      "limit": "integer",
      "total_pages": "integer",
      "has_more": "boolean"
    }
  }
}
```

### 获取酒店详情
- **URL**: `/api/hotels/public/:id`
- **方法**: `GET`
- **权限**: 公开（但非审核通过的酒店只允许管理员或商户本人查看）
- **路径参数**:
  - `id`: 酒店ID
- **查询参数**:
  - `check_in`: 入住日期（可选）
  - `check_out`: 离店日期（可选）
  - `guests`: 客人数量（默认2人）
- **响应**:
```json
{
  "success": true,
  "data": {
    "id": "integer",
    "name_zh": "string",
    "city": "string",
    "star_rating": "integer",
    "room_types": [
      {
        "id": "integer",
        "name": "string",
        "base_price": "float",
        "area": "float（面积，平方米）",
        "max_guests": "integer",
        "total_price": "float"
      }
    ],
    "min_price": "float",
    "max_price": "float",
    "estimated_total": "float",
    "images": [
      {
        "id": "integer",
        "url": "string",
        "alt_text": "string",
        "is_main": "boolean",
        "order": "integer"
      }
    ]
  }
}
```

### 搜索酒店
- **URL**: `/api/hotels/search`
- **方法**: `GET`
- **权限**: 公开
- **查询参数**:
  - `keyword`: 关键词搜索（酒店名、地址、描述）
  - `city`: 按城市搜索
  - `min_price`: 最低价格（需要和max_price同时使用）
  - `max_price`: 最高价格（需要和min_price同时使用）
- **响应示例**:
```json
{
  "success": true,
  "data": {
    "hotels": [
      {
        "id": 2,
        "name_zh": "北京国际饭店",
        "name_en": "Beijing International Hotel",
        "city": "北京",
        "star_rating": 4,
        "final_price": 450,
        "image": "/images/hotel2.jpg"
      }
    ],
    "count": 1
  }
}
```

### 快速搜索
- **URL**: `/api/hotels/search/quick`
- **方法**: `GET`
- **权限**: 公开
- **查询参数**:
  - `q`: 搜索关键词（必填）
- **响应示例**:
```json
{
  "success": true,
  "data": {
    "hotels": [
      {
        "id": 1,
        "name_zh": "北京大酒店",
        "name_en": "Beijing Grand Hotel",
        "city": "北京",
        "star_rating": 5,
        "image": "/images/hotel1.jpg"
      }
    ],
    "cities": [
      {
        "city": "北京",
        "province": "北京",
        "hotel_count": 8
      }
    ]
  }
}
```

### 获取价格区间
- **URL**: `/api/hotels/prices/ranges`
- **方法**: `GET`
- **权限**: 公开
- **响应示例**:
```json
{
  "success": true,
  "data": {
    "min_price": 180,
    "max_price": 1500,
    "average_price": 450,
    "price_ranges": [
      {
        "range": "0-300",
        "count": 5
      },
      {
        "range": "301-600",
        "count": 8
      },
      {
        "range": "601-900",
        "count": 4
      },
      {
        "range": "901+",
        "count": 3
      }
    ]
  }
}
```

### 获取设施选项
- **URL**: `/api/hotels/facilities/options`
- **方法**: `GET`
- **权限**: 公开
- **响应示例**:
```json
{
  "success": true,
  "data": [
    "免费WiFi",
    "停车场",
    "游泳池",
    "健身房",
    "餐厅",
    "会议室",
    "商务中心",
    "机场接送",
    "洗衣服务",
    "叫车服务",
    "无障碍设施",
    "24小时前台",
    "行李寄存",
    "外币兑换",
    "旅游票务"
  ]
}
```

### 获取推荐酒店
- **URL**: `/api/hotels/recommended`
- **方法**: `GET`
- **权限**: 公开
- **响应示例**:
```json
{
  "success": true,
  "data": {
    "hotels": [
      {
        "id": 1,
        "name_zh": "北京大酒店",
        "name_en": "Beijing Grand Hotel",
        "city": "北京",
        "star_rating": 5,
        "description": "五星级豪华酒店",
        "final_price": 720,
        "image": "/images/hotel1.jpg",
        "room_types": [
          {
            "id": 101,
            "name": "豪华双人间",
            "final_price": 720
          }
        ]
      }
    ]
  }
}
```

---

## 商户接口

### 获取我的酒店列表
- **URL**: `/api/hotels/my`
- **方法**: `GET`
- **权限**: merchant 或 admin 权限
- **响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "integer",
      "name_zh": "string",
      "city": "string",
      "star_rating": "integer",
      "status": "string"
    }
  ]
}
```

### 获取我的酒店详情
- **URL**: `/api/hotels/:id`
- **方法**: `GET`
- **权限**: merchant 或 admin 权限（商户只能查看自己的酒店）
- **路径参数**:
  - `id`: 酒店ID
- **响应**:
```json
{
  "success": true,
  "data": {
    "id": "integer",
    "name_zh": "string",
    "name_en": "string",
    "description": "string",
    "address": "string",
    "city": "string",
    "province": "string",
    "star_rating": "integer",
    "status": "string",
    "facilities": ["string"],
    "contact_phone": "string",
    "contact_email": "string",
    "room_types": [
      {
        "id": "integer",
        "name": "string",
        "base_price": "float",
        "area": "float（面积，平方米，可选）",
        "max_guests": "integer"
      }
    ],
    "images": [
      {
        "id": "integer",
        "url": "string",
        "alt_text": "string",
        "is_main": "boolean",
        "order": "integer"
      }
    ],
    "created_at": "datetime",
    "updated_at": "datetime"
  }
}
```

### 创建酒店
- **URL**: `/api/hotels`
- **方法**: `POST`
- **权限**: merchant 或 admin 权限
- **请求体**:
```json
{
  "name_zh": "string",
  "city": "string",
  "address": "string",
  "star_rating": "integer",
  "facilities": ["wifi", "parking"],
  "room_types": [
    {
      "name": "string",
      "base_price": "float",
      "area": "number（可选，面积平方米）"
    }
  ]
}
```
- **响应**:
```json
{
  "success": true,
  "message": "酒店创建成功",
  "data": {
    "id": "integer",
    "name_zh": "string",
    "city": "string"
  }
}
```

### 更新酒店信息
- **URL**: `/api/hotels/:id`
- **方法**: `PUT`
- **权限**: merchant 或 admin 权限（商户只能更新自己的酒店）
- **路径参数**:
  - `id`: 酒店ID
- **请求体**: 同创建酒店，所有字段可选
- **响应**:
```json
{
  "success": true,
  "message": "酒店更新成功",
  "data": {
    "id": "integer",
    "name_zh": "string",
    "city": "string"
  }
}
```

### 提交酒店审核
- **URL**: `/api/hotels/:id/submit`
- **方法**: `POST`
- **权限**: merchant 或 admin 权限
- **路径参数**:
  - `id`: 酒店ID（必填）
- **响应**:
```json
{
  "success": true,
  "message": "酒店已提交审核",
  "data": {
    "id": "integer",
    "status": "pending"
  }
}
```

### 删除酒店
- **URL**: `/api/hotels/:id`
- **方法**: `DELETE`
- **权限**: merchant 或 admin 权限（商户只能删除自己的酒店）
- **路径参数**:
  - `id`: 酒店ID
- **响应**:
```json
{
  "success": true,
  "message": "酒店删除成功"
}
```

### 获取酒店图片列表
- **URL**: `/api/hotels/:id/images`
- **方法**: `GET`
- **权限**: 公开
- **路径参数**:
  - `id`: 酒店ID
- **响应**:
```json
{
  "images": [
    {
      "id": "integer",
      "hotel_id": "integer",
      "url": "string",
      "alt_text": "string",
      "is_main": "boolean",
      "order": "integer",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ]
}
```
- **说明**: 图片按 `is_main`（主图优先）、`order`（顺序）、`id`（ID）排序返回。

### 上传酒店图片
- **URL**: `/api/hotels/:id/images`
- **方法**: `POST`
- **权限**: merchant 或 admin 权限（商户只能为自己的酒店上传图片）
- **Content-Type**: `multipart/form-data`
- **路径参数**:
  - `id`: 酒店ID
- **请求参数（form-data）**:
  - `images`: 图片文件（可多张，最多10张）
  - `alt_text`: 图片描述（可选，字符串）
  - `mainIndex`: 主图索引（可选，数字，默认为0，即第一张为主图）
- **响应**:
```json
{
  "message": "Uploaded",
  "images": [
    {
      "id": "integer",
      "hotel_id": "integer",
      "url": "string",
      "alt_text": "string",
      "is_main": "boolean",
      "order": "integer",
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ]
}
```
- **说明**: 
  - 上传的图片会保存到服务器的 `/uploads` 目录
  - 返回的 `url` 为 `/uploads/文件名` 格式
  - 如果指定了 `mainIndex`，对应索引的图片会被标记为主图（`is_main: true`）

### 删除酒店图片
- **URL**: `/api/hotels/:id/images/:imageId`
- **方法**: `DELETE`
- **权限**: merchant 或 admin 权限（商户只能删除自己酒店的图片）
- **路径参数**:
  - `id`: 酒店ID
  - `imageId`: 图片ID
- **响应**:
```json
{
  "message": "Deleted"
}
```
- **说明**: 删除图片时，服务器上的文件也会被删除。

---

## 管理员接口

### 获取所有酒店
- **URL**: `/api/hotels/admin/all`
- **方法**: `GET`
- **权限**: admin 权限
- **查询参数**:
  - `status`: 酒店状态（可选，如：pending、approved、rejected）
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20）
- **响应**:
```json
{
  "success": true,
  "data": {
    "hotels": [
      {
        "id": "integer",
        "name_zh": "string",
        "status": "approved",
        "merchant": {
          "id": "integer",
          "username": "string"
        },
        "contact_phone": "string",
        "created_at": "datetime"
      }
    ],
    "pagination": {
      "total": "integer",
      "page": "integer",
      "limit": "integer",
      "total_pages": "integer"
    }
  }
}
```

### 获取酒店详情（管理员）
- **URL**: `/api/hotels/admin/:id`
- **方法**: `GET`
- **权限**: admin 权限
- **路径参数**:
  - `id`: 酒店ID
- **响应**:
```json
{
  "success": true,
  "data": {
    "id": "integer",
    "name_zh": "string",
    "name_en": "string",
    "description": "string",
    "address": "string",
    "city": "string",
    "province": "string",
    "star_rating": "integer",
    "status": "string",
    "rejection_reason": "string",
    "facilities": ["string"],
    "contact_phone": "string",
    "contact_email": "string",
    "created_at": "datetime",
    "updated_at": "datetime",
    "merchant": {
      "id": "integer",
      "username": "string",
      "full_name": "string",
      "phone": "string",
      "email": "string"
    },
    "room_types": [
      {
        "id": "integer",
        "name": "string",
        "base_price": "float",
        "area": "float（面积，平方米，可选）",
        "max_guests": "integer"
      }
    ],
    "images": [
      {
        "id": "integer",
        "url": "string",
        "alt_text": "string",
        "is_main": "boolean",
        "order": "integer"
      }
    ]
  }
}
```
- **说明**: 此接口用于管理员审核酒店，返回完整的酒店信息（包括商户信息、房型、图片等）。

### 更新酒店状态
- **URL**: `/api/hotels/admin/:id/status`
- **方法**: `PUT`
- **权限**: admin 权限
- **路径参数**:
  - `id`: 酒店ID
- **请求体**:
```json
{
  "status": "approved|rejected|pending|offline",
  "review_notes": "string"  // 可选，审核不通过时的原因
}
```
- **响应**:
```json
{
  "success": true,
  "message": "酒店状态更新成功",
  "data": {
    "id": "integer",
    "status": "string"
  }
}
```
- **说明**: 
  - `status` 可选值：`approved`（审核通过）、`rejected`（审核不通过）、`pending`（待审核）、`offline`（下线）
  - 当 `status` 为 `rejected` 时，`review_notes` 会被写入 `rejection_reason` 字段
  - 当 `status` 为 `approved` 时，`rejection_reason` 会被清空

### 获取管理员统计
- **URL**: `/api/hotels/admin/stats`
- **方法**: `GET`
- **权限**: admin 权限
- **响应**:
```json
{
  "success": true,
  "data": {
    "total_hotels": "integer",
    "by_status": {
      "approved": "integer",
      "pending": "integer",
      "rejected": "integer"
    },
    "by_star_rating": [
      {
        "star_rating": "integer",
        "count": "integer"
      }
    ],
    "by_city": [
      {
        "city": "string",
        "province": "string",
        "count": "integer"
      }
    ]
  }
}
```

---

## 数据库表结构参考

### 用户表 (users)
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'merchant', 'user') DEFAULT 'user',
  full_name VARCHAR(100),
  phone VARCHAR(20),
  avatar VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 酒店表 (hotels)
```sql
CREATE TABLE hotels (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name_zh VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  description TEXT,
  address VARCHAR(255),
  city VARCHAR(50),
  province VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  star_rating INT CHECK (star_rating BETWEEN 1 AND 5),
  opening_year INT,
  facilities TEXT,  -- JSON格式存储
  status ENUM('draft', 'pending', 'approved', 'rejected', 'offline', 'deleted') DEFAULT 'draft',
  rejection_reason TEXT,
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  check_in_time VARCHAR(5),
  check_out_time VARCHAR(5),
  policy TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  merchant_id INT,
  FOREIGN KEY (merchant_id) REFERENCES users(id)
);
```

### 房型表 (room_types)
```sql
CREATE TABLE room_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hotel_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  area DECIMAL(6, 2),  -- 面积（平方米）
  max_guests INT DEFAULT 2,
  bed_type VARCHAR(50),
  facilities TEXT,  -- JSON格式存储
  base_price DECIMAL(10, 2) NOT NULL,
  available_count INT DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id)
);
```

### 酒店图片表 (hotel_images)
```sql
CREATE TABLE hotel_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hotel_id INT NOT NULL,
  url VARCHAR(255) NOT NULL,
  alt_text VARCHAR(255),
  is_main BOOLEAN DEFAULT false,
  `order` INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id)
);
```
