// components/CalendarDayCard.jsx
import React, { useState } from 'react';
import { format, isSameDay } from 'date-fns';
import { Plus, Users } from 'lucide-react';
import SlotCard from './SlotCard';

const CalendarDayCard = ({ date, isCurrentMonth, isToday, isPast, slots, appointments, onDateClick, onSlotClick }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showAllSlots, setShowAllSlots] = useState(false);
    const totalBookings = appointments.length;

    const getDayStyle = () => {
        if (isToday) return 'border-[#0D614E]/40  bg-[#0D614E]/5';
        if (!isCurrentMonth) return 'bg-gray-10  border-gray-100';
        if (isPast) return 'bg-gray-50 border-gray-200 opacity-60';
        return 'border-[#0D614E]/30 hover:border-[#0D614E]/60 hover:shadow-lg cursor-pointer';
    };

    const getDateStyle = () => {
        if (isToday) return 'bg-[#0D614E] text-white';
        if (!isCurrentMonth) return 'text-gray-400';
        if (isPast) return 'text-gray-400';
        return 'text-gray-700 hover:bg-teal-50';
    };

    return (
        <div
            className={`
        min-h-[96px] sm:min-h-[140px] border-2 rounded-xl p-1 sm:p-2 transition-all duration-200 relative
        ${getDayStyle()}
      `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => !isPast && isCurrentMonth && slots?.length == 0 && onDateClick(date)}
        >
            {/* Date Header */}
            <div className="flex justify-between items-start mb-2">
                <div className={`
          w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-all
          ${getDateStyle()}
        `}>
                    {format(date, 'd')}
                </div>
                {totalBookings > 0 && (
                    <div className="bg-[#0D614E]/10 text-[#0D614E] text-xs px-2 py-0.5 rounded-full font-medium">
                        {totalBookings}
                    </div>
                )}
            </div>

            {/* Quick Add Button */}
            {!isPast && isCurrentMonth && isHovered && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDateClick(date);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-[#0D614E]/10 text-[#0D614E]/100 rounded-full hover:bg-[#0D614E]/20 transition-all duration-200 shadow-sm"
                >
                    <Plus className="w-3 h-3" />
                </button>
            )}

            {/* Time Slots */}
            <div className="space-y-1.5 mt-1">

                {(showAllSlots ? slots : slots.slice(0, 2)).map((slot) =>
                // slot?.is_active &&
                (
                    <SlotCard
                        key={slot.id}
                        slot={slot}
                        onClick={(e) => {
                            // e.stopPropagation();
                            onSlotClick(slot);
                        }}
                        isCompact={true}
                    />
                ))}

                {/* Show More */}
                {slots.length > 2 && !showAllSlots && (
                    <button
                        onClick={(e) => {
                            // e.stopPropagation();
                            setShowAllSlots(true);
                        }}
                        className="w-full text-xs text-center text-[#0D614E] hover:text-[#0a4d3d] mt-1 font-medium py-1 rounded-md hover:bg-[#0D614E]/5 transition"
                    >
                        +{slots.length - 2} more slots
                    </button>
                )}

                {/* Show Less */}
                {showAllSlots && slots.length > 2 && (
                    <button
                        onClick={(e) => {
                            // e.stopPropagation();
                            setShowAllSlots(false);
                        }}
                        className="w-full text-xs text-center text-gray-500 hover:text-gray-700 mt-1 font-medium py-1 rounded-md hover:bg-gray-100 transition"
                    >
                        Show Less
                    </button>
                )}

                {/* Empty State */}
                {slots.length === 0 && !isPast && isCurrentMonth && (
                    <div className="text-xs text-center text-gray-400 mt-2 py-1">
                        Click to add slot
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarDayCard;