// Date Picker Generator - Generate date picker components
import Anthropic from '@anthropic-ai/sdk';

class DatePickerGenerator {
    private anthropic: Anthropic | null = null;

    generateReactDatePicker(): string {
        return `import DatePicker from 'react-datepicker';
import { useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';

interface DateInputProps {
    value?: Date;
    onChange: (date: Date | null) => void;
    placeholder?: string;
    minDate?: Date;
    maxDate?: Date;
}

export function DateInput({ value, onChange, placeholder, minDate, maxDate }: DateInputProps) {
    return (
        <DatePicker
            selected={value}
            onChange={onChange}
            placeholderText={placeholder || 'Select date'}
            minDate={minDate}
            maxDate={maxDate}
            dateFormat="MMM d, yyyy"
            className="date-input"
        />
    );
}

interface DateRangeProps {
    startDate?: Date;
    endDate?: Date;
    onChange: (start: Date | null, end: Date | null) => void;
}

export function DateRange({ startDate, endDate, onChange }: DateRangeProps) {
    return (
        <div className="date-range">
            <DatePicker
                selected={startDate}
                onChange={(date) => onChange(date, endDate || null)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                placeholderText="Start date"
            />
            <span>to</span>
            <DatePicker
                selected={endDate}
                onChange={(date) => onChange(startDate || null, date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                placeholderText="End date"
            />
        </div>
    );
}

export function DateTimePicker({ value, onChange }: { value?: Date; onChange: (date: Date | null) => void }) {
    return (
        <DatePicker
            selected={value}
            onChange={onChange}
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat="MMM d, yyyy h:mm aa"
        />
    );
}
`;
    }

    generateDayPicker(): string {
        return `import { DayPicker, DateRange as DPDateRange } from 'react-day-picker';
import { useState } from 'react';
import 'react-day-picker/dist/style.css';

export function SimpleDayPicker({ selected, onSelect }: { selected?: Date; onSelect: (date: Date | undefined) => void }) {
    return (
        <DayPicker
            mode="single"
            selected={selected}
            onSelect={onSelect}
            showOutsideDays
            className="day-picker"
        />
    );
}

export function RangeDayPicker({ range, onSelect }: { range?: DPDateRange; onSelect: (range: DPDateRange | undefined) => void }) {
    return (
        <DayPicker
            mode="range"
            selected={range}
            onSelect={onSelect}
            numberOfMonths={2}
        />
    );
}

export function MultipleDayPicker({ selected, onSelect }: { selected?: Date[]; onSelect: (dates: Date[] | undefined) => void }) {
    return (
        <DayPicker
            mode="multiple"
            selected={selected}
            onSelect={onSelect}
            min={1}
            max={5}
        />
    );
}

// Custom styles
export const dayPickerStyles = \`
.day-picker { --rdp-cell-size: 40px; --rdp-accent-color: #667eea; }
.day-picker .rdp-day_selected { background-color: var(--rdp-accent-color); }
.day-picker .rdp-day:hover { background-color: #e9ecef; }
\`;
`;
    }

    generateDateFnsUtils(): string {
        return `import { format, parseISO, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isAfter, isBefore, differenceInDays, differenceInMonths, eachDayOfInterval } from 'date-fns';

// Format utilities
export const formatDate = (date: Date, pattern = 'MMM d, yyyy') => format(date, pattern);
export const formatDateTime = (date: Date) => format(date, 'MMM d, yyyy h:mm a');
export const formatTime = (date: Date) => format(date, 'h:mm a');
export const formatISO = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm:ss");

// Parse utilities
export const parseDate = (dateStr: string) => parseISO(dateStr);

// Date manipulation
export const addDaysToDate = (date: Date, days: number) => addDays(date, days);
export const subtractDaysFromDate = (date: Date, days: number) => subDays(date, days);

// Week utilities
export const getWeekStart = (date: Date) => startOfWeek(date, { weekStartsOn: 1 });
export const getWeekEnd = (date: Date) => endOfWeek(date, { weekStartsOn: 1 });

// Month utilities
export const getMonthStart = (date: Date) => startOfMonth(date);
export const getMonthEnd = (date: Date) => endOfMonth(date);

// Comparison
export const isDateAfter = (date1: Date, date2: Date) => isAfter(date1, date2);
export const isDateBefore = (date1: Date, date2: Date) => isBefore(date1, date2);
export const daysBetween = (date1: Date, date2: Date) => differenceInDays(date2, date1);
export const monthsBetween = (date1: Date, date2: Date) => differenceInMonths(date2, date1);

// Generate date range
export const getDateRange = (start: Date, end: Date) => eachDayOfInterval({ start, end });

// Presets
export const datePresets = {
    today: () => new Date(),
    yesterday: () => subDays(new Date(), 1),
    last7Days: () => ({ from: subDays(new Date(), 7), to: new Date() }),
    last30Days: () => ({ from: subDays(new Date(), 30), to: new Date() }),
    thisMonth: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }),
    thisWeek: () => ({ from: getWeekStart(new Date()), to: getWeekEnd(new Date()) }),
};
`;
    }

    generateCalendarComponent(): string {
        return `import { useState, useMemo } from 'react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import './Calendar.css';

interface CalendarProps {
    value?: Date;
    onChange?: (date: Date) => void;
    events?: Array<{ date: Date; title: string; color?: string }>;
}

export function Calendar({ value, onChange, events = [] }: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(value || new Date());
    
    const days = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        return eachDayOfInterval({ start, end });
    }, [currentMonth]);

    const getEventsForDate = (date: Date) => events.filter(e => isSameDay(e.date, date));

    return (
        <div className="calendar">
            <div className="calendar-header">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>&lt;</button>
                <h3>{format(currentMonth, 'MMMM yyyy')}</h3>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>&gt;</button>
            </div>
            <div className="calendar-weekdays">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="calendar-grid">
                {days.map(day => {
                    const dayEvents = getEventsForDate(day);
                    return (
                        <div
                            key={day.toISOString()}
                            className={\`calendar-day \${value && isSameDay(day, value) ? 'selected' : ''}\`}
                            onClick={() => onChange?.(day)}
                        >
                            <span>{format(day, 'd')}</span>
                            {dayEvents.map((e, i) => (
                                <div key={i} className="event" style={{ backgroundColor: e.color || '#667eea' }}>{e.title}</div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
`;
    }
}

export const datePickerGenerator = new DatePickerGenerator();
