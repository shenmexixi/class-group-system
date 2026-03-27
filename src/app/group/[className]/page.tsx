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
  Crown,
  User,
  Users,
  Check,
  X,
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
  
  // 选座状态
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

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
        setLoading(false);
        router.push('/');
        return;
      }

      try {
        const user = JSON.parse(userStr) as CurrentUser;

        if (isAdmin) {
          setLoading(false);
          router.push('/admin');
          return;
        }

        const decodedClassName = decodeURIComponent(className);
        
        if (user.className !== decodedClassName) {
          setLoading(false);
          router.push('/');
          return;
        }

        setCurrentUser(user);
      } catch (e) {
        console.error('解析用户信息失败:', e);
        setLoading(false);
        router.push('/');
      }
    };

    checkAuth();
  }, [className, router, mounted]);

  // 获取分组数据
  useEffect(() => {
    if (!currentUser || !mounted) return;

    const fetchGroupData = async () => {
      try {
        const res = await fetch(`/api/groups/${encodeURIComponent(className)}`);
        const data = await res.json();
        setSlots(data.slots || []);
        setStudents(data.students || []);

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

  // 点击座位处理
  const handleSlotClick = (groupNum: number, slotNum: number) => {
    const slot = getSlotByGroupAndNumber(groupNum, slotNum);
    
    // 已占用或已锁定的座位不可选
    if (slot && (slot.student_id || slot.is_locked)) {
      return;
    }
    
    // 如果已加入分组，不允许再选座
    const mySlot = slots.find(s => s.student_id === currentUser?.id);
    if (mySlot) {
      return;
    }
    
    // 选中/取消选中
    if (selectedGroup === groupNum && selectedSlot === slotNum) {
      setSelectedGroup(null);
      setSelectedSlot(null);
    } else {
      setSelectedGroup(groupNum);
      setSelectedSlot(slotNum);
    }
  };

  // 确认选座
  const handleConfirmSeat = async () => {
    if (!currentUser || selectedGroup === null || selectedSlot === null) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: decodeURIComponent(className),
          groupNumber: selectedGroup,
          slotNumber: selectedSlot,
          studentId: currentUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || '选座失败');
        setActionLoading(false);
        return;
      }

      alert('选座成功！');
      // 刷新数据
      window.location.reload();
    } catch (error) {
      alert('选座失败，请稍后重试');
      setActionLoading(false);
    }
  };

  // 取消选择
  const handleCancelSelection = () => {
    setSelectedGroup(null);
    setSelectedSlot(null);
  };

  // 退出分组
  const handleLeaveSlot = async () => {
    if (!currentUser) return;

    const mySlot = slots.find(s => s.student_id === currentUser.id);
    if (!mySlot) return;

    if (mySlot.is_locked) {
      alert('您的座位已被锁定，无法退出');
      return;
    }

    if (!confirm('确定要退出当前分组吗？')) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/groups/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: decodeURIComponent(className),
          studentId: currentUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || '退出失败');
        setActionLoading(false);
        return;
      }

      alert('已退出分组');
      setWantLeader(false);
      window.location.reload();
    } catch (error) {
      alert('退出失败，请稍后重试');
      setActionLoading(false);
    }
  };

  // 锁定座位
  const handleToggleLock = async () => {
    if (!currentUser) return;

    const mySlot = slots.find(s => s.student_id === currentUser.id);
    if (!mySlot) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/groups/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: decodeURIComponent(className),
          groupNumber: mySlot.group_number,
          slotNumber: mySlot.slot_number,
          studentId: currentUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || '操作失败');
        setActionLoading(false);
        return;
      }

      alert(mySlot.is_locked ? '已解锁座位' : '已锁定座位');
      window.location.reload();
    } catch (error) {
      alert('操作失败，请稍后重试');
      setActionLoading(false);
    }
  };

  // 设置组长
  const handleToggleLeader = async (checked: boolean) => {
    if (!currentUser) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/groups/leader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: decodeURIComponent(className),
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
      alert(checked ? '已申请成为组长' : '已取消组长申请');
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

  const decodedClassName = decodeURIComponent(className);

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              {decodedClassName} 分组选座
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              欢迎，{currentUser?.name}（{currentUser?.studentId}）
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

        {/* 图例说明 */}
        <Card className="mb-6 border-2 border-gray-200 bg-white/80 backdrop-blur">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-200 border-2 border-gray-300"></div>
                <span>已占用</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-100 border-2 border-gray-400 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-gray-500" />
                </div>
                <span>已锁定</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white border-2 border-dashed border-gray-300"></div>
                <span>可选座位</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 border-2 border-green-400"></div>
                <span>已选中</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-pink-100 border-2 border-pink-400"></div>
                <span>我的座位</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                <span>组长</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 我的座位信息 */}
        {mySlot && (
          <Card className="mb-6 border-2 border-pink-200 bg-white/80 backdrop-blur">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">我的座位：</span>
                    <Badge variant="secondary" className="ml-2">
                      第 {mySlot.group_number} 组 - 槽位 {mySlot.slot_number}
                    </Badge>
                    {mySlot.is_leader && (
                      <Badge className="ml-2 bg-yellow-400 text-yellow-900">
                        <Crown className="w-3 h-3 mr-1" />
                        组长
                      </Badge>
                    )}
                    {mySlot.is_locked && (
                      <Badge className="ml-2 bg-gray-400 text-white">
                        <Lock className="w-3 h-3 mr-1" />
                        已锁定
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {!mySlot.is_locked && (
                    <>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="wantLeader"
                          checked={wantLeader}
                          onCheckedChange={handleToggleLeader}
                          disabled={actionLoading}
                        />
                        <Label htmlFor="wantLeader" className="text-sm cursor-pointer">
                          担任组长
                        </Label>
                      </div>
                      <Button
                        onClick={handleToggleLock}
                        variant="outline"
                        size="sm"
                        disabled={actionLoading}
                        className="border-blue-300 text-blue-600"
                      >
                        <Lock className="w-4 h-4 mr-1" />
                        锁定座位
                      </Button>
                      <Button
                        onClick={handleLeaveSlot}
                        variant="destructive"
                        size="sm"
                        disabled={actionLoading}
                      >
                        退出分组
                      </Button>
                    </>
                  )}
                  {mySlot.is_locked && (
                    <Button
                      onClick={handleToggleLock}
                      variant="outline"
                      size="sm"
                      disabled={actionLoading}
                      className="border-blue-300 text-blue-600"
                    >
                      <Lock className="w-4 h-4 mr-1" />
                      解锁座位
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 选座确认栏 */}
        {selectedGroup !== null && selectedSlot !== null && !mySlot && (
          <Card className="mb-6 border-2 border-green-300 bg-green-50/80 backdrop-blur">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium text-green-700">已选座位：</span>
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                    第 {selectedGroup} 组 - 槽位 {selectedSlot}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleCancelSelection}
                    variant="outline"
                    size="sm"
                    disabled={actionLoading}
                  >
                    <X className="w-4 h-4 mr-1" />
                    取消
                  </Button>
                  <Button
                    onClick={handleConfirmSeat}
                    size="sm"
                    disabled={actionLoading}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    确认选座
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 分组区域 - 电影院选座模式 */}
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
                    const isSelected = selectedGroup === groupNum && selectedSlot === index + 1;

                    // 计算样式
                    let slotClass = '';
                    if (isMySlot) {
                      slotClass = 'border-pink-400 bg-pink-100 cursor-default';
                    } else if (isLocked && !isOccupied) {
                      slotClass = 'border-gray-400 bg-gray-100 cursor-not-allowed';
                    } else if (isOccupied) {
                      slotClass = 'border-gray-300 bg-gray-200 cursor-not-allowed';
                    } else if (isSelected) {
                      slotClass = 'border-green-400 bg-green-100 cursor-pointer ring-2 ring-green-300';
                    } else {
                      slotClass = 'border-dashed border-gray-300 bg-white/50 cursor-pointer hover:bg-white/80 hover:border-gray-400';
                    }

                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 transition-all ${slotClass}`}
                        onClick={() => !isOccupied && !isLocked && !mySlot && handleSlotClick(groupNum, index + 1)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600 w-4">
                              {index + 1}
                            </span>
                            {slot.students ? (
                              <>
                                <User className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-medium flex-1">
                                  {slot.students.name}
                                </span>
                                {slot.is_leader && (
                                  <Crown className="w-4 h-4 text-yellow-600" />
                                )}
                              </>
                            ) : isLocked ? (
                              <>
                                <Lock className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-500">已锁定</span>
                              </>
                            ) : isSelected ? (
                              <>
                                <Check className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-green-700">已选中</span>
                              </>
                            ) : (
                              <span className="text-sm text-gray-500">可选</span>
                            )}
                          </div>
                          {isMySlot && !isLocked && (
                            <Badge variant="outline" className="text-xs border-pink-400 text-pink-600">
                              我的
                            </Badge>
                          )}
                          {isMySlot && isLocked && (
                            <Lock className="w-4 h-4 text-gray-500" />
                          )}
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
        {students.filter(s => !slots.find(slot => slot.student_id === s.id)).length > 0 && (
          <Card className="mt-6 border-2 border-blue-200 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">未分组学生（{students.filter(s => !slots.find(slot => slot.student_id === s.id)).length}人）</CardTitle>
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
                      {student.name}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 使用说明 */}
        <Card className="mt-6 border-2 border-purple-200 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">选座说明</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>1. 点击可选座位进行选择（绿色高亮表示已选中）</p>
            <p>2. 点击"确认选座"按钮完成选座</p>
            <p>3. 选座后可以点击"锁定座位"防止误操作</p>
            <p>4. 锁定前可随时退出重新选择，锁定后需先解锁</p>
            <p>5. 可勾选"担任组长"申请成为小组组长</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
