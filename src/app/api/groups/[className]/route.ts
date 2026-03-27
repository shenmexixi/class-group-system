import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ className: string }> }
) {
  try {
    const { className } = await params;
    console.log('[API /groups] 请求班级:', className);
    
    const client = getSupabaseClient();
    
    // 获取该班级的所有分组信息
    const { data: slots, error } = await client
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
    
    console.log('[API /groups] 查询结果 - slots 数量:', slots?.length);
    console.log('[API /groups] 查询结果 - 有学生的 slots:', slots?.filter(s => s.students).map(s => ({
      group: s.group_number,
      slot: s.slot_number,
      studentName: s.students?.name
    })));
    
    if (error) {
      console.error('查询分组失败:', error);
      return NextResponse.json(
        { error: '查询分组失败' },
        { status: 500 }
      );
    }
    
    // 获取该班级的所有学生
    const { data: students, error: studentsError } = await client
      .from('students')
      .select('id, student_id, name, gender')
      .eq('class_name', className)
      .order('name');
    
    console.log('[API /groups] 查询结果 - students 数量:', students?.length);
    
    if (studentsError) {
      console.error('查询学生失败:', studentsError);
      return NextResponse.json(
        { error: '查询学生失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      slots: slots || [],
      students: students || [],
    });
  } catch (error) {
    console.error('获取分组信息失败:', error);
    return NextResponse.json(
      { error: '获取分组信息失败' },
      { status: 500 }
    );
  }
}
