// components/CalendarGrid.jsx
import React from 'react';
import { format } from 'date-fns';
import CalendarDayCard from './CalendarDayCard';

const CalendarGrid = ({ days, onDateClick, onSlotClick }) => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="overflow-x-auto">
            <div className="min-w-[680px] p-3 sm:p-6">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
                {weekDays.map(day => (
                    <div
                        key={day}
                        className="text-center text-xs sm:text-sm font-semibold text-gray-600 py-2"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {days.map((day, idx) => (
                    <CalendarDayCard
                        key={idx}
                        date={day.date}
                        isCurrentMonth={day.isCurrentMonth}
                        isToday={day.isToday}
                        isPast={day.isPast}
                        slots={day.slots}
                        appointments={day.appointments}
                        onDateClick={onDateClick}
                        onSlotClick={onSlotClick}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-200">
                <LegendItem color="bg-[#0D614E]/20 border border-[#0D614E]/30" text="Available" />
                <LegendItem color="bg-blue-100 border border-blue-200" text="Booked / Confirmed" />
                <LegendItem color="bg-purple-100 border border-purple-200" text="In Progress" />
                <LegendItem color="bg-yellow-100 border border-yellow-200" text="Shifted" />
                <LegendItem color="bg-emerald-100 border border-emerald-200" text="Completed" />
                <LegendItem color="bg-orange-100 border border-orange-200" text="Rescheduled" />
                <LegendItem color="bg-red-100 border border-red-200" text="Cancelled" />
                <LegendItem color="bg-gray-100 border border-gray-200" text="Expired" />
            </div>
            </div>
        </div>
    );
};

const LegendItem = ({ color, text }) => (
    <div className="flex items-center gap-2">
        <div className={`w-3 h-3 ${color} rounded`}></div>
        <span className="text-xs text-gray-600">{text}</span>
    </div>
);

export default CalendarGrid;