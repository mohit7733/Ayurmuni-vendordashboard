// DoctorAvailabilityCalendar/index.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, isPast, startOfWeek, endOfWeek } from 'date-fns';
import toast from 'react-hot-toast';
import { doctorService } from '../../../../services/doctorService';
import CalendarHeader from '../components/CalendarHeader';
import CalendarGrid from '../components/CalendarGrid';
import SlotDrawer from '../components/SlotDrawer'
import BookingDetailsModal from '../components/BookingDetailsModal';
import AvailabilityStats from '../components/AvailabilityStats';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useCalendarData } from '../hooks/useCalendarData';
import { getRequiredconfigurationsPolicies } from '../../../../services/policyService';

const DoctorAvailabilityCalendar2 = () => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingSlot, setEditingSlot] = useState(null);
    const [selectedSlotDetails, setSelectedSlotDetails] = useState(null);
    const [adminamount, setadminamount] = useState({
        global_fee: null,
        duration_minutes: null,
    });


    const { slots, appointments, isLoading, baseamount, fetchMonthData, addSlot, updateSlot, deleteSlot } = useCalendarData();

    useEffect(() => {
        fetchMonthData(currentMonth);
    }, [currentMonth, fetchMonthData]);

    const fetchBaseAmount = useCallback(async () => {
        try {
            const response = await getRequiredconfigurationsPolicies("doctor_services");
            if (response) {
                if (response?.configuration?.consultation?.fee?.global_fee) {
                    setadminamount({
                        global_fee: response?.configuration?.consultation?.fee?.global_fee,
                        duration_minutes: response?.configuration?.consultation?.duration_minutes,
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching base amount:", error);
        }

    }, []);

    useEffect(() => {
        fetchBaseAmount();
    }, [fetchBaseAmount]);

    // const modelclose = () => {
    //     setEditingSlot(null)
    //     setIsDrawerOpen(false)
    // }

    const handlePreviousMonth = useCallback(() => setCurrentMonth(prev => subMonths(prev, 1)), []);
    const handleNextMonth = useCallback(() => setCurrentMonth(prev => addMonths(prev, 1)), []);

    const handleDateClick = useCallback((date) => {
        if (isPast(date) && !isToday(date)) {
            toast.error('Cannot add slots for past dates');
            return;
        }
        setSelectedDate(date);
        setEditingSlot((slots[(format(date, "yyyy-MM-dd"))]));
        setIsDrawerOpen(true);
    }, [slots]);

    const handleSlotClick = useCallback((slot) => {
        setSelectedSlotDetails(slot);
    }, []);

    const handleAddSlot = async (slotData) => {
        await addSlot(slotData);
        setIsDrawerOpen(false);
        await fetchMonthData(currentMonth);
    };

    const handleUpdateSlot = async (slotId, slotData) => {
        await updateSlot(slotId, slotData);
        setIsDrawerOpen(false);
        setEditingSlot(null);
        await fetchMonthData(currentMonth);
    };

    const handleDeleteSlot = async (slotId) => {
        if (window.confirm('Are you sure you want to delete this time slot?')) {
            await deleteSlot(slotId);
            setSelectedSlotDetails(null);
            await fetchMonthData(currentMonth);
        }
    };

    const calendarData = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
        const days = eachDayOfInterval({ start: startDate, end: endDate });

        return days.map(day => ({
            date: day,
            isCurrentMonth: isSameMonth(day, currentMonth),
            isToday: isToday(day),
            isPast: isPast(day) && !isToday(day),
            slots: slots[format(day, 'yyyy-MM-dd')] || [],
            appointments: appointments[format(day, 'yyyy-MM-dd')] || [],
        }));
    }, [currentMonth, slots, appointments]);

    if (isLoading) return <LoadingSkeleton />;

    return (
        <div className="min-h-screen ">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Header Section */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold  text-[#0D614E]  bg-clip-text">
                        Availability Calendar
                    </h1>
                    <p className="text-gray-500 mt-1">Manage your consultation slots and appointments</p>
                </div>

                {/* Stats Section */}
                {/* <AvailabilityStats slots={slots} appointments={appointments} currentMonth={currentMonth} /> */}

                {/* Calendar Section */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <CalendarHeader
                        currentMonth={currentMonth}
                        onPrevious={handlePreviousMonth}
                        onNext={handleNextMonth}
                    />
                    <CalendarGrid
                        days={calendarData}
                        onDateClick={handleDateClick}
                        onSlotClick={handleSlotClick}
                    />
                </div>

                {/* Drawers and Modals */}
                <SlotDrawer
                    isOpen={isDrawerOpen}
                    selectedDate={selectedDate}
                    editingSlot={editingSlot}
                    onClose={() => {
                        console.log(editingSlot);
                        setEditingSlot(null);
                        setIsDrawerOpen(false);
                    }}
                    onSave={handleAddSlot}
                    onUpdate={handleUpdateSlot}
                    baseamount={baseamount}
                    adminamount={adminamount}
                />

                <BookingDetailsModal
                    slot={selectedSlotDetails}
                    appointments={selectedSlotDetails ? appointments[selectedSlotDetails.date]?.filter(apt => apt.slot_id === selectedSlotDetails.id) || [] : []}
                    onClose={() => setSelectedSlotDetails(null)}
                    onEdit={() => {
                        setEditingSlot(selectedSlotDetails);
                        setSelectedSlotDetails(null);
                        setIsDrawerOpen(true);
                    }}
                    onDelete={() => handleDeleteSlot(selectedSlotDetails.id)}
                    onUpdateStatus={updateSlot}
                />
            </div>
        </div>
    );
};

export default DoctorAvailabilityCalendar2;