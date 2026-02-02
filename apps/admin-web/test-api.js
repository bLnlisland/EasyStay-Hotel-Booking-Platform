// scripts/test-api.js - API测试脚本
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testAPI() {
  console.log('🧪 开始测试API接口...\n');

  try {
    // 1. 测试健康检查
    console.log('1. 测试健康检查...');
    const healthRes = await axios.get('http://localhost:3000/health');
    console.log(`   ✅ ${healthRes.data.status} - ${healthRes.data.timestamp}`);

    // 2. 测试注册
    console.log('\n2. 测试用户注册...');
    try {
      const registerRes = await axios.post(`${API_BASE_URL}/auth/register`, {
        username: 'testmerchant',
        email: 'test@example.com',
        password: 'password123',
        role: 'merchant',
        full_name: '测试商户',
        phone: '13800138000'
      });
      console.log(`   ✅ 注册成功: ${registerRes.data.message}`);
    } catch (error) {
      if (error.response?.data?.message?.includes('已存在')) {
        console.log('   ⚠️  用户已存在，跳过注册');
      } else {
        console.log(`   ❌ 注册失败: ${error.response?.data?.message || error.message}`);
      }
    }

    // 3. 测试登录
    console.log('\n3. 测试用户登录...');
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'testmerchant',
      password: 'password123'
    });
    const token = loginRes.data.data.token;
    console.log(`   ✅ 登录成功: ${loginRes.data.message}`);
    console.log(`   🔑 Token: ${token.substring(0, 30)}...`);

    // 4. 测试创建酒店
    console.log('\n4. 测试创建酒店...');
    const hotelData = {
      name_zh: '测试酒店',
      name_en: 'Test Hotel',
      description: '这是一个测试酒店',
      address: '上海市测试区测试路123号',
      city: '上海',
      province: '上海市',
      star_rating: 4,
      opening_year: 2020,
      facilities: ['免费WiFi', '停车场', '游泳池'],
      contact_phone: '021-12345678',
      contact_email: 'hotel@example.com'
    };

    const createRes = await axios.post(`${API_BASE_URL}/hotels`, hotelData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   ✅ 创建酒店成功: ${createRes.data.message}`);
    const hotelId = createRes.data.data.id;
    console.log(`   🏨 酒店ID: ${hotelId}`);

    // 5. 测试获取酒店列表
    console.log('\n5. 测试获取酒店列表...');
    const listRes = await axios.get(`${API_BASE_URL}/hotels/public`);
    console.log(`   ✅ 获取到 ${listRes.data.data.pagination.total} 个酒店`);

    // 6. 测试获取酒店详情
    console.log('\n6. 测试获取酒店详情...');
    const detailRes = await axios.get(`${API_BASE_URL}/hotels/public/${hotelId}`);
    console.log(`   ✅ 获取酒店详情: ${detailRes.data.data.name_zh}`);

    // 7. 测试获取我的酒店
    console.log('\n7. 测试获取我的酒店...');
    const myHotelsRes = await axios.get(`${API_BASE_URL}/hotels/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`   ✅ 获取到 ${myHotelsRes.data.data.pagination.total} 个我的酒店`);

    console.log('\n🎉 所有测试完成！');
    console.log('\n📋 可用测试账号：');
    console.log('   用户名: testmerchant');
    console.log('   密码: password123');
    console.log('   角色: merchant');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('💡 请确保：');
    console.error('   1. 服务器已启动: npm run dev');
    console.error('   2. 数据库连接正常');
    console.error('   3. API端口为3000');
  }
}

// 执行测试
testAPI();