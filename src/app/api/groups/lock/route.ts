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
        .update({ is_locked: !slot.is_locked })
        .eq('id', slot.id);
      
      if (updateError) {
        console.error('锁定槽位失败:', updateError);
        return NextResponse.json(
          { error: '锁定槽位失败' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('锁定槽位失败:', error);
    return NextResponse.json(
      { error: '锁定槽位失败，请稍后重试' },
      { status: 500 }
    );
  }
}
