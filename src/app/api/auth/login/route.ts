import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { className, identifier } = await request.json();
    
    if (!className || !identifier) {
      return NextResponse.json(
        { error: '班级和姓名/学号不能为空' },
        { status: 400 }
      );
    }
    
    const client = getSupabaseClient();
    
    // 查询学生（支持学号或姓名）
    // 先按学号查询
    let { data: students, error } = await client
      .from('students')
      .select('*')
      .eq('class_name', className)
      .eq('student_id', identifier);
    
    if (error) {
      console.error('查询失败:', error);
      return NextResponse.json(
        { error: '查询失败，请稍后重试' },
        { status: 500 }
      );
    }
    
    // 如果学号没找到，再按姓名查询
    if (!students || students.length === 0) {
      const result = await client
        .from('students')
        .select('*')
        .eq('class_name', className)
        .eq('name', identifier);
      
      if (result.error) {
        console.error('查询失败:', result.error);
        return NextResponse.json(
          { error: '查询失败，请稍后重试' },
          { status: 500 }
        );
      }
      
      students = result.data;
    }
    
    if (!students || students.length === 0) {
      return NextResponse.json(
        { error: '未找到该学生，请检查班级和姓名/学号是否正确' },
        { status: 404 }
      );
    }
    
    const student = students[0];
    
    // 返回学生信息（用于session）
    return NextResponse.json({
      success: true,
      student: {
        id: student.id,
        studentId: student.student_id,
        name: student.name,
        className: student.class_name,
      },
    });
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
