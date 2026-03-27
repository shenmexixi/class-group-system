import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { className, studentId, isLeader, isAdmin } = await request.json();
    
    if (!className || !studentId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    const client = getSupabaseClient();
    
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
    
    // 权限检查：只有管理员或槽位所有者可以设置
    if (!isAdmin && slot.student_id !== studentId) {
      return NextResponse.json(
        { error: '无权设置组长' },
        { status: 403 }
      );
    }
    
    // 如果设置为组长，需要先取消该组其他人的组长身份
    if (isLeader) {
      const { error: clearError } = await client
        .from('group_slots')
        .update({ is_leader: false })
        .eq('class_name', className)
        .eq('group_number', slot.group_number);
      
      if (clearError) {
        console.error('清除原组长失败:', clearError);
        // 不影响主流程
      }
    }
    
    // 更新组长状态
    const { error: updateError } = await client
      .from('group_slots')
      .update({ is_leader: isLeader })
      .eq('id', slot.id);
    
    if (updateError) {
      console.error('设置组长失败:', updateError);
      return NextResponse.json(
        { error: '设置组长失败' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('设置组长失败:', error);
    return NextResponse.json(
      { error: '设置组长失败，请稍后重试' },
      { status: 500 }
    );
  }
}
