'use client';

import { useRef, useState, useEffect, useCallback, useMemo, useId } from 'react';
import { Check, X, ChevronDown, Search } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  value: string[]; // Array of selected values
  onChange: (value: string[]) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  maxSelections?: number;
  searchable?: boolean;
  className?: string;
}

export default function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Välj...',
  error,
  helperText,
  required = false,
  disabled = false,
  loading = false,
  maxSelections,
  searchable = true,
  className = '',
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const listboxId = useId();
  const labelId = useId();

  // Filter options based on search query (memoized for performance)
  const filteredOptions = useMemo(
    () =>
      searchable && searchQuery
        ? options.filter((option) =>
            option.label.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : options,
    [options, searchable, searchQuery]
  );

  // Get selected option objects (memoized for performance)
  const selectedOptions = useMemo(
    () => options.filter((opt) => value.includes(opt.value)),
    [options, value]
  );

  // Check if max selections reached
  const maxReached = maxSelections !== undefined && value.length >= maxSelections;

  // Handle option selection
  const handleSelect = useCallback(
    (optionValue: string) => {
      if (disabled) return;

      const isSelected = value.includes(optionValue);

      if (isSelected) {
        // Remove from selection
        onChange(value.filter((v) => v !== optionValue));
      } else {
        // Add to selection (if not max reached)
        if (!maxReached) {
          onChange([...value, optionValue]);
        }
      }
    },
    [value, onChange, disabled, maxReached]
  );

  // Remove a selected option
  const handleRemove = useCallback(
    (optionValue: string) => {
      if (disabled) return;
      onChange(value.filter((v) => v !== optionValue));
    },
    [value, onChange, disabled]
  );

  // Clear all selections
  const handleClearAll = useCallback(() => {
    if (disabled) return;
    onChange([]);
  }, [onChange, disabled]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setFocusedIndex((prev) =>
              prev < filteredOptions.length - 1 ? prev + 1 : prev
            );
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setFocusedIndex((prev) => (prev > 0 ? prev - 1 : 0));
          }
          break;

        case 'Enter':
        case ' ':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
            const option = filteredOptions[focusedIndex];
            if (!option.disabled) {
              handleSelect(option.value);
            }
          }
          break;

        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSearchQuery('');
          setFocusedIndex(-1);
          break;

        case 'Tab':
          if (isOpen) {
            setIsOpen(false);
            setSearchQuery('');
            setFocusedIndex(-1);
          }
          break;
      }
    },
    [isOpen, focusedIndex, filteredOptions, handleSelect, disabled]
  );

  // Click outside to close (fixed memory leak)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (containerRef.current && !containerRef.current.contains(target)) {
        setIsOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Scroll focused option into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listboxRef.current) {
      const focusedElement = listboxRef.current.children[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Reset focused index if it exceeds filtered options length
  useEffect(() => {
    if (focusedIndex >= filteredOptions.length && filteredOptions.length > 0) {
      setFocusedIndex(filteredOptions.length - 1);
    }
  }, [filteredOptions.length, focusedIndex]);

  const toggleOpen = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setFocusedIndex(-1);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Label */}
      {label && (
        <label
          id={labelId}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <div
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-labelledby={labelId}
        aria-disabled={disabled || loading}
        aria-required={required}
        aria-busy={loading}
        aria-activedescendant={
          isOpen && focusedIndex >= 0 && focusedIndex < filteredOptions.length
            ? `${listboxId}-option-${focusedIndex}`
            : undefined
        }
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        onClick={toggleOpen}
        className={`
          relative min-h-[42px] px-3 py-2
          bg-white border rounded-lg
          transition-all duration-200 cursor-pointer
          ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-telink-violet'}
          ${disabled || loading ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-gray-400'}
          ${isOpen ? 'ring-2 ring-telink-violet border-telink-violet' : ''}
        `}
      >
        {/* Selected values */}
        <div className="flex flex-wrap gap-2">
          {selectedOptions.length === 0 && (
            <span className="text-gray-400 text-sm">{placeholder}</span>
          )}

          {selectedOptions.map((option) => (
            <div
              key={option.value}
              className="inline-flex items-center gap-1 px-2 py-1 bg-telink-violet text-white text-sm rounded-md"
            >
              <span>{option.label}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(option.value);
                }}
                disabled={disabled}
                className="hover:bg-telink-violet-dark rounded-full p-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-white"
                aria-label={`Ta bort ${option.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Dropdown Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
          {loading && (
            <div className="animate-spin h-4 w-4 border-2 border-telink-violet border-t-transparent rounded-full" />
          )}
          <ChevronDown
            className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !loading && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {/* Search Input */}
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Sök..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-telink-violet focus:border-transparent"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Sök i alternativ"
                />
              </div>
              {/* Live region for search results */}
              <div className="sr-only" aria-live="polite" aria-atomic="true">
                {filteredOptions.length} alternativ tillgängliga
              </div>
            </div>
          )}

          {/* Options List */}
          <ul
            ref={listboxRef}
            role="listbox"
            id={listboxId}
            aria-labelledby={labelId}
            aria-multiselectable="true"
            className="max-h-48 overflow-y-auto"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-500 text-center">
                Inga alternativ hittades
              </li>
            ) : (
              filteredOptions.map((option, index) => {
                const isSelected = value.includes(option.value);
                const isFocused = index === focusedIndex;
                const isDisabled = option.disabled || (maxReached && !isSelected);

                return (
                  <li
                    key={option.value}
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDisabled) {
                        handleSelect(option.value);
                      }
                    }}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`
                      px-4 py-2 text-sm cursor-pointer
                      flex items-center justify-between gap-2
                      transition-colors
                      ${isFocused ? 'bg-gray-100' : ''}
                      ${isSelected ? 'bg-telink-violet-light' : ''}
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
                    `}
                  >
                    <span className={isSelected ? 'font-medium text-telink-violet' : ''}>
                      {option.label}
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-telink-violet flex-shrink-0" />
                    )}
                  </li>
                );
              })
            )}
          </ul>

          {/* Footer */}
          {selectedOptions.length > 0 && (
            <div className="p-2 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600">
              <span>
                {selectedOptions.length} valda
                {maxSelections && ` av ${maxSelections}`}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                className="text-telink-violet hover:text-telink-violet-dark font-medium transition-colors"
              >
                Rensa alla
              </button>
            </div>
          )}
        </div>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Max selections warning */}
      {maxReached && (
        <p className="mt-1 text-sm text-yellow-600" role="status">
          Maximalt antal val ({maxSelections}) har nåtts
        </p>
      )}
    </div>
  );
}
