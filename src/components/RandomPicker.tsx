import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  History,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Flame,
  UserCheck,
  Zap,
} from 'lucide-react';
import { Student, PickHistoryItem } from '../types';
import { sounds } from '../utils/sound';

interface RandomPickerProps {
  students: Student[];
  onOpenRosterTab: () => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({
  students,
  onOpenRosterTab,
}) => {
  // Settings
  const [allowRepeat, setAllowRepeat] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [durationSec, setDurationSec] = useState<number>(3.0); // 1.5, 3.0, 4.5
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Picker State
  const [drawnIds, setDrawnIds] = useState<string[]>([]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [displayStudent, setDisplayStudent] = useState<Student | null>(null);
  const [lastWinner, setLastWinner] = useState<Student | null>(null);
  const [history, setHistory] = useState<PickHistoryItem[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Sync sound settings with audio manager
  useEffect(() => {
    sounds.enabled = soundEnabled;
  }, [soundEnabled]);

  // Candidates pool based on allowRepeat setting
  const candidatePool = allowRepeat
    ? students
    : students.filter((s) => !drawnIds.includes(s.id));

  // Reset drawn if students change or explicitly reset
  const handleResetDrawn = () => {
    setDrawnIds([]);
    setLastWinner(null);
    setDisplayStudent(null);
    sounds.playPop();
  };

  const handleClearHistory = () => {
    setHistory([]);
    sounds.playPop();
  };

  // Trigger celebration confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
    });
  };

  // Perform the random pick with suspenseful easing animation and audio
  const startDrawing = () => {
    if (students.length === 0 || candidatePool.length === 0 || isRolling) return;

    setIsRolling(true);
    sounds.playPop();

    // Pick true random winner in advance from candidates
    const winnerIndex = Math.floor(Math.random() * candidatePool.length);
    const chosenWinner = candidatePool[winnerIndex];

    const startTime = performance.now();
    const duration = durationSec * 1000;
    let lastTickTime = 0;
    let tickInterval = 60; // start fast
    let stepCount = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic for tension build-up
      const easeOut = 1 - Math.pow(1 - progress, 3);
      // Gradually lengthen interval between ticks from 50ms to ~350ms
      tickInterval = 50 + easeOut * 320;

      if (currentTime - lastTickTime >= tickInterval && progress < 1) {
        lastTickTime = currentTime;
        stepCount++;

        // Randomly flick candidate for visual thrill
        const randomCandidate =
          candidatePool[Math.floor(Math.random() * candidatePool.length)];
        setDisplayStudent(randomCandidate);

        // Sound tick pitch climbs slightly as suspense mounts
        const pitchRatio = 0.8 + easeOut * 0.7;
        sounds.playTick(pitchRatio);
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Final finish
        setDisplayStudent(chosenWinner);
        setLastWinner(chosenWinner);
        setIsRolling(false);

        // Add to history
        setHistory((prev) => [
          {
            id: `pick-${Date.now()}`,
            student: chosenWinner,
            timestamp: Date.now(),
          },
          ...prev,
        ]);

        // If non-repeat, add to drawn list
        if (!allowRepeat) {
          setDrawnIds((prev) => [...prev, chosenWinner.id]);
        }

        // Victory fanfare and confetti!
        sounds.playWin();
        triggerConfetti();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  useEffect(() => {
    const handleFSEvent = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSEvent);
    return () => document.removeEventListener('fullscreenchange', handleFSEvent);
  }, []);

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-8 shadow-xs">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <HelpCircle className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">尚未載入學生名單</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          抽籤前請先匯入學生名單（支援 CSV 檔案或直接貼上姓名），或是立即載入示範班級名單體驗。
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

  const isPoolExhausted = !allowRepeat && candidatePool.length === 0;

  return (
    <div
      ref={containerRef}
      className={`space-y-6 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-900 text-white p-8 flex flex-col justify-between overflow-y-auto'
          : ''
      }`}
    >
      {/* Control / Config bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border transition-colors ${
          isFullscreen
            ? 'bg-slate-800/80 border-slate-700 text-white'
            : 'bg-white border-slate-200/80 shadow-xs text-slate-800'
        }`}
      >
        {/* Left: Mode toggle (Repeat vs Non-repeat) */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            抽取模式
          </span>
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/80">
            <button
              type="button"
              disabled={isRolling}
              onClick={() => {
                setAllowRepeat(false);
                sounds.playPop();
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                !allowRepeat
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              不重複抽取
            </button>
            <button
              type="button"
              disabled={isRolling}
              onClick={() => {
                setAllowRepeat(true);
                sounds.playPop();
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                allowRepeat
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              允許重複抽取
            </button>
          </div>
        </div>

        {/* Right: Sound, Duration & Fullscreen Controls */}
        <div className="flex items-center gap-2">
          {/* Duration speed select */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 hidden sm:inline">懸疑節奏:</span>
            <select
              value={durationSec}
              disabled={isRolling}
              onChange={(e) => setDurationSec(parseFloat(e.target.value))}
              aria-label="抽籤動畫節奏速度"
              className={`text-xs px-2.5 py-1.5 rounded-lg border focus:outline-hidden font-medium ${
                isFullscreen
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value={1.5}>極速 (1.5秒)</option>
              <option value={3.0}>標準 (3.0秒)</option>
              <option value={4.5}>刺激緊張 (4.5秒)</option>
            </select>
          </div>

          {/* Sound toggle */}
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              sounds.playPop();
            }}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'text-indigo-600 bg-indigo-50 border-indigo-200'
                : 'text-slate-400 bg-slate-50 border-slate-200'
            }`}
            title={soundEnabled ? '音效已開啟' : '音效已靜音'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* History modal toggle */}
          <button
            type="button"
            onClick={() => setShowHistoryModal(!showHistoryModal)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isFullscreen
                ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">歷史</span> ({history.length})
          </button>

          {/* Fullscreen toggle for projector */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className={`p-2 rounded-lg border transition-colors ${
              isFullscreen
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title={isFullscreen ? '結束投影全螢幕' : '進入投影全螢幕模式'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Lucky Draw Arena */}
      <div
        className={`relative overflow-hidden rounded-2xl border transition-all ${
          isFullscreen
            ? 'bg-slate-800/90 border-slate-700 my-auto py-16'
            : 'bg-linear-to-b from-white to-indigo-50/30 border-slate-200/80 shadow-sm py-12 px-6'
        }`}
      >
        {/* Ambient subtle decorative background circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-xl mx-auto text-center space-y-6">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-slate-100/90 text-slate-600 border border-slate-200/60 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {allowRepeat ? (
              <span>允許重複模式・候選名單 {students.length} 人</span>
            ) : (
              <span>
                不重複模式・剩餘待抽 {candidatePool.length} 人 / 總計 {students.length} 人
              </span>
            )}
          </div>

          {/* Large Name Presentation Display */}
          <div className="min-h-[220px] flex items-center justify-center p-6">
            <AnimatePresence mode="wait">
              {displayStudent ? (
                <motion.div
                  key={displayStudent.id + (isRolling ? '-rolling' : '-picked')}
                  initial={{ scale: 0.85, opacity: 0.8 }}
                  animate={{
                    scale: isRolling ? [0.95, 1.05, 1] : 1,
                    opacity: 1,
                  }}
                  transition={{
                    duration: isRolling ? 0.08 : 0.4,
                    type: isRolling ? 'tween' : 'spring',
                  }}
                  className={`p-8 rounded-3xl w-full max-w-md border transition-all ${
                    !isRolling && lastWinner
                      ? isFullscreen
                        ? 'bg-indigo-600/30 border-indigo-400 shadow-2xl shadow-indigo-500/20 ring-4 ring-indigo-400/40'
                        : 'bg-white border-indigo-300 shadow-xl ring-4 ring-indigo-100'
                      : isFullscreen
                      ? 'bg-slate-700/50 border-slate-600'
                      : 'bg-white/90 border-slate-200 shadow-md'
                  }`}
                >
                  {/* Seat number if available */}
                  <div className="mb-2">
                    <span
                      className={`inline-block text-xs font-mono font-bold tracking-widest px-3 py-1 rounded-full ${
                        !isRolling && lastWinner
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {displayStudent.seatNumber
                        ? `座號 ${displayStudent.seatNumber}`
                        : '學生'}
                    </span>
                  </div>

                  {/* Student Name */}
                  <h1
                    className={`font-black tracking-tight leading-tight transition-all ${
                      isFullscreen
                        ? 'text-5xl md:text-7xl text-white'
                        : 'text-4xl md:text-6xl text-slate-900'
                    }`}
                  >
                    {displayStudent.name}
                  </h1>

                  {!isRolling && lastWinner && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>幸運中選！</span>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <div className="p-8 rounded-3xl w-full max-w-md border border-dashed border-slate-300 bg-white/60 text-slate-400 flex flex-col items-center justify-center">
                  <Flame className="w-12 h-12 text-slate-300 mb-2 stroke-[1.5]" />
                  <p className="text-base font-semibold text-slate-600">準備好開始抽籤了嗎？</p>
                  <p className="text-xs text-slate-400 mt-1">
                    點擊下方「開始抽籤」按鈕隨機抽出一位學生
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {isPoolExhausted ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-amber-600 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  所有學生皆已抽出完畢！
                </div>
                <button
                  type="button"
                  onClick={handleResetDrawn}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  重新洗牌重抽
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  disabled={isRolling}
                  onClick={startDrawing}
                  className={`px-8 py-4 text-lg font-bold rounded-2xl shadow-lg transition-all flex items-center gap-2.5 cursor-pointer transform active:scale-95 ${
                    isRolling
                      ? 'bg-slate-400 text-white cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/25 text-white'
                  }`}
                >
                  <Zap className={`w-5 h-5 ${isRolling ? 'animate-bounce' : ''}`} />
                  {isRolling ? '抽籤進行中...' : displayStudent ? '再抽下一位' : '開始隨機抽籤'}
                </button>

                {!allowRepeat && drawnIds.length > 0 && !isRolling && (
                  <button
                    type="button"
                    onClick={handleResetDrawn}
                    className="px-4 py-3.5 text-xs font-semibold rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                    title="重設已抽出名單，讓所有學生回到抽籤池"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    重設已抽池 ({drawnIds.length})
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pools Grid: Remaining vs Drawn */}
      {!allowRepeat && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Waiting Pool */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  待抽取名單 ({candidatePool.length} 人)
                </h4>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
              {candidatePool.length === 0 ? (
                <span className="text-xs text-slate-400 py-2">所有人都已被抽中！</span>
              ) : (
                candidatePool.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200/60"
                  >
                    {s.seatNumber && <span className="font-mono text-slate-400">{s.seatNumber}</span>}
                    {s.name}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Already Drawn Pool */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  已抽出名單 ({drawnIds.length} 人)
                </h4>
              </div>
              {drawnIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetDrawn}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  重設
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
              {drawnIds.length === 0 ? (
                <span className="text-xs text-slate-400 py-2">尚未抽出任何學生</span>
              ) : (
                drawnIds.map((id, index) => {
                  const s = students.find((item) => item.id === id);
                  if (!s) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200/70"
                    >
                      <span className="text-[10px] font-mono text-emerald-500">#{index + 1}</span>
                      {s.name}
                    </span>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Drawer / Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  抽籤歷史紀錄 ({history.length})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearHistory}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                  >
                    清空歷史
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 max-h-[360px] overflow-y-auto space-y-2">
              {history.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  尚無抽籤紀錄
                </div>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/70 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 w-5">
                        #{history.length - idx}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {item.student.name}
                      </span>
                      {item.student.seatNumber && (
                        <span className="text-slate-400 font-mono">
                          (座號 {item.student.seatNumber})
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium rounded-lg"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
