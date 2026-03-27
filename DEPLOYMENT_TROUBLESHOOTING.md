# 部署环境诊断指南

## 问题现象
- ✅ 预览环境：选座功能正常
- ❌ 部署环境：看不到已选座位

## 原因分析
预览环境和部署环境使用**不同的数据库实例**，需要确保：
1. 部署环境的数据库表结构完整
2. seat_logs表已创建
3. 唯一约束已添加

## 诊断方法

### 1. 访问诊断API
在浏览器打开：
```
https://您的部署域名/api/debug/database?class=材料A2511
```

检查返回的数据：
- `students.total` 应该是 29（每班学生数）
- `logs.exists` 应该是 true
- 如果 `logs.error` 显示 "relation does not exist"，说明需要创建表

### 2. 在Supabase控制台执行SQL

打开 Supabase Dashboard → SQL Editor，执行：

```sql
-- 1. 创建操作日志表（如果不存在）
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

-- 3. 添加唯一约束（防止并发重复占座）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_class_group_slot') THEN
    ALTER TABLE group_slots ADD CONSTRAINT unique_class_group_slot UNIQUE (class_name, group_number, slot_number);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_class_student') THEN
    ALTER TABLE group_slots ADD CONSTRAINT unique_class_student UNIQUE (class_name, student_id);
  END IF;
END $$;
```

### 3. 重新部署
在Coze控制台点击"重新构建"并"部署"

## 常见问题

### Q: 预览正常，部署异常？
A: 两个环境使用不同数据库，需要在部署环境的Supabase执行上述SQL

### Q: 如何获取Supabase控制台地址？
A: 访问 https://supabase.com/dashboard，找到您的项目

### Q: 学生数据从哪来？
A: 需要确认students表有数据，如果没有需要导入
