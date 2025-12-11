interface BadgeProps {
  variant:
    | 'booked'
    | 'completed'
    | 'no-show'
    | 'canceled'
    | 'rescheduled'
    | 'user'
    | 'manager'
    | 'admin';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant,
  size = 'md',
  children,
  className = '',
}: BadgeProps) {
  const variantClasses = {
    booked: 'bg-status-booked/10 text-status-booked border-status-booked/20',
    completed:
      'bg-status-completed/10 text-status-completed border-status-completed/20',
    'no-show':
      'bg-status-no-show/10 text-status-no-show border-status-no-show/20',
    canceled:
      'bg-status-canceled/10 text-status-canceled border-status-canceled/20',
    rescheduled:
      'bg-status-rescheduled/10 text-status-rescheduled border-status-rescheduled/20',
    user: 'bg-blue-50 text-blue-700 border-blue-200',
    manager: 'bg-purple-50 text-purple-700 border-purple-200',
    admin: 'bg-red-50 text-red-700 border-red-200',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  );
}
