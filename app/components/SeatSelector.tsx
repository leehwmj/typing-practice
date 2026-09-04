'use client';

import { useState, useEffect } from 'react';
import koreanLayout from '@/data/korean-layout.json';
import englishLayout from '@/data/english-layout.json';
import seatsData from '@/data/seats.json';
import type { SeatSelection } from '../types';

interface SeatSelectorProps {
  onStart: (selection: SeatSelection) => void;
  onBack?: () => void;
  language?: 'korean' | 'english';
}

export default function SeatSelector({ onStart, onBack, language = 'korean' }: SeatSelectorProps) {
  const layout = language === 'korean' ? koreanLayout : englishLayout;
  const [selection, setSelection] = useState<SeatSelection>({});

  useEffect(() => {
    const initialSelection: SeatSelection = {};
    Object.keys(layout.seats).forEach((seatId) => {
      initialSelection[seatId] = {
        selected: false,
        selectedKeys: new Set(),
      };
    });
    setSelection(initialSelection);
  }, [layout]);

  const handleSeatToggle = (seatId: string) => {
    setSelection((prev) => {
      const newSelection = { ...prev };
      const seat = layout.seats[seatId as keyof typeof layout.seats];

      if (newSelection[seatId].selected) {
        newSelection[seatId] = {
          selected: false,
          selectedKeys: new Set(),
        };
      } else {
        newSelection[seatId] = {
          selected: true,
          selectedKeys: new Set(seat.keys),
        };
      }

      return newSelection;
    });
  };

  const handleKeyToggle = (seatId: string, key: string) => {
    setSelection((prev) => {
      const newSelection = { ...prev };
      const keys = new Set(newSelection[seatId].selectedKeys);

      if (keys.has(key)) {
        keys.delete(key);
      } else {
        keys.add(key);
      }

      return {
        ...newSelection,
        [seatId]: {
          ...newSelection[seatId],
          selectedKeys: keys,
        },
      };
    });
  };

  const getTotalSelectedKeys = () => {
    return Object.values(selection).reduce((sum, seat) => {
      return sum + seat.selectedKeys.size;
    }, 0);
  };

  const canStart = getTotalSelectedKeys() > 0;

  const handleStart = () => {
    if (canStart) {
      onStart(selection);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300">
          연습할 자리와 키를 선택하세요
        </p>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          선택된 키: {getTotalSelectedKeys()}개
        </p>
      </div>

      <div className="space-y-4">
        {seatsData.seatGroups.map((group) => (
          <div key={group.name} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
              {group.name}
            </h2>

            <div className="space-y-3">
              {group.seats.map((seatId) => {
                const seat =
                  layout.seats[seatId as keyof typeof layout.seats];
                const seatState = selection[seatId];

                if (!seatState) return null;

                return (
                  <div key={seatId} className="space-y-2">
                    <label className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                      <input
                        type="checkbox"
                        checked={seatState.selected}
                        onChange={() => handleSeatToggle(seatId)}
                        className="w-5 h-5 rounded"
                        aria-label={`${seat.label} 전체 선택`}
                      />
                      <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        {seat.label}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({seatState.selectedKeys.size}/{seat.keys.length})
                      </span>
                    </label>

                    {seatState.selected && (
                      <div className="ml-8 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {seat.keys.map((key) => {
                          const mapping = seat.mapping as Record<string, string>;
                          const displayValue = mapping[key] || key;
                          // Korean mode: show only Korean, English mode: show only English
                          const showKey = language === 'english' ? displayValue : '';
                          const showKorean = language === 'korean' ? displayValue : '';
                          return (
                            <label
                              key={key}
                              className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <input
                                type="checkbox"
                                checked={seatState.selectedKeys.has(key)}
                                onChange={() => handleKeyToggle(seatId, key)}
                                className="w-4 h-4 rounded"
                                aria-label={`${displayValue} 선택`}
                              />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {language === 'english' ? (
                                  displayValue
                                ) : (
                                  <>
                                    {showKorean}
                                  </>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-4 pt-6">
        <button
          onClick={handleStart}
          disabled={!canStart}
          className="px-8 py-3 sm:px-10 sm:py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-base sm:text-lg rounded-lg transition-colors"
          aria-label="시작"
        >
          시작
        </button>
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-2 sm:px-8 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold text-base sm:text-lg rounded-lg transition-colors"
            aria-label="뒤로"
          >
            뒤로
          </button>
        )}
      </div>
    </div>
  );
}
