import Badge from '../ui/badge';

interface MeetingStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const statusMap: Record<string, { variant: any; label: string }> = {
  BOOKED: { variant: 'booked', label: 'Bokad' },
  COMPLETED: { variant: 'completed', label: 'Genomförd' },
  NO_SHOW: { variant: 'no-show', label: 'No-show' },
  CANCELED: { variant: 'canceled', label: 'Avbokad' },
  RESCHEDULED: { variant: 'rescheduled', label: 'Ombokad' },
};

export default function MeetingStatusBadge({
  status,
  size = 'sm',
}: MeetingStatusBadgeProps) {
  const mapping = statusMap[status] || { variant: 'booked', label: status };

  return (
    <Badge variant={mapping.variant} size={size}>
      {mapping.label}
    </Badge>
  );
}
