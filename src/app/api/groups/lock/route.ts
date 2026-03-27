import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { className, groupNumber, slotNumber, studentId, isAdmin } = await request.json();
    
    if (!className || !groupNumber || !slotNumber) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    const client = getSupabaseClient();
    
    // 获取学生信息
    let studentName = '管理员';
    if (studentId) {
      const { data: student } = await client
        .from('students')
        .select('name')
        .eq('id', studentId)
        .single();
      studentName = student?.name || '未知';
    }
    
    // 查找槽位
    const { data: slot, error: findError } = await client
      .from('group_slots')
      .select('*')
      .eq('class_name', className)
      .eq('group_number', groupNumber)
      .eq('slot_number', slotNumber)
      .maybeSingle();
    
    if (findError) {
      console.error('查找槽位失败:', findError);
      return NextResponse.json(
        { error: '查找槽位失败' },
        { status: 500 }
      );
    }
    
    // 权限检查：只有管理员或槽位所有者可以锁定
    if (!isAdmin && slot && slot.student_id !== studentId) {
      return NextResponse.json(
        { error: '无权锁定此槽位' },
        { status: 403 }
      );
    }
    
    // 获取客户端信息
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    const newLockState = slot ? !slot.is_locked : true;
    
    // 如果槽位不存在，创建一个锁定的空槽位
    if (!slot) {
      const { error: insertError } = await client
        .from('group_slots')
        .insert({
          class_name: className,
          group_number: groupNumber,
          slot_number: slotNumber,
          is_locked: true,
        });
      
      if (insertError) {
        console.error('锁定槽位失败:', insertError);
        return NextResponse.json(
          { error: '锁定槽位失败' },
          { status: 500 }
        );
      }
    } else {
      // 切换锁定状态
      const { error: updateError } = await client
        .from('group_slots')
        .update({ is_locked: newLockState })
        .eq('id', slot.id);
      
      if (updateError) {
        console.error('锁定槽位失败:', updateError);
        return NextResponse.json(
          { error: '锁定槽位失败' },
          { status: 500 }
        );
      }
    }
    
    // 记录日志
    await client
      .from('seat_logs')
      .insert({
        class_name: className,
        student_id: studentId || null,
        student_name: studentName,
        group_number: groupNumber,
        slot_number: slotNumber,
        action: newLockState ? 'lock' : 'unlock',
        details: `${studentName} ${newLockState ? '锁定' : '解锁'}第${groupNumber}组第${slotNumber}号座位`,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('锁定槽位失败:', error);
    return NextResponse.json(
      { error: '锁定槽位失败，请稍后重试' },
      { status: 500 }
    );
  }
}
