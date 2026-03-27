import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 完整诊断API - 用于排查数据显示问题
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const results: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.COZE_PROJECT_ENV || 'unknown',
    };
    
    // 1. 检查所有班级的所有座位
    const { data: allSlots, error: slotsError } = await client
      .from('group_slots')
      .select('*')
      .order('class_name')
      .order('group_number')
      .order('slot_number');
    
    if (slotsError) {
      results.error = slotsError;
      return NextResponse.json(results, { status: 500 });
    }
    
    results.totalSlots = allSlots?.length || 0;
    
    // 2. 分析class_name值
    const classNames = new Map<string, number>();
    const encodedNames: string[] = [];
    
    for (const slot of (allSlots || [])) {
      const cn = slot.class_name;
      classNames.set(cn, (classNames.get(cn) || 0) + 1);
      
      // 检查是否是URL编码的
      if (cn.includes('%')) {
        encodedNames.push(cn);
      }
    }
    
    results.classNames = Object.fromEntries(classNames);
    results.encodedClassNames = encodedNames;
    results.hasEncodedNames = encodedNames.length > 0;
    
    // 3. 显示前10条座位记录
    results.sampleSlots = (allSlots || []).slice(0, 10).map((s: any) => ({
      id: s.id,
      class_name: s.class_name,
      class_name_encoded: s.class_name.includes('%'),
      group: s.group_number,
      slot: s.slot_number,
      student_id: s.student_id,
    }));
    
    // 4. 统计已占座位
    const occupied = (allSlots || []).filter((s: any) => s.student_id);
    results.occupiedCount = occupied.length;
    
    // 5. 检查students表
    const { data: students, error: studentsError } = await client
      .from('students')
      .select('id, name, class_name')
      .limit(10);
    
    results.studentsSample = students;
    results.studentsError = studentsError?.message;
    
    return NextResponse.json(results, {
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: '诊断失败', details: String(error) },
      { status: 500 }
    );
  }
}
