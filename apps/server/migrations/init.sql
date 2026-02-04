-- 创建数据库
CREATE DATABASE IF NOT EXISTS hotel_booking DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hotel_booking;

-- 使用数据库
USE hotel_booking;

-- 删除所有存在的表（按依赖顺序）
DROP TRIGGER IF EXISTS before_booking_insert;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS hotel_images;
DROP TABLE IF EXISTS room_types;
DROP TABLE IF EXISTS hotels;
DROP TABLE IF EXISTS users;
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('merchant', 'admin', 'user') DEFAULT 'user' NOT NULL,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  avatar VARCHAR(500) DEFAULT '/default-avatar.png',
  is_active BOOLEAN DEFAULT TRUE,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_email (email),
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 酒店表
CREATE TABLE IF NOT EXISTS hotels (
  id INT PRIMARY KEY AUTO_INCREMENT,
  merchant_id INT NOT NULL,
  name_zh VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  description TEXT,
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100) NOT NULL,
  province VARCHAR(50),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  star_rating INT DEFAULT 3 CHECK (star_rating BETWEEN 1 AND 5),
  opening_year INT,
  facilities JSON DEFAULT (JSON_ARRAY()),
  status ENUM('draft', 'under_review', 'approved', 'rejected', 'offline') DEFAULT 'draft' NOT NULL,
  rejection_reason TEXT,
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  check_in_time VARCHAR(10) DEFAULT '14:00',
  check_out_time VARCHAR(10) DEFAULT '12:00',
  policy TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (merchant_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_city (city),
  INDEX idx_status (status),
  INDEX idx_star_rating (star_rating),
  INDEX idx_merchant_id (merchant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 房型表
CREATE TABLE IF NOT EXISTS room_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hotel_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  area DECIMAL(6, 2),
  max_guests INT DEFAULT 2,
  bed_type VARCHAR(50),
  facilities JSON DEFAULT (JSON_ARRAY()),
  base_price DECIMAL(10, 2) NOT NULL,
  discount_rate DECIMAL(3, 2) DEFAULT 1.00,
  available_count INT DEFAULT 10,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  INDEX idx_hotel_id (hotel_id),
  INDEX idx_price (base_price),
  INDEX idx_is_available (is_available)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 酒店图片表
CREATE TABLE IF NOT EXISTS hotel_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hotel_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(200),
  is_main BOOLEAN DEFAULT FALSE,
  `order` INT DEFAULT 0,  -- 注意：使用反引号包裹保留字
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  INDEX idx_hotel_id (hotel_id),
  INDEX idx_is_main (is_main)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 预订表
CREATE TABLE IF NOT EXISTS bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  hotel_id INT NOT NULL,
  room_type_id INT NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  adults INT DEFAULT 2,
  children INT DEFAULT 0,
  rooms INT DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,
  status ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'pending',
  payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
  payment_method VARCHAR(50),
  special_requests TEXT,
  booking_reference VARCHAR(50) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (hotel_id) REFERENCES hotels(id),
  FOREIGN KEY (room_type_id) REFERENCES room_types(id),
  INDEX idx_user_id (user_id),
  INDEX idx_hotel_id (hotel_id),
  INDEX idx_status (status),
  INDEX idx_payment_status (payment_status),
  INDEX idx_booking_reference (booking_reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 审核日志表
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hotel_id INT NOT NULL,
  admin_id INT NOT NULL,
  action ENUM('approve', 'reject', 'suspend', 'activate') NOT NULL,
  reason TEXT,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id),
  INDEX idx_hotel_id (hotel_id),
  INDEX idx_admin_id (admin_id),
  INDEX idx_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 添加简化的触发器生成预订参考号
DROP TRIGGER IF EXISTS before_booking_insert;

CREATE TRIGGER before_booking_insert
BEFORE INSERT ON bookings
FOR EACH ROW
SET NEW.booking_reference = 
  IF(
    NEW.booking_reference IS NULL, 
    CONCAT('BK', UNIX_TIMESTAMP() * 1000, LPAD(FLOOR(RAND() * 1000), 3, '0')), 
    NEW.booking_reference
  );

-- 插入初始数据
INSERT INTO users (username, email, password, role, full_name, phone) VALUES
('admin', 'admin@hotel.com', '$2a$10$YourHashedPasswordHere', 'admin', '系统管理员', '13800138000'),
('merchant1', 'merchant@hotel.com', '$2a$10$YourHashedPasswordHere', 'merchant', '酒店商户', '13800138001'),
('user1', 'user@example.com', '$2a$10$YourHashedPasswordHere', 'user', '普通用户', '13800138002');

-- 注意：实际使用时需要生成真实的bcrypt哈希密码