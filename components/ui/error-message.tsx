import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  variant?: 'inline' | 'card';
  className?: string;
}

export default function ErrorMessage({
  message,
  variant = 'inline',
  className = '',
}: ErrorMessageProps) {
  if (variant === 'card') {
    return (
      <div
        className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}
        role="alert"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Fel uppstod</p>
            <p className="mt-1 text-sm text-red-700">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 text-sm text-red-600 ${className}`} role="alert">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
