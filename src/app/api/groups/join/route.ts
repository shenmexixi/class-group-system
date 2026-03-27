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
    
    // 获取客户端信息
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // === 并发安全的关键：使用原子操作 ===
    
    // 方案：使用 PostgreSQL 的条件更新，避免竞态条件
    // 尝试插入新记录，如果已存在则更新（仅当座位未被占用时）
    
    // 步骤1: 先检查学生是否已在其他座位（快速失败）
    const { data: existingStudentSlot } = await client
      .from('group_slots')
      .select('id, group_number, slot_number')
      .eq('class_name', className)
      .eq('student_id', studentId)
      .maybeSingle();
    
    if (existingStudentSlot) {
      return NextResponse.json(
        { error: `您已加入第${existingStudentSlot.group_number}组第${existingStudentSlot.slot_number}号座位，请先退出` },
        { status: 400 }
      );
    }
    
    // 步骤2: 检查目标座位状态
    const { data: targetSlot, error: checkError } = await client
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
    
    // 步骤3: 根据座位状态执行原子操作
    
    if (targetSlot) {
      // 座位已存在，检查是否可占用
      if (targetSlot.student_id) {
        return NextResponse.json(
          { error: '该座位已被占用，请刷新页面查看最新状态' },
          { status: 409 } // 409 Conflict
        );
      }
      
      if (targetSlot.is_locked) {
        return NextResponse.json(
          { error: '该座位已被锁定' },
          { status: 400 }
        );
      }
      
      // 使用条件更新：只有当 student_id 仍为 null 时才更新
      // 这是乐观锁的实现方式
      const { data: updateResult, error: updateError } = await client
        .from('group_slots')
        .update({ student_id: studentId, updated_at: new Date().toISOString() })
        .eq('id', targetSlot.id)
        .is('student_id', null) // 关键：只有当座位仍为空时才更新
        .select();
      
      if (updateError) {
        console.error('加入分组失败:', updateError);
        return NextResponse.json(
          { error: '加入分组失败' },
          { status: 500 }
        );
      }
      
      // 如果没有更新任何行，说明座位已被其他请求占用
      if (!updateResult || updateResult.length === 0) {
        return NextResponse.json(
          { error: '该座位已被其他同学抢先占用，请选择其他座位' },
          { status: 409 } // 409 Conflict
        );
      }
    } else {
      // 座位不存在，尝试创建（依赖唯一约束防止重复）
      const { error: insertError } = await client
        .from('group_slots')
        .insert({
          class_name: className,
          group_number: groupNumber,
          slot_number: slotNumber,
          student_id: studentId,
        });
      
      if (insertError) {
        // 如果是唯一约束冲突，说明座位已被占用
        if (insertError.code === '23505') { // PostgreSQL unique violation
          return NextResponse.json(
            { error: '该座位已被其他同学抢先占用，请选择其他座位' },
            { status: 409 }
          );
        }
        
        console.error('加入分组失败:', insertError);
        return NextResponse.json(
          { error: '加入分组失败' },
          { status: 500 }
        );
      }
    }
    
    // 记录日志（异步，不阻塞响应）
    ;(async () => {
      try {
        await client.from('seat_logs').insert({
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
      } catch (err) {
        console.error('记录日志失败:', err);
      }
    })();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('加入分组失败:', error);
    return NextResponse.json(
      { error: '加入分组失败，请稍后重试' },
      { status: 500 }
    );
  }
}
