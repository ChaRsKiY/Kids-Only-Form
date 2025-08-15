import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MdOutlineDateRange, MdOutlineChevronLeft, MdOutlineChevronRight } from 'react-icons/md';
import { Input } from './input';

export type DateInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputSize?: 'sm' | 'md' | 'lg';
  maxDate?: Date;
  minDate?: Date;
  disabled?: boolean;
  name?: string;
  locale?: string;
  yearFrom?: number;
  yearTo?: number;
};

function clampToBounds(date: Date, minDate?: Date, maxDate?: Date): Date {
  if (minDate && date < minDate) return minDate;
  if (maxDate && date > maxDate) return maxDate;
  return date;
}

function formatISO(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseISO(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  if (isNaN(date.getTime())) return null;
  // Validate that components match (avoid 2024-02-31 -> Mar 2)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

export const DateInput: React.FC<DateInputProps> = ({
  value,
  onChange,
  placeholder,
  inputSize = 'md',
  maxDate,
  minDate,
  disabled,
  name,
  locale,
  yearFrom,
  yearTo,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(() => {
    const parsed = parseISO(value);
    return parsed ? parsed.getFullYear() : new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    const parsed = parseISO(value);
    return parsed ? parsed.getMonth() : new Date().getMonth();
  });
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selectedDate = useMemo(() => parseISO(value), [value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (e.target instanceof Node && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    // Keep view in sync when value changes externally
    const parsed = parseISO(value);
    if (parsed) {
      setViewYear(parsed.getFullYear());
      setViewMonth(parsed.getMonth());
    }
  }, [value]);

  const daysGrid = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startDay = first.getDay(); // 0-6, Sunday=0
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells: Array<{ label: string; date: Date | null; disabled: boolean }> = [];
    const prefixBlanks = (startDay + 6) % 7; // make Monday first
    for (let i = 0; i < prefixBlanks; i++) cells.push({ label: '', date: null, disabled: true });
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(viewYear, viewMonth, day);
      const outOfRange = (minDate && d < minDate) || (maxDate && d > maxDate);
      cells.push({ label: String(day), date: d, disabled: !!outOfRange });
    }
    // pad to 6 rows x 7 cols if needed
    while (cells.length % 7 !== 0) cells.push({ label: '', date: null, disabled: true });
    return cells;
  }, [viewYear, viewMonth, minDate, maxDate]);

  const handlePrevMonth = () => {
    const m = viewMonth - 1;
    if (m < 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(m);
    }
  };
  const handleNextMonth = () => {
    const m = viewMonth + 1;
    if (m > 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(m);
    }
  };

  const handleSelectDay = (d: Date) => {
    const clamped = clampToBounds(d, minDate, maxDate);
    onChange(formatISO(clamped));
    setIsOpen(false);
  };

  const resolvedLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en');
  const monthFormatter = useMemo(() => new Intl.DateTimeFormat(resolvedLocale, { month: 'long', year: 'numeric' }), [resolvedLocale]);
  const monthOnlyFormatter = useMemo(() => new Intl.DateTimeFormat(resolvedLocale, { month: 'long' }), [resolvedLocale]);
  const weekdayFormatter = useMemo(() => new Intl.DateTimeFormat(resolvedLocale, { weekday: 'short' }), [resolvedLocale]);
  const monthTitle = monthFormatter.format(new Date(viewYear, viewMonth, 1));

  const monthNames = useMemo(() => Array.from({ length: 12 }, (_, m) => monthOnlyFormatter.format(new Date(2020, m, 1))), [monthOnlyFormatter]);
  const weekdayLabels = useMemo(() => {
    // Monday-first labels
    const base = new Date(2023, 0, 2); // Mon Jan 2, 2023 is Monday
    return Array.from({ length: 7 }, (_, i) => weekdayFormatter.format(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i)));
  }, [weekdayFormatter]);

  const currentYear = new Date().getFullYear();
  const minYear = minDate ? minDate.getFullYear() : (yearFrom ?? currentYear - 120);
  const maxYear = maxDate ? maxDate.getFullYear() : (yearTo ?? currentYear);

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const raw = e.target.value;
    // Allow only digits and hyphens
    const sanitized = raw.replace(/[^0-9-]/g, '');
    onChange(sanitized);
  };

  const handleIconClick = () => {
    if (disabled) return;
    setIsOpen((s) => !s);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        name={name}
        value={value}
        // Блокируем ручной ввод: открываем пикер по клику
        onClick={handleIconClick}
        placeholder={placeholder}
        inputSize={inputSize}
        rightIcon={<MdOutlineDateRange onClick={handleIconClick} />}
        readOnly
        onKeyDown={(e) => {
          // Блокируем набор текста; пробел/Enter открывают календарь
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleIconClick();
          } else {
            e.preventDefault();
          }
        }}
        className="cursor-pointer"
        disabled={disabled}
      />
      {isOpen && (
        <div className="absolute z-50 mt-2 w-[18rem] rounded-md border bg-white shadow-lg p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <button type="button" onClick={handlePrevMonth} className="p-1 rounded hover:bg-muted">
              <MdOutlineChevronLeft />
            </button>
            <div className="flex items-center gap-2">
              <select
                className="bg-transparent text-sm outline-none"
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
              >
                {monthNames.map((name, i) => (
                  <option key={i} value={i} className="capitalize">{name}</option>
                ))}
              </select>
              <select
                className="bg-transparent text-sm outline-none"
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
              >
                {Array.from({ length: maxYear - minYear + 1 }, (_, idx) => maxYear - idx).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={handleNextMonth} className="p-1 rounded hover:bg-muted">
              <MdOutlineChevronRight />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground mb-1 select-none">
            {weekdayLabels.map((d, i) => (
              <div key={i} className="text-center">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {daysGrid.map((cell, idx) => (
              <button
                key={idx}
                type="button"
                disabled={!cell.date || cell.disabled}
                onClick={() => cell.date && handleSelectDay(cell.date)}
                className={[
                  'h-8 rounded text-sm',
                  !cell.date ? 'opacity-0 pointer-events-none' : '',
                  cell.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-muted',
                  selectedDate && cell.date && formatISO(cell.date) === formatISO(selectedDate) ? 'bg-primary text-primary-foreground hover:bg-primary' : '',
                ].join(' ')}
              >
                {cell.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateInput;
