import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 数据库诊断API
 * 访问 /api/debug/database 查看数据库状态
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const className = request.nextUrl.searchParams.get('class') || '材料A2511';
    
    // 1. 统计学生数量
    const { count: studentCount, error: studentError } = await client
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('class_name', className);
    
    // 2. 统计座位数量
    const { data: slots, error: slotsError } = await client
      .from('group_slots')
      .select('id, group_number, slot_number, student_id, is_locked, students(id, name)')
      .eq('class_name', className);
    
    // 3. 统计已占用座位
    const occupiedSlots = (slots || []).filter(s => s.student_id);
    
    // 4. 检查seat_logs表
    const { count: logCount, error: logError } = await client
      .from('seat_logs')
      .select('*', { count: 'exact', head: true });
    
    const diagnostics = {
      environment: process.env.COZE_PROJECT_ENV || 'unknown',
      database: {
        connected: !studentError && !slotsError,
        errors: studentError?.message || slotsError?.message || null,
      },
      students: {
        total: studentCount || 0,
        className,
      },
      seats: {
        totalRecords: slots?.length || 0,
        occupied: occupiedSlots.length,
        empty: (slots?.length || 0) - occupiedSlots.length,
      },
      logs: {
        exists: !logError,
        count: logCount || 0,
        error: logError?.message || null,
      },
      occupiedSeats: occupiedSlots.map(s => ({
        group: s.group_number,
        slot: s.slot_number,
        student: (s.students as any)?.name || 'unknown',
        locked: s.is_locked,
      })),
    };
    
    return NextResponse.json(diagnostics, { 
      headers: { 'Content-Type': 'application/json; charset=utf-8' } 
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: '诊断失败', details: String(error) },
      { status: 500 }
    );
  }
}
