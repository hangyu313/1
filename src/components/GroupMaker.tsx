import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Shuffle,
  Copy,
  Download,
  Check,
  ArrowRightLeft,
  Sparkles,
  HelpCircle,
  Hash,
  Sliders,
  AlertCircle,
} from 'lucide-react';
import { Student, StudentGroup, GroupingStrategy } from '../types';
import { GROUP_COLOR_PALETTES, formatGroupsText, exportGroupsCSV } from '../utils/parser';
import { sounds } from '../utils/sound';

interface GroupMakerProps {
  students: Student[];
  onOpenRosterTab: () => void;
}

export const GroupMaker: React.FC<GroupMakerProps> = ({
  students,
  onOpenRosterTab,
}) => {
  const [strategy, setStrategy] = useState<GroupingStrategy>('bySize');
  const [studentsPerGroup, setStudentsPerGroup] = useState<number>(4);
  const [groupCount, setGroupCount] = useState<number>(4);
  const [balanceMethod, setBalanceMethod] = useState<'even' | 'overflow'>('even');

  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [movingStudent, setMovingStudent] = useState<{ student: Student; fromGroupId: string } | null>(null);

  // Fisher-Yates shuffle array
  function shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }
    return shuffled;
  }

  // Execute grouping
  const handleGenerateGroups = () => {
    if (students.length === 0) return;

    sounds.playShuffle();

    const shuffled: Student[] = shuffleArray<Student>(students);
    const resultGroups: StudentGroup[] = [];

    let targetNumGroups = 0;

    if (strategy === 'bySize') {
      const size = Math.max(1, studentsPerGroup);
      if (balanceMethod === 'even') {
        // e.g. 10 students, size 3 => 3 groups (sizes 4, 3, 3)
        targetNumGroups = Math.ceil(shuffled.length / size);
      } else {
        // e.g. 10 students, size 3 => 3 groups of 3 + 1 group of 1
        targetNumGroups = Math.ceil(shuffled.length / size);
      }
    } else {
      targetNumGroups = Math.min(Math.max(1, groupCount), shuffled.length);
    }

    // Initialize groups
    for (let i = 0; i < targetNumGroups; i++) {
      const palette = GROUP_COLOR_PALETTES[i % GROUP_COLOR_PALETTES.length];
      resultGroups.push({
        id: `group-${i + 1}-${Date.now()}`,
        name: `第 ${i + 1} 組`,
        color: palette,
        members: [],
      });
    }

    if (strategy === 'bySize' && balanceMethod === 'overflow') {
      // Chunk by exact size, last group gets remainder
      let groupIdx = 0;
      for (let i = 0; i < shuffled.length; i += studentsPerGroup) {
        const chunk = shuffled.slice(i, i + studentsPerGroup);
        if (resultGroups[groupIdx]) {
          resultGroups[groupIdx].members = chunk;
          groupIdx++;
        }
      }
    } else {
      // Deal like a deck of cards round-robin for perfect balance
      shuffled.forEach((student, index) => {
        const targetIndex = index % targetNumGroups;
        resultGroups[targetIndex].members.push(student);
      });
    }

    // Sort members in each group by seat number if available
    resultGroups.forEach((g) => {
      g.members.sort((a, b) => {
        if (a.seatNumber && b.seatNumber) {
          return parseInt(a.seatNumber, 10) - parseInt(b.seatNumber, 10);
        }
        return a.name.localeCompare(b.name, 'zh-Hant');
      });
    });

    setGroups(resultGroups);
    setMovingStudent(null);
  };

  const handleCopy = () => {
    if (groups.length === 0) return;
    const text = formatGroupsText(groups);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      sounds.playPop();
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleExportCSV = () => {
    if (groups.length === 0) return;
    exportGroupsCSV(groups);
    sounds.playPop();
  };

  // Move student to another group for manual fine-tuning
  const handleMoveStudentTo = (targetGroupId: string) => {
    if (!movingStudent) return;
    const { student, fromGroupId } = movingStudent;
    if (fromGroupId === targetGroupId) {
      setMovingStudent(null);
      return;
    }

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === fromGroupId) {
          return {
            ...g,
            members: g.members.filter((m) => m.id !== student.id),
          };
        }
        if (g.id === targetGroupId) {
          return {
            ...g,
            members: [...g.members, student].sort((a, b) =>
              (a.seatNumber || '').localeCompare(b.seatNumber || '')
            ),
          };
        }
        return g;
      })
    );

    sounds.playPop();
    setMovingStudent(null);
  };

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-8 shadow-xs">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <HelpCircle className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">尚未載入學生名單</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          進行自動分組前，請先匯入班級學生名單。
        </p>
        <button
          type="button"
          onClick={onOpenRosterTab}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-xs transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          前往名單管理 / 載入名單
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Config & Action Panel */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">自動分組設定</h3>
              <p className="text-xs text-slate-500">
                目前名單共有 <span className="font-semibold text-indigo-600">{students.length}</span> 位學生
              </p>
            </div>
          </div>

          {/* Strategy Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setStrategy('bySize');
                sounds.playPop();
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                strategy === 'bySize'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              依「每組人數」分組
            </button>
            <button
              type="button"
              onClick={() => {
                setStrategy('byCount');
                sounds.playPop();
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                strategy === 'byCount'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              依「要分成幾組」分組
            </button>
          </div>
        </div>

        {/* Dynamic Controls depending on strategy */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {strategy === 'bySize' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  每組幾人：
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={students.length}
                    value={studentsPerGroup}
                    onChange={(e) => setStudentsPerGroup(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 text-sm font-bold text-center p-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <div className="flex gap-1">
                    {[2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setStudentsPerGroup(num);
                          sounds.playPop();
                        }}
                        className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
                          studentsPerGroup === num
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {num}人
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  餘數人數分配：
                </label>
                <select
                  value={balanceMethod}
                  onChange={(e) => setBalanceMethod(e.target.value as 'even' | 'overflow')}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-hidden bg-white text-slate-800"
                >
                  <option value="even">平均分散至各組（推薦，人數最接近）</option>
                  <option value="overflow">剩餘者單獨成為最後一組</option>
                </select>
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                預計將分為約{' '}
                <span className="font-bold text-indigo-600">
                  {Math.ceil(students.length / studentsPerGroup)}
                </span>{' '}
                組，每組約 {studentsPerGroup} ~ {studentsPerGroup + 1} 人
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  欲分成幾組：
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={students.length}
                    value={groupCount}
                    onChange={(e) => setGroupCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 text-sm font-bold text-center p-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <div className="flex gap-1">
                    {[2, 3, 4, 5, 6, 8].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setGroupCount(num);
                          sounds.playPop();
                        }}
                        className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
                          groupCount === num
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {num}組
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                總計 {students.length} 人分成 {groupCount} 組，每組平均約{' '}
                <span className="font-bold text-indigo-600">
                  {Math.floor(students.length / groupCount)} ~ {Math.ceil(students.length / groupCount)}
                </span>{' '}
                人
              </div>
            </>
          )}
        </div>

        {/* Action Button & Export Options */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleGenerateGroups}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Shuffle className="w-4 h-4" />
            {groups.length === 0 ? '開始隨機自動分組' : '重新隨機分組'}
          </button>

          {groups.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                title="複製格式化文字到剪貼簿"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">已複製名單！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    複製名單
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                title="匯出分組結果為 CSV 檔案"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                匯出 CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Manual Fine-Tuning Notice if student selected */}
      {movingStudent && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              正在微調學生：<strong className="font-bold">{movingStudent.student.name}</strong>，請點選下方要移入的目標組別。
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMovingStudent(null)}
            className="text-amber-700 hover:text-amber-900 font-bold px-2 py-0.5 rounded-sm hover:bg-amber-100"
          >
            取消
          </button>
        </div>
      )}

      {/* Visualized Groups Grid */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
            <Users className="w-7 h-7 stroke-[1.5]" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 mb-1">
            設定完成後，點擊上方「開始隨機自動分組」
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            系統將以公平隨機演算法進行分配，分組完成後將以色彩分明的小組卡片視覺化呈現，並支援手動微調與匯出。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {groups.map((group, groupIdx) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: groupIdx * 0.04 }}
              className={`rounded-2xl border shadow-xs overflow-hidden flex flex-col transition-all ${
                group.color.bg
              } ${group.color.border} ${
                movingStudent && movingStudent.fromGroupId !== group.id
                  ? 'ring-2 ring-indigo-400 cursor-pointer hover:shadow-md'
                  : ''
              }`}
              onClick={() => {
                if (movingStudent && movingStudent.fromGroupId !== group.id) {
                  handleMoveStudentTo(group.id);
                }
              }}
            >
              {/* Group Card Header */}
              <div className="p-3.5 border-b border-black/5 flex items-center justify-between bg-white/60 backdrop-blur-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${group.color.badge}`}
                  >
                    {groupIdx + 1}
                  </span>
                  <h4 className={`text-sm font-bold ${group.color.text}`}>
                    {group.name}
                  </h4>
                </div>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-black/5 text-slate-700">
                  {group.members.length} 人
                </span>
              </div>

              {/* Members List */}
              <div className="p-3 flex-1 space-y-1.5 min-h-[140px]">
                {group.members.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 py-6">
                    此組暫無組員
                  </div>
                ) : (
                  group.members.map((member) => {
                    const isBeingMoved = movingStudent?.student.id === member.id;
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium transition-all ${
                          isBeingMoved
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white/90 hover:bg-white text-slate-800 border border-black/5 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {member.seatNumber ? (
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                                isBeingMoved
                                  ? 'bg-indigo-700 text-indigo-100'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {member.seatNumber}
                            </span>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          )}
                          <span className="truncate">{member.name}</span>
                        </div>

                        {/* Quick Move Trigger */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isBeingMoved) {
                              setMovingStudent(null);
                            } else {
                              setMovingStudent({
                                student: member,
                                fromGroupId: group.id,
                              });
                            }
                            sounds.playPop();
                          }}
                          className={`p-1 rounded-md transition-colors ${
                            isBeingMoved
                              ? 'text-white hover:bg-indigo-700'
                              : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                          }`}
                          title="換組 / 移動組員"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Card Footer Helper */}
              {movingStudent && movingStudent.fromGroupId !== group.id && (
                <div className="p-2 bg-indigo-50 border-t border-indigo-100 text-center text-xs font-semibold text-indigo-700">
                  點擊移入此組
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
