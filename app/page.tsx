'use client';

import { useState } from 'react';
import SeatSelector from './components/SeatSelector';
import PracticeBoard from './components/PracticeBoard';
import WordPracticeMode from './components/WordPracticeMode';
import WordPractice from './components/WordPractice';
import koreanLayout from '@/data/korean-layout.json';
import englishLayout from '@/data/english-layout.json';
import type { SeatSelection } from './types';

type Mode = 'main' | 'language-select' | 'seat-select' | 'seat-practice' | 'word-practice-mode' | 'word-seat-select' | 'word-practice';
type Language = 'korean' | 'english';

export default function Home() {
  const [mode, setMode] = useState<Mode>('main');
  const [language, setLanguage] = useState<Language>('korean');
  const [includeUppercase, setIncludeUppercase] = useState(false);
  const [seatSelection, setSeatSelection] = useState<SeatSelection>({});
  const [wordPracticeMode, setWordPracticeMode] = useState<'linked' | 'general'>('linked');

  const handleSelectSeatMode = () => {
    setMode('language-select');
  };

  const handleSelectLanguage = (lang: Language) => {
    setLanguage(lang);
    setIncludeUppercase(false); // Reset uppercase option
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
          {mode === 'language-select' && (
            <LanguageSelector
              onSelectKorean={() => handleSelectLanguage('korean')}
              onSelectEnglish={() => handleSelectLanguage('english')}
              onBack={handleBackToMain}
            />
          )}
          {mode === 'seat-select' && (
            <div className="space-y-6">
              <div>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
                  연습할 자리를 선택하세요
                </p>
                <SeatSelector
                  onStart={handleStartSeatPracticeWithSelection}
                  onBack={() => setMode('language-select')}
                />
              </div>
              {language === 'english' && (
                <div className="flex justify-center">
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                    <input
                      type="checkbox"
                      checked={includeUppercase}
                      onChange={(e) => setIncludeUppercase(e.target.checked)}
                      className="w-5 h-5 rounded"
                    />
                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                      대문자 포함 (Shift로 입력)
                    </span>
                  </label>
                </div>
              )}
            </div>
          )}
          {mode === 'seat-practice' && (
            <PracticeBoard
              seatSelection={seatSelection}
              includeUppercase={includeUppercase}
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

interface LanguageSelectorProps {
  onSelectKorean: () => void;
  onSelectEnglish: () => void;
  onBack: () => void;
}

function LanguageSelector({ onSelectKorean, onSelectEnglish, onBack }: LanguageSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300">
          자리 연습할 언어를 선택하세요
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={onSelectKorean}
          className="p-6 bg-red-50 dark:bg-red-900 rounded-lg hover:bg-red-100 dark:hover:bg-red-800 transition-colors border-2 border-red-200 dark:border-red-700"
        >
          <p className="text-2xl font-bold text-red-700 dark:text-red-300 mb-2">
            한글
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            한글 자모 자리 연습
          </p>
        </button>

        <button
          onClick={onSelectEnglish}
          className="p-6 bg-purple-50 dark:bg-purple-900 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors border-2 border-purple-200 dark:border-purple-700"
        >
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300 mb-2">
            English
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            영문 소문자 자리 연습
          </p>
        </button>
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={onBack}
          className="px-6 py-2 sm:px-8 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
        >
          뒤로
        </button>
      </div>
    </div>
  );
}
