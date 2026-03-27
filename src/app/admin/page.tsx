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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Move,
  UserPlus,
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
  
  // 分配/移动相关状态
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [selectedTargetSlot, setSelectedTargetSlot] = useState<{ group: number; slot: number } | null>(null);
  const [selectedStudentToAssign, setSelectedStudentToAssign] = useState<Student | null>(null);
  const [selectedStudentToMove, setSelectedStudentToMove] = useState<{ student: Student; fromGroup: number; fromSlot: number } | null>(null);

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

  // 获取班级列表
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

  // 获取分组数据
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

  // 获取未分组学生
  const unassignedStudents = students.filter(s => !slots.find(slot => slot.student_id === s.id));

  // 点击空座位 - 分配学生
  const handleEmptySlotClick = (groupNum: number, slotNum: number) => {
    const slot = getSlotByGroupAndNumber(groupNum, slotNum);
    if (slot?.is_locked && !slot.student_id) {
      // 已锁定的空座位，先解锁
      return;
    }
    
    if (unassignedStudents.length === 0) {
      alert('没有未分组的学生可分配');
      return;
    }
    
    setSelectedTargetSlot({ group: groupNum, slot: slotNum });
    setSelectedStudentToAssign(null);
    setShowAssignDialog(true);
  };

  // 点击已占用座位 - 移动学生
  const handleOccupiedSlotClick = (student: Student, groupNum: number, slotNum: number) => {
    setSelectedStudentToMove({ student, fromGroup: groupNum, fromSlot: slotNum });
    setSelectedTargetSlot(null);
    setShowMoveDialog(true);
  };

  // 确认分配学生
  const handleConfirmAssign = async () => {
    if (!selectedStudentToAssign || !selectedTargetSlot) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/groups/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: selectedClass,
          studentId: selectedStudentToAssign.id,
          groupNumber: selectedTargetSlot.group,
          slotNumber: selectedTargetSlot.slot,
          isAdmin: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || '分配失败');
        setActionLoading(false);
        return;
      }

      setShowAssignDialog(false);
      window.location.reload();
    } catch (error) {
      alert('分配失败，请稍后重试');
      setActionLoading(false);
    }
  };

  // 选择移动目标座位
  const handleSelectMoveTarget = (groupNum: number, slotNum: number) => {
    const slot = getSlotByGroupAndNumber(groupNum, slotNum);
    if (slot?.student_id) {
      alert('目标座位已被占用');
      return;
    }
    setSelectedTargetSlot({ group: groupNum, slot: slotNum });
  };

  // 确认移动学生
  const handleConfirmMove = async () => {
    if (!selectedStudentToMove || !selectedTargetSlot) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/groups/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: selectedClass,
          studentId: selectedStudentToMove.student.id,
          targetGroupNumber: selectedTargetSlot.group,
          targetSlotNumber: selectedTargetSlot.slot,
          isAdmin: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || '移动失败');
        setActionLoading(false);
        return;
      }

      setShowMoveDialog(false);
      window.location.reload();
    } catch (error) {
      alert('移动失败，请稍后重试');
      setActionLoading(false);
    }
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

      window.location.reload();
    } catch (error) {
      alert('操作失败，请稍后重试');
      setActionLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: number) => {
    if (!confirm('确定要移除该学生吗？（即使是已锁定的座位也可以移除）')) return;

    setActionLoading(true);
    try {
      const res = await fetch('/api/groups/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          className: selectedClass,
          studentId,
          isAdmin: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || '移除失败');
        setActionLoading(false);
        return;
      }

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
      move: '移动座位',
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
      move: 'text-purple-600',
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

        {/* 图例说明 */}
        <Card className="mb-6 border-2 border-gray-200 bg-white/80 backdrop-blur">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-200 border-2 border-gray-300"></div>
                <span>已占用（点击可移动）</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gray-100 border-2 border-gray-400"></div>
                <span>已锁定</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white border-2 border-dashed border-gray-300"></div>
                <span>空位（点击可分配）</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                <span>组长</span>
              </div>
              <div className="flex items-center gap-2">
                <Move className="w-5 h-5 text-purple-500" />
                <span>移动</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 未分组学生 */}
        {unassignedStudents.length > 0 && (
          <Card className="mb-6 border-2 border-blue-200 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                未分组学生（{unassignedStudents.length}人）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {unassignedStudents.map(student => (
                  <Badge
                    key={student.id}
                    variant="secondary"
                    className="bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200 transition-colors"
                    onClick={() => {
                      if (unassignedStudents.length > 0) {
                        setSelectedStudentToAssign(student);
                        setSelectedTargetSlot(null);
                        setShowAssignDialog(true);
                      }
                    }}
                  >
                    {student.name}（{student.student_id}）
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">点击学生姓名可快速分配座位</p>
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
                    const isOccupied = slot.student_id !== null;
                    const isLocked = slot.is_locked;

                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          isLocked && !isOccupied
                            ? 'border-gray-400 bg-gray-100'
                            : isOccupied
                            ? 'border-white/50 bg-white/30 cursor-pointer hover:bg-white/50'
                            : 'border-dashed border-gray-300 bg-white/20 cursor-pointer hover:bg-white/40'
                        }`}
                        onClick={() => {
                          if (isOccupied && slot.students) {
                            handleOccupiedSlotClick(slot.students, groupNum, index + 1);
                          } else {
                            handleEmptySlotClick(groupNum, index + 1);
                          }
                        }}
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
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
                                  title="移除学生（可移除已锁定）"
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

        {/* 管理员说明 */}
        <Card className="mt-6 border-2 border-purple-200 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">管理员功能</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600 space-y-2">
            <p>1. 点击空座位可分配未分组学生</p>
            <p>2. 点击已占用座位可移动该学生到其他位置</p>
            <p>3. 可锁定/解锁任意槽位</p>
            <p>4. 可移除任意学生（包括已锁定的座位）</p>
            <p>5. 可设置/取消任意学生的组长身份</p>
            <p>6. 可导出任意班级的分组情况</p>
            <p>7. 可查看所有操作日志</p>
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

        {/* 分配学生对话框 */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>分配学生到座位</DialogTitle>
              <DialogDescription>
                {selectedTargetSlot 
                  ? `将学生分配到 第${selectedTargetSlot.group}组 第${selectedTargetSlot.slot}号座位`
                  : '选择座位和学生进行分配'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                {/* 选择目标座位 */}
                {!selectedTargetSlot && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">选择目标座位：</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map(g => (
                        <div key={g} className="space-y-1">
                          <div className="text-xs text-center font-medium text-gray-600">第{g}组</div>
                          {[1, 2, 3, 4, 5, 6, 7].map(s => {
                            const slot = getSlotByGroupAndNumber(g, s);
                            const isOccupied = slot?.student_id;
                            const isLocked = slot?.is_locked;
                            return (
                              <div
                                key={s}
                                className={`text-xs text-center py-1 px-2 rounded cursor-pointer ${
                                  isOccupied 
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : isLocked
                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                }`}
                                onClick={() => {
                                  if (!isOccupied && !isLocked) {
                                    setSelectedTargetSlot({ group: g, slot: s });
                                  }
                                }}
                              >
                                {s}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 选择学生 */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">选择学生：</label>
                  <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                    {unassignedStudents.map(student => (
                      <Badge
                        key={student.id}
                        variant={selectedStudentToAssign?.id === student.id ? "default" : "secondary"}
                        className={`cursor-pointer ${
                          selectedStudentToAssign?.id === student.id 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={() => setSelectedStudentToAssign(student)}
                      >
                        {student.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                取消
              </Button>
              <Button 
                onClick={handleConfirmAssign}
                disabled={!selectedStudentToAssign || !selectedTargetSlot || actionLoading}
              >
                确认分配
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 移动学生对话框 */}
        <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>移动学生</DialogTitle>
              <DialogDescription>
                将 <strong>{selectedStudentToMove?.student.name}</strong> 从 
                第{selectedStudentToMove?.fromGroup}组第{selectedStudentToMove?.fromSlot}号 移动到其他座位
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="space-y-4">
                {/* 选择目标座位 */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">选择目标座位：</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map(g => (
                      <div key={g} className="space-y-1">
                        <div className="text-xs text-center font-medium text-gray-600">第{g}组</div>
                        {[1, 2, 3, 4, 5, 6, 7].map(s => {
                          const slot = getSlotByGroupAndNumber(g, s);
                          const isOccupied = slot?.student_id;
                          const isCurrent = selectedStudentToMove && 
                            g === selectedStudentToMove.fromGroup && 
                            s === selectedStudentToMove.fromSlot;
                          const isSelected = selectedTargetSlot && 
                            selectedTargetSlot.group === g && 
                            selectedTargetSlot.slot === s;
                          return (
                            <div
                              key={s}
                              className={`text-xs text-center py-1 px-2 rounded cursor-pointer ${
                                isCurrent
                                  ? 'bg-purple-200 text-purple-700 cursor-not-allowed'
                                  : isOccupied
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-green-500 text-white'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                              onClick={() => {
                                if (!isOccupied && !isCurrent) {
                                  handleSelectMoveTarget(g, s);
                                }
                              }}
                            >
                              {s}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
                取消
              </Button>
              <Button 
                onClick={handleConfirmMove}
                disabled={!selectedTargetSlot || actionLoading}
              >
                确认移动
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
