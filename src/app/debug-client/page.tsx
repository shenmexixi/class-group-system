'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugClientPage() {
  const [localStorageData, setLocalStorageData] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        data[key] = localStorage.getItem(key) || '';
      }
    }
    setLocalStorageData(data);
  }, [mounted]);

  if (!mounted) {
    return <div className="p-8">加载中...</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold mb-4">客户端诊断工具</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>LocalStorage 数据</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(localStorageData, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>当前用户信息</CardTitle>
          </CardHeader>
          <CardContent>
            {localStorageData.currentUser ? (
              <div className="space-y-2">
                <p><strong>解析后的用户:</strong></p>
                <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-auto text-sm">
                  {JSON.stringify(JSON.parse(localStorageData.currentUser), null, 2)}
                </pre>
              </div>
            ) : (
              <p className="text-red-500">未找到 currentUser</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>URL 信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>当前 URL:</strong> {typeof window !== 'undefined' ? window.location.href : ''}</p>
              <p><strong>Pathname:</strong> {typeof window !== 'undefined' ? window.location.pathname : ''}</p>
              <p><strong>Search:</strong> {typeof window !== 'undefined' ? window.location.search : ''}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API 测试</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <button
                onClick={async () => {
                  const user = JSON.parse(localStorageData.currentUser);
                  const url = `/api/groups/${encodeURIComponent(user.className)}?t=${Date.now()}`;
                  console.log('测试 URL:', url);
                  const res = await fetch(url, { cache: 'no-store' });
                  const data = await res.json();
                  console.log('API 返回:', data);
                  alert(`获取到 ${data.slots?.length} 个 slots, ${data.students?.length} 个 students`);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                测试获取分组数据
              </button>
              
              <button
                onClick={() => {
                  localStorage.clear();
                  alert('已清除所有 localStorage');
                  window.location.reload();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded ml-4"
              >
                清除 localStorage
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
