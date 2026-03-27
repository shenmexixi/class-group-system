import { getSupabaseClient } from '../src/storage/database/supabase-client';

async function createAdmin() {
  const client = getSupabaseClient();
  
  // 创建默认管理员账号
  // 密码: admin123 (实际应用中应该使用bcrypt加密)
  const adminData = {
    username: 'admin',
    password_hash: 'admin123', // 简化处理，实际应使用bcrypt
  };
  
  const { data, error } = await client
    .from('admins')
    .insert(adminData)
    .select();
  
  if (error) {
    if (error.code === '23505') {
      console.log('管理员账号已存在');
    } else {
      console.error('创建管理员失败:', error);
      throw error;
    }
  } else {
    console.log('管理员账号创建成功:', data);
  }
}

createAdmin().catch(console.error);
