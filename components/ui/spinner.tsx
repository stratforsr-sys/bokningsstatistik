interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-solid border-telink-violet border-t-transparent ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Laddar..."
    >
      <span className="sr-only">Laddar...</span>
    </div>
  );
}
