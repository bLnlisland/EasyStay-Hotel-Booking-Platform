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

### 认证模块
#### 普通用户注册
-**URL**-：POST /auth/register
-**权限**-：公开
-**请求体（JSON）**-：

```json
{
  "username": "string（3-50字符）",
  "email": "string（邮箱格式）",
  "password": "string（6-100字符）",
  "full_name": "string（可选）",
  "phone": "string（可选）"
}
```
成功响应（201）：

```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "number",
      "username": "string",
      "email": "string",
      "role": "user",
      "full_name": "string"
    },
    "token": "string"
  }
}
```
#### 商户注册
-**URL**-：POST /auth/register/merchant
-**权限**-：公开

-**请求体（JSON）**-：

```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "business_name": "string",
  "business_license": "string（18位统一信用代码）",
  "license_image": "string（图片URL）",
  "contact_name": "string",
  "phone": "string",
  "address": "string（可选）",
  "full_name": "string（可选）"
}
```
成功响应（201）：

```json
{
  "success": true,
  "message": "商户注册成功，请等待管理员审核",
  "data": {
    "id": "number",
    "username": "string",
    "email": "string",
    "role": "merchant",
    "approval_status": "pending",
    "business_name": "string"
  }
}
```
#### 管理员自助注册
-**URL**-：POST /auth/register/admin

-**权限**-：公开（注意：生产环境应限制此接口）

-**请求体（JSON）**-：

```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "full_name": "string（可选）",
  "phone": "string（可选）"
}
```
成功响应（201）：

```json
{
  "success": true,
  "message": "管理员创建成功",
  "data": {
    "id": "number",
    "username": "string",
    "email": "string",
    "role": "admin"
  }
}
```
#### 用户登录
-**URL**-：POST /auth/login
-**权限**-：公开

-**请求体**-（JSON）：

```json
{
  "username": "string（用户名或邮箱）",
  "password": "string"
}
```
成功响应（200）：

```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "number",
      "username": "string",
      "email": "string",
      "role": "string（user/merchant/admin）",
      "full_name": "string",
      "phone": "string",
      "avatar": "string|null",
      "is_active": "boolean"
    },
    "token": "string"
  }
}
```
#### 获取当前用户信息
-**URL**-：GET /auth/profile
-**权限**-：需认证
-**成功响应（200）**-：

```json
{
  "success": true,
  "data": {
    "id": "number",
    "username": "string",
    "email": "string",
    "role": "string",
    "full_name": "string",
    "phone": "string",
    "avatar": "string|null",
    "is_active": "boolean",
    "last_login": "datetime"
  }
}
```
#### 更新用户信息
-**URL**-：PUT /auth/profile
-**权限**-：需认证
-**请求体（JSON）**-：

```json
{
  "full_name": "string（可选）",
  "phone": "string（可选）",
  "avatar": "string（可选，图片URL）"
}
```
成功响应（200）：

```json
{
  "success": true,
  "message": "个人信息更新成功",
  "data": { /* 更新后的用户对象 */ }
}
```
#### 修改密码
-**URL**-：PUT /auth/change-password
-**权限**-：需认证

-**请求体（JSON）**-：

```json
{
  "current_password": "string",
  "new_password": "string"
}
```
成功响应（200）：

```json
{
  "success": true,
  "message": "密码修改成功",
  "data": { "token": "string（新token）" }
}
```
#### 退出登录
-**URL**-：POST /auth/logout
-**权限**-：需认证（仅前端清除token，服务端无操作）

成功响应（200）：

```json
{
  "success": true,
  "message": "已退出登录"
}
```
#### 诊断接口（开发调试用）
-**URL**-：GET /auth/diagnose
-**权限**-：公开（建议开发环境开启）

成功响应（200）：

```json
{
  "success": true,
  "message": "诊断完成，所有测试通过",
  "tests": ["数据库连接正常", "User模型正常", "bcrypt加密正常", "直接创建用户正常"]
}
```
### 公共酒店模块
-**以下接口无需认证，用于前台展示**-

#### 获取酒店列表（公开）
-**URL**-：GET /hotels/public
-**权限**-：公开

-**查询参数**-：

参数	  类型	   说明
city	  string	城市名称（模糊匹配）
guests	number	入住人数（默认2）
page	  number	页码（默认1）
limit	  number	每页数量（默认10）
sort_by	string	排序字段（默认created_at）
order	  string	排序方向（asc/desc，默认desc）
成功响应（200）：

```json
{
  "success": true,
  "data": {
    "hotels": [
      {
        "id": "number",
        "name_zh": "string",
        "name_en": "string",
        "city": "string",
        "address": "string",
        "star_rating": "number",
        "min_price": "number",
        "images": [{ "url": "string" }],
        // ... 其他酒店字段
      }
    ],
    "pagination": {
      "total": "number",
      "page": "number",
      "limit": "number",
      "total_pages": "number",
      "has_more": "boolean"
    },
    "filters": { /* 实际应用的筛选条件 */ }
  }
}
```
#### 获取酒店详情（公开）
-**URL**-：GET /hotels/public/:id
-**权限**-：公开

-**路径参数**-：

参数	类型	 说明
id	 number	酒店ID

-**查询参数**-：

参数	     类型	    说明
check_in	 date	   入住日期（可选，用于计算价格）
check_out	 date	   离店日期（可选）
guests	   number	 入住人数（默认2）
成功响应（200）：

```json
{
  "success": true,
  "data": {
    "id": "number",
    "name_zh": "string",
    "name_en": "string",
    "city": "string",
    "address": "string",
    "description": "string",
    "star_rating": "number",
    "facilities": ["string"],
    "images": [{ "url": "string", "is_main": "boolean" }],
    "room_types": [
      {
        "id": "number",
        "name": "string",
        "base_price": "number",
        "discount_rate": "number",
        "discounted_price": "number",
        "available_count": "number",
        "max_guests": "number"
      }
    ],
    "min_price": "number",
    "max_price": "number",
    "avg_price": "number",
    "merchant": { "id": "number", "username": "string", "full_name": "string", "phone": "string", "email": "string" },
    "selected_dates": { "check_in": "string", "check_out": "string", "nights": "number" },
    "estimated_total": "number"
  }
}
```
#### 搜索酒店
-**URL**-：GET /hotels/search
-**权限**-：公开

-**查询参数**-：

参数	         类型	      说明
keyword	     string	     关键词（酒店名、地址等）
min_price	   number	     最低价格
max_price	   number	     最高价格
star_rating	 number	     星级
city	       string	     城市
guests	     number	     入住人数（默认2）
page	       number	     页码（默认1）
limit	       number	     每页数量（默认10）
-**响应格式**-：同酒店列表

#### 快速搜索（自动补全）
-**URL**-：GET /hotels/search/quick
-**权限**-：公开

-**查询参数**-：

参数	类型	   说明
q	    string	搜索词（至少2字符）
limit	number	返回结果数量（默认3）
-**成功响应（200）**-：

```json
{
  "success": true,
  "data": {
    "hotels": [
      {
        "id": "number",
        "name_zh": "string",
        "name_en": "string",
        "city": "string",
        "star_rating": "number",
        "min_price": "number",
        "image": "string|null",
        "type": "hotel"
      }
    ],
    "cities": [
      {
        "city": "string",
        "province": "string",
        "hotel_count": "number",
        "type": "city"
      }
    ],
    "suggestions": ["string"]
  }
}
```
#### 获取热门城市
-**URL**-：GET /hotels/popular-cities
-**权限**-：公开

-**查询参数**-：

参数	 类型	    说明
limit	 number	返回城市数量（默认5）
-**成功响应（200）**-：

```json
{
  "success": true,
  "data": [
    {
      "city": "string",
      "province": "string",
      "hotel_count": "number",
      "min_price": "number"
    }
  ]
}
```
#### 获取价格区间统计
-**URL**-：GET /hotels/prices/ranges
-**权限**-：公开

-**查询参数**-：

参数	 类型	   说明
city	string	城市名称（可选）
-**成功响应（200）**-：

```json
{
  "success": true,
  "data": {
    "min_price": "number",
    "max_price": "number",
    "ranges": [
      { "min": "number", "max": "number", "count": "number", "label": "string" }
    ],
    "suggestion_ranges": [ /* 预定义区间 */ ]
  }
}
```
#### 获取设施选项
-**URL**-：GET /hotels/facilities/options
-**权限**-：公开

-**成功响应（200）**-：

```json
{
  "success": true,
  "data": {
    "facilities": [
      { "id": "string", "name": "string", "icon": "string", "category": "string" }
    ],
    "categorized": { "网络": [...], "交通": [...], ... },
    "categories": ["网络", "交通", ...]
  }
}
```
#### 获取推荐酒店
-**URL**-：GET /hotels/recommended
-**权限**-：公开

-**查询参数**-：

参数	 类型	    说明
city	string	城市（可选）
limit	number	返回数量（默认4）
-**成功响应（200）**-：

```json
{
  "success": true,
  "data": {
    "hotels": [ /* 酒店列表，包含recommendation_reason字段 */ ],
    "recommendation_criteria": { "min_stars": 4, "city": "string" }
  }
}
```
### 商户酒店管理模块
-**以下接口需要商户角色认证（或管理员）**-

#### 获取当前商户的酒店列表
-**URL**-：GET /hotels/my
-**权限**-：商户或管理员

-**成功响应（200）**-：

```json
{
  "success": true,
  "data": [ /* 酒店数组，包含主图 */ ]
}
```
#### 获取当前商户的单个酒店详情（用于编辑）
-**URL**-：GET /hotels/:id
-**权限**-：商户或管理员（商户只能访问自己的酒店）

-**路径参数**-：

参数	类型	 说明
id	 number	酒店ID
-**成功响应（200）**-：

```json
{
  "success": true,
  "data": { /* 酒店详情，包含所有字段和关联的图片、房型 */ }
}
```
#### 创建酒店
-**URL**-：POST /hotels

-**权限**-：商户或管理员

-**请求体（JSON）**-：

```json
{
  "name_zh": "string",
  "name_en": "string（可选）",
  "city": "string",
  "address": "string",
  "description": "string（可选）",
  "star_rating": "number",
  "facilities": ["string"],
  "contact_phone": "string",
  "contact_email": "string（可选）",
  "check_in_time": "string（如14:00）",
  "check_out_time": "string（如12:00）",
  "room_types": [
    {
      "name": "string",
      "base_price": "number",
      "discount_rate": "number（0.1~1，默认1）",
      "max_guests": "number",
      "available_count": "number"
    }
  ]
  // 其他可选酒店字段
}
```
成功响应（201）：

```json
{
  "success": true,
  "message": "酒店创建成功",
  "data": { /* 创建的酒店对象（包含房型） */ }
}
```
#### 更新酒店
-**URL**-：PUT /hotels/:id
-**权限**-：商户或管理员（商户只能更新自己的酒店）

-**路径参数**-：

参数	类型	 说明
id	 number	酒店ID
-**请求体**-：同创建酒店，可只传需要修改的字段。room_types 将完全替换原有房型（若提供）。

-**成功响应（200）**-：

```json
{
  "success": true,
  "message": "酒店更新成功",
  "data": { /* 更新后的酒店对象 */ }
}
```
#### 提交酒店审核
-**URL**-：POST /hotels/:id/submit
-**权限**-：商户或管理员（商户只能提交自己的酒店）

-**路径参数**-：

参数	类型	说明
id	number	酒店ID
-**成功响应（200）**-：

```json
{
  "success": true,
  "message": "酒店已提交审核",
  "data": { /* 酒店对象，status变为pending */ }
}
```
#### 删除酒店（软删除）
-**URL**-：DELETE /hotels/:id
-**权限**-：商户或管理员（商户只能删除自己的酒店）

-**路径参数**-：

参数	类型	  说明
id	 number	 酒店ID
-**成功响应（200）**-：

```json
{
  "success": true,
  "message": "酒店已删除"
}
```
### 管理员酒店管理模块
-**以下接口需要管理员角色认证**-

#### 获取所有酒店（管理员）
-**URL**-：GET /hotels/admin/all
-**权限**-：管理员

-**查询参数**-：

参数	   类型	   说明
status	string	按状态筛选（pending/approved/rejected等）
page	  number	默认1
limit	  number	默认10
-**成功响应（200）**-：

```json
{
  "success": true,
  "data": {
    "hotels": [
      {
        "id": "number",
        "name_zh": "string",
        "status": "string",
        "merchant": { "id": "number", "username": "string" },
        "contact_phone": "string",
        "created_at": "datetime"
      }
    ],
    "pagination": { "total": "number", "page": "number", "limit": "number", "total_pages": "number" }
  }
}
```
#### 管理员获取酒店详情（审核用）
-**URL**-：GET /hotels/admin/:id
-**权限**-：管理员

-**路径参数**-：

参数	类型	 说明
id	 number	酒店ID
-**成功响应（200）**-：

```json
{
  "success": true,
  "data": {
    /* 酒店完整信息，包含商户信息、图片、房型、创建时间等 */
  }
}
```
#### 更新酒店状态（审核）
-**URL**-：PUT /hotels/admin/:id/status
-**权限**-：管理员

-**路径参数**-：

参数	类型	  说明
id	 number	 酒店ID
-**请求体（JSON）**-：

```json
{
  "status": "string（approved/rejected/pending）",
  "review_notes": "string（拒绝时填写理由）"
}
```
成功响应（200）：

```json
{
  "success": true,
  "message": "酒店已审核通过/审核拒绝/重置为待审核",
  "data": { /* 更新后的酒店对象 */ }
}
```
#### 获取管理员统计信息
-**URL**-：GET /hotels/admin/stats
-**权限**-：管理员

-**成功响应（200）**-：

```json
{
  "success": true,
  "data": {
    "total_hotels": "number",
    "by_status": { "draft": "number", "pending": "number", "approved": "number", "rejected": "number" },
    "by_star_rating": [ { "star_rating": "number", "count": "number" } ],
    "by_city": [ { "city": "string", "province": "string", "count": "number" } ]
  }
}
```
### 酒店图片管理模块
#### 上传酒店图片
-**URL**-：POST /hotels/:id/images
-**权限**-：商户或管理员（商户只能操作自己的酒店）

-**路径参数**-：

参数	类型	  说明
id	 number	 酒店ID
-**请求格式**-：multipart/form-data

字段	    类型	    说明
images	  file	  多张图片（可多个同名字段）
alt_text	string	可选，图片描述
mainIndex	number	可选，指定哪一张为主图（基于文件顺序，默认0）
-**成功响应（201）**-：

```json
{
  "message": "Uploaded",
  "images": [ /* 创建的图片对象数组 */ ]
}
```
#### 获取酒店图片列表
-**URL**-：GET /hotels/:id/images
-**权限**-：公开（但根据酒店状态可能受限）

-**路径参数**-：

参数	类型	  说明
id	 number	 酒店ID
-**成功响应（200）**-：

```json
{
  "images": [
    { "id": "number", "url": "string", "alt_text": "string", "is_main": "boolean", "order": "number" }
  ]
}
```
#### 删除酒店图片
-**URL**-：DELETE /hotels/:id/images/:imageId
-**权限**-：商户或管理员（商户只能操作自己的酒店）

-**路径参数**-：

参数	  类型	    说明
id	    number	酒店ID
imageId	number	图片ID
-**成功响应（200）**-：

```json
{
  "message": "Deleted"
}
```
-**注意事项**-
所有需要认证的接口，请在请求头中添加：Authorization: Bearer <token>

-**错误响应格式通常为**-：

```json
{
  "success": false,
  "message": "错误信息",
  "errors": ["详细错误列表"] // 仅验证失败时存在
}
```
-**文件上传接口的 Content-Type 必须为 multipart/form-data**-

-**分页接口中，page 和 limit 参数均为正整数，超出范围会调整为默认值**-

-**酒店状态值**-：draft（草稿）、pending（待审核）、approved（已通过）、rejected（已拒绝）、deleted（已删除，软删除）等。