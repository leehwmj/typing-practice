'use client';

import { useState } from 'react';
import SeatSelector from './components/SeatSelector';
import PracticeBoard from './components/PracticeBoard';
import WordPracticeMode from './components/WordPracticeMode';
import WordPractice from './components/WordPractice';
import type { SeatSelection } from './types';

type Mode = 'main' | 'seat-select' | 'seat-practice' | 'word-practice-mode' | 'word-seat-select' | 'word-practice';

export default function Home() {
  const [mode, setMode] = useState<Mode>('main');
  const [seatSelection, setSeatSelection] = useState<SeatSelection>({});
  const [wordPracticeMode, setWordPracticeMode] = useState<'linked' | 'general'>('linked');

  const handleSelectSeatMode = () => {
    setMode('seat-select');
  };

  const handleStartSeatPracticeWithSelection = (selection: SeatSelection) => {
    setSeatSelection(selection);
    setMode('seat-practice');
  };

  const handleStartSeatPractice = (selection: SeatSelection) => {
    setSeatSelection(selection);
    setMode('seat-practice');
  };

  const handleStartWordPracticeModeSelect = () => {
    setMode('word-practice-mode');
  };

  const handleSelectWordPracticeMode = (mode: 'linked' | 'general') => {
    setWordPracticeMode(mode);
    if (mode === 'linked') {
      setMode('word-seat-select');
    } else {
      setMode('word-practice');
    }
  };

  const handleStartWordPractice = (selection: SeatSelection) => {
    setSeatSelection(selection);
    setMode('word-practice');
  };

  const handleBackToMain = () => {
    setMode('main');
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <header className="bg-blue-600 dark:bg-blue-800 text-white py-4 sm:py-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-center px-4">
          타자 연습기
        </h1>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-4xl">
          {mode === 'main' && (
            <ModeSelector
              onSeatPractice={handleSelectSeatMode}
              onWordPractice={handleStartWordPracticeModeSelect}
            />
          )}
          {mode === 'seat-select' && (
            <div>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
                연습할 자리를 선택하세요
              </p>
              <SeatSelector
                onStart={handleStartSeatPracticeWithSelection}
                onBack={handleBackToMain}
              />
            </div>
          )}
          {mode === 'seat-practice' && (
            <PracticeBoard
              seatSelection={seatSelection}
              onBack={handleBackToMain}
            />
          )}
          {mode === 'word-practice-mode' && (
            <WordPracticeMode
              onSelectMode={handleSelectWordPracticeMode}
              onBack={handleBackToMain}
            />
          )}
          {mode === 'word-seat-select' && (
            <div>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
                낱말 연습에 사용할 자리를 선택하세요
              </p>
              <SeatSelector
                onStart={(selection) => {
                  setSeatSelection(selection);
                  setMode('word-practice');
                }}
                onBack={() => setMode('word-practice-mode')}
              />
            </div>
          )}
          {mode === 'word-practice' && (
            <WordPractice
              seatSelection={seatSelection}
              mode={wordPracticeMode}
              onBack={handleBackToMain}
            />
          )}
        </div>
      </main>
    </div>
  );
}

interface ModeSelectorProps {
  onSeatPractice: () => void;
  onWordPractice: () => void;
}

function ModeSelector({ onSeatPractice, onWordPractice }: ModeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2 mb-8">
        <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300">
          연습 종류를 선택하세요
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={onSeatPractice}
          className="p-6 bg-blue-50 dark:bg-blue-900 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors border-2 border-blue-200 dark:border-blue-700"
        >
          <p className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-2">
            자리 연습
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            키보드 자리별로 연습하기
          </p>
        </button>

        <button
          onClick={onWordPractice}
          className="p-6 bg-green-50 dark:bg-green-900 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors border-2 border-green-200 dark:border-green-700"
        >
          <p className="text-xl font-bold text-green-700 dark:text-green-300 mb-2">
            낱말 연습
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            단어를 입력해서 연습하기
          </p>
        </button>
      </div>
    </div>
  );
}
