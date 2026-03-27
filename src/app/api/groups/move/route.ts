import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { className, studentId, targetGroupNumber, targetSlotNumber, isAdmin } = await request.json();
    
    if (!className || !studentId || !targetGroupNumber || !targetSlotNumber) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 只有管理员可以移动
    if (!isAdmin) {
      return NextResponse.json(
        { error: '无权执行此操作' },
        { status: 403 }
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
    
    // 查找学生当前槽位
    const { data: currentSlot } = await client
      .from('group_slots')
      .select('*')
      .eq('class_name', className)
      .eq('student_id', studentId)
      .maybeSingle();
    
    if (!currentSlot) {
      return NextResponse.json(
        { error: '该学生未分配座位' },
        { status: 400 }
      );
    }
    
    const oldGroupNumber = currentSlot.group_number;
    const oldSlotNumber = currentSlot.slot_number;
    const wasLeader = currentSlot.is_leader;
    
    // 检查目标槽位
    const { data: targetSlot } = await client
      .from('group_slots')
      .select('*')
      .eq('class_name', className)
      .eq('group_number', targetGroupNumber)
      .eq('slot_number', targetSlotNumber)
      .maybeSingle();
    
    // 获取客户端信息
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // 清空原槽位
    await client
      .from('group_slots')
      .update({
        student_id: null,
        is_leader: false,
        is_locked: false,
      })
      .eq('id', currentSlot.id);
    
    // 更新目标槽位
    if (!targetSlot) {
      // 创建新槽位
      const { error: insertError } = await client
        .from('group_slots')
        .insert({
          class_name: className,
          group_number: targetGroupNumber,
          slot_number: targetSlotNumber,
          student_id: studentId,
          is_leader: wasLeader, // 保持组长状态
        });
      
      if (insertError) {
        console.error('移动学生失败:', insertError);
        return NextResponse.json(
          { error: '移动学生失败' },
          { status: 500 }
        );
      }
    } else if (targetSlot.student_id) {
      // 目标槽位已被占用
      return NextResponse.json(
        { error: '目标座位已被占用' },
        { status: 400 }
      );
    } else {
      // 更新目标槽位
      const { error: updateError } = await client
        .from('group_slots')
        .update({
          student_id: studentId,
          is_locked: false,
          is_leader: wasLeader,
        })
        .eq('id', targetSlot.id);
      
      if (updateError) {
        console.error('移动学生失败:', updateError);
        return NextResponse.json(
          { error: '移动学生失败' },
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
        group_number: targetGroupNumber,
        slot_number: targetSlotNumber,
        action: 'move',
        details: `管理员移动 ${studentName} 从第${oldGroupNumber}组第${oldSlotNumber}号 到 第${targetGroupNumber}组第${targetSlotNumber}号`,
        ip_address: ipAddress,
        user_agent: userAgent,
      });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('移动学生失败:', error);
    return NextResponse.json(
      { error: '移动学生失败，请稍后重试' },
      { status: 500 }
    );
  }
}
