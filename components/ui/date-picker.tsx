'use client';

import { forwardRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  selected: Date | null;
  onChange: (date: Date | null) => void;
  showTimeSelect?: boolean;
  timeFormat?: string;
  timeIntervals?: number;
  dateFormat?: string;
  placeholderText?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  required?: boolean;
}

const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      label,
      error,
      helperText,
      selected,
      onChange,
      showTimeSelect = false,
      timeFormat = 'HH:mm',
      timeIntervals = 15,
      dateFormat = showTimeSelect ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd',
      placeholderText = 'Välj datum',
      minDate,
      maxDate,
      disabled = false,
      required = false,
    },
    ref
  ) => {
    return (
      <div className="w-full" ref={ref}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <ReactDatePicker
            selected={selected}
            onChange={onChange}
            showTimeSelect={showTimeSelect}
            timeFormat={timeFormat}
            timeIntervals={timeIntervals}
            dateFormat={dateFormat}
            placeholderText={placeholderText}
            minDate={minDate}
            maxDate={maxDate}
            disabled={disabled}
            className={`
              w-full rounded-md border px-3 py-2 text-sm pl-10
              focus:outline-none focus:ring-2 focus:ring-telink-violet focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${error ? 'border-red-300' : 'border-gray-300'}
            `}
          />
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export default DatePicker;
