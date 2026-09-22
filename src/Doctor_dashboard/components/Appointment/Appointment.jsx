import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dayjs from "dayjs";
import {
    Calendar as CalendarIcon,
    Users,
    Clock,
    Search,
    Plus,
    Edit,
    Trash2,
    Eye,
    CheckCircle,
    XCircle,
    Clock as ClockIcon,
    Video,
    Phone,
    Mail,
    MessageSquare,
    Star,
    AlertCircle,
    CheckCheck,
    X,
    Download,
    ArrowUp,
    ArrowDown,
    RefreshCw,
    CalendarDays,
    User,
    Activity,
    Stethoscope,
    DollarSign,
    Smile,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Filter,
    ChevronDown as ChevronDownIcon,
    ArrowUpDown
} from 'lucide-react';
import { doctorService } from '../../../services/doctorService';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

// ==================== CONSTANTS ====================
const STATUS_CONFIG = {
    completed: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Completed', bg: 'emerald' },
    missed: { color: 'bg-gray-100 text-gray-700', icon: ClockIcon, label: 'Missed', bg: 'gray' },
    confirmed: { color: 'bg-blue-100 text-blue-700', icon: CheckCheck, label: 'Confirmed', bg: 'blue' },
    cancelled: { color: 'bg-rose-100 text-rose-700', icon: XCircle, label: 'Cancelled', bg: 'rose' },
    cancellation_requested: { color: 'bg-rose-100 text-rose-700', icon: XCircle, label: 'Cancellation Requested', bg: 'rose' },
    pending: { color: 'bg-purple-100 text-purple-700', icon: AlertCircle, label: 'Pending', bg: 'purple' },
    rescheduled: { color: 'bg-orange-100 text-orange-700', icon: RefreshCw, label: 'Rescheduled', bg: 'orange' },
    reschedule: {
        color: "bg-orange-100 text-orange-700",
        icon: RefreshCw,
        label: "Waiting for Patient Response",
        bg: "orange",
    },
};

const CONSULTATION_TYPES = ['video', 'chat', 'in-person'];
const STATUS_OPTIONS = ['confirmed', 'completed', 'cancelled', 'rescheduled', 'reschedule'];
const ITEMS_PER_PAGE_OPTIONS = [5, 10, 15, 25, 50];

// ==================== HELPER FUNCTIONS ====================
const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const formatDate = (dateString) => {
    if (!dateString) return '--/--/----';
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        weekday: 'short'
    });
};

const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getStatusIcon = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    return <Icon size={16} className={config.color.split(' ')[1]} />;
};

// ==================== REUSABLE COMPONENTS ====================
const StatCard = ({ title, value, icon: Icon, iconBg, iconColor, trend }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
                {trend && (
                    <div className="flex items-center space-x-1 mt-2">
                        {trend.up ? <ArrowUp size={12} className="text-emerald-600" /> : <ArrowDown size={12} className="text-rose-600" />}
                        <span className={`text-xs ${trend.up ? 'text-emerald-600' : 'text-rose-600'}`}>{trend.text}</span>
                    </div>
                )}
            </div>
            <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
                <Icon size={20} className={iconColor} />
            </div>
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    return (
        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
            <Icon size={12} />
            <span>{config.label}</span>
        </span>
    );
};

// Pagination Component
const Pagination = ({
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    onPageChange,
    onItemsPerPageChange,
    itemsPerPageOptions = ITEMS_PER_PAGE_OPTIONS
}) => {
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            pages.push(totalPages);
        }

        return pages;
    };

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex  flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>
                    Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}
                    <span className="font-medium">{totalItems}</span> appointments
                </span>
                <select
                    value={itemsPerPage}
                    onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D614E] bg-white"
                >
                    {itemsPerPageOptions.map(option => (
                        <option key={option} value={option}>{option} per page</option>
                    ))}
                </select>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 bg-white"
                >
                    <ChevronLeft size={18} />
                </button>

                {getPageNumbers().map((page, index) => (
                    <button
                        key={index}
                        onClick={() => typeof page === 'number' && onPageChange(page)}
                        disabled={page === '...'}
                        className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${page === currentPage
                            ? 'bg-[#0D614E] text-white'
                            : page === '...'
                                ? 'cursor-default text-gray-400'
                                : 'hover:bg-gray-200 text-gray-700 bg-white border border-gray-200'
                            }`}
                    >
                        {page}
                    </button>
                ))}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 bg-white"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
};

// Sorting Dropdown
const SortDropdown = ({ sortBy, sortOrder, onSortChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const sortOptions = [
        { value: 'patient_name', label: 'Patient Name' },
        { value: 'appointment_date', label: 'Appointment Date' },
        { value: 'status', label: 'Status' },
        { value: 'consultation_type', label: 'Consultation Type' },
        { value: 'created_at', label: 'Created Date' }
    ];

    const currentLabel = sortOptions.find(opt => opt.value === sortBy)?.label || 'Sort By';

    return (
        <div className="relative min-w-[250px]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm font-medium text-gray-700"
            >
                <ArrowUpDown size={16} />
                <span>{currentLabel}</span>
                <ChevronDownIcon size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                {sortOrder === 'asc' ? <ArrowUp size={14} className="text-[#0D614E]" /> : <ArrowDown size={14} className="text-[#0D614E]" />}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {sortOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => {
                                onSortChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${sortBy === option.value ? 'text-[#0D614E] font-medium' : 'text-gray-700'
                                }`}
                        >
                            {option.label}
                            {sortBy === option.value && (
                                <span className="text-[#0D614E]">
                                    {sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// Rest of the components (ActionModal, AppointmentDetailsModal, DeleteConfirmModal, LoadingSpinner, EmptyState) remain the same
// ... (keeping all existing modal components)

const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-[#0D614E] border-t-transparent rounded-full animate-spin"></div>
    </div>
);

const EmptyState = ({ message, onRefresh }) => (
    <div className="text-center py-12">
        <CalendarIcon size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">{message || "No appointments found"}</p>
        <button onClick={onRefresh} className="px-4 py-2 bg-[#0D614E] text-white rounded-lg hover:bg-opacity-90">
            Refresh
        </button>
    </div>
);


// Reschedule/Cancel Modal
const ActionModal = ({ show, type, upcomming, appointment, onClose, onConfirm, isLoading }) => {
    const [reason, setReason] = useState('');
    // const [newDate, setNewDate] = useState('');
    // const [newTime, setNewTime] = useState('');
    const [selectedSlot, setSelectedSlot] = useState(null)

    // useEffect(() => {
    //     if (show && type === 'reschedule' && appointment) {
    //         setNewDate(appointment.appointment_date || '');
    //         setNewTime(appointment.start_time?.slice(0, 5) || '');
    //     }
    // }, [show, type, appointment]);

    if (!show) return null;

    const isReschedule = type === 'reschedule';
    const title = isReschedule ? 'Reschedule Appointment' : 'Cancel Appointment';
    const icon = isReschedule ? <RefreshCw size={24} className="text-orange-600" /> : <XCircle size={24} className="text-rose-600" />;
    const iconBg = isReschedule ? 'bg-orange-100' : 'bg-rose-100';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
                <div className="flex items-center space-x-3 mb-4">
                    <div className={`w-12 h-12 rounded-full ${iconBg} flex items-center justify-center`}>
                        {icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
                </div>

                <p className="text-gray-600 mb-4">
                    {isReschedule
                        ? `Change appointment for ${appointment?.patient_name || 'patient'} to a new time`
                        : `Are you sure you want to cancel appointment with ${appointment?.patient_name || 'patient'}?`
                    }
                </p>

                {isReschedule && (
                    <div className="space-y-4 mb-4">
                        {/* <div className="space-y-3">
                            <label className="block text-sm font-semibold text-gray-700">
                                Select Appointment Slot
                            </label>

                            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                                {upcomming?.map((slot) => (
                                    <div
                                        key={slot.id}
                                        onClick={() => setSelectedSlot(slot)}
                                        className={`
                    cursor-pointer rounded-2xl border p-4 transition-all duration-200
                    ${selectedSlot?.id === slot.id
                                                ? "border-[#0D614E] bg-[#0D614E]/5 ring-2 ring-[#0D614E]/20 shadow-sm"
                                                : "border-gray-200 bg-white hover:border-[#0D614E]/50 hover:shadow-sm"
                                            }
                `}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`
                                w-10 h-10 rounded-xl flex items-center justify-center
                                ${selectedSlot?.id === slot.id
                                                            ? "bg-[#0D614E] text-white"
                                                            : "bg-teal-50 text-[#0D614E]"
                                                        }
                            `}
                                                >
                                                    📅
                                                </div>

                                                <div>
                                                    <h4 className="font-semibold text-gray-900">
                                                        {dayjs(slot.date).format("ddd, DD MMM YYYY")}
                                                    </h4>

                                                    <p className="text-sm text-gray-500">
                                                        {dayjs(`2000-01-01 ${slot.start_time}`).format("hh:mm A")}
                                                        {" - "}
                                                        {dayjs(`2000-01-01 ${slot.end_time}`).format("hh:mm A")}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-1">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                                    Available
                                                </span>

                                                <span className="font-semibold text-[#0D614E]">
                                                    ₹{slot.amount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {selectedSlot && (
                                <div className="rounded-2xl bg-[#0D614E] text-white p-4 mt-3">
                                    <h4 className="font-semibold mb-2 text-white">Selected Slot</h4>

                                    <div className="flex items-center justify-between text-sm">
                                        <span>
                                            {dayjs(selectedSlot.date).format("DD MMM YYYY")}
                                        </span>

                                        <span>
                                            {dayjs(`2000-01-01 ${selectedSlot.start_time}`).format("hh:mm A")}
                                            {" - "}
                                            {dayjs(`2000-01-01 ${selectedSlot.end_time}`).format("hh:mm A")}
                                        </span>

                                        <span>₹{selectedSlot.amount}</span>
                                    </div>
                                </div>
                            )}
                        </div> */}
                        {/* <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Date *</label>
                            <input
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Time *</label>
                            <input
                                type="time"
                                value={newTime}
                                onChange={(e) => setNewTime(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E]"
                            />
                        </div> */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Reason {isReschedule ? 'for Rescheduling' : 'for Cancellation'} *</label>
                            <textarea
                                rows="3"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder={isReschedule ? "Please provide reason for rescheduling..." : "Please provide reason for cancellation..."}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E]"
                            />
                        </div>
                    </div>
                )}

                {!isReschedule && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Cancellation *</label>
                        <textarea
                            rows="3"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Please provide reason for cancellation..."
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E]"
                        />
                    </div>
                )}

                <div className="flex space-x-3">
                    <button onClick={e => {
                        onClose()
                        setReason("")
                    }} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm({ reason, selectedSlot, reschedule: (isReschedule ? "request_reschedule" : "request_cancellation") })
                            setReason("")
                        }}
                        disabled={isLoading || !reason
                        }
                        className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 ${isReschedule ? 'bg-orange-600 hover:bg-orange-700' : 'bg-rose-600 hover:bg-rose-700'
                            }`}
                    >
                        {isLoading ? <RefreshCw size={16} className="animate-spin mx-auto" /> : (isReschedule ? 'Confirm Reschedule' : 'Confirm Cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeleteConfirmModal = ({ show, onConfirm, onCancel }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                        <AlertCircle size={24} className="text-rose-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800">Delete Appointment</h3>
                </div>
                <p className="text-gray-600 mb-6">Are you sure you want to delete this appointment? This action cannot be undone.</p>
                <div className="flex space-x-3">
                    <button onClick={onCancel} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                    <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">Delete</button>
                </div>
            </div>
        </div>
    );
};

// ==================== MAIN COMPONENT ====================
const AppointmentsPage = () => {
    const [appointments, setAppointments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchbydate, setsearchbydate] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [showActionModal, setShowActionModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [actionType, setActionType] = useState(null);
    const [upcomming, setUpComming] = useState([])

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Sorting state
    const [sortBy, setSortBy] = useState('');
    const [sortOrder, setSortOrder] = useState('');
    const [appointmentStats, setAppointmentStats] = useState({
        total: 0,
        today: 0,
        confirmed: 0,
        rescheduled: 0,
        completed: 0,
    });
    const [totalItems, setTotalItems] = useState(0);

    // Fetch appointments from API
    const fetchAppointments = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await doctorService?.getAppointment(
                "appointment",
                currentPage,
                itemsPerPage,
                {
                    search: searchTerm,
                    status: statusFilter,
                    appointment_date: searchbydate,
                }
            );
            if (response?.data?.success && response?.data?.data?.results) {
                const appointmentsData = response.data.data.results.map(apt => ({
                    id: apt.id,
                    appointment_date: apt.appointment_date,
                    start_time: apt.start_time,
                    end_time: apt.end_time,
                    consultation_type: apt.type || apt.consultation_type,
                    status: apt.status,
                    concern: apt.concern,
                    patient_name: apt.patient_name || 'Unknown Patient',
                    patient_prakriti: apt.prakriti,
                    day: apt.day,
                }));
                setAppointments(appointmentsData);
                setTotalItems(response.data.data.count ?? appointmentsData.length);
                const counts = response.data.data.total_counts;
                if (counts) {
                    setAppointmentStats({
                        total: counts.total ?? 0,
                        today: counts.today ?? 0,
                        confirmed: counts.confirmed ?? 0,
                        rescheduled: counts.rescheduled ?? 0,
                        completed: counts.completed ?? 0,
                    });
                }
            } else {
                setAppointments([]);
                setTotalItems(0);
                setAppointmentStats({
                    total: 0,
                    today: 0,
                    confirmed: 0,
                    rescheduled: 0,
                    completed: 0,
                });
            }
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
            toast.error('Failed to load appointments');
        } finally {
            setIsLoading(false);
        }

        // try {
        //     const upcomingresponse = await doctorService?.getUpcomingAppointment();
        //     setUpComming(upcomingresponse?.data?.data)
        // } catch (error) {
        //     toast.error('Failed to load appointments');
        // }
    }, [currentPage, itemsPerPage, searchbydate, statusFilter]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // Sort and filter current page (type filter + sort are client-side on page results)
    const displayedAppointments = useMemo(() => {
        let filtered = appointments.filter(apt => {
            const matchesType = typeFilter === 'all' || apt.consultation_type === typeFilter;
            return matchesType;
        });

        filtered.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'patient_name':
                    comparison = (a.patient_name || '').localeCompare(b.patient_name || '');
                    break;
                case 'appointment_date':
                    comparison = new Date(a.appointment_date) - new Date(b.appointment_date);
                    break;
                case 'status':
                    comparison = (a.status || '').localeCompare(b.status || '');
                    break;
                case 'consultation_type':
                    comparison = (a.consultation_type || '').localeCompare(b.consultation_type || '');
                    break;
                case 'created_at':
                    comparison = new Date(a.created_at) - new Date(b.created_at);
                    break;
                default:
                    comparison = 0;
            }

            return sortOrder === 'asc' ? comparison : -comparison;
        });

        return filtered;
    }, [appointments, typeFilter, sortBy, sortOrder]);

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Statistics from API total_counts
    const stats = appointmentStats;

    // Handle Sort
    const handleSortChange = (newSortBy) => {
        if (sortBy === newSortBy) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(newSortBy);
            setSortOrder('asc');
        }
    };

    // Handle Reschedule
    const handleReschedule = async ({ reason, selectedSlot, reschedule }) => {
        if (!selectedAppointment) return;
        setIsActionLoading(true);
        try {
            const response = await doctorService?.updateAppointmentstatus(selectedAppointment.id, actionType === 'reschedule' ? {
                // availability: selectedSlot?.id,
                // appointment_date: newDate,
                // start_time: newTime,
                // end_time: `${parseInt(newTime.split(':')[0]) + 1}:${newTime.split(':')[1]}:00`,
                action: reschedule,
                reschedule_reason: reason,
                rescheduled_by: 'doctor'
            } : {
                availability: selectedAppointment.availability,
                action: reschedule,
                cancellation_reason: reason,
                rescheduled_by: 'doctor'
            });

            if (response?.data?.success) {
                toast.success('Appointment rescheduled successfully');
                setShowActionModal(false);
                setSelectedAppointment(null);
                setActionType(null);
                fetchAppointments();
            } else {
                toast.error(response?.data?.message || 'Failed to reschedule appointment');
            }
        } catch (error) {
            console.error('Reschedule error:', error);
            toast.error('Failed to reschedule appointment');
        } finally {
            setIsActionLoading(false);
        }
    };

    // Handle Cancel
    const handleCancel = async ({ reason }) => {
        if (!selectedAppointment) return;
        setIsActionLoading(true);
        try {
            const response = await doctorService?.updateAppointmentstatus(selectedAppointment.id, {
                action: 'request_cancellation',
                cancellation_reason: reason,
                cancelled_by: 'doctor'
            });

            if (response?.data?.success) {
                toast.success('Appointment cancelled successfully');
                setShowActionModal(false);
                setSelectedAppointment(null);
                setActionType(null);
                fetchAppointments();
            }
        } catch (error) {
            console.error('Cancel error:', error);
            toast.error('Failed to cancel appointment');
        } finally {
            setIsActionLoading(false);
        }
    };

    // Handle Delete
    const handleDeleteAppointment = async (id) => {
        try {
            const response = await doctorService?.deleteAppointment(id);
            if (response?.data?.success) {
                toast.success('Appointment deleted successfully');
                setShowDeleteConfirm(null);
                fetchAppointments();
            } else {
                toast.error(response?.data?.message || 'Failed to delete appointment');
            }
        } catch (error) {
            console.error('Delete appointment error:', error);
            toast.error('Failed to delete appointment');
        }
    };

    // Export to CSV
    const exportToCSV = () => {
        const headers = ['Date', 'Start Time', 'End Time', 'Patient Name', 'Prakriti', 'Consultation Type', 'Status', 'Concern', 'Amount'];
        const csvData = displayedAppointments.map(apt => [
            apt.appointment_date,
            formatTime(apt.start_time),
            formatTime(apt.end_time),
            apt.patient_name,
            apt.patient_prakriti || 'N/A',
            apt.consultation_type,
            apt.status,
            (apt.concern || '').replace(/,/g, ';'),
            apt.fee || 0
        ]);

        const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `appointments_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('Appointments exported successfully');
    };




    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="border-b border-gray-200 bg-white sticky top-0 z-20">
                <div className="px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Appointment Management</h1>
                            <p className="text-gray-500 mt-1">Manage and track all patient appointments</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={fetchAppointments}
                                className="p-2 flex gap-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw size={18} className={`text-gray-500 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            {/* <button
                                onClick={exportToCSV}
                                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                            >
                                <Download size={18} /><span>Export</span>
                            </button> */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-8">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <StatCard title="Total Appointments" value={stats.total} icon={CalendarIcon} iconBg="bg-emerald-50" iconColor="text-[#0D614E]" />
                    <StatCard title="Today's Appointments" value={stats.today} icon={Clock} iconBg="bg-yellow-50" iconColor="text-yellow-600" />
                    <StatCard title="Confirmed" value={stats.confirmed} icon={CheckCircle} iconBg="bg-blue-50" iconColor="text-blue-600" />
                    <StatCard title="Rescheduled" value={stats.rescheduled} icon={RefreshCw} iconBg="bg-orange-50" iconColor="text-orange-600" />
                    <StatCard title="Completed" value={stats.completed} icon={CheckCheck} iconBg="bg-green-50" iconColor="text-green-600" />
                </div>

                {/* Filters and Search Bar */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by patient name, concern, or notes..."
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E]"
                                />
                            </div>
                        </div>
                        <div className="flex  gap-3">
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E] bg-white"
                            >
                                <option value="all">All Status</option>
                                {STATUS_OPTIONS.map(status => (
                                    <option key={status} value={status}>{STATUS_CONFIG[status]?.label || status}</option>
                                ))}
                            </select>
                            {/* <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E] bg-white"
                            >
                                <option value="all">All Types</option>
                                {CONSULTATION_TYPES.map(type => (
                                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                ))}
                            </select> */}
                            {/* <SortDropdown
                                sortBy={sortBy}
                                sortOrder={sortOrder}
                                onSortChange={handleSortChange}
                            /> */}
                            <input
                                type="date"
                                value={searchbydate}
                                onChange={(e) => {
                                    setsearchbydate(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E]"
                            />
                        </div>
                    </div>

                    {/* Active Filters Display */}
                    {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                            <span className="text-sm text-gray-500">Active Filters:</span>
                            {searchTerm && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                                    Search: {searchTerm}
                                    <button onClick={() => setSearchTerm('')} className="hover:text-blue-900">
                                        <X size={12} />
                                    </button>
                                </span>
                            )}
                            {statusFilter !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                                    Status: {STATUS_CONFIG[statusFilter]?.label || statusFilter}
                                    <button onClick={() => setStatusFilter('all')} className="hover:text-purple-900">
                                        <X size={12} />
                                    </button>
                                </span>
                            )}
                            {typeFilter !== 'all' && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                                    Type: {typeFilter}
                                    <button onClick={() => setTypeFilter('all')} className="hover:text-green-900">
                                        <X size={12} />
                                    </button>
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('all');
                                    setTypeFilter('all');
                                    setCurrentPage(1);
                                    setTypeFilter('all');
                                }}
                                className="text-xs text-[#0D614E] hover:underline"
                            >
                                Clear All
                            </button>
                        </div>
                    )}
                </div>

                {/* Appointments Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : displayedAppointments.length === 0 ? (
                        <EmptyState message="No appointments found matching your criteria" onRefresh={fetchAppointments} />
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <button
                                                    onClick={() => handleSortChange('appointment_date')}
                                                    className="flex items-center gap-1 hover:text-gray-700"
                                                >
                                                    Date & Time
                                                    {sortBy === 'appointment_date' && (
                                                        sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                                                    )}
                                                </button>
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <button
                                                    onClick={() => handleSortChange('patient_name')}
                                                    className="flex items-center gap-1 hover:text-gray-700"
                                                >
                                                    Patient
                                                    {sortBy === 'patient_name' && (
                                                        sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                                                    )}
                                                </button>
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prakriti</th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <button
                                                    onClick={() => handleSortChange('consultation_type')}
                                                    className="flex items-center gap-1 hover:text-gray-700"
                                                >
                                                    Type
                                                    {sortBy === 'consultation_type' && (
                                                        sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                                                    )}
                                                </button>
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concern</th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                <button
                                                    onClick={() => handleSortChange('status')}
                                                    className="flex items-center gap-1 hover:text-gray-700"
                                                >
                                                    Status
                                                    {sortBy === 'status' && (
                                                        sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                                                    )}
                                                </button>
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {displayedAppointments.map((appointment) => {
                                            const appointmentDateTime = new Date(
                                                `${appointment.appointment_date}T${appointment.start_time}`
                                            );

                                            const now = new Date();

                                            const minutesUntilAppointment =
                                                (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60);

                                            const canTakeAction = minutesUntilAppointment > 30;
                                            return(
                                                <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-gray-800">{formatDate(appointment.appointment_date)}</span>
                                                            <div className="flex items-center space-x-2 mt-1">
                                                                <Clock size={12} className="text-gray-400" />
                                                                <span className="text-xs text-gray-500">
                                                                    {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0D614E] to-[#0a4d3e] flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                                                                {getInitials(appointment?.patient_name)}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-800">{appointment.patient_name}</p>
                                                                <p className="text-xs text-gray-400">{appointment.patient_email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-600">{appointment.patient_prakriti || "N/A"}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center space-x-1">
                                                            {appointment.consultation_type === 'video' && <Video size={14} className="text-purple-500" />}
                                                            {appointment.consultation_type === 'chat' && <MessageSquare size={14} className="text-blue-500" />}
                                                            {appointment.consultation_type === 'in-person' && <Users size={14} className="text-green-500" />}
                                                            <span className="text-sm text-gray-600 capitalize">{appointment.consultation_type || '--'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm text-gray-600" title={appointment.concern}>
                                                            {appointment.concern?.slice(0, 40) || '--'}
                                                            {appointment.concern?.length > 40 && '...'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <StatusBadge status={appointment.status} />
                                                        {appointment.call_status === 'in_progress' && (new Date(appointment.appointment_date).getDate() > new Date()?.getDate()) && (
                                                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full animate-pulse">
                                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                                                Live
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center space-x-2">
                                                            <Link
                                                                to={`appointment/${appointment.id}`}
                                                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                                                title="View Details"
                                                            >
                                                                <Eye size={16} className="text-gray-500" />
                                                            </Link>

                                                            {canTakeAction && appointment?.status === 'confirmed' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedAppointment(appointment);
                                                                            setActionType('reschedule');
                                                                            setShowActionModal(true);
                                                                        }}
                                                                        className="p-1.5 hover:bg-orange-100 rounded-lg transition-colors"
                                                                        title="Reschedule"
                                                                    >
                                                                        <RefreshCw size={16} className="text-orange-600" />
                                                                    </button>

                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedAppointment(appointment);
                                                                            setActionType('cancel');
                                                                            setShowActionModal(true);
                                                                        }}
                                                                        className="p-1.5 hover:bg-rose-100 rounded-lg transition-colors"
                                                                        title="Cancel"
                                                                    >
                                                                        <XCircle size={16} className="text-rose-600" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                itemsPerPage={itemsPerPage}
                                totalItems={totalItems}
                                onPageChange={setCurrentPage}
                                onItemsPerPageChange={setItemsPerPage}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Modals - Keep existing modals */}
            <ActionModal
                show={showActionModal}
                type={actionType}
                upcomming={upcomming}
                appointment={selectedAppointment}
                onClose={() => { setShowActionModal(false); setSelectedAppointment(null); setActionType(null); }}
                onConfirm={actionType === 'reschedule' ? handleReschedule : handleCancel}
                isLoading={isActionLoading}
            />

            <DeleteConfirmModal
                show={!!showDeleteConfirm}
                onConfirm={() => handleDeleteAppointment(showDeleteConfirm)}
                onCancel={() => setShowDeleteConfirm(null)}
            />

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}</style>
        </div>
    );
};

export default AppointmentsPage;