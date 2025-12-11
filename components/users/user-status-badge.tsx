interface UserStatusBadgeProps {
  isActive: boolean;
  size?: 'sm' | 'md';
}

export default function UserStatusBadge({ isActive, size = 'sm' }: UserStatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${sizeClasses[size]}
        ${
          isActive
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-gray-100 text-gray-700 border border-gray-200'
        }
      `}
    >
      <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${isActive ? 'bg-green-600' : 'bg-gray-400'}`} />
      {isActive ? 'Aktiv' : 'Inaktiv'}
    </span>
  );
}
