'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import koreanLayout from '@/data/korean-layout.json';
import englishLayout from '@/data/english-layout.json';
import type { SeatSelection, KeyStats } from '../types';

interface PracticeBoardProps {
  seatSelection: SeatSelection;
  includeUppercase?: boolean;
  language?: 'korean' | 'english';
  onBack: () => void;
}

export default function PracticeBoard({
  seatSelection,
  includeUppercase = false,
  language = 'korean',
  onBack,
}: PracticeBoardProps) {
  const layout = language === 'korean' ? koreanLayout : englishLayout;

  const [stats, setStats] = useState<KeyStats>({
    correct: 0,
    incorrect: 0,
  });
  const [currentKey, setCurrentKey] = useState<string>('');
  const [allKeys, setAllKeys] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [keyHistory, setKeyHistory] = useState<string[]>([]);

  // Refs to avoid stale closures in event listener
  const currentKeyRef = useRef<string>('');
  const allKeysRef = useRef<string[]>([]);
  const soundEnabledRef = useRef<boolean>(true);
  const keyHistoryRef = useRef<string[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const keys: string[] = [];
    Object.entries(seatSelection).forEach(([seatId, seatState]) => {
      if (seatState.selected) {
        keys.push(...Array.from(seatState.selectedKeys));
      }
    });

    // If includeUppercase, add uppercase versions of lowercase letters
    if (includeUppercase) {
      const uppercaseKeys: string[] = [];
      keys.forEach((key) => {
        if (!key.startsWith('shift+') && /^[a-z]$/.test(key)) {
          uppercaseKeys.push(`shift+${key}`);
        }
      });
      keys.push(...uppercaseKeys);
    }

    setAllKeys(keys);
    allKeysRef.current = keys;

    if (keys.length > 0) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      setCurrentKey(randomKey);
      currentKeyRef.current = randomKey;
    }
  }, [seatSelection, includeUppercase]);

  // Update refs when state changes
  useEffect(() => {
    currentKeyRef.current = currentKey;
  }, [currentKey]);

  useEffect(() => {
    allKeysRef.current = allKeys;
  }, [allKeys]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    keyHistoryRef.current = keyHistory;
  }, [keyHistory]);

  const getKeyDisplay = useCallback(() => {
    let seatId = '';
    let mapping: Record<string, string> = {};
    let baseKey = currentKey;

    // Handle uppercase keys (shift+X format)
    if (currentKey.startsWith('shift+')) {
      baseKey = currentKey.slice(6);
    }

    // Find the seat and mapping for the base key
    for (const [id, seatInfo] of Object.entries(
      layout.seats
    )) {
      if (seatInfo.keys.includes(baseKey)) {
        seatId = id;
        mapping = seatInfo.mapping as Record<string, string>;
        break;
      }
    }

    // Get the character (uppercase if shift key)
    const char = mapping[baseKey] || baseKey;
    const character = currentKey.startsWith('shift+') ? char.toUpperCase() : char;

    return {
      key: currentKey,
      character,
      seatId,
    };
  }, [currentKey, layout]);

  const playSound = useCallback(
    (frequency: number, duration: number) => {
      if (!soundEnabled) return;

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
        // 음성 재생 불가 (예: 권한 없음)
      }
    },
    [soundEnabled]
  );

  const getNextRandomKey = useCallback(() => {
    if (allKeys.length === 0) return '';

    let randomKey = allKeys[Math.floor(Math.random() * allKeys.length)];

    // 이전 2개 키가 모두 같은 경우, 다른 키를 선택해서 3번 연속 반복 방지
    if (
      keyHistory.length >= 2 &&
      keyHistory[keyHistory.length - 1] === keyHistory[keyHistory.length - 2] &&
      keyHistory[keyHistory.length - 1] === randomKey
    ) {
      const otherKeys = allKeys.filter((k) => k !== randomKey);
      if (otherKeys.length > 0) {
        randomKey = otherKeys[Math.floor(Math.random() * otherKeys.length)];
      }
    }

    return randomKey;
  }, [allKeys, keyHistory]);

  const codeToKey = (code: string): string => {
    const map: Record<string, string> = {
      KeyA: 'a', KeyS: 's', KeyD: 'd', KeyF: 'f',
      KeyG: 'g', KeyH: 'h', KeyT: 't', KeyB: 'b',
      KeyJ: 'j', KeyK: 'k', KeyL: 'l',
      KeyQ: 'q', KeyW: 'w', KeyE: 'e', KeyR: 'r',
      KeyU: 'u', KeyI: 'i', KeyO: 'o', KeyP: 'p',
      KeyZ: 'z', KeyX: 'x', KeyC: 'c', KeyV: 'v',
      KeyY: 'y', KeyN: 'n', KeyM: 'm',
      Semicolon: ';',
      Comma: ',',
      Period: '.',
      Slash: '/',
    };
    return map[code] || code;
  };

  useEffect(() => {
    const handleGlobalKeyPress = (e: KeyboardEvent) => {
      let pressedKey = codeToKey(e.code);

      if (e.shiftKey) {
        pressedKey = `shift+${pressedKey}`;
      }

      // Use refs to access latest values without recreating listener
      const isCorrect = pressedKey === currentKeyRef.current ||
        (includeUppercase && pressedKey === `shift+${currentKeyRef.current}`);

      if (isCorrect) {
        if (soundEnabledRef.current) {
          playSound(800, 0.2); // 맞음: 높은 음
        }
        setFeedback('correct');
        setStats((prev) => ({
          ...prev,
          correct: prev.correct + 1,
        }));

        if (allKeysRef.current.length > 0) {
          // Generate next key directly without calling getNextRandomKey
          let randomKey = allKeysRef.current[Math.floor(Math.random() * allKeysRef.current.length)];
          const history = keyHistoryRef.current;

          // Prevent 3 consecutive same keys
          if (
            history.length >= 2 &&
            history[history.length - 1] === history[history.length - 2] &&
            history[history.length - 1] === randomKey
          ) {
            const otherKeys = allKeysRef.current.filter((k) => k !== randomKey);
            if (otherKeys.length > 0) {
              randomKey = otherKeys[Math.floor(Math.random() * otherKeys.length)];
            }
          }

          setKeyHistory([...keyHistoryRef.current, currentKeyRef.current]);
          setCurrentKey(randomKey);
        }
      } else if (allKeysRef.current.includes(pressedKey) ||
                 (includeUppercase && allKeysRef.current.some(k => pressedKey === `shift+${k}`))) {
        if (soundEnabledRef.current) {
          playSound(300, 0.2); // 틀림: 낮은 음
        }
        setFeedback('incorrect');
        setStats((prev) => ({
          ...prev,
          incorrect: prev.incorrect + 1,
        }));
      }
    };

    // Register listener once on mount with empty dependency array
    window.addEventListener('keydown', handleGlobalKeyPress);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyPress);
    };
  }, [playSound]); // Only playSound for audio context creation

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const display = getKeyDisplay();
  const accuracy =
    stats.correct + stats.incorrect > 0
      ? Math.round(
          (stats.correct / (stats.correct + stats.incorrect)) * 100
        )
      : 0;

  const getSelectedSeats = () => {
    return Object.entries(seatSelection)
      .filter(([_, state]) => state.selected)
      .map(([seatId, _]) => {
        const seat = layout.seats[seatId as keyof typeof layout.seats];
        return seat?.label || seatId;
      })
      .join(', ');
  };

  return (
    <>
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-300">현재 연습 중인 자리</p>
        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
          {getSelectedSeats()}
        </p>
      </div>
      <div
        className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-6 sm:p-8 text-center space-y-4 transition-shadow ${
          feedback === 'correct' ? 'animate-border-flash-green' : feedback === 'incorrect' ? 'animate-border-flash-red' : ''
        }`}
      >
        <h2 className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
          이 키를 누르세요
        </h2>

        <div className="space-y-4">
          <div className="w-80 h-56 flex items-center justify-center relative mx-auto rounded bg-white">
            {/* Horizontal ruled lines - English only */}
            {language === 'english' && (
              <>
                <div className="absolute left-0 right-0 h-0.5 bg-gray-400" style={{ top: '30%', transform: 'translateY(-50%)' }} />
                <div className="absolute left-0 right-0 h-0.5 bg-gray-400" style={{ top: '50%', transform: 'translateY(-50%)' }} />
                <div className="absolute left-0 right-0 h-0.5 bg-gray-400" style={{ top: '70%', transform: 'translateY(-50%)' }} />
              </>
            )}

            {/* Character display */}
            <div className="text-9xl font-bold text-blue-600 relative z-10">
              {display.character}
            </div>
          </div>
          <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {display.seatId}
          </div>
        </div>

        <div className="py-3 px-4 text-center text-lg text-gray-500 dark:text-gray-400">
          키보드에서 해당 키를 누르세요
        </div>
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

      <div className="flex justify-center">
        <button
          onClick={onBack}
          className="px-6 py-2 sm:px-8 sm:py-3 bg-gray-600 hover:bg-gray-700 text-white font-bold text-base sm:text-lg rounded-lg transition-colors"
          aria-label="뒤로"
        >
          뒤로
        </button>
      </div>
    </div>

    <button
      onClick={() => setSoundEnabled(!soundEnabled)}
      className="fixed bottom-6 right-6 p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-2xl shadow-lg transition-colors"
      aria-label={soundEnabled ? '소리 끄기' : '소리 켜기'}
      title={soundEnabled ? '소리 끄기' : '소리 켜기'}
    >
      {soundEnabled ? '🔊' : '🔇'}
    </button>
  </>
  );
}
