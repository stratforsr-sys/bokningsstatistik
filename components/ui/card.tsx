interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'hoverable' | 'clickable';
  onClick?: () => void;
}

interface CardSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardSectionProps) {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }: CardSectionProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: CardSectionProps) {
  return (
    <div className={`px-6 py-4 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

export default function Card({
  children,
  className = '',
  variant = 'default',
  onClick,
}: CardProps) {
  const baseClasses = 'card bg-white rounded-lg border border-gray-200 shadow-sm';

  const variantClasses = {
    default: '',
    hoverable: 'hover:shadow-md transition-shadow duration-200',
    clickable: 'cursor-pointer hover:shadow-md hover:border-telink-violet/30 transition-all duration-200',
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
