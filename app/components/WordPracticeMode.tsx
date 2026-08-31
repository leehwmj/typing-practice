'use client';

interface WordPracticeModeProps {
  onSelectMode: (mode: 'linked' | 'general') => void;
  onBack: () => void;
}

export default function WordPracticeMode({
  onSelectMode,
  onBack,
}: WordPracticeModeProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300">
          낱말 연습 종류를 선택하세요
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onSelectMode('linked')}
          className="p-8 bg-blue-50 dark:bg-blue-900 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors border-2 border-blue-200 dark:border-blue-700 text-center"
        >
          <p className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-3">
            자리 연계 낱말 연습
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            선택한 자리의 글자로만
            <br />
            구성된 단어 연습
          </p>
        </button>

        <button
          onClick={() => onSelectMode('general')}
          className="p-8 bg-green-50 dark:bg-green-900 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors border-2 border-green-200 dark:border-green-700 text-center"
        >
          <p className="text-lg font-bold text-green-700 dark:text-green-300 mb-3">
            일반 낱말 연습
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            모든 글자를 사용한
            <br />
            단어 연습
          </p>
        </button>
      </div>

      <div className="flex justify-center pt-6">
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
