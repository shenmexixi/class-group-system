import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as XLSX from 'xlsx';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ className: string }> }
) {
  try {
    const { className } = await params;
    const client = getSupabaseClient();
    
    // 获取该班级的所有分组信息
    const { data: slots, error } = await client
      .from('group_slots')
      .select(`
        group_number,
        slot_number,
        is_locked,
        is_leader,
        students (
          student_id,
          name,
          gender
        )
      `)
      .eq('class_name', className)
      .order('group_number')
      .order('slot_number');
    
    if (error) {
      console.error('查询分组失败:', error);
      return NextResponse.json(
        { error: '查询分组失败' },
        { status: 500 }
      );
    }
    
    // 构建导出数据
    const exportData: any[] = [];
    
    for (let groupNum = 1; groupNum <= 5; groupNum++) {
      const groupSlots = slots?.filter((s: any) => s.group_number === groupNum) || [];
      
      for (let slotNum = 1; slotNum <= 7; slotNum++) {
        const slot = groupSlots.find((s: any) => s.slot_number === slotNum);
        const student = slot?.students as any;
        
        exportData.push({
          '组号': groupNum,
          '槽位': slotNum,
          '学号': student?.student_id || '',
          '姓名': student?.name || '',
          '性别': student?.gender || '',
          '是否组长': slot?.is_leader ? '是' : '否',
          '是否锁定': slot?.is_locked ? '是' : '否',
        });
      }
      
      // 添加空行分隔组
      if (groupNum < 5) {
        exportData.push({});
      }
    }
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 8 },   // 组号
      { wch: 8 },   // 槽位
      { wch: 15 },  // 学号
      { wch: 10 },  // 姓名
      { wch: 6 },   // 性别
      { wch: 10 },  // 是否组长
      { wch: 10 },  // 是否锁定
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, '分组情况');
    
    // 生成Excel文件
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    // 生成安全的文件名（完全使用ASCII字符，避免编码问题）
    const safeFileName = `group_export_${className.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
    
    // 返回文件
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
      },
    });
  } catch (error) {
    console.error('导出Excel失败:', error);
    return NextResponse.json(
      { error: '导出Excel失败' },
      { status: 500 }
    );
  }
}
