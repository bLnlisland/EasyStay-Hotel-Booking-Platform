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