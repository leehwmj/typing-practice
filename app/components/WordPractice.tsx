'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import koreanLayout from '@/data/korean-layout.json';
import wordsData from '@/data/words.json';
import type { SeatSelection } from '../types';

interface WordPracticeProps {
  seatSelection: SeatSelection;
  mode: 'linked' | 'general';
  onBack: () => void;
}

interface Word {
  word: string;
  characters: string[];
}

const isVowel = (char: string): boolean => {
  const vowels = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅜ', 'ㅠ', 'ㅣ', 'ㅐ', 'ㅔ', 'ㅡ'];
  return vowels.includes(char);
};

const countKoreanJamo = (word: string): number => {
  let count = 0;

  for (let i = 0; i < word.length; i++) {
    const charCode = word.charCodeAt(i);

    // 한글 음절 범위 (0xAC00 ~ 0xD7A3)
    if (charCode >= 0xAC00 && charCode <= 0xD7A3) {
      const index = charCode - 0xAC00;
      const jong = index % 28; // 종성 인덱스

      count += 2; // 초성 + 중성
      if (jong > 0) count += 1; // 종성이 있으면 추가
    } else {
      count += 1; // 한글이 아니면 1개로 계산
    }
  }

  return count;
};

const combineHangul = (consonant: string, vowel: string, finalConsonant?: string): string => {
  const consonantMap: Record<string, number> = {
    ㄱ: 0, ㄲ: 1, ㄴ: 2, ㄷ: 3, ㄸ: 4, ㄹ: 5, ㅁ: 6, ㅂ: 7, ㅃ: 8, ㅄ: 9,
    ㅅ: 10, ㅆ: 11, ㅇ: 12, ㅈ: 13, ㅉ: 14, ㅊ: 15, ㅋ: 16, ㅌ: 17, ㅍ: 18, ㅎ: 19,
  };

  const vowelMap: Record<string, number> = {
    ㅏ: 0, ㅑ: 1, ㅓ: 2, ㅕ: 3, ㅗ: 4, ㅛ: 5, ㅜ: 6, ㅠ: 7,
    ㅣ: 8, ㅐ: 9, ㅔ: 10, ㅡ: 11,
  };

  const finalMap: Record<string, number> = {
    ㄱ: 1, ㄲ: 2, ㄴ: 3, ㄷ: 4, ㄹ: 5, ㅁ: 6, ㅂ: 7, ㅄ: 8,
    ㅅ: 9, ㅆ: 10, ㅇ: 11, ㅈ: 12, ㅉ: 13, ㅊ: 14, ㅋ: 15, ㅌ: 16, ㅍ: 17, ㅎ: 18,
  };

  const c = consonantMap[consonant];
  const v = vowelMap[vowel];
  const f = finalConsonant ? finalMap[finalConsonant] : 0;

  if (c === undefined || v === undefined) {
    return consonant + vowel + (finalConsonant || '');
  }

  const code = 0xAC00 + c * 588 + v * 28 + f;
  return String.fromCharCode(code);
};

const generateRandomWord = (availableCharacters: string[]): Word | null => {
  const consonants = availableCharacters.filter((c) => !isVowel(c));
  const vowels = availableCharacters.filter((c) => isVowel(c));

  if (consonants.length === 0 || vowels.length === 0) {
    return null;
  }

  const wordChars: string[] = [];
  const characters: string[] = [];

  // 글자 개수를 더 다양하게 (1~4글자)
  const syllableCount = Math.random() < 0.25
    ? 1
    : Math.random() < 0.5
      ? 2
      : Math.random() < 0.75
        ? 3
        : 4;

  for (let s = 0; s < syllableCount; s++) {
    const consonant = consonants[Math.floor(Math.random() * consonants.length)];
    const vowel = vowels[Math.floor(Math.random() * vowels.length)];

    const hangul = combineHangul(consonant, vowel);
    wordChars.push(hangul);

    characters.push(consonant);
    characters.push(vowel);
  }

  return {
    word: wordChars.join(''),
    characters: characters,
  };
};

const getNextWord = (
  filteredWords: Word[],
  availableCharacters: string[],
  useGenerated: boolean
): Word | null => {
  if (filteredWords.length > 0) {
    return filteredWords[Math.floor(Math.random() * filteredWords.length)];
  } else if (useGenerated && availableCharacters.length > 0) {
    return generateRandomWord(availableCharacters);
  }
  return null;
};

export default function WordPractice({
  seatSelection,
  mode,
  onBack,
}: WordPracticeProps) {
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [filteredWords, setFilteredWords] = useState<Word[]>([]);
  const [availableCharacters, setAvailableCharacters] = useState<string[]>([]);
  const [useGeneratedWords, setUseGeneratedWords] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [previousWordLength, setPreviousWordLength] = useState(0);
  const [completedCharacters, setCompletedCharacters] = useState(0);
  const [typingSegments, setTypingSegments] = useState<number[]>([]);
  const currentSegmentStartRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const spacePressedRef = useRef(false);
  const isProcessingRef = useRef(false); // Prevent duplicate checkWord() calls
  const isComposingRef = useRef(false); // Use ref instead of state for synchronous updates
  const debugCountRef = useRef({ checkWordCalls: 0, correctCount: 0, incorrectCount: 0 });
  const audioContextRef = useRef<AudioContext | null>(null);

  // Debug: Expose to window for console inspection
  useEffect(() => {
    (window as any).debugInfo = {
      checkWordCalls: debugCountRef.current.checkWordCalls,
      correctCount: debugCountRef.current.correctCount,
      incorrectCount: debugCountRef.current.incorrectCount,
      currentWord: currentWord?.word || 'loading...',
      userInput,
      mode,
    };
  }, [currentWord?.word, userInput, mode]);

  // 사용 가능한 글자 추출
  useEffect(() => {
    const charSet = new Set<string>();
    const charArray: string[] = [];

    Object.entries(seatSelection).forEach(([seatId, seatState]) => {
      if (seatState.selected) {
        const seat = koreanLayout.seats[seatId as keyof typeof koreanLayout.seats];
        if (seat) {
          const mapping = seat.mapping as Record<string, string>;
          Object.values(mapping).forEach((char) => {
            if (char !== ';' && char !== ',' && char !== '.' && char !== '/') {
              if (!charSet.has(char)) {
                charSet.add(char);
                charArray.push(char);
              }
            }
          });
        }
      }
    });

    setAvailableCharacters(charArray);

    // 단어 필터링
    let filtered: Word[] = wordsData.words;

    if (mode === 'linked' && charSet.size > 0) {
      filtered = wordsData.words.filter((word) =>
        word.characters.every((char) => charSet.has(char))
      );
    }

    setFilteredWords(filtered);
    const useGenerated = filtered.length === 0 && charArray.length > 0;
    setUseGeneratedWords(useGenerated);

    // 첫 단어 선택 또는 생성
    const nextWord = getNextWord(filtered, charArray, useGenerated);
    setCurrentWord(nextWord);
  }, [seatSelection, mode]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentWord]);


  const playSound = useCallback((frequency: number, duration: number) => {
    try {
      // Create AudioContext once and reuse it to avoid memory leak
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
      // 음성 재생 불가
    }
  }, []);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const checkWord = useCallback(() => {
    if (!currentWord || isProcessingRef.current) {
      return;
    }

    debugCountRef.current.checkWordCalls++;
    isProcessingRef.current = true;

    try {
      if (userInput.trim() === currentWord.word) {
        debugCountRef.current.correctCount++;
        playSound(800, 0.2);
        setFeedback('correct');
        setStats((prev) => ({
          ...prev,
          correct: prev.correct + 1,
        }));
        setWordsCompleted((prev) => prev + 1);
        setCompletedCharacters((prev) => prev + countKoreanJamo(currentWord.word));

        // 다음 단어 (1음절이 2번 연속이 되지 않도록)
        let nextWord: Word | null = null;
        let attempts = 0;
        const maxAttempts = 10;

        while (
          (!nextWord ||
            (currentWord.word.length === 1 && nextWord.word.length === 1)) &&
          attempts < maxAttempts
        ) {
          nextWord = getNextWord(filteredWords, availableCharacters, useGeneratedWords);
          attempts++;
        }

        if (nextWord) {
          // 입력 시간 기록
          if (currentSegmentStartRef.current) {
            const duration = Date.now() - currentSegmentStartRef.current;
            setTypingSegments((prev) => [...prev, duration]);
            currentSegmentStartRef.current = null;
          }

          setCurrentWord(nextWord);
          setPreviousWordLength(nextWord.word.length);
          setUserInput('');
        }
      } else {
        debugCountRef.current.incorrectCount++;
        playSound(300, 0.2);
        setFeedback('incorrect');
        setStats((prev) => ({
          ...prev,
          incorrect: prev.incorrect + 1,
        }));
        setUserInput('');
        // Reset timing for next word attempt to prevent CPM inflation
        currentSegmentStartRef.current = null;
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [currentWord, userInput, filteredWords, availableCharacters, useGeneratedWords, playSound]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    checkWord();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 일반 낱말 연습에서 첫 입력 시 시간 기록
    if (mode === 'general' && !currentSegmentStartRef.current && e.code !== 'Space') {
      currentSegmentStartRef.current = Date.now();
    }

    if (e.code === 'Space') {
      e.preventDefault();
      e.stopPropagation();

      // If Space is already being processed, ignore this duplicate event
      if (spacePressedRef.current) {
        spacePressedRef.current = false; // Reset for next Space keypress
        return;
      }
      spacePressedRef.current = true;

      // Only call checkWord if not composing AND not already processing
      if (!isComposingRef.current && !isProcessingRef.current) {
        checkWord();
      } else {
      }
    }
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
    // If space was pressed during IME composition and checkWord isn't already processing, handle it now
    if (spacePressedRef.current && !isProcessingRef.current) {
      spacePressedRef.current = false;
      checkWord();
    } else {
    }
  };

  const accuracy =
    stats.correct + stats.incorrect > 0
      ? Math.round(
          (stats.correct / (stats.correct + stats.incorrect)) * 100
        )
      : 0;

  const totalTypingMs = typingSegments.reduce((sum, ms) => sum + ms, 0);
  const totalTypingSeconds = totalTypingMs / 1000;
  const cpm = totalTypingSeconds > 0
    ? Math.round((completedCharacters / (totalTypingSeconds / 60)))
    : 0;

  const getSelectedSeats = () => {
    return Object.entries(seatSelection)
      .filter(([_, state]) => state.selected)
      .map(([seatId, _]) => {
        const seat = koreanLayout.seats[seatId as keyof typeof koreanLayout.seats];
        return seat?.label || seatId;
      })
      .join(', ');
  };

  if (!currentWord) {
    return (
      <div className="text-center space-y-4">
        <p className="text-lg text-gray-600 dark:text-gray-400">
          연습할 수 있는 단어가 없습니다.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2 sm:px-8 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors"
        >
          뒤로
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {mode === 'linked' && (
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300">현재 연습 중인 자리</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {getSelectedSeats()}
          </p>
        </div>
      )}

      <div
        className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-6 sm:p-8 text-center space-y-4 transition-shadow ${
          feedback === 'correct'
            ? 'animate-border-flash-green'
            : feedback === 'incorrect'
              ? 'animate-border-flash-red'
              : ''
        }`}
      >
        <h2 className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
          이 단어를 입력하세요
          {useGeneratedWords && (
            <span className="text-sm text-blue-500 ml-2">(생성된 단어)</span>
          )}
        </h2>

        <div className="text-5xl sm:text-6xl font-bold text-blue-600 dark:text-blue-400">
          {currentWord.word}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            className="w-full py-3 px-4 text-center text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="여기에 입력하세요"
            autoComplete="off"
          />
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
          >
            확인 (Enter)
          </button>
        </form>
      </div>

      <div className="grid grid-cols-3 gap-4 sm:gap-6">
        <div
          className={`bg-green-50 dark:bg-green-900 rounded-lg p-4 sm:p-6 text-center transition-shadow ${
            feedback === 'correct' ? 'animate-border-flash-green' : ''
          }`}
        >
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            맞음
          </p>
          <p className="text-3xl sm:text-4xl font-bold text-green-600 dark:text-green-400">
            {stats.correct}
          </p>
        </div>

        <div
          className={`bg-red-50 dark:bg-red-900 rounded-lg p-4 sm:p-6 text-center transition-shadow ${
            feedback === 'incorrect' ? 'animate-border-flash-red' : ''
          }`}
        >
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            틀림
          </p>
          <p className="text-3xl sm:text-4xl font-bold text-red-600 dark:text-red-400">
            {stats.incorrect}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 sm:p-6 text-center">
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            정확도
          </p>
          <p className="text-3xl sm:text-4xl font-bold text-blue-600 dark:text-blue-400">
            {accuracy}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {mode === 'general' && (
          <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-4 text-center">
            <p className="text-gray-600 dark:text-gray-300 text-sm">타 수 (분당)</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {cpm} CPM
            </p>
          </div>
        )}

        <div className="bg-orange-50 dark:bg-orange-900 rounded-lg p-4 text-center">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {useGeneratedWords ? '생성 중' : '이용 가능한 단어'}
          </p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {useGeneratedWords ? '∞' : filteredWords.length}개
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onBack}
          className="px-6 py-2 sm:px-8 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold text-base sm:text-lg rounded-lg transition-colors"
        >
          뒤로
        </button>
      </div>
    </div>
  );
}
