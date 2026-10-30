// hooks/useCalendarData.js
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { doctorService } from '../../../../services/doctorService';
import { parseMonthlyAvailabilityResponse } from '../utils/calendarDataParser';

// doctorService rejects with a plain { message, status, data, originalError }
// object (see handleServiceError in services/doctorService.js), NOT an
// AxiosError — so `error.response?.data` is undefined for API failures.
// Look in every possible shape and surface the backend field error first,
// e.g. errors: [{ slots: ["Past time slot cannot be created."] }] instead of
// the generic "Validation failed." wrapper message.
export const getApiErrorMessage = (error, fallback) => {
    const data =
        error?.response?.data ||
        error?.data ||
        error?.originalError?.response?.data;

    const fieldMessages = [];
    const collect = (value) => {
        if (!value) return;
        if (typeof value === 'string') fieldMessages.push(value);
        else if (Array.isArray(value)) value.forEach(collect);
        else if (typeof value === 'object') Object.values(value).forEach(collect);
    };
    collect(data?.errors);

    return (
        fieldMessages[0] ||
        data?.detail ||
        data?.message ||
        error?.message ||
        fallback
    );
};

const showApiError = (error, fallback) => {
    toast.error(getApiErrorMessage(error, fallback));
    // Mark it so callers that also catch (e.g. SlotDrawer.handleSubmit)
    // don't show a second, duplicate toast for the same failure.
    if (error && typeof error === 'object') error.toastShown = true;
};

export const useCalendarData = () => {
    const [slots, setSlots] = useState({});
    const [appointments, setAppointments] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [baseamount, setbaseamount] = useState(0);

    const fetchMonthData = useCallback(async (date) => {
        setIsLoading(true);
        try {
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const response = await doctorService.getMonthlyAvailability(year, month);
            const rawData = response?.data?.data;
            const { slotsMap, appointmentsMap, baseamount: amount } = parseMonthlyAvailabilityResponse(rawData);

            setbaseamount(amount);
            setSlots(slotsMap);
            setAppointments(appointmentsMap);
        } catch (error) {
            console.error('Failed to fetch availability:', error);
            toast.error('Failed to load calendar data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const addSlot = useCallback(async (slotData) => {
        try {
            await doctorService.createSlot(slotData);
            toast.success('Time slot added successfully');
            return true;
        } catch (error) {
            showApiError(error, 'Failed to add slot');
            throw error;
        }
    }, []);

    const updateSlot = useCallback(async (slotId, slotData) => {
        try {
            await doctorService.updateTimeSlot(slotId, slotData);
            toast.success('Slot updated successfully');
            return true;
        } catch (error) {
            showApiError(error, 'Failed to update slot');
            throw error;
        }
    }, []);

    const deleteSlot = useCallback(async (slotId) => {
        try {
            await doctorService.deleteTimeSlot(slotId);
            toast.success('Slot deleted successfully');
            return true;
        } catch (error) {
            showApiError(error, 'Failed to delete slot');
            throw error;
        }
    }, []);

    return {
        slots,
        appointments,
        isLoading,
        baseamount,
        fetchMonthData,
        addSlot,
        updateSlot,
        deleteSlot,
    };
};
