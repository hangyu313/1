import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { RandomPicker } from './components/RandomPicker';
import { GroupMaker } from './components/GroupMaker';
import { RosterManager } from './components/RosterManager';
import { Student } from './types';
import { DEMO_STUDENTS } from './utils/parser';
import { sounds } from './utils/sound';

const STORAGE_KEY = 'classroom_assistant_students_v1';

export default function App() {
  const [students, setStudents] = useState<Student[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Fallback to demo
      }
    }
    return DEMO_STUDENTS;
  });

  const [activeTab, setActiveTab] = useState<'picker' | 'groups' | 'roster'>('picker');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    } catch {
      // LocalStorage might fail in strict sandbox
    }
  }, [students]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.enabled = next;
    if (next) {
      sounds.playPop();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        studentCount={students.length}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'picker' && (
          <RandomPicker
            students={students}
            onOpenRosterTab={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'groups' && (
          <GroupMaker
            students={students}
            onOpenRosterTab={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'roster' && (
          <RosterManager
            students={students}
            onUpdateStudents={setStudents}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>
            課堂隨機抽籤與分組小幫手 ・ 專為教學現場設計
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('roster')}
              className="hover:text-indigo-600 transition-colors"
            >
              名單管理 ({students.length} 人)
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveTab('picker')}
              className="hover:text-indigo-600 transition-colors"
            >
              抽籤模組
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className="hover:text-indigo-600 transition-colors"
            >
              分組模組
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
