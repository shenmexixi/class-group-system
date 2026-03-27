import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 修复数据库中URL编码的class_name
 * 将 %E6%9D%90%E6%96%99A2511 格式更新为 材料A2511
 */
export async function POST(request: NextRequest) {
  try {
    const adminKey = request.headers.get('x-admin-key');
    
    // 简单验证
    if (adminKey !== 'fix-encoded-classname-2024') {
      return NextResponse.json(
        { error: '无权执行此操作' },
        { status: 403 }
      );
    }
    
    const client = getSupabaseClient();
    const results: any = {
      timestamp: new Date().toISOString(),
      fixed: [],
      errors: [],
    };
    
    // 1. 获取所有座位
    const { data: allSlots, error: fetchError } = await client
      .from('group_slots')
      .select('id, class_name');
    
    if (fetchError) {
      return NextResponse.json({ error: fetchError }, { status: 500 });
    }
    
    results.totalSlots = allSlots?.length || 0;
    
    // 2. 找出需要修复的记录
    const toFix = (allSlots || []).filter((s: any) => s.class_name.includes('%'));
    results.encodedCount = toFix.length;
    
    if (toFix.length === 0) {
      results.message = '没有需要修复的记录';
      return NextResponse.json(results);
    }
    
    // 3. 逐个修复
    for (const slot of toFix) {
      const decoded = decodeURIComponent(slot.class_name);
      
      const { error: updateError } = await client
        .from('group_slots')
        .update({ class_name: decoded })
        .eq('id', slot.id);
      
      if (updateError) {
        results.errors.push({
          id: slot.id,
          original: slot.class_name,
          decoded,
          error: updateError.message,
        });
      } else {
        results.fixed.push({
          id: slot.id,
          original: slot.class_name,
          decoded,
        });
      }
    }
    
    // 4. 同样修复students表
    const { data: allStudents } = await client
      .from('students')
      .select('id, class_name');
    
    const studentsToFix = (allStudents || []).filter((s: any) => s.class_name?.includes('%'));
    results.studentsFixed = [];
    
    for (const student of studentsToFix) {
      const decoded = decodeURIComponent(student.class_name);
      
      const { error } = await client
        .from('students')
        .update({ class_name: decoded })
        .eq('id', student.id);
      
      if (!error) {
        results.studentsFixed.push({
          id: student.id,
          original: student.class_name,
          decoded,
        });
      }
    }
    
    // 5. 同样修复seat_logs表
    const { data: allLogs } = await client
      .from('seat_logs')
      .select('id, class_name');
    
    const logsToFix = (allLogs || []).filter((s: any) => s.class_name?.includes('%'));
    results.logsFixed = [];
    
    for (const log of logsToFix) {
      const decoded = decodeURIComponent(log.class_name);
      
      const { error } = await client
        .from('seat_logs')
        .update({ class_name: decoded })
        .eq('id', log.id);
      
      if (!error) {
        results.logsFixed.push({
          id: log.id,
          original: log.class_name,
          decoded,
        });
      }
    }
    
    results.success = true;
    results.summary = {
      slotsFixed: results.fixed.length,
      studentsFixed: results.studentsFixed.length,
      logsFixed: results.logsFixed.length,
      errors: results.errors.length,
    };
    
    return NextResponse.json(results);
    
  } catch (error) {
    return NextResponse.json(
      { error: '修复失败', details: String(error) },
      { status: 500 }
    );
  }
}
