import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { className, studentId } = await request.json();
    
    if (!className || !studentId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    const client = getSupabaseClient();
    
    // 获取学生信息
    const { data: student } = await client
      .from('students')
      .select('name')
      .eq('id', studentId)
      .single();
    
    const studentName = student?.name || '未知';
    
    // 查找该学生的槽位
    const { data: slot, error: findError } = await client
      .from('group_slots')
      .select('*')
      .eq('class_name', className)
      .eq('student_id', studentId)
      .maybeSingle();
    
    if (findError) {
      console.error('查找槽位失败:', findError);
      return NextResponse.json(
        { error: '查找槽位失败' },
        { status: 500 }
      );
    }
    
    if (!slot) {
      return NextResponse.json(
        { error: '未找到您的分组信息' },
        { status: 404 }
      );
    }
    
    // 检查是否锁定
    if (slot.is_locked) {
      return NextResponse.json(
        { error: '槽位已锁定，无法退出' },
        { status: 400 }
      );
    }
    
    // 获取客户端信息
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    const groupNumber = slot.group_number;
    const slotNumber = slot.slot_number;
    
    // 清空槽位的学生信息
    const { error: updateError } = await client
      .from('group_slots')
      .update({
        student_id: null,
        is_leader: false,
      })
      .eq('id', slot.id);
    
    if (updateError) {
      console.error('退出分组失败:', updateError);
      return NextResponse.json(
        { error: '退出分组失败' },
        { status: 500 }
      );
    }
    
    // 记录日志
    await client
      .from('seat_logs')
      .insert({
        class_name: className,
        student_id: studentId,
        student_name: studentName,
        group_number: groupNumber,
        slot_number: slotNumber,
        action: 'leave',
        details: `学生 ${studentName} 退出第${groupNumber}组第${slotNumber}号座位`,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('退出分组失败:', error);
    return NextResponse.json(
      { error: '退出分组失败，请稍后重试' },
      { status: 500 }
    );
  }
}
