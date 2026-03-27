-- ============================================
-- 部署环境数据库修复脚本
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ============================================

-- 1. 创建操作日志表
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

-- 2. 创建索引
CREATE INDEX IF NOT EXISTS seat_logs_class_name_idx ON seat_logs(class_name);
CREATE INDEX IF NOT EXISTS seat_logs_student_id_idx ON seat_logs(student_id);
CREATE INDEX IF NOT EXISTS seat_logs_action_idx ON seat_logs(action);
CREATE INDEX IF NOT EXISTS seat_logs_created_at_idx ON seat_logs(created_at);

-- 3. 添加唯一约束（并发安全必需）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_class_group_slot') THEN
    ALTER TABLE group_slots ADD CONSTRAINT unique_class_group_slot UNIQUE (class_name, group_number, slot_number);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_class_student') THEN
    ALTER TABLE group_slots ADD CONSTRAINT unique_class_student UNIQUE (class_name, student_id);
  END IF;
END $$;

-- 4. 验证表结构
SELECT 'students表记录数' as info, COUNT(*) as count FROM students
UNION ALL
SELECT 'group_slots表记录数', COUNT(*) FROM group_slots
UNION ALL
SELECT 'seat_logs表记录数', COUNT(*) FROM seat_logs;
