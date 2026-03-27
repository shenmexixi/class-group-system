import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }
    
    const client = getSupabaseClient();
    
    // 查询管理员
    const { data: admins, error } = await client
      .from('admins')
      .select('*')
      .eq('username', username)
      .eq('password_hash', password);
    
    if (error) {
      console.error('查询失败:', error);
      return NextResponse.json(
        { error: '查询失败，请稍后重试' },
        { status: 500 }
      );
    }
    
    if (!admins || admins.length === 0) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }
    
    const admin = admins[0];
    
    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (error) {
    console.error('管理员登录失败:', error);
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
