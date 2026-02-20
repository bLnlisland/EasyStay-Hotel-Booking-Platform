-- 删除用户 forevil 及其关联数据（在 MySQL 中执行）
-- 使用前：请先 use 你的数据库名；建议先备份。

-- 第一步：查出 forevil 的 id（记下结果里的 id，下面用 @uid 代替）
SELECT id, username, role FROM users WHERE username = 'forevil';
-- 假设得到的 id 是 7，则下面把 @uid 换成 7，或使用变量：

SET @uid = (SELECT id FROM users WHERE username = 'forevil' LIMIT 1);

-- 第二步：按依赖顺序删除（先子表后父表）

-- 删除该商户下所有酒店的图片
DELETE FROM hotel_images WHERE hotel_id IN (SELECT id FROM hotels WHERE merchant_id = @uid);

-- 删除该商户下所有酒店的房型
DELETE FROM room_types WHERE hotel_id IN (SELECT id FROM hotels WHERE merchant_id = @uid);

-- 若有预订表，按需取消注释：
-- DELETE FROM bookings WHERE hotel_id IN (SELECT id FROM hotels WHERE merchant_id = @uid);
-- DELETE FROM bookings WHERE user_id = @uid;

-- 删除该商户的酒店
DELETE FROM hotels WHERE merchant_id = @uid;

-- 最后删除用户
DELETE FROM users WHERE id = @uid;

-- 核对（应无结果）：
-- SELECT * FROM users WHERE username = 'forevil';
