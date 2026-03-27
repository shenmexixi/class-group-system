import { NextResponse } from 'next/server';

export async function GET() {
  // 返回预定义的班级列表
  const classes = [
    { id: 1, name: '材料A2511', studentCount: 29 },
    { id: 2, name: '材料A2512', studentCount: 28 },
    { id: 3, name: '材料A2513', studentCount: 28 },
    { id: 4, name: '材料A2514', studentCount: 30 },
    { id: 5, name: '材料A2515', studentCount: 28 },
  ];
  
  return NextResponse.json({ classes });
}
