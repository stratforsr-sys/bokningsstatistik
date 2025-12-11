'use client';

import { Star } from 'lucide-react';

interface QualityScoreInputProps {
  value: number | null;
  onChange: (score: number) => void;
  label?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function QualityScoreInput({
  value,
  onChange,
  label = 'Kvalitetsbetyg',
  disabled = false,
  required = false,
}: QualityScoreInputProps) {
  const scores = [1, 2, 3, 4, 5];

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex items-center gap-2">
        {scores.map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => !disabled && onChange(score)}
            disabled={disabled}
            className={`
              transition-all duration-150
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-110'}
            `}
            aria-label={`Rate ${score} stars`}
          >
            <Star
              className={`h-8 w-8 ${
                value && score <= value
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        {value && (
          <span className="ml-2 text-sm text-gray-600">
            {value} av 5
          </span>
        )}
      </div>
    </div>
  );
}
