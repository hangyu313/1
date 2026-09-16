import { Student, StudentGroup } from '../types';

export const DEMO_STUDENTS: Student[] = [
  { id: 's-1', seatNumber: '01', name: '陳建宏' },
  { id: 's-2', seatNumber: '02', name: '林郁婷' },
  { id: 's-3', seatNumber: '03', name: '張家豪' },
  { id: 's-4', seatNumber: '04', name: '黃詩涵' },
  { id: 's-5', seatNumber: '05', name: '王俊傑' },
  { id: 's-6', seatNumber: '06', name: '李佩珊' },
  { id: 's-7', seatNumber: '07', name: '吳冠宇' },
  { id: 's-8', seatNumber: '08', name: '蔡宜靜' },
  { id: 's-9', seatNumber: '09', name: '楊承翰' },
  { id: 's-10', seatNumber: '10', name: '許雅婷' },
  { id: 's-11', seatNumber: '11', name: '鄭翔宇' },
  { id: 's-12', seatNumber: '12', name: '謝佳蓉' },
  { id: 's-13', seatNumber: '13', name: '郭子豪' },
  { id: 's-14', seatNumber: '14', name: '洪心怡' },
  { id: 's-15', seatNumber: '15', name: '曾柏翰' },
  { id: 's-16', seatNumber: '16', name: '邱筱涵' },
  { id: 's-17', seatNumber: '17', name: '廖偉誠' },
  { id: 's-18', seatNumber: '18', name: '賴品妤' },
  { id: 's-19', seatNumber: '19', name: '徐宗佑' },
  { id: 's-20', seatNumber: '20', name: '周子涵' },
  { id: 's-21', seatNumber: '21', name: '葉庭宇' },
  { id: 's-22', seatNumber: '22', name: '蘇靖雯' },
  { id: 's-23', seatNumber: '23', name: '莊凱翔' },
  { id: 's-24', seatNumber: '24', name: '江佩璇' },
  { id: 's-25', seatNumber: '25', name: '呂宇軒' },
  { id: 's-26', seatNumber: '26', name: '何冠霖' },
  { id: 's-27', seatNumber: '27', name: '羅千慧' },
  { id: 's-28', seatNumber: '28', name: '高郁倫' },
  { id: 's-29', seatNumber: '29', name: '蕭弘毅' },
  { id: 's-30', seatNumber: '30', name: '彭家齊' }
];

export const GROUP_COLOR_PALETTES = [
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-900', badge: 'bg-rose-500 text-white', ring: 'focus-within:ring-rose-400' },
  { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-900', badge: 'bg-sky-500 text-white', ring: 'focus-within:ring-sky-400' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', badge: 'bg-emerald-500 text-white', ring: 'focus-within:ring-emerald-400' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900', badge: 'bg-amber-500 text-white', ring: 'focus-within:ring-amber-400' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-900', badge: 'bg-violet-500 text-white', ring: 'focus-within:ring-violet-400' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900', badge: 'bg-indigo-500 text-white', ring: 'focus-within:ring-indigo-400' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900', badge: 'bg-teal-500 text-white', ring: 'focus-within:ring-teal-400' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', badge: 'bg-orange-500 text-white', ring: 'focus-within:ring-orange-400' },
  { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-900', badge: 'bg-fuchsia-500 text-white', ring: 'focus-within:ring-fuchsia-400' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-900', badge: 'bg-cyan-500 text-white', ring: 'focus-within:ring-cyan-400' },
  { bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-900', badge: 'bg-lime-500 text-white', ring: 'focus-within:ring-lime-400' },
  { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-900', badge: 'bg-pink-500 text-white', ring: 'focus-within:ring-pink-400' },
];

/**
 * Parse raw text (from paste or file) into student list
 */
export function parseStudentsText(text: string): Student[] {
  if (!text || !text.trim()) return [];

  // Strip UTF-8 BOM
  let cleaned = text.replace(/^\uFEFF/, '').trim();

  // Split into lines
  const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const students: Student[] = [];

  // Check if first line looks like a CSV header
  const firstLine = lines[0].toLowerCase();
  const isCSVHeader = ['姓名', 'name', '學生', 'student', '座號', 'id', '學號'].some(h => firstLine.includes(h));
  const startIdx = isCSVHeader ? 1 : 0;

  // Detect delimiter if any (comma, tab, semicolon)
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let seat = '';
    let name = '';
    let note = '';

    if (line.includes(',') || line.includes('\t') || line.includes(';')) {
      const sep = line.includes('\t') ? '\t' : (line.includes(';') ? ';' : ',');
      const parts = line.split(sep).map(p => p.trim().replace(/^["']|["']$/g, ''));

      if (parts.length === 1) {
        name = parts[0];
      } else if (parts.length === 2) {
        // Check which one is a number/seat
        if (/^\d+$/.test(parts[0])) {
          seat = parts[0];
          name = parts[1];
        } else if (/^\d+$/.test(parts[1])) {
          name = parts[0];
          seat = parts[1];
        } else {
          name = parts[0];
          note = parts[1];
        }
      } else if (parts.length >= 3) {
        if (/^\d+$/.test(parts[0])) {
          seat = parts[0];
          name = parts[1];
          note = parts.slice(2).join(' ');
        } else {
          name = parts[0];
          seat = parts[1];
          note = parts.slice(2).join(' ');
        }
      }
    } else {
      // Free text line, could be "1. 王小明", "01 李大華", "陳小強", etc.
      // Match pattern like: (01|1|#1|座號1) (name)
      const numMatch = line.match(/^([#№]?\d{1,3}|[座學]號\s*[:：]?\s*\d{1,3})[\.\s、，,:]+(.+)$/);
      if (numMatch) {
        const rawNum = numMatch[1].replace(/\D/g, '');
        seat = rawNum.padStart(2, '0');
        name = numMatch[2].trim();
      } else {
        name = line;
      }
    }

    if (name) {
      // Sanitize name: remove any lingering quotes or leading symbols
      name = name.replace(/^[\s•\-\*\.]+|[\s]+$/g, '');
      students.push({
        id: `s-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        seatNumber: seat ? seat.padStart(2, '0') : undefined,
        name,
        note: note || undefined,
      });
    }
  }

  return students;
}

/**
 * Export student groups into formatted text for sharing
 */
export function formatGroupsText(groups: StudentGroup[]): string {
  let output = `【分組結果】共 ${groups.length} 組\n`;
  output += `=========================\n\n`;

  groups.forEach((g) => {
    output += `${g.name} (${g.members.length}人):\n`;
    const memberNames = g.members.map(m => m.seatNumber ? `${m.seatNumber}號 ${m.name}` : m.name).join('、');
    output += `  ${memberNames}\n\n`;
  });

  return output.trim();
}

/**
 * Generate CSV download for groups
 */
export function exportGroupsCSV(groups: StudentGroup[]) {
  const rows: string[] = ['組別,座號,姓名,備註'];
  groups.forEach(g => {
    g.members.forEach(m => {
      rows.push(`"${g.name}","${m.seatNumber || ''}","${m.name}","${m.note || ''}"`);
    });
  });

  const csvContent = '\uFEFF' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `課堂分組結果_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
