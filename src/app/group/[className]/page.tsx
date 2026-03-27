'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Download,
  LogOut,
  Lock,
  Unlock,
  Crown,
  User,
  Users,
} from 'lucide-react';

interface Student {
  id: number;
  student_id: string;
  name: string;
  gender: string;
}

interface GroupSlot {
  id: number;
  class_name: string;
  group_number: number;
  slot_number: number;
  student_id: number | null;
  is_locked: boolean;
  is_leader: boolean;
  students: Student | null;
}

interface CurrentUser {
  id: number;
  studentId: string;
  name: string;
  className: string;
}

const GROUP_COLORS = [
  'from-pink-200 to-pink-300',
  'from-blue-200 to-blue-300',
  'from-purple-200 to-purple-300',
  'from-green-200 to-green-300',
  'from-yellow-200 to-yellow-300',
];

export default function GroupPage() {
  const params = useParams();
  const router = useRouter();
  const className = params.className as string;

  const [slots, setSlots] = useState<GroupSlot[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [wantLeader, setWantLeader] = useState(false);

  // 标记客户端已挂载
  useEffect(() => {
    setMounted(true);
  }, []);

  // 检查登录状态
  useEffect(() => {
    if (!mounted) return;
    
    const checkAuth = () => {
      const userStr = localStorage.getItem('currentUser');
      const isAdmin = localStorage.getItem('isAdmin') === 'true';

      if (!userStr) {
        console.log('未找到用户信息，跳转首页');
        setLoading(false);
        router.push('/');
        return;
      }

      try {
        const user = JSON.parse(userStr) as CurrentUser;

        // 如果是管理员，跳转到管理员页面
        if (isAdmin) {
          console.log('管理员登录，跳转管理页面');
          setLoading(false);
          router.push('/admin');
          return;
        }

        // 解码URL中的className（处理中文编码问题）
        const decodedClassName = decodeURIComponent(className);
        
        // 检查班级是否匹配
        if (user.className !== decodedClassName) {
          console.log('班级不匹配:', user.className, decodedClassName);
          setLoading(false);
          router.push('/');
          return;
        }

        console.log('验证通过，用户:', user);
        setCurrentUser(user);
      } catch (e) {
        console.error('解析用户信息失败:', e);
        setLoading(false);
        router.push('/');
      }
    };

    checkAuth();
  }, [className, router, mounted]);

  // 获取分组数据（依赖 currentUser）
  useEffect(() => {
    if (!currentUser || !mounted) return;

    const fetchGroupData = async () => {
      try {
        // 对className进行URL编码
        const res = await fetch(`/api/groups/${encodeURIComponent(className)}`);
        const data = await res.json();
        setSlots(data.slots || []);
        setStudents(data.students || []);

        // 检查当前用户是否已选择组长
        const userSlot = (data.slots || []).find(
          (s: GroupSlot) => s.student_id === currentUser.id
        );
        if (userSlot) {
          setWantLeader(userSlot.is_leader);
        }
      } catch (error) {
        console.error('获取分组数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [className, currentUser, mounted]);

  const getSlotByGroupAndNumber = (groupNum: number, slotNum: number) => {
    return slots.find(
      s => s.group_number === groupNum && s.slot_number === slotNum
    );
  };

  const handleJoinSlot = async (groupNum: number, slotNum: number) => {
    if (!currentUser) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className,
          groupNumber: groupNum,
          slotNumber: slotNum,
          studentId: currentUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || '加入失败');
        setActionLoading(false);
        return;
      }

      // 刷新数据
      window.location.reload();
    } catch (error) {
      alert('加入失败，请稍后重试');
      setActionLoading(false);
    }
  };

  const handleLeaveSlot = async () => {
    if (!currentUser) return;

    if (!confirm('确定要退出当前分组吗？')) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/groups/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className,
          studentId: currentUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || '退出失败');
        setActionLoading(false);
        return;
      }

      setWantLeader(false);
      // 刷新数据
      window.location.reload();
    } catch (error) {
      alert('退出失败，请稍后重试');
      setActionLoading(false);
    }
  };

  const handleToggleLock = async (groupNum: number, slotNum: number) => {
    if (!currentUser) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/groups/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className,
          groupNumber: groupNum,
          slotNumber: slotNum,
          studentId: currentUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || '操作失败');
        setActionLoading(false);
        return;
      }

      // 刷新数据
      window.location.reload();
    } catch (error) {
      alert('操作失败，请稍后重试');
      setActionLoading(false);
    }
  };

  const handleToggleLeader = async (checked: boolean) => {
    if (!currentUser) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/groups/leader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className,
          studentId: currentUser.id,
          isLeader: checked,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || '设置失败');
        setActionLoading(false);
        return;
      }

      setWantLeader(checked);
      // 刷新数据
      window.location.reload();
    } catch (error) {
      alert('设置失败，请稍后重试');
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    window.location.href = `/api/export/${encodeURIComponent(className)}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAdmin');
    router.push('/');
  };

  // 获取当前用户的槽位
  const mySlot = slots.find(s => s.student_id === currentUser?.id);

  // 在客户端挂载前显示加载状态
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50">
        <div className="text-lg text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              {className} 分组管理
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              欢迎你，{currentUser?.name}（{currentUser?.studentId}）
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              variant="outline"
              className="border-green-300 text-green-600 hover:bg-green-50"
            >
              <Download className="w-4 h-4 mr-2" />
              导出Excel
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              退出
            </Button>
          </div>
        </div>

        {/* 我的分组信息 */}
        {mySlot && (
          <Card className="mb-6 border-2 border-pink-200 bg-white/80 backdrop-blur">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">我的位置：</span>
                    <Badge variant="secondary" className="ml-2">
                      第 {mySlot.group_number} 组 - 槽位 {mySlot.slot_number}
                    </Badge>
                    {mySlot.is_leader && (
                      <Badge className="ml-2 bg-yellow-400 text-yellow-900">
                        <Crown className="w-3 h-3 mr-1" />
                        组长
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="wantLeader"
                      checked={wantLeader}
                      onCheckedChange={handleToggleLeader}
                      disabled={actionLoading}
                    />
                    <Label htmlFor="wantLeader" className="text-sm cursor-pointer">
                      我想担任组长
                    </Label>
                  </div>
                  <Button
                    onClick={handleLeaveSlot}
                    variant="destructive"
                    size="sm"
                    disabled={actionLoading || mySlot.is_locked}
                  >
                    退出分组
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 分组区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(groupNum => {
            const groupSlots = Array.from({ length: 7 }, (_, i) => {
              const slot = getSlotByGroupAndNumber(groupNum, i + 1);
              return slot || {
                group_number: groupNum,
                slot_number: i + 1,
                student_id: null,
                is_locked: false,
                is_leader: false,
                students: null,
              };
            });

            const occupiedCount = groupSlots.filter(s => s.student_id).length;

            return (
              <Card
                key={groupNum}
                className={`bg-gradient-to-br ${GROUP_COLORS[groupNum - 1]} border-2 border-white/50 shadow-lg`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      第 {groupNum} 组
                    </span>
                    <Badge variant="secondary" className="bg-white/70">
                      {occupiedCount}/7
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {groupSlots.map((slot, index) => {
                    const isMySlot = slot.student_id === currentUser?.id;
                    const isOccupied = slot.student_id !== null;
                    const isLocked = slot.is_locked;

                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isMySlot
                            ? 'border-pink-400 bg-pink-50'
                            : isLocked
                            ? 'border-gray-300 bg-gray-100'
                            : isOccupied
                            ? 'border-white/50 bg-white/30'
                            : 'border-dashed border-gray-300 bg-white/20 hover:bg-white/40 cursor-pointer'
                        }`}
                        onClick={() => {
                          if (!isOccupied && !isLocked && !mySlot) {
                            handleJoinSlot(groupNum, index + 1);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">
                              {index + 1}
                            </span>
                            {slot.students ? (
                              <>
                                <User className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-medium">
                                  {slot.students.name}
                                </span>
                                {slot.is_leader && (
                                  <Crown className="w-4 h-4 text-yellow-600" />
                                )}
                              </>
                            ) : isLocked ? (
                              <span className="text-sm text-gray-500">已锁定</span>
                            ) : (
                              <span className="text-sm text-gray-500">空位</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {isMySlot && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleToggleLock(groupNum, index + 1);
                                }}
                                disabled={actionLoading}
                              >
                                {isLocked ? (
                                  <Lock className="w-4 h-4 text-red-500" />
                                ) : (
                                  <Unlock className="w-4 h-4 text-green-500" />
                                )}
                              </Button>
                            )}
                            {!isOccupied && isLocked && !isMySlot && (
                              <Lock className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 未分组学生 */}
        {students.length > 0 && (
          <Card className="mt-6 border-2 border-blue-200 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">未分组学生</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {students
                  .filter(s => !slots.find(slot => slot.student_id === s.id))
                  .map(student => (
                    <Badge
                      key={student.id}
                      variant="secondary"
                      className="bg-blue-100 text-blue-700"
                    >
                      {student.name}（{student.student_id}）
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 使用说明 */}
        <Card className="mt-6 border-2 border-purple-200 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">使用说明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>1. 点击空白槽位可加入分组</p>
            <p>2. 加入分组后可勾选"我想担任组长"</p>
            <p>3. 点击锁定图标可锁定/解锁自己的槽位（锁定后无法退出）</p>
            <p>4. 每人只能加入一个槽位</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
