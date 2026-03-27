'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GraduationCap, Lock, Users } from 'lucide-react';
import { VERSION } from '@/lib/version';

interface ClassInfo {
  id: number;
  name: string;
  studentCount: number;
}

export default function HomePage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    // 获取班级列表
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => {
        setClasses(data.classes);
      })
      .catch(err => console.error('获取班级失败:', err));
  }, []);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: selectedClass,
          identifier,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '登录失败');
        setLoading(false);
        return;
      }

      // 保存登录信息到 localStorage
      localStorage.setItem('currentUser', JSON.stringify(data.student));
      localStorage.setItem('isAdmin', 'false');

      // 使用 window.location.href 强制刷新页面跳转
      // 对班级名称进行URL编码，处理中文字符
      window.location.href = `/group/${encodeURIComponent(selectedClass)}`;
    } catch (err) {
      setError('登录失败，请稍后重试');
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminUsername,
          password: adminPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '登录失败');
        setLoading(false);
        return;
      }

      // 保存登录信息
      localStorage.setItem('currentUser', JSON.stringify(data.admin));
      localStorage.setItem('isAdmin', 'true');

      // 使用 window.location.href 强制刷新页面跳转
      window.location.href = '/admin';
    } catch (err) {
      setError('登录失败，请稍后重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50">
      <Card className="w-full max-w-md shadow-xl border-2 border-pink-100">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            教学班级分组系统 <span className="text-sm text-gray-400">{VERSION}</span>
          </CardTitle>
          <CardDescription>
            选择班级并输入姓名或学号登录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showAdminLogin ? (
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="class" className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-pink-400" />
                  选择班级
                </Label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="border-pink-200 focus:border-pink-400">
                    <SelectValue placeholder="请选择班级" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.name}>
                        {cls.name} ({cls.studentCount}人)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="identifier" className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-400" />
                  姓名或学号
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="请输入姓名或学号"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  className="border-blue-200 focus:border-blue-400"
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-500 text-center p-2 bg-red-50 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white"
                disabled={!selectedClass || !identifier || loading}
              >
                {loading ? '登录中...' : '进入班级'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(true)}
                  className="text-sm text-gray-500 hover:text-pink-500 flex items-center justify-center gap-1 mx-auto"
                >
                  <Lock className="w-3 h-3" />
                  管理员登录
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-username" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  用户名
                </Label>
                <Input
                  id="admin-username"
                  type="text"
                  placeholder="请输入管理员用户名"
                  value={adminUsername}
                  onChange={e => setAdminUsername(e.target.value)}
                  className="border-purple-200 focus:border-purple-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  密码
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="请输入密码"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  className="border-purple-200 focus:border-purple-400"
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-500 text-center p-2 bg-red-50 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-400 to-blue-400 hover:from-purple-500 hover:to-blue-500 text-white"
                disabled={!adminUsername || !adminPassword || loading}
              >
                {loading ? '登录中...' : '管理员登录'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(false)}
                  className="text-sm text-gray-500 hover:text-pink-500"
                >
                  返回学生登录
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
