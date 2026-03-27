'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  LogOut,
  Lock,
  Unlock,
  Crown,
  User,
  Users,
  Trash2,
  History,
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

interface AdminUser {
  id: number;
  username: string;
}

interface ClassInfo {
  id: number;
  name: string;
  studentCount: number;
}

interface SeatLog {
  id: number;
  class_name: string;
  student_id: number | null;
  student_name: string;
  group_number: number | null;
  slot_number: number | null;
  action: string;
  details: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const GROUP_COLORS = [
  'from-pink-200 to-pink-300',
  'from-blue-200 to-blue-300',
  'from-purple-200 to-purple-300',
  'from-green-200 to-green-300',
  'from-yellow-200 to-yellow-300',
];

export default function AdminPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [slots, setSlots] = useState<GroupSlot[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [logs, setLogs] = useState<SeatLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);

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

      if (!userStr || !isAdmin) {
        router.push('/');
        return;
      }

      try {
        setCurrentAdmin(JSON.parse(userStr));
      } catch (e) {
        console.error('解析管理员信息失败:', e);
        router.push('/');
      }
    };

    checkAuth();
  }, [router, mounted]);

  // 获取班级列表（依赖 currentAdmin）
  useEffect(() => {
    if (!currentAdmin || !mounted) return;

    const fetchClasses = async () => {
      try {
        const res = await fetch('/api/classes');
        const data = await res.json();
        setClasses(data.classes);
        if (data.classes.length > 0) {
          setSelectedClass(data.classes[0].name);
        }
        setLoading(false);
      } catch (error) {
        console.error('获取班级列表失败:', error);
        setLoading(false);
      }
    };

    fetchClasses();
  }, [currentAdmin, mounted]);

  // 获取分组数据（依赖 selectedClass）
  useEffect(() => {
    if (!selectedClass || !mounted) return;

    const fetchGroupData = async () => {
      try {
        const res = await fetch(`/api/groups/${encodeURIComponent(selectedClass)}`);
        const data = await res.json();
        setSlots(data.slots || []);
        setStudents(data.students || []);
      } catch (error) {
        console.error('获取分组数据失败:', error);
      }
    };

    fetchGroupData();
  }, [selectedClass, mounted]);

  const getSlotByGroupAndNumber = (groupNum: number, slotNum: number) => {
    return slots.find(
      s => s.group_number === groupNum && s.slot_number === slotNum
    );
  };

  const handleToggleLock = async (groupNum: number, slotNum: number) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/groups/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: selectedClass,
          groupNumber: groupNum,
          slotNumber: slotNum,
          isAdmin: true,
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

  const handleRemoveStudent = async (studentId: number) => {
    if (!confirm('确定要移除该学生吗？')) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/groups/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: selectedClass,
          studentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || '移除失败');
        setActionLoading(false);
        return;
      }

      // 刷新数据
      window.location.reload();
    } catch (error) {
      alert('移除失败，请稍后重试');
      setActionLoading(false);
    }
  };

  const handleToggleLeader = async (studentId: number, isLeader: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/groups/leader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: selectedClass,
          studentId,
          isLeader,
          isAdmin: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || '设置失败');
        setActionLoading(false);
        return;
      }

      // 刷新数据
      window.location.reload();
    } catch (error) {
      alert('设置失败，请稍后重试');
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    window.location.href = `/api/export/${encodeURIComponent(selectedClass)}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAdmin');
    router.push('/');
  };

  const handleFetchLogs = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/logs?className=${encodeURIComponent(selectedClass)}&limit=50`);
      const data = await res.json();
      setLogs(data.logs || []);
      setShowLogs(true);
    } catch (error) {
      alert('获取日志失败，请稍后重试');
    } finally {
      setActionLoading(false);
    }
  };

  const getActionText = (action: string) => {
    const actionMap: Record<string, string> = {
      join: '加入座位',
      leave: '退出座位',
      lock: '锁定座位',
      unlock: '解锁座位',
      set_leader: '成为组长',
      remove_leader: '取消组长',
    };
    return actionMap[action] || action;
  };

  const getActionColor = (action: string) => {
    const colorMap: Record<string, string> = {
      join: 'text-green-600',
      leave: 'text-orange-600',
      lock: 'text-red-600',
      unlock: 'text-blue-600',
      set_leader: 'text-yellow-600',
      remove_leader: 'text-gray-600',
    };
    return colorMap[action] || 'text-gray-600';
  };

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
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              管理员控制台
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              当前管理员：{currentAdmin?.username}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleFetchLogs}
              variant="outline"
              className="border-purple-300 text-purple-600 hover:bg-purple-50"
              disabled={actionLoading}
            >
              <History className="w-4 h-4 mr-2" />
              查看日志
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              className="border-green-300 text-green-600 hover:bg-green-50"
            >
              <Download className="w-4 h-4 mr-2" />
              导出当前班级
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

        {/* 班级选择 */}
        <Card className="mb-6 border-2 border-purple-200 bg-white/80 backdrop-blur">
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">选择班级：</span>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-64 border-purple-200 focus:border-purple-400">
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
          </CardContent>
        </Card>

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
                    const isOccupied = slot.student_id !== null;
                    const isLocked = slot.is_locked;

                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isLocked
                            ? 'border-gray-300 bg-gray-100'
                            : isOccupied
                            ? 'border-white/50 bg-white/30'
                            : 'border-dashed border-gray-300 bg-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-xs font-medium text-gray-600">
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
                              <span className="text-sm text-gray-500">已锁定</span>
                            ) : (
                              <span className="text-sm text-gray-500">空位</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {slot.student_id && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() =>
                                    handleToggleLeader(
                                      slot.student_id!,
                                      !slot.is_leader
                                    )
                                  }
                                  disabled={actionLoading}
                                  title={slot.is_leader ? '取消组长' : '设为组长'}
                                >
                                  <Crown
                                    className={`w-4 h-4 ${
                                      slot.is_leader
                                        ? 'text-yellow-500'
                                        : 'text-gray-400'
                                    }`}
                                  />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() =>
                                    handleRemoveStudent(slot.student_id!)
                                  }
                                  disabled={actionLoading}
                                  title="移除学生"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => handleToggleLock(groupNum, index + 1)}
                              disabled={actionLoading}
                              title={isLocked ? '解锁' : '锁定'}
                            >
                              {isLocked ? (
                                <Lock className="w-4 h-4 text-red-500" />
                              ) : (
                                <Unlock className="w-4 h-4 text-green-500" />
                              )}
                            </Button>
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

        {/* 管理员说明 */}
        <Card className="mt-6 border-2 border-purple-200 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">管理员功能</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>1. 可查看所有班级的分组情况</p>
            <p>2. 可锁定/解锁任意槽位</p>
            <p>3. 可移除任意学生</p>
            <p>4. 可设置/取消任意学生的组长身份</p>
            <p>5. 可导出任意班级的分组情况</p>
            <p>6. 可查看选座操作日志</p>
          </CardContent>
        </Card>

        {/* 操作日志 */}
        {showLogs && (
          <Card className="mt-6 border-2 border-indigo-200 bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5" />
                操作日志（最近50条）
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowLogs(false)}
              >
                关闭
              </Button>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">暂无操作记录</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200"
                    >
                      <div className="flex items-center gap-4">
                        <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                          {getActionText(log.action)}
                        </span>
                        <span className="text-sm text-gray-700">
                          {log.student_name}
                        </span>
                        {log.group_number && log.slot_number && (
                          <Badge variant="outline" className="text-xs">
                            第{log.group_number}组-{log.slot_number}号
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {log.details}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(log.created_at).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
