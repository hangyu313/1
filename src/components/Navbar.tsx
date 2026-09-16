import React from 'react';
import {
  Sparkles,
  Users,
  Dices,
  ClipboardList,
  Volume2,
  VolumeX,
  GraduationCap,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'picker' | 'groups' | 'roster';
  onTabChange: (tab: 'picker' | 'groups' | 'roster') => void;
  studentCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  studentCount,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                課堂隨機抽籤與分組小幫手
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                專為教師設計的互動教學工具
              </p>
            </div>
          </div>

          {/* Navigation Mode Tabs */}
          <nav className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => onTabChange('picker')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'picker'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Dices className="w-4 h-4 text-indigo-500" />
              <span>隨機抽籤</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('groups')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'groups'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-sky-500" />
              <span>自動分組</span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange('roster')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all relative ${
                activeTab === 'roster'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ClipboardList className="w-4 h-4 text-emerald-500" />
              <span>名單管理</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  studentCount > 0
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {studentCount}
              </span>
            </button>
          </nav>

          {/* Sound Mute Quick Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleSound}
              className={`p-2 rounded-lg border transition-colors ${
                soundEnabled
                  ? 'text-indigo-600 bg-indigo-50/80 border-indigo-200'
                  : 'text-slate-400 bg-slate-50 border-slate-200'
              }`}
              title={soundEnabled ? '音效已開啟' : '音效已靜音'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
