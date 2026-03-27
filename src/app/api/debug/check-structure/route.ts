import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const className = searchParams.get('className') || '材料A2511';
    
    // 1. 检查 group_slots 表结构
    const { data: sampleSlot, error: slotError } = await client
      .from('group_slots')
      .select('*')
      .limit(1);
    
    // 2. 检查该班级的 slots 数据
    const { data: classSlots, error: classSlotsError } = await client
      .from('group_slots')
      .select('*')
      .eq('class_name', className)
      .limit(5);
    
    // 3. 检查该班级有学生的 slots
    const { data: occupiedSlots, error: occupiedError } = await client
      .from('group_slots')
      .select('*')
      .eq('class_name', className)
      .not('student_id', 'is', null)
      .limit(5);
    
    // 4. 检查关联查询结果
    const { data: slotsWithStudents, error: joinError } = await client
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
      .not('student_id', 'is', null)
      .limit(5);
    
    // 5. 检查 students 表
    const { data: students, error: studentsError } = await client
      .from('students')
      .select('*')
      .eq('class_name', className)
      .limit(5);
    
    // 6. 检查所有不同的 class_name 值
    const { data: allClassNames, error: classNamesError } = await client
      .from('group_slots')
      .select('class_name');
    
    // 7. 检查 students 表中所有不同的 class_name 值
    const { data: studentClassNames, error: studentClassNamesError } = await client
      .from('students')
      .select('class_name');
    
    return NextResponse.json({
      query: { className },
      sampleSlot: { data: sampleSlot, error: slotError },
      classSlots: { data: classSlots, error: classSlotsError },
      occupiedSlots: { data: occupiedSlots, error: occupiedError },
      slotsWithStudents: { data: slotsWithStudents, error: joinError },
      students: { data: students, error: studentsError },
      allClassNames: allClassNames?.map(s => s.class_name),
      studentClassNames: studentClassNames?.map(s => s.class_name),
    });
  } catch (error) {
    console.error('调试失败:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
