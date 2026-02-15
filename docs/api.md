<<<<<<< HEAD
# 🏨 酒店管理系统 API 文档

## 基础信息

- **基础URL**: `http://localhost:3000/api/hotels`
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

### 公开接口（无需认证）
1. [获取酒店列表](#获取酒店列表)
2. [获取酒店详情](#获取酒店详情)
3. [搜索酒店](#搜索酒店)
4. [快速搜索](#快速搜索)
5. [获取热门城市](#获取热门城市)
6. [获取价格区间](#获取价格区间)
7. [获取设施选项](#获取设施选项)
8. [获取推荐酒店](#获取推荐酒店)

### 商户接口（需商户或管理员认证）
9. [获取我的酒店列表](#获取我的酒店列表)
10. [创建酒店](#创建酒店)
11. [更新酒店信息](#更新酒店信息)
12. [提交酒店审核](#提交酒店审核)
13. [删除酒店](#删除酒店)

### 管理员接口（需管理员认证）
14. [获取所有酒店](#获取所有酒店)
15. [更新酒店状态](#更新酒店状态)
16. [获取管理员统计](#获取管理员统计)



### 用户注册
- **URL**: `/api/auth/register`
- **方法**: `POST`
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
-**成功**：

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
-**失败**：

```json

{
  "success": false,
  "message": "请求数据验证失败",
  "errors": ["错误信息"]
}
```
#### 用户登录
-**URL**: /api/auth/login
-**方法**: POST
-**请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```
-**响应**:

-**成功**：
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
-**失败**：
```json
{
  "success": false,
  "message": "用户名或密码错误"
}
```
### 商户注册
-**URL**-：/auth/register/merchant
-**方法**-：POST
-**权限**-：公开

-**请求参数（JSON）**-：
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
-**响应示例（成功）**-：

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
-**说明**-：注册后 approval_status 为 pending，需管理员审核通过后方可登录。

###  管理员注册
-**URL**-：/auth/register/admin
-**方法**-：POST
-**权限**-：仅限超级管理员（role = superadmin）

-**请求参数（JSON）**-：

```json
{
  "username": "用户名",
  "email": "邮箱",
  "password": "密码",
  "full_name": "姓名（可选）",
  "phone": "手机号（可选）"
}
```
-**响应示例（成功）**-：

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
#### 获取当前用户信息
-**URL**: /api/auth/profile
-**方法**: GET
-**响应**:
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
### 酒店接口
#### 获取酒店列表（公开接口）
-**URL**: /api/hotels/public
-**方法**: GET
-**查询参数**:
city: 城市

check_in: 入住日期

check_out: 离店日期

guests: 客人数量（默认2人）

min_price: 最低价格

max_price: 最高价格

star_rating: 星级评分

facilities: 设施（逗号分隔）

page: 页码（默认1）

limit: 每页数量（默认10）

-**响应**:

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
#### 搜索酒店
-**URL**: /api/hotels/search
-**方法**: GET
-**路径参数**:
参数名	    类型	必填	说明
keyword	  string	否	关键词搜索（酒店名、地址、描述）
city	    string	否	按城市搜索
min_price	number	否	最低价格（需要和max_price同时使用）
max_price	number	否	最高价格（需要和min_price同时使用）
响应示例
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
#### 获取酒店详情
-**URL**: /api/hotels/public/:id
-**方法**: GET
-**路径参数**:

id: 酒店ID

查询参数:

check_in: 入住日期

check_out: 离店日期

guests: 客人数量（默认2人）

-**响应**:

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
        "discount_rate": "float",
        "discounted_price": "float",
        "max_guests": "integer",
        "total_price": "float"
      }
    ],
    "min_price": "float",
    "max_price": "float",
    "estimated_total": "float"
  }
}
```
#### 获取价格区间
-**URL**:/api/hotels/prices/ranges
-**方法**: GET
-**响应示例**
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
#### 快速搜索
-**URL**- :/api/hotels/search/quick
-**方法**: GET
-**查询参数**-
参数名	类型	必填	说明
q	    string	是	搜索关键词
-**响应示例**
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
#### 获取设施选项
-**URL**-: /api/hotels/facilities/options
-**方法**: GET
-**响应示例**-
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
#### 获取推荐酒店
-**URL**-:/api/hotels/recommended
-**方法**: GET
-**响应示例**-
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
### 商户接口

#### 获取我的酒店（商户）
-**URL**: /api/hotels/my
-**方法**: GET
-**权限**: merchant 或 admin 权限

-**响应**:

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
#### 创建酒店（商户）
-**URL**: /api/hotels
-**方法**: POST
-**权限**: merchant 或 admin 权限

-**请求体**:

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
      "discount_rate": "float"
    }
  ]
}
```
-**响应**:

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
#### 更新酒店信息（商户）
-**URL**: /api/hotels/:id
-**方法**: PUT
-**权限**: merchant 或 admin 权限

-**响应**:

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
#### 提交酒店审核（商户）
-**URL**: /api/hotels/:id/submit
-**方法**: POST
-**权限**: merchant 或 admin 权限
-**路径参数**-
参数名	类型	必填	说明
id 	  integer	是	酒店ID
-**响应**:

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
### 管理员接口
#### 获取所有酒店（管理员）
-**URL**: /api/hotels/admin/all
-**方法**: GET
-**权限**: admin 权限

-**查询参数**:

status: 酒店状态（可选）

page: 页码（默认1）

limit: 每页数量（默认20）

-**响应**:

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
        }
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
### 管理员功能
#### 更新酒店状态（管理员）
-**URL**: /api/hotels/admin/:id/status
-**方法**: PUT
-**权限**: admin 权限

-**请求体**:

```json

{
  "status": "approved|rejected|pending",
  "review_notes": "string"  // 可选
}
```
-**响应**:

```json

{
  "success": true,
  "message": "酒店状态更新成功"
}
```
#### 获取酒店统计（管理员）
-**URL**: /api/hotels/admin/stats
-**方法**: GET
-**权限**: admin 权限

-**响应**:
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
### 数据库表结构参考
#### 用户表 (users)
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
#### 酒店表 (hotels)
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
  status ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft',
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
#### 房型表 (room_types)
```sql
CREATE TABLE room_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hotel_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  area INT,
  max_guests INT DEFAULT 2,
  bed_type VARCHAR(50),
  facilities TEXT,  -- JSON格式存储
  base_price DECIMAL(10, 2) NOT NULL,
  discount_rate DECIMAL(3, 2) DEFAULT 1.00,
  available_count INT DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id)
);
```
#### 酒店图片表 (hotel_images)
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
=======
# 🏨 酒店管理系统 API 文档

## 基础信息

- **基础URL**: `http://localhost:3000/api/hotels`
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

### 公开接口（无需认证）
1. [获取酒店列表](#获取酒店列表)
2. [获取酒店详情](#获取酒店详情)
3. [搜索酒店](#搜索酒店)
4. [快速搜索](#快速搜索)
5. [获取热门城市](#获取热门城市)
6. [获取价格区间](#获取价格区间)
7. [获取设施选项](#获取设施选项)
8. [获取推荐酒店](#获取推荐酒店)

### 商户接口（需商户或管理员认证）
9. [获取我的酒店列表](#获取我的酒店列表)
10. [创建酒店](#创建酒店)
11. [更新酒店信息](#更新酒店信息)
12. [提交酒店审核](#提交酒店审核)
13. [删除酒店](#删除酒店)

### 管理员接口（需管理员认证）
14. [获取所有酒店](#获取所有酒店)
15. [更新酒店状态](#更新酒店状态)
16. [获取管理员统计](#获取管理员统计)



### 用户注册
- **URL**: `/api/auth/register`
- **方法**: `POST`
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
-**成功**：

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
-**失败**：

```json

{
  "success": false,
  "message": "请求数据验证失败",
  "errors": ["错误信息"]
}
```
#### 用户登录
-**URL**: /api/auth/login
-**方法**: POST
-**请求体**:
```json
{
  "username": "string",
  "password": "string"
}
```
-**响应**:

-**成功**：
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
-**失败**：
```json
{
  "success": false,
  "message": "用户名或密码错误"
}
```
#### 获取当前用户信息
-**URL**: /api/auth/profile
-**方法**: GET
-**响应**:
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
### 酒店接口
#### 获取酒店列表（公开接口）
-**URL**: /api/hotels/public
-**方法**: GET
-**查询参数**:
city: 城市

check_in: 入住日期

check_out: 离店日期

guests: 客人数量（默认2人）

min_price: 最低价格

max_price: 最高价格

star_rating: 星级评分

facilities: 设施（逗号分隔）

page: 页码（默认1）

limit: 每页数量（默认10）

-**响应**:

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
#### 搜索酒店
-**URL**: /api/hotels/search
-**方法**: GET
-**路径参数**:
参数名	    类型	必填	说明
keyword	  string	否	关键词搜索（酒店名、地址、描述）
city	    string	否	按城市搜索
min_price	number	否	最低价格（需要和max_price同时使用）
max_price	number	否	最高价格（需要和min_price同时使用）
响应示例
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
#### 获取酒店详情
-**URL**: /api/hotels/public/:id
-**方法**: GET
-**路径参数**:

id: 酒店ID

查询参数:

check_in: 入住日期

check_out: 离店日期

guests: 客人数量（默认2人）

-**响应**:

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
        "discount_rate": "float",
        "discounted_price": "float",
        "max_guests": "integer",
        "total_price": "float"
      }
    ],
    "min_price": "float",
    "max_price": "float",
    "estimated_total": "float"
  }
}
```
#### 获取价格区间
-**URL**:/api/hotels/prices/ranges
-**方法**: GET
-**响应示例**
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
#### 快速搜索
-**URL**- :/api/hotels/search/quick
-**方法**: GET
-**查询参数**-
参数名	类型	必填	说明
q	    string	是	搜索关键词
-**响应示例**
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
#### 获取设施选项
-**URL**-: /api/hotels/facilities/options
-**方法**: GET
-**响应示例**-
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
#### 获取推荐酒店
-**URL**-:/api/hotels/recommended
-**方法**: GET
-**响应示例**-
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
### 商户接口

#### 获取我的酒店（商户）
-**URL**: /api/hotels/my
-**方法**: GET
-**权限**: merchant 或 admin 权限

-**响应**:

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
#### 创建酒店（商户）
-**URL**: /api/hotels
-**方法**: POST
-**权限**: merchant 或 admin 权限

-**请求体**:

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
      "discount_rate": "float"
    }
  ]
}
```
-**响应**:

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
#### 更新酒店信息（商户）
-**URL**: /api/hotels/:id
-**方法**: PUT
-**权限**: merchant 或 admin 权限

-**响应**:

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
#### 提交酒店审核（商户）
-**URL**: /api/hotels/:id/submit
-**方法**: POST
-**权限**: merchant 或 admin 权限
-**路径参数**-
参数名	类型	必填	说明
id 	  integer	是	酒店ID
-**响应**:

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
### 管理员接口
#### 获取所有酒店（管理员）
-**URL**: /api/hotels/admin/all
-**方法**: GET
-**权限**: admin 权限

-**查询参数**:

status: 酒店状态（可选）

page: 页码（默认1）

limit: 每页数量（默认20）

-**响应**:

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
        }
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
### 管理员功能
#### 更新酒店状态（管理员）
-**URL**: /api/hotels/admin/:id/status
-**方法**: PUT
-**权限**: admin 权限

-**请求体**:

```json

{
  "status": "approved|rejected|pending",
  "review_notes": "string"  // 可选
}
```
-**响应**:

```json

{
  "success": true,
  "message": "酒店状态更新成功"
}
```
#### 获取酒店统计（管理员）
-**URL**: /api/hotels/admin/stats
-**方法**: GET
-**权限**: admin 权限

-**响应**:
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
### 数据库表结构参考
#### 用户表 (users)
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
#### 酒店表 (hotels)
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
  status ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft',
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
#### 房型表 (room_types)
```sql
CREATE TABLE room_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hotel_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  area INT,
  max_guests INT DEFAULT 2,
  bed_type VARCHAR(50),
  facilities TEXT,  -- JSON格式存储
  base_price DECIMAL(10, 2) NOT NULL,
  discount_rate DECIMAL(3, 2) DEFAULT 1.00,
  available_count INT DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id)
);
```
#### 酒店图片表 (hotel_images)
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
>>>>>>> 8d1793c950e1be3944f96d42aed7e3ee695e765f
```