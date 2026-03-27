import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 数据库初始化API
 * 部署后调用此API初始化数据库约束和测试数据
 * 
 * 调用方式：POST /api/admin/init-database
 * Header: x-admin-key: your-admin-key
 */
export async function POST(request: NextRequest) {
  try {
    // 简单的安全验证
    const adminKey = request.headers.get('x-admin-key');
    const expectedKey = process.env.ADMIN_INIT_KEY || 'init-' + Date.now();
    
    if (adminKey !== expectedKey) {
      return NextResponse.json(
        { error: '无权执行此操作' },
        { status: 403 }
      );
    }
    
    const client = getSupabaseClient();
    const results: string[] = [];
    
    // 1. 检查学生表是否有数据
    const { data: students, error: studentError } = await client
      .from('students')
      .select('id')
      .limit(1);
    
    if (studentError) {
      return NextResponse.json(
        { error: '数据库连接失败', details: studentError },
        { status: 500 }
      );
    }
    
    if (!students || students.length === 0) {
      results.push('⚠️ 学生表为空，需要导入学生数据');
    } else {
      results.push('✅ 学生表有数据');
    }
    
    // 2. 检查seat_logs表是否存在
    const { error: logCheckError } = await client
      .from('seat_logs')
      .select('id')
      .limit(1);
    
    if (logCheckError) {
      if (logCheckError.message.includes('relation') || logCheckError.message.includes('does not exist')) {
        results.push('⚠️ seat_logs表不存在，需要在Supabase控制台创建');
        results.push('');
        results.push('请在Supabase SQL Editor中执行以下SQL:');
        results.push('```sql');
        results.push(`CREATE TABLE seat_logs (
  id SERIAL PRIMARY KEY,
  class_name VARCHAR(50) NOT NULL,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  student_name VARCHAR(50) NOT NULL,
  group_number INTEGER,
  slot_number INTEGER,
  action VARCHAR(20) NOT NULL,
  details VARCHAR(500),
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX seat_logs_class_name_idx ON seat_logs(class_name);
CREATE INDEX seat_logs_student_id_idx ON seat_logs(student_id);
CREATE INDEX seat_logs_action_idx ON seat_logs(action);
CREATE INDEX seat_logs_created_at_idx ON seat_logs(created_at);`);
        results.push('```');
      }
    } else {
      results.push('✅ seat_logs表存在');
    }
    
    // 3. 检查唯一约束
    results.push('');
    results.push('📋 请确保group_slots表有以下唯一约束:');
    results.push('```sql');
    results.push(`-- 在Supabase SQL Editor中执行：
ALTER TABLE group_slots 
ADD CONSTRAINT IF NOT EXISTS unique_class_group_slot 
UNIQUE (class_name, group_number, slot_number);

ALTER TABLE group_slots 
ADD CONSTRAINT IF NOT EXISTS unique_class_student 
UNIQUE (class_name, student_id);`);
    results.push('```');
    
    // 4. 返回统计信息
    const { count: studentCount } = await client
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    const { count: slotCount } = await client
      .from('group_slots')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({
      success: true,
      message: '数据库检查完成',
      stats: {
        students: studentCount || 0,
        slots: slotCount || 0,
      },
      results,
      adminKey: expectedKey, // 返回key用于首次调用
    });
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return NextResponse.json(
      { error: '数据库初始化失败', details: String(error) },
      { status: 500 }
    );
  }
}
