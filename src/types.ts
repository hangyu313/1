export interface Student {
  id: string;
  name: string;
  seatNumber?: string;
  note?: string;
}

export interface PickHistoryItem {
  id: string;
  student: Student;
  timestamp: number;
}

export interface StudentGroup {
  id: string;
  name: string;
  color: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    ring: string;
  };
  members: Student[];
}

export type GroupingStrategy = 'bySize' | 'byCount';

export interface GroupConfig {
  strategy: GroupingStrategy;
  value: number; // either students per group or number of groups
  balanceMethod: 'even' | 'overflow'; // distribute remainder evenly or create smaller group
}
