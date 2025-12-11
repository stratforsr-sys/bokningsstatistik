'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Input from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import Select from '@/components/ui/select';
import DatePicker from '@/components/ui/date-picker';
import Button from '@/components/ui/button';
import QualityScoreInput from './quality-score-input';

const meetingSchema = z
  .object({
    subject: z.string().min(1, 'Ämne krävs').max(200, 'Ämne får vara max 200 tecken'),
    startTime: z.date({ message: 'Starttid krävs' }),
    endTime: z.date({ message: 'Sluttid krävs' }),
    ownerId: z.string().optional(),
    status: z.enum(['BOOKED', 'COMPLETED', 'NO_SHOW', 'CANCELED', 'RESCHEDULED']),
    notes: z.string().max(1000, 'Anteckningar får vara max 1000 tecken').optional(),
    qualityScore: z.number().min(1).max(5).nullable().optional(),
    outlookLink: z.string().url('Måste vara en giltig URL').optional().or(z.literal('')),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'Sluttid måste vara efter starttid',
    path: ['endTime'],
  });

type MeetingFormData = z.infer<typeof meetingSchema>;

interface MeetingFormProps {
  initialData?: Partial<MeetingFormData>;
  onSubmit: (data: MeetingFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'BOOKED', label: 'Bokad' },
  { value: 'COMPLETED', label: 'Genomförd' },
  { value: 'NO_SHOW', label: 'No-show' },
  { value: 'CANCELED', label: 'Avbokad' },
  { value: 'RESCHEDULED', label: 'Ombokad' },
];

export default function MeetingForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  isEdit = false,
}: MeetingFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      subject: initialData?.subject || '',
      startTime: initialData?.startTime || new Date(),
      endTime: initialData?.endTime || new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
      ownerId: initialData?.ownerId || undefined,
      status: initialData?.status || 'BOOKED',
      notes: initialData?.notes || '',
      qualityScore: initialData?.qualityScore || null,
      outlookLink: initialData?.outlookLink || '',
    },
  });

  const status = watch('status');
  const showQualityScore = status === 'COMPLETED';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Subject */}
      <Input
        label="Ämne"
        {...register('subject')}
        error={errors.subject?.message}
        required
        placeholder="t.ex. Kundmöte - Projekt X"
      />

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="startTime"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="Starttid"
              selected={field.value}
              onChange={field.onChange}
              showTimeSelect
              error={errors.startTime?.message}
              required
            />
          )}
        />
        <Controller
          name="endTime"
          control={control}
          render={({ field }) => (
            <DatePicker
              label="Sluttid"
              selected={field.value}
              onChange={field.onChange}
              showTimeSelect
              error={errors.endTime?.message}
              required
            />
          )}
        />
      </div>

      {/* Status */}
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            {...field}
            error={errors.status?.message}
            required
          />
        )}
      />

      {/* Quality Score - Only show for completed meetings */}
      {showQualityScore && (
        <Controller
          name="qualityScore"
          control={control}
          render={({ field }) => (
            <QualityScoreInput
              label="Kvalitetsbetyg"
              value={field.value ?? null}
              onChange={field.onChange}
            />
          )}
        />
      )}

      {/* Notes */}
      <Textarea
        label="Anteckningar"
        {...register('notes')}
        error={errors.notes?.message}
        placeholder="Lägg till anteckningar om mötet..."
        rows={4}
      />

      {/* Outlook Link */}
      <Input
        label="Outlook-länk"
        {...register('outlookLink')}
        error={errors.outlookLink?.message}
        placeholder="https://outlook.office365.com/..."
        helperText="Valfri länk till Outlook-mötet"
      />

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Avbryt
        </Button>
        <Button type="submit" variant="primary" loading={isLoading}>
          {isEdit ? 'Uppdatera möte' : 'Skapa möte'}
        </Button>
      </div>
    </form>
  );
}
