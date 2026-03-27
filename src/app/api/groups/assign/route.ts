import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { className, studentId, groupNumber, slotNumber, isAdmin } = await request.json();
    
    if (!className || !studentId || !groupNumber || !slotNumber) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    // 只有管理员可以分配
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
    
    // 检查该学生是否已经加入了其他槽位
    const { data: existingStudentSlot } = await client
      .from('group_slots')
      .select('id, group_number, slot_number')
      .eq('class_name', className)
      .eq('student_id', studentId)
      .maybeSingle();
    
    if (existingStudentSlot) {
      return NextResponse.json(
        { error: `该学生已在第${existingStudentSlot.group_number}组第${existingStudentSlot.slot_number}号座位，请先移除` },
        { status: 400 }
      );
    }
    
    // 获取客户端信息
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // 检查目标槽位状态
    const { data: targetSlot } = await client
      .from('group_slots')
      .select('*')
      .eq('class_name', className)
      .eq('group_number', groupNumber)
      .eq('slot_number', slotNumber)
      .maybeSingle();
    
    if (targetSlot) {
      // 检查槽位是否已被占用
      if (targetSlot.student_id) {
        return NextResponse.json(
          { error: '该座位已被占用' },
          { status: 400 }
        );
      }
      
      // 使用条件更新（乐观锁）
      const { data: updateResult, error: updateError } = await client
        .from('group_slots')
        .update({ 
          student_id: studentId, 
          is_locked: false,
          updated_at: new Date().toISOString() 
        })
        .eq('id', targetSlot.id)
        .is('student_id', null)
        .select();
      
      if (updateError) {
        console.error('分配座位失败:', updateError);
        return NextResponse.json(
          { error: '分配座位失败' },
          { status: 500 }
        );
      }
      
      if (!updateResult || updateResult.length === 0) {
        return NextResponse.json(
          { error: '该座位已被占用，请刷新后重试' },
          { status: 409 }
        );
      }
    } else {
      // 创建新槽位（依赖唯一约束防止重复）
      const { error: insertError } = await client
        .from('group_slots')
        .insert({
          class_name: className,
          group_number: groupNumber,
          slot_number: slotNumber,
          student_id: studentId,
        });
      
      if (insertError) {
        if (insertError.code === '23505') {
          return NextResponse.json(
            { error: '该座位已被占用，请刷新后重试' },
            { status: 409 }
          );
        }
        
        console.error('分配座位失败:', insertError);
        return NextResponse.json(
          { error: '分配座位失败' },
          { status: 500 }
        );
      }
    }
    
    // 记录日志
    ;(async () => {
      try {
        await client.from('seat_logs').insert({
          class_name: className,
          student_id: studentId,
          student_name: studentName,
          group_number: groupNumber,
          slot_number: slotNumber,
          action: 'join',
          details: `管理员分配 ${studentName} 到第${groupNumber}组第${slotNumber}号座位`,
          ip_address: ipAddress,
          user_agent: userAgent,
        });
      } catch (err) {
        console.error('记录日志失败:', err);
      }
    })();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('分配座位失败:', error);
    return NextResponse.json(
      { error: '分配座位失败，请稍后重试' },
      { status: 500 }
    );
  }
}
