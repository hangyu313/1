import React, { useState, useRef } from 'react';
import { Upload, ClipboardPaste, UserPlus, Trash2, Users, FileText, Check, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { Student } from '../types';
import { parseStudentsText, DEMO_STUDENTS } from '../utils/parser';
import { sounds } from '../utils/sound';

interface RosterManagerProps {
  students: Student[];
  onUpdateStudents: (newStudents: Student[]) => void;
  onResetPickerState?: () => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  students,
  onUpdateStudents,
  onResetPickerState,
}) => {
  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'paste' | 'manual'>('upload');
  const [pasteText, setPasteText] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newSeatNumber, setNewSeatNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        showFeedback('檔案內容為空', 'error');
        return;
      }
      const parsed = parseStudentsText(content);
      if (parsed.length === 0) {
        showFeedback('無法辨識名單格式，請確認是否包含姓名', 'error');
      } else {
        onUpdateStudents(parsed);
        if (onResetPickerState) onResetPickerState();
        sounds.playWin();
        showFeedback(`成功匯入 ${parsed.length} 位學生名單！`);
      }
    };
    reader.onerror = () => {
      showFeedback('讀取檔案失敗，請重試', 'error');
    };
    reader.readAsText(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) {
      showFeedback('請輸入或貼上學生名單', 'error');
      return;
    }
    const parsed = parseStudentsText(pasteText);
    if (parsed.length === 0) {
      showFeedback('未偵測到有效姓名，請檢查輸入內容', 'error');
      return;
    }
    onUpdateStudents(parsed);
    if (onResetPickerState) onResetPickerState();
    sounds.playWin();
    setPasteText('');
    showFeedback(`成功解析並匯入 ${parsed.length} 位學生！`);
  };

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const newStudent: Student = {
      id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newStudentName.trim(),
      seatNumber: newSeatNumber.trim() ? newSeatNumber.trim().padStart(2, '0') : undefined,
    };

    onUpdateStudents([...students, newStudent]);
    setNewStudentName('');
    setNewSeatNumber('');
    sounds.playPop();
    showFeedback(`已新增學生：${newStudent.name}`);
  };

  const handleRemoveSingle = (id: string) => {
    const target = students.find((s) => s.id === id);
    onUpdateStudents(students.filter((s) => s.id !== id));
    sounds.playPop();
    if (target) {
      showFeedback(`已移除：${target.name}`);
    }
  };

  const handleClearAll = () => {
    if (confirm('確定要清空所有學生名單嗎？')) {
      onUpdateStudents([]);
      if (onResetPickerState) onResetPickerState();
      showFeedback('已清空學生名單');
    }
  };

  const handleLoadDemo = () => {
    onUpdateStudents(DEMO_STUDENTS);
    if (onResetPickerState) onResetPickerState();
    sounds.playWin();
    showFeedback('已載入 30 人示範班級名單！');
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.seatNumber && s.seatNumber.includes(searchQuery))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Fast Demo bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              班級名單來源管理
            </h2>
            <p className="text-xs text-slate-500">
              目前共有 <span className="font-semibold text-indigo-600">{students.length}</span> 位學生在名單中
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleLoadDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-200/60"
            title="載入 30 人範例學生名單方便立即測試"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            載入 30 人示範名單
          </button>
          {students.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors border border-rose-200/60"
            >
              <Trash2 className="w-3.5 h-3.5" />
              清空名單
            </button>
          )}
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`flex items-center gap-2 p-3 text-sm rounded-lg border transition-all ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Main Grid: Input panel & Current Roster Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Add methods */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Input tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50/70 p-1">
              <button
                type="button"
                onClick={() => setActiveInputTab('upload')}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeInputTab === 'upload'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                上傳 CSV 檔
              </button>
              <button
                type="button"
                onClick={() => setActiveInputTab('paste')}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeInputTab === 'paste'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                貼上文字名單
              </button>
              <button
                type="button"
                onClick={() => setActiveInputTab('manual')}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                  activeInputTab === 'manual'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                單筆新增
              </button>
            </div>

            <div className="p-5">
              {/* Tab 1: CSV Upload */}
              {activeInputTab === 'upload' && (
                <div className="space-y-3">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      dragOver
                        ? 'border-indigo-500 bg-indigo-50/50'
                        : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt,.tsv"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                          e.target.value = '';
                        }
                      }}
                    />
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-800">
                      點擊選取或拖曳檔案至此
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      支援 .csv、.txt，包含座號或學生姓名欄位均可解析
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                    <p className="font-medium text-slate-700">💡 CSV 格式範例：</p>
                    <p className="font-mono text-slate-500">座號,姓名 或 01,王小明</p>
                    <p className="text-slate-500">（若檔案只有一行一個姓名，亦可直接解析）</p>
                  </div>
                </div>
              )}

              {/* Tab 2: Text Paste */}
              {activeInputTab === 'paste' && (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-slate-700">
                    直接貼上姓名名單（一行一位或逗號分隔）：
                  </label>
                  <textarea
                    rows={7}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="例如：&#10;01 王小明&#10;02 李大華&#10;03 張美麗&#10;或直接貼上：陳曉涵、林志銘、黃俊傑"
                    className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      支援帶編號格式如「1. 王大同」
                    </span>
                    <button
                      type="button"
                      onClick={handlePasteSubmit}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
                    >
                      解析並匯入
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 3: Manual Single Add */}
              {activeInputTab === 'manual' && (
                <form onSubmit={handleAddSingle} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      座號 / 學號（選填）
                    </label>
                    <input
                      type="text"
                      value={newSeatNumber}
                      onChange={(e) => setNewSeatNumber(e.target.value)}
                      placeholder="例：01"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      學生姓名 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      placeholder="例：林大同"
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors shadow-xs"
                  >
                    新增學生
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Roster Table & Search */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                名單總覽 ({students.length} 人)
              </h3>
              <p className="text-xs text-slate-500">
                抽籤與自動分組時均以此名單為基準
              </p>
            </div>
            <div className="w-full sm:w-48">
              <input
                type="text"
                placeholder="搜尋學生姓名或座號..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[360px] p-2">
            {students.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center p-6">
                <FileText className="w-12 h-12 stroke-[1.5] mb-2 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">目前尚無學生名單</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  請從左側上傳 CSV 檔案、直接貼上姓名，或點擊上方「載入示範名單」快速體驗
                </p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
                找不到符合「{searchQuery}」的學生
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredStudents.map((student, idx) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="shrink-0 text-[11px] font-mono font-medium px-1.5 py-0.5 rounded-sm bg-slate-200/80 text-slate-700">
                        {student.seatNumber || `${idx + 1}`.padStart(2, '0')}
                      </span>
                      <span className="text-sm font-medium text-slate-800 truncate" title={student.name}>
                        {student.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSingle(student.id)}
                      title={`移除 ${student.name}`}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity rounded-sm hover:bg-rose-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {students.length > 0 && (
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
              <span>共顯示 {filteredStudents.length} / {students.length} 位學生</span>
              <span className="text-emerald-600 font-medium">✓ 名單已就緒，可開始抽籤或分組</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
