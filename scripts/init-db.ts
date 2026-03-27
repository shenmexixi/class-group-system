/**
 * 数据库初始化脚本
 * 用于在部署环境初始化表结构和基础数据
 */

import { getSupabaseClient } from '../src/storage/database/supabase-client';

const CLASS_NAMES = [
  '材料A2511',
  '材料A2512',
  '材料A2513',
  '材料A2514',
  '材料A2515',
];

// 每班29个学生的测试数据
const STUDENT_DATA: Record<string, string[]> = {
  '材料A2511': [
    '马逸成', '方妍', '王玉新', '叶思宇', '田嘉怡',
    '朱轶凡', '朱元瑾', '刘欣泽', '刘逸扬', '陈艺玮',
    '沈佳乐', '张明旸', '李沂洋', '陈俊明', '陈星铔',
    '吴杰涛', '张嘉桐', '李本鑫', '钟志杭', '贺雅萍',
    '殷子恒', '徐嘉', '莫明钊', '贾履琛', '符骏浩',
    '曾冠智', '赛婷', '管韩阳', '佘天宇',
  ],
};

async function initDatabase() {
  console.log('开始初始化数据库...');
  
  const client = getSupabaseClient();
  
  // 1. 创建seat_logs表（如果不存在）
  console.log('创建seat_logs表...');
  const { error: createLogError } = await client.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS seat_logs (
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
      
      CREATE INDEX IF NOT EXISTS seat_logs_class_name_idx ON seat_logs(class_name);
      CREATE INDEX IF NOT EXISTS seat_logs_student_id_idx ON seat_logs(student_id);
      CREATE INDEX IF NOT EXISTS seat_logs_action_idx ON seat_logs(action);
      CREATE INDEX IF NOT EXISTS seat_logs_created_at_idx ON seat_logs(created_at);
    `,
  });
  
  if (createLogError && !createLogError.message.includes('already exists')) {
    console.error('创建seat_logs表失败:', createLogError);
  } else {
    console.log('seat_logs表创建成功');
  }
  
  // 2. 添加唯一约束
  console.log('添加唯一约束...');
  const { error: constraintError } = await client.rpc('exec_sql', {
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_class_group_slot') THEN
          ALTER TABLE group_slots ADD CONSTRAINT unique_class_group_slot UNIQUE (class_name, group_number, slot_number);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_class_student') THEN
          ALTER TABLE group_slots ADD CONSTRAINT unique_class_student UNIQUE (class_name, student_id);
        END IF;
      END $$;
    `,
  });
  
  if (constraintError) {
    console.error('添加约束失败（可能已存在）:', constraintError.message);
  } else {
    console.log('唯一约束添加成功');
  }
  
  // 3. 检查学生数据
  const { data: existingStudents, error: checkError } = await client
    .from('students')
    .select('class_name')
    .limit(1);
  
  if (checkError) {
    console.error('检查学生数据失败:', checkError);
    return;
  }
  
  if (existingStudents && existingStudents.length > 0) {
    console.log('学生数据已存在，跳过初始化');
    return;
  }
  
  // 4. 插入学生数据
  console.log('插入学生数据...');
  let studentId = 2025020290;
  
  for (const className of CLASS_NAMES) {
    const students = STUDENT_DATA['材料A2511']; // 使用相同的学生名字
    
    for (let i = 0; i < students.length; i++) {
      const { error: insertError } = await client
        .from('students')
        .insert({
          student_id: `STU${studentId++}`,
          name: students[i],
          gender: Math.random() > 0.5 ? '男' : '女',
          class_name: className,
        });
      
      if (insertError) {
        console.error(`插入学生失败 (${className} - ${students[i]}):`, insertError);
      }
    }
    
    console.log(`${className} 学生数据插入完成`);
  }
  
  console.log('数据库初始化完成！');
}

// 执行初始化
initDatabase().catch(console.error);
