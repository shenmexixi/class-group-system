import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { className, groupNumber, slotNumber, studentId } = await request.json();
    
    if (!className || !groupNumber || !slotNumber || !studentId) {
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
    
    // 检查该槽位是否已被占用或锁定
    const { data: existingSlot, error: checkError } = await client
      .from('group_slots')
      .select('*')
      .eq('class_name', className)
      .eq('group_number', groupNumber)
      .eq('slot_number', slotNumber)
      .maybeSingle();
    
    if (checkError) {
      console.error('检查槽位失败:', checkError);
      return NextResponse.json(
        { error: '检查槽位失败' },
        { status: 500 }
      );
    }
    
    // 如果槽位已被占用或锁定
    if (existingSlot && (existingSlot.student_id || existingSlot.is_locked)) {
      return NextResponse.json(
        { error: '该槽位已被占用或锁定' },
        { status: 400 }
      );
    }
    
    // 检查该学生是否已经加入了其他槽位
    const { data: studentSlots, error: studentCheckError } = await client
      .from('group_slots')
      .select('*')
      .eq('class_name', className)
      .eq('student_id', studentId);
    
    if (studentCheckError) {
      console.error('检查学生槽位失败:', studentCheckError);
      return NextResponse.json(
        { error: '检查学生槽位失败' },
        { status: 500 }
      );
    }
    
    if (studentSlots && studentSlots.length > 0) {
      return NextResponse.json(
        { error: '您已经加入了其他分组，请先退出当前分组' },
        { status: 400 }
      );
    }
    
    // 获取客户端信息
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // 创建或更新槽位
    if (existingSlot) {
      // 更新现有槽位
      const { error: updateError } = await client
        .from('group_slots')
        .update({ student_id: studentId })
        .eq('id', existingSlot.id);
      
      if (updateError) {
        console.error('加入分组失败:', updateError);
        return NextResponse.json(
          { error: '加入分组失败' },
          { status: 500 }
        );
      }
    } else {
      // 创建新槽位
      const { error: insertError } = await client
        .from('group_slots')
        .insert({
          class_name: className,
          group_number: groupNumber,
          slot_number: slotNumber,
          student_id: studentId,
        });
      
      if (insertError) {
        console.error('加入分组失败:', insertError);
        return NextResponse.json(
          { error: '加入分组失败' },
          { status: 500 }
        );
      }
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
        action: 'join',
        details: `学生 ${studentName} 加入第${groupNumber}组第${slotNumber}号座位`,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('加入分组失败:', error);
    return NextResponse.json(
      { error: '加入分组失败，请稍后重试' },
      { status: 500 }
    );
  }
}
