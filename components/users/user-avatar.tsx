interface UserAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function UserAvatar({ name, size = 'md', className = '' }: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  // Get first letter of name, fallback to '?'
  const initial = name && name.length > 0 ? name.charAt(0).toUpperCase() : '?';

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full bg-telink-violet
        flex items-center justify-center
        text-white font-semibold
        flex-shrink-0
        ${className}
      `}
    >
      {initial}
    </div>
  );
}
