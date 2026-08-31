export interface SeatInfo {
  label: string;
  keys: string[];
  mapping: Record<string, string>;
}

export interface KoreanLayout {
  seats: Record<string, SeatInfo>;
}

export interface SeatSelection {
  [seatId: string]: {
    selected: boolean;
    selectedKeys: Set<string>;
  };
}

export interface KeyStats {
  correct: number;
  incorrect: number;
  currentKey?: string;
}
