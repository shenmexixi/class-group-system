import { getSupabaseClient } from '../src/storage/database/supabase-client';
import * as fs from 'fs';

interface StudentData {
  学号: string;
  姓名: string;
  性别: string;
  年级: string;
  专业: string;
  班级: string;
  手机号码: string;
}

async function importStudents() {
  const client = getSupabaseClient();
  
  // 读取学生数据
  const rawData = fs.readFileSync('/tmp/students.json', 'utf-8');
  const data = JSON.parse(rawData);
  const students: StudentData[] = data.sheet1;
  
  // 过滤出需要的5个班级
  const targetClasses = ['材料A2511', '材料A2512', '材料A2513', '材料A2514', '材料A2515'];
  const filteredStudents = students.filter(s => targetClasses.includes(s.班级));
  
  console.log(`找到 ${filteredStudents.length} 名学生`);
  
  // 批量插入
  const studentsToInsert = filteredStudents.map(s => ({
    student_id: s.学号,
    name: s.姓名,
    gender: s.性别,
    grade: s.年级,
    major: s.专业,
    class_name: s.班级,
    phone: s.手机号码,
  }));
  
  // 每次插入100条
  const batchSize = 100;
  for (let i = 0; i < studentsToInsert.length; i += batchSize) {
    const batch = studentsToInsert.slice(i, i + batchSize);
    const { error } = await client.from('students').insert(batch);
    if (error) {
      console.error('插入失败:', error);
      throw error;
    }
    console.log(`已插入 ${i + batch.length}/${studentsToInsert.length} 名学生`);
  }
  
  console.log('学生数据导入完成！');
  
  // 统计每个班级的学生数量
  const classCounts: Record<string, number> = {};
  filteredStudents.forEach(s => {
    classCounts[s.班级] = (classCounts[s.班级] || 0) + 1;
  });
  
  console.log('\n各班级学生数量:');
  targetClasses.forEach(className => {
    console.log(`${className}: ${classCounts[className] || 0} 人`);
  });
}

importStudents().catch(console.error);
