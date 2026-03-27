import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const className = searchParams.get('className') || '材料A2511';
    const studentName = searchParams.get('name') || '马逸成';
    
    // 1. 模拟登录 - 获取学生信息
    const { data: students, error: loginError } = await client
      .from('students')
      .select('*')
      .eq('class_name', className)
      .eq('name', studentName);
    
    if (loginError || !students || students.length === 0) {
      return NextResponse.json({ error: '学生不存在', loginError });
    }
    
    const student = students[0];
    
    // 2. 模拟前端存储的 currentUser
    const currentUser = {
      id: student.id,
      studentId: student.student_id,
      name: student.name,
      className: student.class_name,
    };
    
    // 3. 获取分组数据 - 使用和前端相同的方式
    const apiUrl = `/api/groups/${encodeURIComponent(className)}`;
    const { data: slots, error: slotsError } = await client
      .from('group_slots')
      .select(`
        *,
        students (
          id,
          student_id,
          name,
          gender
        )
      `)
      .eq('class_name', className)
      .order('group_number')
      .order('slot_number');
    
    const { data: allStudents, error: studentsError } = await client
      .from('students')
      .select('id, student_id, name, gender')
      .eq('class_name', className)
      .order('name');
    
    // 4. 检查当前用户的座位
    const userSlot = (slots || []).find(
      s => s.student_id === currentUser.id
    );
    
    return NextResponse.json({
      step1_login: {
        student,
        currentUser,
      },
      step2_api: {
        url: apiUrl,
        className,
        slotsCount: slots?.length,
        studentsCount: allStudents?.length,
      },
      step3_data: {
        slots: slots?.slice(0, 3),
        userSlot,
        userSlotStudentId: userSlot?.student_id,
        currentUserId: currentUser.id,
        idMatch: userSlot?.student_id === currentUser.id,
      },
      step4_students: {
        firstThreeStudents: allStudents?.slice(0, 3),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
