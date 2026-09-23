// src/pages/doctor/AppointmentDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doctorService } from '../../../services/doctorService';
import { vendorService } from '../../../services/vendorService';
import logo from "../../../Assests/Aurmunilogo.png";
import { Rnd } from "react-rnd";

import {
    ArrowLeft, Calendar, Clock, User, Mail, Smartphone, Cake,
    Activity, Droplet, Heart, Stethoscope, Pill, AlertCircle,
    CheckCircle, XCircle, MessageCircle, Save, Plus, Trash2,
    Edit2, TrendingUp, CalendarDays, NotebookPen, History,
    FileHeart, BadgeCheck, Download, Sparkles, ShieldCheck,
    FileText, ChevronDown, ChevronUp, Brain, Receipt, CreditCard,
    Upload, Image, File, X, Video, ClipboardList, Wind, Droplets,
    Scale, ThermometerSun, IndianRupee, Phone, VideoIcon, Clock3,
    UserCircle, FolderOpen, Calendar as CalendarIcon, CheckSquare,
    Building, Home, Shield, Eye, Printer, Share2, MoreVertical,
    Search, Filter, DownloadCloud, Printer as PrintIcon, Edit3,
    Package,
    Thermometer,
    Notebook,
    CheckCircle2,
    UserX,
    RefreshCw,
    DeleteIcon,
    Leaf,
    Loader2,
    XCircleIcon,
    PencilIcon
} from 'lucide-react';
import { BsLungs, BsPrescription } from 'react-icons/bs';
import toast from 'react-hot-toast';
import { FaAllergies } from 'react-icons/fa';
import { MdFamilyRestroom } from 'react-icons/md';
import DoctorQAPanelPremium from './questionsforpatient';
import DoctorVideoCall from '../videocall/DoctorVideoCall';
import DietProgress from './dietprogress';
import { BiFoodMenu } from 'react-icons/bi';
// import html2canvas from 'html2canvas';
// import jsPDF from 'jspdf';

// ─── HELPERS ────────────────────────────────────────────────────────────────
const formatDate = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
};

const formatDateTime = (d) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatTime = (t) => {
    if (!t) return 'N/A';
    return t.substring(0, 5);
};

const formatSlotDateTime = (date, time) => {
    if (!date) return 'N/A';
    const iso = time ? `${date}T${String(time).slice(0, 8)}` : date;
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return formatDate(date);
    return parsed.toLocaleString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatDurationLabel = (duration) => {
    if (duration === 0 || duration === '0') return '0 days';
    if (duration == null || duration === '') return '—';
    const value = String(duration).trim();
    if (/day|week|month|hour|yr|year/i.test(value)) return value;
    return `${value} days`;
};

const toAdviceList = (items) => {
    if (!items) return [];
    if (Array.isArray(items)) {
        return items.map((item) => String(item).replace(/^•\s*/, '').trim()).filter(Boolean);
    }
    return String(items)
        .split('\n')
        .map((line) => line.replace(/^•\s*/, '').trim())
        .filter(Boolean);
};

const isPrescriptionStillEditable = (record) => {
    if (typeof record?.is_editable === 'boolean') return record.is_editable;
    if (record?.edit_window_closes_at) {
        const closesAt = new Date(record.edit_window_closes_at);
        return !Number.isNaN(closesAt.getTime()) && closesAt.getTime() > Date.now();
    }
    return true;
};

const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const today = new Date(), b = new Date(dob);
    let age = today.getFullYear() - b.getFullYear();
    if (today.getMonth() - b.getMonth() < 0 || (today.getMonth() === b.getMonth() && today.getDate() < b.getDate())) age--;
    return age;
};

const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'P';
};

const STATUS_CONFIG = {
    pending: {
        color: '#D97706',
        bg: '#FEF3C7',
        border: '#FBBF24',
        label: 'Pending',
        icon: Clock
    },
    missed: {
        color: 'Gray',
        border: 'Gray',
        label: 'Missed',
        icon: Clock
    },

    confirmed: {
        color: '#2563EB',
        bg: '#DBEAFE',
        border: '#93C5FD',
        label: 'Confirmed',
        icon: CheckCircle
    },

    'in-progress': {
        color: '#7C3AED',
        bg: '#EDE9FE',
        border: '#C4B5FD',
        label: 'In Progress',
        icon: Activity
    },

    completed: {
        color: '#0D614E',
        bg: '#E8F5F2',
        border: '#34D399',
        label: 'Completed',
        icon: BadgeCheck
    },

    rescheduled: {
        color: '#EA580C',
        bg: '#FFEDD5',
        border: '#FDBA74',
        label: 'Rescheduled',
        icon: RefreshCw
    },

    reschedule: {
        color: '#EA580C',
        bg: '#FFEDD5',
        border: '#FDBA74',
        label: "Waiting for Patient Response",
        icon: RefreshCw
    },

    cancelled: {
        color: '#DC2626',
        bg: '#FEE2E2',
        border: '#FCA5A5',
        label: 'Cancelled',
        icon: XCircle
    },
    cancellation_requested: {
        color: '#DC2626',
        bg: '#FEE2E2',
        border: '#FCA5A5',
        label: 'Cancellation Requested',
        icon: XCircle
    },
    'no-show': {
        color: '#6B7280',
        bg: '#F3F4F6',
        border: '#D1D5DB',
        label: 'No Show',
        icon: UserX
    }
};

const CONSULTATION_TYPES = {
    video: { icon: Video, label: 'Video Call', color: '#3B82F6' },
    clinic: { icon: Building, label: 'In-Clinic', color: '#10B981' },
    home: { icon: Home, label: 'Home Visit', color: '#8B5CF6' }
};

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────
const SectionCard = ({ children, className = '' }) => (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
        {children}
    </div>
);

const SectionHeader = ({ icon: Icon, title, action, badge }) => (
    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
                <Icon className="w-4 h-4 text-[#0D614E]" />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
            {badge && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{badge}</span>
            )}
        </div>
        {action}
    </div>
);

const InfoRow = ({ label, value, mono, highlight }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
        <span className={`text-sm font-semibold ${highlight ? 'text-[#0D614E]' : 'text-gray-700'} ${mono ? 'font-mono text-xs' : ''}`}>
            {value || '—'}
        </span>
    </div>
);

const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = config.icon;
    return (
        <span className="inline-flex items-center gap-1.5 px-6 py-2 rounded-full text-xs font-semibold border shadow-sm"
            style={{ background: config.bg, color: config.color, borderColor: config.border }}>
            <Icon className="w-3.5 h-3.5" />
            {config.label}
        </span>
    );
};

const VitalsCard = ({ vitals }) => {
    const vitalItems = [
        { label: 'Blood Pressure', value: vitals?.blood_pressure, icon: Activity, unit: 'mmHg' },
        { label: 'Heart Rate', value: vitals?.heart_rate, icon: Heart, unit: 'bpm' },
        { label: 'Temperature', value: vitals?.temperature, icon: ThermometerSun, unit: '°F' },
        { label: 'Oxygen Level', value: vitals?.oxygen_saturation, icon: Wind, unit: '%' },
        { label: 'Blood Sugar', value: vitals?.blood_sugar, icon: Droplet, unit: 'mg/dL' },
        { label: 'Respiratory Rate', value: vitals?.respiratory_rate, icon: BsLungs, unit: 'breaths/min' }
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {vitalItems.map((item, idx) => item.value && (
                <div key={idx} className="bg-gradient-to-br from-gray-50 to-white p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 mb-1">
                        <item.icon className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs text-gray-500">{item.label}</span>
                    </div>
                    <p className="text-lg font-bold text-gray-800">{item.value} <span className="text-xs font-normal text-gray-400">{item.unit}</span></p>
                </div>
            ))}
        </div>
    );
};

// Prescription Template Component for PDF
const PrescriptionTemplate = React.forwardRef(({ appointment, formData, doctor, patient, date, dietPlans = [] }, ref) => {
    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        return new Date().getFullYear() - new Date(dob).getFullYear();
    };

    const formatDate = (dateString) => {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    };

    console.log(doctor);


    return (
        <div
            ref={ref}
            className="bg-white min-h-screen"
        >
            {/* ─────────────────────────────────────────────────────────────────────────────── */}
            {/* PREMIUM HEADER WITH AYURVEDIC TOUCH */}
            {/* ─────────────────────────────────────────────────────────────────────────────── */}
            <div className="relative bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 px-10 py-12 text-white overflow-hidden">
                {/* Decorative Ayurvedic Background Pattern */}
                <div className="absolute inset-0 opacity-5">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                        <defs>
                            <pattern id="ayur-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M10 2 L13 8 L19 9 L14 14 L15 20 L10 17 L5 20 L6 14 L1 9 L7 8 Z" fill="currentColor" />
                            </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#ayur-pattern)" />
                    </svg>
                </div>

                <div className="relative z-10 max-w-6xl mx-auto">
                    {/* Logo & Clinic Name */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold tracking-tight text-white mb-1">
                                AYURMUNI
                            </h1>
                            <p className="text-emerald-200 text-sm font-medium tracking-wide">Ayurvedic Medical Centre</p>
                        </div>
                        {/* Decorative Leaf Element */}
                        <div className="mt-2">
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-emerald-300 opacity-80">
                                <path d="M24 4C24 4 28 16 24 28C20 16 24 4 24 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <path d="M24 28C16 26 8 24 4 20M24 28C32 26 40 24 44 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                                <circle cx="24" cy="28" r="2" fill="currentColor" />
                            </svg>
                        </div>
                    </div>

                    {/* Doctor & Clinic Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                        <div>
                            <p className="text-emerald-200 text-xs font-semibold uppercase tracking-widest mb-1">Doctor</p>
                            <p className="text-white font-medium capitalize">{doctor?.doctor_name}</p>
                            <p className="text-emerald-100 text-xs mt-1">{doctor?.qualification}</p>
                        </div>
                        <div>
                            <p className="text-emerald-200 text-xs font-semibold uppercase tracking-widest mb-1">Registration</p>
                            <p className="text-white font-medium">{doctor?.registration_number}</p>
                            <p className="text-emerald-100 text-xs mt-1">License: Valid</p>
                        </div>
                        <div>
                            <p className="text-emerald-200 text-xs font-semibold uppercase tracking-widest mb-1">Date</p>
                            <p className="text-white font-medium">{doctor?.registration_year || formatDate(doctor?.registration_year)}</p>
                        </div>
                        <div>
                            <p className="text-emerald-200 text-xs font-semibold uppercase tracking-widest mb-1">Consultation ID</p>
                            <p className="text-white font-mono">{appointment?.id?.slice(0, 8).toUpperCase() || 'AYU-2024'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────────────────────── */}
            {/* MAIN CONTENT AREA */}
            {/* ─────────────────────────────────────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-10 py-10">

                {/* PATIENT INFO CARD */}
                <div className="mb-8">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-[#0D614E] rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-emerald-900">Patient Information</h2>
                        </div>

                        <div className="!gap-1 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2  priciptiondata">
                            <div>
                                <label className="text-sm font-semibold text-emerald-700 uppercase tracking-widest">Name </label>
                                <p className="text-sm font-bold text-gray-900 mt-1">: {patient?.first_name} {patient?.last_name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-emerald-700 uppercase tracking-widest">Age </label>
                                <p className="text-sm font-bold text-gray-900 mt-1">: {calculateAge(patient?.dob)} years</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-emerald-700 uppercase tracking-widest">Gender </label>
                                <p className="text-sm font-bold text-gray-900 mt-1">: {patient?.gender || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-emerald-700 uppercase tracking-widest">Blood Type </label>
                                <p className="text-sm font-bold text-gray-900 mt-1">: {patient?.blood_group || '—'}</p>
                            </div>
                            {/* <div>
                                <label className="text-sm font-semibold text-emerald-700 uppercase tracking-widest">Contact</label>
                                <p className="text-sm font-bold text-gray-900 mt-1">{patient?.phone_number || '—'}</p>
                            </div> */}
                            <div>
                                <label className="text-sm font-semibold text-emerald-700 uppercase tracking-widest">Dosha Type </label>
                                <p className="text-sm font-bold text-gray-900 mt-1">: {patient?.dosha || 'Vata'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CHIEF COMPLAINT & DIAGNOSIS */}
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
                    {/* Chief Complaint Card */}
                    <div className="rounded-xl border border-[#0D614E]/20 p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-[#0D614E]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-5 h-5 text-[#0D614E]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Chief Complaint</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed text-base">
                            {formData.symptom_description}
                        </p>
                    </div>
                    {
                        formData.history_of_past_illness &&
                        <div className="rounded-xl border border-[#0D614E]/20 p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 bg-[#0D614E]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Notebook className='stroke-[#0D614E]' size={16} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">History of Past Illness</h3>
                            </div>
                            <p className="text-gray-700 leading-relaxed text-base">
                                {formData.history_of_past_illness}
                            </p>
                        </div>
                    }



                    {
                        formData.allergies &&
                        <div className="rounded-xl border border-[#0D614E]/20 p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 bg-[#0D614E]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <FaAllergies className='fill-[#0D614E]' />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Allergies </h3>
                            </div>
                            <p className="text-gray-700 leading-relaxed text-base">
                                {formData.allergies}
                            </p>
                        </div>
                    }

                    {
                        formData.family_history &&
                        <div className="rounded-xl border border-[#0D614E]/20 p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 bg-[#0D614E]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <MdFamilyRestroom className='fill-[#0D614E]' />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Family History </h3>
                            </div>
                            <p className="text-gray-700 leading-relaxed text-base">
                                {formData.family_history}
                            </p>
                        </div>
                    }
                    {/* Diagnosis Card */}
                    <div className="rounded-xl border border-[#0D614E]/20 p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-[#0D614E]/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg className="w-5 h-5 text-[#0D614E]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Diagnosis</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed text-base">
                            {formData.diagnosis || appointment?.diagnosis}
                        </p>
                    </div>
                </div>

                {/* PRESCRIPTIONS TABLE */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 bg-[#0D614E] rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Prescribed Medicines</h3>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-gray-300 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[#0D614E] text-white">
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Medicine Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Dosage</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Frequency</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Duration</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold">Instructions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(formData.prescriptions || appointment?.prescriptions || []).length > 0 ? (
                                        (formData.prescriptions || appointment?.prescriptions || []).map((med, idx) => (
                                            <tr
                                                key={idx}
                                                className={`border-t border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-emerald-50 transition-colors`}
                                            >
                                                <td className="px-6 py-5 font-semibold text-gray-900">{med.product_name || med.medicine_name}</td>
                                                <td className="px-6 py-5 text-gray-700">{med.dosage || '—'}</td>
                                                <td className="px-6 py-5 text-gray-700">{med.frequency || '—'}</td>
                                                <td className="px-6 py-5 text-gray-700">{formatDurationLabel(med.duration)}</td>
                                                <td className="px-6 py-5 text-sm text-gray-600 italic">{med.instruction || '—'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-base">
                                                No medicines prescribed
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* DIET PLANS */}
                {(dietPlans || []).length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 bg-[#0D614E] rounded-lg flex items-center justify-center">
                                <Leaf className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Diet Plans</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {(dietPlans || []).map((diet) => (
                                <div key={diet.id || diet.name} className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-semibold text-gray-900">{diet.name || 'Unnamed plan'}</p>
                                        <p className="text-sm text-gray-600 mt-1">Assigned with this prescription</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-end">
                                        <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                            {formatDurationLabel(diet.duration ?? diet.total_days)}
                                        </span>
                                        {diet.meals_per_day != null && diet.meals_per_day !== '' && (
                                            <span className="inline-block bg-sky-100 text-sky-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                                {diet.meals_per_day} meals/day
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* DO'S & DON'TS */}
                {(toAdviceList(formData.dos).length > 0 || toAdviceList(formData.donts).length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                        {toAdviceList(formData.dos).length > 0 && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                                <h3 className="font-semibold text-emerald-800 mb-3">Do's</h3>
                                <ul className="space-y-2">
                                    {toAdviceList(formData.dos).map((item, i) => (
                                        <li key={i} className="flex gap-2 text-sm text-emerald-900">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {toAdviceList(formData.donts).length > 0 && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                                <h3 className="font-semibold text-red-800 mb-3">Don'ts</h3>
                                <ul className="space-y-2">
                                    {toAdviceList(formData.donts).map((item, i) => (
                                        <li key={i} className="flex gap-2 text-sm text-red-900">
                                            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* CLINICAL NOTES */}
                {formData.clinical_notes && (
                    <div className="mb-8">
                        <div className="rounded-xl border border-[#0D614E]/20  to-yellow-50 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 bg-[#0D614E]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-5 h-5 text-[#0D614E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Clinical Notes & Observations</h3>
                            </div>
                            <p className="text-gray-800 leading-relaxed text-base">{formData.clinical_notes}</p>
                        </div>
                    </div>
                )}

                {/* LIFESTYLE & DIET RECOMMENDATIONS */}
                {formData.lifestyle_recommendations && (
                    <div className="mb-8">
                        <div className="rounded-xl border border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Lifestyle & Diet Guidance</h3>
                            </div>
                            <p className="text-gray-800 leading-relaxed text-base">{formData.lifestyle_recommendations}</p>
                        </div>
                    </div>
                )}

                {/* FOLLOW-UP APPOINTMENT */}
                {formData.follow_up?.schedule && formData.follow_up?.date && (
                    <div className="mb-8">
                        <div className="rounded-xl border border-[#0D614E]/20  to-cyan-50 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 bg-[#0D614E]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg className="w-5 h-5 text-[#0D614E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">Follow-up Appointment</h3>
                            </div>
                            <div className="flex flex-wrap gap-6">
                                <div>
                                    <p className="text-sm text-gray-600 font-semibold">Scheduled Date</p>
                                    <p className="text-md font-bold mt-1">{formatDate(formData.follow_up.date)}</p>
                                </div>
                                {formData.follow_up.reason && (
                                    <div>
                                        <p className="text-sm text-gray-600 font-semibold">Reason</p>
                                        <p className="text-md  mt-1">{formData.follow_up.reason}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </div>


            {/* ─────────────────────────────────────────────────────────────────────────────── */}
            {/* PROFESSIONAL FOOTER WITH SIGNATURE AREA */}
            {/* ─────────────────────────────────────────────────────────────────────────────── */}
            <div className=" border-t border-gray-300 bg-gradient-to-br from-gray-50 to-white">
                <div className="max-w-6xl mx-auto px-10 py-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Important Info */}
                        <div>
                            <h4 className="font-bold text-gray-900 mb-3">Important Information</h4>
                            <ul className="text-sm text-gray-700 space-y-2">
                                <li className="flex gap-2">
                                    <span className="text-emerald-600 font-bold">•</span>
                                    <span>Follow prescribed dosage strictly</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-emerald-600 font-bold">•</span>
                                    <span>Avoid contraindicated foods</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-emerald-600 font-bold">•</span>
                                    <span>Maintain treatment schedule</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-emerald-600 font-bold">•</span>
                                    <span>Report adverse effects immediately</span>
                                </li>
                            </ul>
                        </div>

                        {/* Doctor Signature Area */}
                        <div className=" border-gray-400 pt-8 text-center">
                            {/* <div className="h-20 mb-2 flex items-center justify-center">
                            </div>
                            <p className="text-sm font-bold text-gray-900">Dr. {doctor?.name || 'Dr. Sharma'}</p>
                            <p className="text-xs text-gray-600 mt-1">{doctor?.specialization || 'Vaidya'}</p>
                            <p className="text-xs text-gray-500 mt-2">{doctor?.clinic_address || 'Ayurmuni Medical Centre'}</p> */}
                        </div>

                        {/* Clinic Details */}
                        <div className="text-right">
                            <h4 className="font-bold text-gray-900 mb-3">Clinic Details</h4>
                            <p className="text-sm text-gray-700">{doctor?.clinic_address || 'Ayurmuni Medical Centre'}</p>
                            <p className="text-sm text-gray-700 mt-2">Phone: {doctor?.contact_no || '+91 XXXXXXXXXX'}</p>
                            <p className="text-sm text-gray-700">Email: {doctor?.email || 'info@ayurmuni.com'}</p>
                            <p className="text-xs text-gray-500 mt-3 italic">Reg. License: {doctor?.registration_no || 'AYUR-2024-001'}</p>
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                        <p className="text-xs text-gray-500">
                            This prescription is generated digitally and is valid without a written signature.
                            Please consult the doctor for any clarifications regarding the prescribed medicines and dietary advice.
                        </p>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none; }
        }
      `}</style>
        </div>
    );
});

PrescriptionTemplate.displayName = 'PrescriptionTemplate';

// Invoice Template Component for PDF
const InvoiceTemplate = React.forwardRef(({ appointment, patient, doctor }, ref) => (
    <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header */}
        <div className="text-center border-b-2 border-emerald-600 pb-6 mb-6">
            <h1 className="text-3xl font-bold text-emerald-800">TAX INVOICE</h1>
            <p className="text-gray-600 mt-2">{doctor?.clinic_name || 'Medical Clinic'}</p>
            <p className="text-sm text-gray-500">{doctor?.clinic_address || 'Healthcare Center'}</p>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
                <p className="text-sm text-gray-500">Invoice No: <span className="font-semibold text-gray-800">INV-{appointment?.id?.slice(0, 8)}</span></p>
                <p className="text-sm text-gray-500 mt-1">Date: {formatDate(new Date())}</p>
                <p className="text-sm text-gray-500 mt-1">Appointment ID: {appointment?.id?.slice(0, 12)}</p>
            </div>
            <div className="text-right">
                <p className="text-sm text-gray-500">Payment Status:
                    <span className={`ml-2 font-semibold ${appointment?.payment_id ? 'text-green-600' : 'text-red-600'}`}>
                        {appointment?.payment_id ? 'PAID' : 'PENDING'}
                    </span>
                </p>
                {appointment?.payment_id && (
                    <>
                        <p className="text-sm text-gray-500 mt-1">Payment ID: {appointment?.payment_id}</p>
                        <p className="text-sm text-gray-500 mt-1">Transaction ID: {appointment?.transaction_id}</p>
                    </>
                )}
            </div>
        </div>

        {/* Patient Details */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Patient Details</h3>
            <p className="text-sm">Name: {patient?.first_name} {patient?.last_name}</p>
            <p className="text-sm mt-1">Contact: {patient?.phone_number}</p>
            <p className="text-sm mt-1">Email: {patient?.email}</p>
        </div>

        {/* Bill Details */}
        <table className="w-full mb-6 border-collapse">
            <thead>
                <tr className="bg-gray-100">
                    <th className="p-3 text-left border">Description</th>
                    <th className="p-3 text-right border">Amount (₹)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td className="p-3 border">Consultation Fee</td>
                    <td className="p-3 text-right border">{appointment?.amount}</td>
                </tr>
                <tr>
                    <td className="p-3 border">Platform Fee</td>
                    <td className="p-3 text-right border">Included</td>
                </tr>
                <tr className="bg-emerald-50">
                    <td className="p-3 border font-bold">Total</td>
                    <td className="p-3 text-right border font-bold">₹{appointment?.amount}</td>
                </tr>
            </tbody>
        </table>

        {/* Insurance Details */}
        {patient?.insurance_provider && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Insurance Information</h3>
                <p className="text-sm">Provider: {patient.insurance_provider}</p>
                <p className="text-sm mt-1">Policy No: {patient.insurance_policy_number}</p>
                <p className="text-sm mt-1">Valid Thru: {formatDate(patient.insurance_valid_thru)}</p>
            </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-center">
            <p className="text-xs text-gray-400">Thank you for choosing us. This is a system generated invoice.</p>
            <p className="text-xs text-gray-400 mt-1">For any queries, please contact support</p>
        </div>
    </div>
));

InvoiceTemplate.displayName = 'InvoiceTemplate';

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const AppointmentDetail = ({ videodetails }) => {
    const { type, appointmentId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [dietloading, setdietloading] = useState(false);
    const [appointment, setAppointment] = useState(null);
    const [doDonts, setdoDonts] = useState(null);
    const [filterdoDonts, setFilterdoDonts] = useState(null);
    const [filterdietplans, setFilterdietplans] = useState(null);
    const [activeTab, setActiveTab] = useState(type == "patient" ? "history" : 'prescription');
    const [updating, setUpdating] = useState(false);
    const [showAddMed, setShowAddMed] = useState(false);
    const [expandedIdx, setExpandedIdx] = useState(null);
    const [editingPrescription, setEditingPrescription] = useState(null);
    const [editingPrescriptionId, setEditingPrescriptionId] = useState(null);
    const [editingAppointmentId, setEditingAppointmentId] = useState(null);
    const [editingPrescriptionStatus, setEditingPrescriptionStatus] = useState("sent");
    const [originalPrescriptionItems, setOriginalPrescriptionItems] = useState([]);
    const [savingPrescription, setSavingPrescription] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showCall, setshowCall] = useState(false)
    // Refs for PDF generation
    const prescriptionRef = useRef();
    const invoiceRef = useRef();

    // Form state
    const [formData, setFormData] = useState({
        symptom_description: '',
        history_of_past_illness: '',
        surgical_history: '',
        allergies: '',
        family_history: '',
        clinical_notes: '',
        diagnosis: '',
        prescriptions: [],
        follow_up: { schedule: false, date: '', reason: '' },
        dos: "",
        donts: ""
    });

    const [selecteddietplan, setSelecteddietplan] = useState(null);
    const [originalPrescribedDiet, setOriginalPrescribedDiet] = useState(null);
    const [dietSearchQuery, setDietSearchQuery] = useState("");
    const dietDropdownRef = useRef(null);

    const [newMed, setNewMed] = useState({
        medicine_name: '',
        medicinedata: "",
        medicine: "",
        dosage: '',
        frequency: '',
        duration: '',
        instruction: ''
    });


    const [documents, setDocuments] = useState([]);
    const [search, setSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    const [doDontSearchQuery, setDoDontSearchQuery] = useState("");
    const [selectedDoDontId, setSelectedDoDontId] = useState(null);
    const [showDropdowndo, setShowDropdowndo] = useState(false);
    const [showDropdowndiet, setShowDropdowndiet] = useState(false);

    const [medicines, setMedicines] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [patientHistory, setPatientHistory] = useState([]);
    const [patientDocument, setPatientDocument] = useState([]);
    const [loader, setloader] = useState(false)
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedUploadFiles, setSelectedUploadFiles] = useState([]);
    const [uploadMeta, setUploadMeta] = useState({
        medical_record_type: 'prescription',
        description: ''
    });
    const fileInputRef = useRef(null);

    const MEDICAL_RECORD_TYPES = [
        { value: 'prescription', label: 'Prescription' },
        { value: 'lab_report', label: 'Lab Report' },
        // { value: 'scan', label: 'Scan' },
        // { value: 'xray', label: 'X-Ray' },
        // { value: 'discharge_summary', label: 'Discharge Summary' },
        { value: 'other', label: 'Other' },
    ];

    useEffect(() => {
        fetchAppointmentDetails();
    }, [appointmentId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dietDropdownRef.current && !dietDropdownRef.current.contains(event.target)) {
                setShowDropdowndiet(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);



    const fetchAppointmentDetails = async () => {
        try {
            setLoading(true);
            const response = await doctorService.getAppointmentDetails?.(type, appointmentId);
            const apiData = response?.data?.data || response?.data || response
            let prakriti = appointment?.patient?.prakriti || appointment?.prakriti || "";
            const dodonts = await doctorService.getDosDonts?.(prakriti);

            setAppointment(apiData);
            setdoDonts(dodonts?.data.data || dodonts?.data || dodonts);
            setFilterdoDonts(dodonts?.data.data || dodonts?.data || dodonts);
            // setDocuments(apiData?.documents || []);
            // setFormData({
            //     symptom_description: apiData?.symptom_description || '',
            //     history_of_past_illness: apiData?.medical_history?.previous_surgeries || '',
            //     surgical_history: '',
            //     allergies: '',
            //     family_history: apiData?.medical_history?.family_history || '',
            //     clinical_notes: apiData?.notes || '',
            //     diagnosis: apiData?.diagnosis || '',
            //     prescriptions: apiData?.prescriptions || [],
            //     follow_up: { schedule: false, date: '', reason: '' }
            // });
            fetchPatientHistory(apiData?.patient?.id);
            fetchPatientDocuments(type == "patient" ? apiData?.patient?.id : apiData?.id)
        } catch (err) {
            console.error('Error fetching appointment:', err);
            toast.error(err?.response?.data?.message || 'Failed to load appointment');
        } finally {
            setLoading(false);
        }
    };

    const fetchPatientHistory = async (id) => {
        try {
            const response = await doctorService.getAppointmentprec(id, "");
            const payload = response?.data?.data || response?.data || {};
            const results = Array.isArray(payload?.results)
                ? payload.results
                : Array.isArray(payload)
                    ? payload
                    : [];
            setPatientHistory(results);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to load patient history');
        }
    };

    const fetchPatientDocuments = async (id) => {
        try {
            const response = await doctorService.getAppointmentDoc(type, id);
            const payload = response?.data?.data;
            const list = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.results)
                    ? payload.results
                    : [];
            setPatientDocument(list);
        } catch (error) {
            toast.error(error?.message || error?.response?.data?.message || 'Failed to load Document history');
        }
    };

    const getDocumentFileType = (file) => {
        const ext = (file?.name?.split('.').pop() || '').toLowerCase();
        if (file?.type?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            return 'image';
        }
        if (ext === 'pdf' || file?.type === 'application/pdf') return 'pdf';
        if (['doc', 'docx'].includes(ext)) return ext;
        return ext || 'file';
    };

    const resetUploadForm = () => {
        setShowUploadModal(false);
        setSelectedUploadFiles([]);
        setUploadMeta({ medical_record_type: 'prescription', description: '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search.trim().length >= 2 && newMed?.medicine == "") {
                fetchMedicines(search);
            } else {
                setMedicines([]);
            }
        }, 500); // wait 500ms after typing stops

        if (newMed.medicine_name != search) {
            setNewMed(prev => ({
                ...prev,
                medicine_name: "",
                medicinedata: {},
                medicine: "",
            }))
        }
        return () => clearTimeout(timer);
    }, [search]);
    const fetchMedicines = async (keyword) => {
        try {
            setloader(true)
            const res = await doctorService.getProductList(keyword);
            setMedicines(res?.data?.data.results || []);
            setShowDropdown(true);
            setloader(false)
        } catch (error) {
            console.log(error);
        }
    };
    const selectMedicine = (medicine) => {
        setNewMed(prev => ({
            ...prev,
            medicinedata: medicine,
            medicine_name: medicine.product_name,
            medicine: medicine.id,
        }));
        setSearch(medicine.product_name);
        setShowDropdown(false);
    };

    const searchDoDonts = (keyword) => {
        if (keyword.trim().length >= 2) {
            const filtered = doDonts?.filter(item => item.prakriti.toLowerCase().includes(keyword.toLowerCase()) || item.dos.some(dos => dos.toLowerCase().includes(keyword.toLowerCase())) || item.donts.some(dont => dont.toLowerCase().includes(keyword.toLowerCase())) || item.health_diseases.some(disease => disease?.name.toLowerCase().includes(keyword.toLowerCase())));
            setFilterdoDonts(filtered);
        } else if (keyword.trim().length == 2 || keyword == "") {
            setFilterdoDonts(doDonts);
        }
    };

    const dietSearchTimeout = useRef(null);

    const searchdietplans = (keyword) => {
        clearTimeout(dietSearchTimeout.current);
        dietSearchTimeout.current = setTimeout(async () => {
            try {
                if (keyword.trim().length < 2) {
                    setFilterdietplans([]);
                    return;
                }
                setdietloading(true);
                const res = await doctorService.getDietPlans(keyword);
                const dietplans = res?.data?.data || [];

                setFilterdietplans(dietplans);
            } catch (error) {
                console.error(error);
            } finally {
                setdietloading(false);
            }
        }, 500);
    };



    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'sent': return 'bg-blue-50 border-blue-200 text-blue-700';
            case 'completed': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
            case 'pending': return 'bg-amber-50 border-amber-200 text-amber-700';
            default: return 'bg-gray-50 border-gray-200 text-gray-700';
        }
    };
    const handleAddMed = () => {
        if (
            !String(newMed.medicine_name || '').trim() ||
            !String(newMed.medicine || '').trim() ||
            !String(newMed.dosage || '').trim() ||
            !String(newMed.frequency || '').trim() ||
            !String(newMed.duration || '').trim()
        ) {
            toast.error("Please select a medicine and fill dosage, frequency, and duration");
            return;
        }
        setFormData(prev => ({
            ...prev,
            prescriptions: [...prev.prescriptions, { ...newMed, id: Date.now(), prescribed_at: new Date().toISOString() }]
        }));
        setNewMed({ medicine_name: '', dosage: '', frequency: '', duration: '', instruction: '', medicine: '', medicinedata: {} });
        setShowAddMed(false);
        setShowDropdown(false);
        setSearch("");
    };

    const handleUpdatePrescription = (id, updatedMed) => {
        setFormData(prev => ({
            ...prev,
            prescriptions: prev.prescriptions.map(med => med.id === id ? { ...med, ...updatedMed } : med)
        }));
        setEditingPrescription(null);
    };

    const handleRemovePrescription = (id) => {
        setFormData(prev => ({
            ...prev,
            prescriptions: prev.prescriptions.filter(x => x.id !== id)
        }));
    };

    const handleDeleteDocument = async (id) => {
        try {
            const res = await doctorService.deleteAppointmentDocument(id);
            if (res.data.success) {
                toast.success('Document deleted successfully');
            }
        } catch (error) {
            toast.error(error?.message || error?.response?.data?.message || 'Failed to delete document');
        }
    };

    const getEmptyPrescriptionForm = () => ({
        symptom_description: "",
        history_of_past_illness: "",
        surgical_history: "",
        allergies: "",
        family_history: "",
        clinical_notes: "",
        diagnosis: "",
        prescriptions: [],
        follow_up: {
            schedule: false,
            date: "",
            reason: "",
        },
        dos: "",
        donts: "",
    });

    const convertArrayToBulletText = (items) => {
        if (!items) return "";
        if (typeof items === "string") return items;
        if (!Array.isArray(items)) return "";
        return items.map((item) => `• ${item}`).join("\n");
    };

    const isExistingPrescriptionItem = (id) =>
        typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const getMedicineItemPayload = (med) => ({
        medicine: med?.medicine?.id || med?.medicine || med?.medicine_id || "",
        dosage: med?.dosage || "",
        frequency: med?.frequency || "",
        duration: med?.duration || "",
        instruction: med?.instruction || "",
    });

    const mapPrescriptionItems = (items = []) =>
        items.map((med) => ({
            ...med,
            id: med.id || Date.now() + Math.random(),
            medicine_name: med.product_name || med.medicine_name || med.medicine?.product_name || "",
            medicine: med.medicine?.id || med.medicine || med.medicine_id || "",
            dosage: med.dosage || "",
            frequency: med.frequency || "",
            duration: med.duration || "",
            instruction: med.instruction || "",
            medicinedata: med.medicinedata || med.medicine || med,
        }));

    const handleEditPrescriptionForm = (record, e) => {
        e?.stopPropagation?.();
        e?.preventDefault?.();
        try {
            const followUp = record?.follow_up || {};
            const followUpDate = followUp.date
                ? String(followUp.date).slice(0, 10)
                : "";
            const mappedItems = mapPrescriptionItems(record?.prescription_items || record?.prescriptions || []);
            const firstDiet = record?.diets?.[0];
            setFormData({
                symptom_description: record?.symptom_description || "",
                history_of_past_illness: record?.history_of_past_illness || "",
                surgical_history: record?.surgical_history || "",
                allergies: record?.allergies || "",
                family_history: record?.family_history || "",
                clinical_notes: record?.clinical_notes || "",
                diagnosis: record?.diagnosis_advice || record?.diagnosis || "",
                prescriptions: mappedItems,
                follow_up: {
                    schedule: Boolean(followUp.schedule),
                    date: followUpDate,
                    reason: followUp.reason || "",
                },
                dos: convertArrayToBulletText(record?.dos),
                donts: convertArrayToBulletText(record?.donts),
            });
            const mappedDiet = firstDiet
                ? {
                    ...firstDiet,
                    total_days: firstDiet.duration ?? firstDiet.total_days,
                }
                : null;
            setSelecteddietplan(mappedDiet);
            setOriginalPrescribedDiet(mappedDiet);
            setEditingPrescriptionId(record?.id || null);
            setEditingAppointmentId(record?.appointment_id || record?.appointment || appointment?.id || null);
            setEditingPrescriptionStatus(record?.status || "sent");
            setOriginalPrescriptionItems(mappedItems);
            setShowAddMed(false);
            setEditingPrescription(null);
            setActiveTab("prescription");
            toast.success("Prescription loaded for editing");
        } catch (error) {
            console.error(error);
            toast.error("Failed to load prescription for editing");
        }
    };

    const handleCancelEditPrescription = () => {
        setEditingPrescriptionId(null);
        setEditingAppointmentId(null);
        setEditingPrescriptionStatus("sent");
        setOriginalPrescriptionItems([]);
        setFormData(getEmptyPrescriptionForm());
        setSelecteddietplan(null);
        setOriginalPrescribedDiet(null);
        setDietSearchQuery("");
        setShowAddMed(false);
        setEditingPrescription(null);
        setActiveTab("history");
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setSelectedUploadFiles(files);
        setShowUploadModal(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmitDocumentUpload = async () => {
        if (!selectedUploadFiles.length) {
            toast.error('Please select at least one document');
            return;
        }
        if (!uploadMeta.medical_record_type) {
            toast.error('Please select a medical record type');
            return;
        }

        const currentAppointmentId = appointment?.id || (type !== 'patient' ? appointmentId : null);
        if (!currentAppointmentId) {
            toast.error('Appointment ID is required to upload documents');
            return;
        }

        setUploading(true);
        try {
            let uploadedCount = 0;
            for (const file of selectedUploadFiles) {
                const uploadRes = await vendorService.uploadfiles(file, 'appointment_documents');
                const fileUrl = uploadRes?.data?.data?.url || uploadRes?.data?.url;
                if (!fileUrl) {
                    toast.error(`Failed to upload ${file.name}`);
                    continue;
                }

                await doctorService.uploadAppointmentDocument(currentAppointmentId, {
                    file_url: fileUrl,
                    file_type: getDocumentFileType(file),
                    medical_record_type: uploadMeta.medical_record_type,
                    description: uploadMeta.description?.trim() || file.name,
                });
                uploadedCount += 1;
            }

            if (uploadedCount > 0) {
                toast.success(`${uploadedCount} document(s) uploaded successfully`);
                resetUploadForm();
                const docsId = type === 'patient' ? appointment?.patient?.id : appointment?.id;
                await fetchPatientDocuments(docsId);
            }
        } catch (error) {
            toast.error(error?.message || error?.response?.data?.message || 'Failed to upload document');
        } finally {
            setUploading(false);
        }
    };


    const validateProductInfo = () => {
        const newErrors = {};

        if (!formData.symptom_description) {
            toast.error("Chief Complaint is required");
            return false;
        }
        // if (!formData.prescriptions[0]) {
        //     toast.error("Prescribed Medicines is required");
        //     return false;
        // }
        return true;
    };

    const convertBulletTextToArray = (text) => {
        if (Array.isArray(text)) return text.filter(Boolean);
        if (!text) return [];
        return String(text)
            .split("\n")
            .map(line => line.replace(/^•\s*/, "").trim())
            .filter(Boolean);
    };

    const getDietPlanId = (diet) => diet?.diet_plan_id || diet?.diet_plan || diet?.id || null;

    const getDietAdditionalNotes = (diet) => {
        if (Array.isArray(diet?.additional_notes)) {
            return diet.additional_notes.filter(Boolean);
        }
        return [];
    };
    // Save prescription to history
    const handleSavePrescription = async () => {
        if (!validateProductInfo()) return;
        setSavingPrescription(true);
        setUpdating(true)

        const isEditing = Boolean(editingPrescriptionId);
        const prescriptionData = isEditing
            ? {
                symptom_description: formData.symptom_description,
                history_of_past_illness: formData.history_of_past_illness,
                surgical_history: formData.surgical_history,
                allergies: formData.allergies,
                family_history: formData.family_history,
                clinical_notes: formData.clinical_notes,
                diagnosis_advice: formData.diagnosis,
                dos: convertBulletTextToArray(formData?.dos),
                donts: convertBulletTextToArray(formData?.donts),
                follow_up: formData.follow_up,
                status: editingPrescriptionStatus || "sent",
                prescription_items: formData.prescriptions,
            }
            : {
                id: Date.now().toString(),
                appointment_id: appointment?.id,
                surgical_history: formData.surgical_history,
                allergies: formData.allergies,
                family_history: formData.family_history,
                symptom_description: formData.symptom_description,
                history_of_past_illness: formData.history_of_past_illness,
                clinical_notes: formData.clinical_notes,
                diagnosis_advice: formData.diagnosis,
                prescription_items: formData.prescriptions,
                follow_up: formData.follow_up,
                dos: convertBulletTextToArray(formData?.dos),
                donts: convertBulletTextToArray(formData?.donts)
            };

        const dietAppointmentId = isEditing
            ? (editingAppointmentId || appointment?.id)
            : appointment?.id;
        const dietplanData = {
            patient_id: appointment?.patient?.id,
            diet_plan_id: getDietPlanId(selecteddietplan),
            appointment_id: dietAppointmentId,
            plan_json: {},
        };

        try {
            const res = isEditing
                ? await doctorService.editPrescription(
                    appointment?.patient?.id,
                    editingPrescriptionId,
                    prescriptionData
                )
                : await doctorService.postprescription(
                    appointment?.patient?.id,
                    prescriptionData
                );

            if (res.data.success) {
                if (isEditing) {
                    const currentItems = formData.prescriptions || [];
                    const currentIds = new Set(
                        currentItems.map((med) => med.id).filter(isExistingPrescriptionItem)
                    );

                    const removedItems = originalPrescriptionItems.filter(
                        (med) => isExistingPrescriptionItem(med.id) && !currentIds.has(med.id)
                    );
                    // for (const med of removedItems) {
                    //     await doctorService.deletePrescriptionItem(med.id);
                    // }

                    const originalById = Object.fromEntries(
                        originalPrescriptionItems
                            .filter((med) => isExistingPrescriptionItem(med.id))
                            .map((med) => [med.id, med])
                    );

                    for (const med of currentItems) {
                        const payload = getMedicineItemPayload(med);
                        if (!payload.medicine) continue;

                        if (isExistingPrescriptionItem(med.id)) {
                            const original = originalById[med.id];
                            const hasChanged = !original ||
                                String(original.medicine) !== String(payload.medicine) ||
                                String(original.dosage || "") !== String(payload.dosage) ||
                                String(original.frequency || "") !== String(payload.frequency) ||
                                String(original.duration || "") !== String(payload.duration) ||
                                String(original.instruction || "") !== String(payload.instruction);
                            if (hasChanged) {
                                await doctorService.updatePrescriptionItem(med.id, payload);
                            }
                        }
                        // else {
                        //     await doctorService.addPrescriptionItem(editingPrescriptionId, payload);
                        // }
                    }
                }

                // Save or replace diet plan if selected
                const newDietPlanId = getDietPlanId(selecteddietplan);
                const currentDietPlanId = getDietPlanId(originalPrescribedDiet);

                if (newDietPlanId) {
                    const dietChanged = Boolean(currentDietPlanId) &&
                        String(currentDietPlanId) !== String(newDietPlanId);

                    if (dietChanged || !currentDietPlanId) {
                        const getdietplan = await doctorService.getdietbyid(newDietPlanId);
                        const rawDiet = getdietplan?.data?.data || getdietplan?.data || {};
                        const dietPayload = Array.isArray(rawDiet) ? (rawDiet[0] || {}) : rawDiet;
                        const schedule = dietPayload.schedule || dietPayload.plan_json;

                        if (schedule) {
                            if (dietChanged) {
                                await doctorService.replacedietplan({
                                    patient_id: appointment?.patient?.id,
                                    current_diet_plan_id: currentDietPlanId,
                                    new_diet_plan_id: newDietPlanId,
                                    appointment_id: dietAppointmentId,
                                    additional_notes: getDietAdditionalNotes(selecteddietplan).length
                                        ? getDietAdditionalNotes(selecteddietplan)
                                        : getDietAdditionalNotes(originalPrescribedDiet),
                                    plan_json: schedule,
                                });
                            } else {
                                await doctorService.postdietplan({
                                    ...dietplanData,
                                    diet_plan_id: newDietPlanId,
                                    plan_json: schedule,
                                });
                            }
                        }
                    }
                }

                toast.success(isEditing ? "Prescription updated successfully!" : "Prescription saved successfully!");

                setShowPreview(false);
                setEditingPrescriptionId(null);
                setEditingAppointmentId(null);
                setEditingPrescriptionStatus("sent");
                setOriginalPrescriptionItems([]);
                setFormData(getEmptyPrescriptionForm());
                setSelecteddietplan(null);
                setOriginalPrescribedDiet(null);
                setDietSearchQuery("");

                fetchAppointmentDetails();
                setActiveTab("history");
                setUpdating(false);
            } else {
                toast.error(
                    res?.data?.errors?.appointment_id?.[0] ||
                    (isEditing ? "Failed to update prescription" : "Failed to save prescription")
                );
            }
        } catch (err) {
            console.error(isEditing ? "Failed to update prescription:" : "Failed to save prescription:", err);

            setUpdating(false);

            toast.error(
                err?.response?.data?.message ||
                err?.message ||
                (isEditing ? "Failed to update prescription" : "Failed to save prescription")
            );
        } finally {
            setSavingPrescription(false);
        }
    };

    // Generate PDF Prescription
    // const generatePrescriptionPDF = async () => {
    //     if (!prescriptionRef.current) return;

    //     try {
    //         const canvas = await html2canvas(prescriptionRef.current, {
    //             scale: 2,
    //             logging: false,
    //             useCORS: true
    //         });
    //         const imgData = canvas.toDataURL('image/png');
    //         const pdf = new jsPDF('p', 'mm', 'a4');
    //         const imgWidth = 210;
    //         const pageHeight = 295;
    //         const imgHeight = (canvas.height * imgWidth) / canvas.width;
    //         let heightLeft = imgHeight;
    //         let position = 0;

    //         pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    //         heightLeft -= pageHeight;

    //         while (heightLeft >= 0) {
    //             position = heightLeft - imgHeight;
    //             pdf.addPage();
    //             pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    //             heightLeft -= pageHeight;
    //         }

    //         pdf.save(`prescription_${appointment?.patient_name}_${formatDate(new Date())}.pdf`);
    //     } catch (error) {
    //         console.error('Error generating PDF:', error);
    //         alert('Failed to generate PDF');
    //     }
    // };

    // Generate PDF Invoice
    // const generateInvoicePDF = async () => {
    //     if (!invoiceRef.current) return;

    //     try {
    //         const canvas = await html2canvas(invoiceRef.current, {
    //             scale: 2,
    //             logging: false,
    //             useCORS: true
    //         });
    //         const imgData = canvas.toDataURL('image/png');
    //         const pdf = new jsPDF('p', 'mm', 'a4');
    //         const imgWidth = 210;
    //         const pageHeight = 295;
    //         const imgHeight = (canvas.height * imgWidth) / canvas.width;
    //         let heightLeft = imgHeight;
    //         let position = 0;

    //         pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    //         heightLeft -= pageHeight;

    //         while (heightLeft >= 0) {
    //             position = heightLeft - imgHeight;
    //             pdf.addPage();
    //             pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    //             heightLeft -= pageHeight;
    //         }

    //         pdf.save(`invoice_${appointment?.patient_name}_${formatDate(new Date())}.pdf`);
    //     } catch (error) {
    //         console.error('Error generating PDF:', error);
    //         alert('Failed to generate invoice');
    //     }
    // };

    const handleSaveAll = async () => {
        setUpdating(true);
        const saveData = {
            appointment_id: appointment?.id,
            ...formData
        };
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Saved:', saveData);
            alert('Changes saved successfully!');
        } catch (err) {
            console.error('Save failed:', err);
            alert('Failed to save changes');
        } finally {
            setUpdating(false);
        }
    };

    const handleBulletList = (e, field) => {
        if (e.key !== "Enter") return;

        e.preventDefault();

        const textarea = e.target;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const value = formData[field];
        console.log('Current value:', value, 'Start:', start, 'End:', end);

        const newValue =
            value?.substring(0, start) +
            "\n• " +
            value?.substring(end);
        handleInputChange(field, newValue);
        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 3;
        }, 0);
    };
    const handleFocus = (field) => {
        if (!formData[field]) {
            handleInputChange(field, "• ");
        }
    };
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full border-4 border-t-transparent animate-spin"
                        style={{ borderColor: '#0D614E', borderTopColor: 'transparent' }} />
                    <p className="text-sm text-gray-500 font-medium">Loading appointment details...</p>
                </div>
            </div>
        );
    }

    if (!appointment) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center max-w-md p-8 bg-white rounded-2xl shadow-lg border border-gray-100">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Appointment Not Found</h2>
                    <p className="text-sm text-gray-500 mb-6">The appointment you're looking for doesn't exist or has been removed.</p>
                    <button onClick={() => navigate('/doctor/appointments')}
                        className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-lg"
                        style={{ background: '#0D614E' }}>
                        <ArrowLeft className="w-4 h-4 inline mr-2" /> Back to Appointments
                    </button>
                </div>
            </div>
        );
    }


    const patient = { ...appointment?.patient, end_time: appointment?.end_time };
    const doctor = appointment?.doctor;
    const initials = getInitials(patient?.first_name, patient?.last_name);
    const ConsultationIcon = CONSULTATION_TYPES[appointment?.consultation_type]?.icon || Video;
    const consultationLabel = CONSULTATION_TYPES[appointment?.consultation_type]?.label || appointment?.consultation_type;

    const tabs = [
        { id: 'prescription', label: 'Prescription', icon: Pill },
        { id: 'questions', label: 'Questions', icon: Notebook },
        { id: 'diet-progress', label: 'Diet Progress', icon: Leaf },
        { id: 'history', label: 'History', icon: History },
        { id: 'documents', label: 'Documents', icon: FileHeart },
        // { id: 'billing', label: 'Billing', icon: IndianRupee },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/doctor/appointments')}
                                className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-all">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Appointment Details</h1>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {appointment?.id?.slice(0, 12)}...</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">

                            {/* <button onClick={generateInvoicePDF}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-600 text-[#0D614E] text-sm font-semibold hover:bg-emerald-50 transition-all">
                                <Download className="w-4 h-4" />
                                Download Invoice
                            </button> */}
                            {
                                appointment?.status &&
                                <StatusBadge status={appointment?.status} />
                            }
                            {/* {
                                type != "patient" && (appointment?.status == "confirmed" || appointment?.status == "completed") &&
                                <button onClick={() => setShowPreview(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-600 text-[#0D614E] text-sm font-semibold hover:bg-emerald-50 transition-all">
                                    <Eye className="w-4 h-4" />
                                    Preview Prescription
                                </button>
                            } */}
                            {/* {(appointment?.status == "confirmed" || appointment?.status == "completed") &&
                                <button onClick={handleSavePrescription} disabled={updating}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-lg disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg, #0D614E 0%, #0a4a3d 100%)' }}>
                                    <Save className="w-4 h-4" />
                                    {updating ? 'Saving...' : 'Save Changes'}
                                </button>
                            } */}
                        </div>
                    </div>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Sidebar */}
                    <div className="lg:col-span-3 space-y-5">

                        {/* Patient Profile Card */}
                        <SectionCard>
                            <div className="h-24 rounded-t-2xl bg-gradient-to-r from-[#0D614E] to-teal-600" />
                            <div className="-mt-12 flex flex-col items-center px-6 pb-6">
                                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-xl flex items-center justify-center text-2xl font-bold text-white bg-gradient-to-br from-emerald-600 to-teal-600 overflow-hidden">
                                    {patient?.profile_picture ? <img src={patient?.profile_picture} alt="Profile" className="w-full h-full object-cover" /> : initials}
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg mt-3">{appointment?.patient?.first_name + " " + appointment?.patient?.last_name}</h3>
                                <p className="text-xs text-gray-400 mt-0.5 mb-2">Patient ID: {patient?.id?.slice(0, 8)}...</p>
                                {(type == "patient" ? appointment?.prakriti?.result?.result : appointment?.prakriti) && (
                                    <span className="mb-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-[#0D614E]">
                                        <Sparkles className="w-3 h-3" />
                                        Prakriti: {(type == "patient" ? appointment?.prakriti?.result?.result : appointment?.prakriti)}
                                    </span>
                                )}
                                {/* {
                                    appointment?.status &&
                                    <StatusBadge status={appointment?.status} />
                                } */}
                                {
                                    appointment?.status == "confirmed" &&
                                    <div className="grid grid-cols-2 gap-2 w-full mt-2">
                                        <Link to={`/doctor/messenger/${patient?.id}`} className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 bg-emerald-50 text-[#0D614E]">
                                            <MessageCircle className="w-3.5 h-3.5" /> Message
                                        </Link>
                                        <button onClick={e => {
                                            // setshowCall(!showCall)
                                            videodetails({ ...videodetails, showCall: !videodetails.showCall, patient: patient, appointment: appointment })
                                        }} className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-80 bg-emerald-50 text-[#0D614E]">
                                            <Video className="w-3.5 h-3.5" />Join Call
                                        </button>
                                    </div>
                                }
                            </div>
                        </SectionCard>

                        {/* Appointment Info */}
                        {
                            appointment?.appointment_date &&
                            <SectionCard>
                                <SectionHeader icon={Calendar} title="Appointment Details" />
                                <div className="p-5">
                                    <InfoRow label="Date" value={formatDate(appointment?.appointment_date)} />
                                    <InfoRow label="Time" value={`${formatTime(appointment?.start_time)} – ${formatTime(appointment?.end_time)}`} />
                                    <InfoRow label="Type" value={
                                        <span className="flex items-center gap-1">
                                            <ConsultationIcon className="w-3 h-3" />
                                            {consultationLabel}
                                        </span>
                                    } />
                                    <InfoRow label="Amount" value={`₹${appointment?.amount}`} highlight />
                                </div>
                            </SectionCard>
                        }

                        {/* Patient Info */}
                        <SectionCard>
                            <SectionHeader icon={User} title="Patient Information" />
                            <div className="p-5">
                                <InfoRow label="Age" value={`${calculateAge(patient?.dob)} years`} />
                                <InfoRow label="Gender" value={patient?.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'N/A'} />
                                <InfoRow label="Blood Group" value={patient?.blood_group || 'Not recorded'} />
                                {/* <InfoRow label="Phone" value={patient?.phone_number || 'N/A'} />
                                <InfoRow label="Email" value={patient?.email || 'Not provided'} /> */}
                            </div>
                        </SectionCard>

                        {/* Emergency Contact */}
                        {(patient?.emergency_contact_name || patient?.emergency_contact_phone) && (
                            <SectionCard>
                                <SectionHeader icon={Shield} title="Emergency Contact" />
                                <div className="p-5">
                                    {patient.emergency_contact_name && <InfoRow label="Name" value={patient.emergency_contact_name} />}
                                    {patient.emergency_contact_relation && <InfoRow label="Relation" value={patient.emergency_contact_relation} />}
                                    {patient.emergency_contact_phone && <InfoRow label="Phone" value={patient.emergency_contact_phone} />}
                                </div>
                            </SectionCard>
                        )}
                    </div>

                    {/* Right Panel */}
                    <div className="lg:col-span-9">
                        <SectionCard className="overflow-hidden">
                            {/* Tabs */}
                            <div className="flex overflow-x-auto border-b border-gray-100 scrollbar-thin bg-gray-50/50">
                                {tabs.map((tab, index) => {
                                    if (type == "patient" && index == 0) return
                                    return <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold whitespace-nowrap transition-all relative
                                            ${activeTab === tab.id ? 'text-[#0D614E]' : 'text-gray-500 hover:text-gray-700'}`}>
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                        {activeTab === tab.id && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
                                        )}
                                    </button>
                                })}
                            </div>

                            {/* Content Area */}
                            <div className="p-6 space-y-6 max-h-[calc(100%-280px)] overflow-y-auto">

                                {/* Prescription Tab */}
                                {activeTab === 'prescription' && (
                                    appointment?.status == "confirmed" || editingPrescriptionId
                                        // || appointment?.status == "completed"
                                        ?
                                        <div className="space-y-6">
                                            {editingPrescriptionId && (
                                                <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50">
                                                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                                                        <PencilIcon className="w-4 h-4" />
                                                        Editing existing prescription
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={handleCancelEditPrescription}
                                                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                            {/* Chief Complaint */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    <AlertCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                    Chief Complaint<span className="text-rose-500">*</span>
                                                </label>
                                                <textarea
                                                    rows={8}
                                                    value={formData.symptom_description}
                                                    onChange={e => handleInputChange('symptom_description', e.target.value)}
                                                    placeholder="Patient's main concern..."
                                                    className="w-full px-4 py-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all"
                                                />
                                            </div>

                                            {/* History of Past Illness */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    <History className="w-3.5 h-3.5 text-emerald-600" />
                                                    History of Past Illness
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={formData.history_of_past_illness}
                                                    onChange={e => handleInputChange('history_of_past_illness', e.target.value)}
                                                    placeholder="Previous medical conditions, past treatments..."
                                                    className="w-full px-4 py-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all"
                                                />
                                            </div>

                                            {/* Surgical History */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                                                    Surgical History
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={formData.surgical_history}
                                                    onChange={e => handleInputChange('surgical_history', e.target.value)}
                                                    placeholder="Previous surgeries..."
                                                    className="w-full px-4 py-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all"
                                                />
                                            </div>

                                            {/* Allergies */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    <AlertCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                    Allergies (if any)
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={formData.allergies}
                                                    onChange={e => handleInputChange('allergies', e.target.value)}
                                                    placeholder="Known allergies to medicines, food, or substances..."
                                                    className="w-full px-4 py-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all"
                                                />
                                            </div>

                                            {/* Family History */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    <Brain className="w-3.5 h-3.5 text-emerald-600" />
                                                    Family History (if any)
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={formData.family_history}
                                                    onChange={e => handleInputChange('family_history', e.target.value)}
                                                    placeholder="Family medical history..."
                                                    className="w-full px-4 py-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all"
                                                />
                                            </div>

                                            {/* Prescriptions */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-lg bg-[#0D614E]/10 flex items-center justify-center">
                                                            <Pill className="w-4 h-4 text-[#0D614E]" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-800">Prescribed Medicines</p>
                                                            <p className="text-[11px] text-gray-400">
                                                                {formData.prescriptions.length === 0
                                                                    ? 'No medicines added yet'
                                                                    : `${formData.prescriptions.length} medicine${formData.prescriptions.length > 1 ? 's' : ''} in Rx`}
                                                            </p>
                                                        </div>
                                                        {formData.prescriptions.length > 0 && (
                                                            <span className="ml-1 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold text-white bg-[#0D614E]">
                                                                {formData.prescriptions.length}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (showAddMed) {
                                                                setShowAddMed(false);
                                                                setShowDropdown(false);
                                                                setSearch('');
                                                                setNewMed({ medicine_name: '', dosage: '', frequency: '', duration: '', instruction: '', medicine: '', medicinedata: {} });
                                                            } else {
                                                                setShowAddMed(true);
                                                            }
                                                        }}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${showAddMed
                                                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                            : 'text-white hover:shadow-md'
                                                            }`}
                                                        style={!showAddMed ? { background: '#0D614E' } : undefined}
                                                    >
                                                        {showAddMed ? (
                                                            <>
                                                                <X className="w-4 h-4" /> Close
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Plus className="w-4 h-4" /> Add Medicine
                                                            </>
                                                        )}
                                                    </button>
                                                </div>

                                                {showAddMed && (
                                                    <div className="rounded-2xl border border-emerald-200 bg-white overflow-hidden shadow-sm">
                                                        <div className="px-4 py-3 bg-[#0D614E]/5 border-b border-emerald-100 flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-[#0D614E] text-white text-[11px] font-bold flex items-center justify-center">1</div>
                                                            <p className="text-sm font-semibold text-gray-800">Search & select medicine</p>
                                                        </div>

                                                        <div className="p-4 space-y-4">
                                                            {newMed?.medicine && newMed?.medicinedata ? (
                                                                <div className="relative flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                                                                    <img
                                                                        src={newMed.medicinedata.cover_image}
                                                                        alt=""
                                                                        className="w-14 h-14 rounded-lg object-cover border border-white shadow-sm flex-shrink-0"
                                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-start justify-between gap-2">
                                                                            <div>
                                                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 mb-0.5">Selected</p>
                                                                                <h4 className="text-sm font-semibold text-gray-900 leading-snug">
                                                                                    {newMed.medicinedata.product_name}
                                                                                </h4>
                                                                                <p className="text-xs text-gray-500 mt-0.5">
                                                                                    {newMed.medicinedata.brand_name}
                                                                                    {newMed.medicinedata.variant_code ? ` · ${newMed.medicinedata.variant_code}` : ''}
                                                                                </p>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setNewMed({ medicine_name: '', dosage: newMed.dosage, frequency: newMed.frequency, duration: newMed.duration, instruction: newMed.instruction, medicine: '', medicinedata: {} });
                                                                                    setSearch('');
                                                                                    setShowDropdown(false);
                                                                                }}
                                                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-white transition-colors"
                                                                                title="Change medicine"
                                                                            >
                                                                                <X className="w-4 h-4" />
                                                                            </button>
                                                                        </div>
                                                                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                                            {newMed.medicinedata.title && (
                                                                                <span className="px-2 py-0.5 text-[10px] font-medium bg-white text-emerald-700 rounded-md border border-emerald-100">
                                                                                    {newMed.medicinedata.title}
                                                                                </span>
                                                                            )}
                                                                            {(newMed.medicinedata.size || newMed.medicinedata.weightage) && (
                                                                                <span className="px-2 py-0.5 text-[10px] font-medium bg-white text-sky-700 rounded-md border border-sky-100">
                                                                                    {newMed.medicinedata.size} {newMed.medicinedata.weightage}
                                                                                </span>
                                                                            )}
                                                                            {newMed.medicinedata.physical_state && (
                                                                                <span className="px-2 py-0.5 text-[10px] font-medium bg-white text-amber-700 rounded-md border border-amber-100">
                                                                                    {newMed.medicinedata.physical_state}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="relative">
                                                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                                    <input
                                                                        type="search"
                                                                        placeholder="Type medicine name, brand, or variant code..."
                                                                        value={search}
                                                                        onChange={(e) => {
                                                                            setSearch(e.target.value);
                                                                            setShowDropdown(true);
                                                                        }}
                                                                        className="w-full pl-10 pr-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                                                                        autoFocus
                                                                    />
                                                                    {showDropdown && search.trim().length >= 2 && (
                                                                        <>
                                                                            {loader ? (
                                                                                <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                                                                                    {[...Array(4)].map((_, index) => (
                                                                                        <div key={index} className="px-4 py-3 border-b border-gray-50 last:border-0">
                                                                                            <div className="animate-pulse flex items-center gap-3">
                                                                                                <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
                                                                                                <div className="flex-1 space-y-2">
                                                                                                    <div className="h-3.5 bg-gray-200 rounded w-2/5" />
                                                                                                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                                                                                                    <div className="flex gap-2">
                                                                                                        <div className="h-4 w-16 bg-gray-100 rounded" />
                                                                                                        <div className="h-4 w-14 bg-gray-100 rounded" />
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            ) : medicines?.length > 0 ? (
                                                                                <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-y-auto">
                                                                                    <p className="sticky top-0 z-10 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-gray-400 bg-gray-50 border-b border-gray-100">
                                                                                        {medicines.length} result{medicines.length > 1 ? 's' : ''} — tap to select
                                                                                    </p>
                                                                                    {medicines.map((item) => (
                                                                                        <button
                                                                                            type="button"
                                                                                            key={item.id}
                                                                                            onClick={() => item?.status !== 'out_of_stock' && selectMedicine(item)}
                                                                                            className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-gray-50 last:border-0 transition-colors"
                                                                                        >
                                                                                            <div className="flex items-center gap-3">
                                                                                                {item?.cover_image ? (
                                                                                                    <img
                                                                                                        src={item.cover_image}
                                                                                                        alt=""
                                                                                                        className="w-12 h-12 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                                                                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                                                                    />
                                                                                                ) : (
                                                                                                    <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                                                                        <Pill className="w-5 h-5 text-emerald-600" />
                                                                                                    </div>
                                                                                                )}
                                                                                                <div className="flex-1 min-w-0">
                                                                                                    <h4 className="text-sm font-semibold text-gray-900 truncate">{item.product_name}</h4>
                                                                                                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                                                                        {item.brand_name}
                                                                                                        {item.variant_code ? ` · ${item.variant_code}` : ''}
                                                                                                    </p>
                                                                                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                                                                                        {item.title && (
                                                                                                            <span className="px-1.5 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 rounded">{item.title}</span>
                                                                                                        )}
                                                                                                        {(item.size || item.weightage) && (
                                                                                                            <span className="px-1.5 py-0.5 text-[10px] bg-sky-50 text-sky-700 rounded">{item.size} {item.weightage}</span>
                                                                                                        )}
                                                                                                        {item.physical_state && (
                                                                                                            <span className="px-1.5 py-0.5 text-[10px] bg-amber-50 text-amber-700 rounded">{item.physical_state}</span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                                <span
                                                                                                    className={`px-2 py-1 text-[10px] font-semibold rounded-full whitespace-nowrap ${item?.status === 'in_stock'
                                                                                                        ? 'bg-emerald-50 text-emerald-700'
                                                                                                        : 'bg-red-50 text-red-600'
                                                                                                        }`}
                                                                                                >
                                                                                                    {item?.status === 'in_stock' ? 'In Stock' : 'Out of Stock'}
                                                                                                </span>
                                                                                                <Plus className="w-4 h-4 text-emerald-600 flex-shrink-0 opacity-0 group-hover:opacity-100" />                                                                                           <Plus className="w-4 h-4 text-emerald-600 flex-shrink-0 opacity-0 group-hover:opacity-100" />
                                                                                            </div>
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl">
                                                                                    <div className="flex flex-col items-center justify-center py-8 px-4">
                                                                                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                                                                                            <Search className="w-5 h-5 text-gray-300" />
                                                                                        </div>
                                                                                        <h4 className="text-sm font-semibold text-gray-800">No medicine found</h4>
                                                                                        <p className="text-xs text-gray-500 mt-1 text-center max-w-[220px]">
                                                                                            Try another name, brand, or variant code
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            )}

                                                            <div className={`space-y-4 ${!newMed?.medicine ? 'opacity-50 pointer-events-none' : ''}`}>
                                                                <div className="flex items-center gap-2 pt-1">
                                                                    <div className="w-6 h-6 rounded-full bg-[#0D614E] text-white text-[11px] font-bold flex items-center justify-center">2</div>
                                                                    <p className="text-sm font-semibold text-gray-800">Set dosage & schedule</p>
                                                                    {!newMed?.medicine && (
                                                                        <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">Select a medicine first</span>
                                                                    )}
                                                                </div>

                                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                                    <div className="space-y-1.5">
                                                                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                                                            <Package className="w-3 h-3 text-sky-500" /> Dosage *
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="e.g. 1 tablet, 5ml"
                                                                            value={newMed.dosage}
                                                                            onChange={e => setNewMed({ ...newMed, dosage: e.target.value })}
                                                                            className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                                                                        />
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {['1 tablet', '2 tablets', '5 ml', '10 ml', '1 tsp'].map(opt => (
                                                                                <button
                                                                                    key={opt}
                                                                                    type="button"
                                                                                    onClick={() => setNewMed({ ...newMed, dosage: opt })}
                                                                                    className={`px-2 py-0.5 text-[10px] rounded-md border transition-colors ${newMed.dosage === opt
                                                                                        ? 'bg-sky-100 border-sky-300 text-sky-800'
                                                                                        : 'bg-white border-gray-200 text-gray-500 hover:border-sky-200 hover:text-sky-700'
                                                                                        }`}
                                                                                >
                                                                                    {opt}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-1.5">
                                                                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                                                            <Clock3 className="w-3 h-3 text-amber-500" /> Frequency *
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="e.g. Twice daily"
                                                                            value={newMed.frequency}
                                                                            onChange={e => setNewMed({ ...newMed, frequency: e.target.value })}
                                                                            className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                                                                        />
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {['Once daily', 'Twice daily', 'Thrice daily', 'At bedtime'].map(opt => (
                                                                                <button
                                                                                    key={opt}
                                                                                    type="button"
                                                                                    onClick={() => setNewMed({ ...newMed, frequency: opt })}
                                                                                    className={`px-2 py-0.5 text-[10px] rounded-md border transition-colors ${newMed.frequency === opt
                                                                                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                                                                                        : 'bg-white border-gray-200 text-gray-500 hover:border-amber-200 hover:text-amber-700'
                                                                                        }`}
                                                                                >
                                                                                    {opt}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-1.5">
                                                                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                                                            <CalendarDays className="w-3 h-3 text-violet-500" /> Duration *
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            placeholder="e.g. 7 days"
                                                                            value={newMed.duration}
                                                                            onChange={e => setNewMed({ ...newMed, duration: e.target.value })}
                                                                            className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                                                                        />
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {['3 days', '5 days', '7 days', '15 days', '30 days'].map(opt => (
                                                                                <button
                                                                                    key={opt}
                                                                                    type="button"
                                                                                    onClick={() => setNewMed({ ...newMed, duration: opt })}
                                                                                    className={`px-2 py-0.5 text-[10px] rounded-md border transition-colors ${newMed.duration === opt
                                                                                        ? 'bg-violet-100 border-violet-300 text-violet-800'
                                                                                        : 'bg-white border-gray-200 text-gray-500 hover:border-violet-200 hover:text-violet-700'
                                                                                        }`}
                                                                                >
                                                                                    {opt}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="space-y-1.5">
                                                                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                                                                        <FileText className="w-3 h-3 text-gray-400" /> Instructions
                                                                    </label>
                                                                    <textarea
                                                                        placeholder="e.g. After food with warm water..."
                                                                        rows={2}
                                                                        value={newMed.instruction}
                                                                        onChange={e => setNewMed({ ...newMed, instruction: e.target.value })}
                                                                        className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
                                                                    />
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {['Before food', 'After food', 'With warm water', 'Empty stomach'].map(opt => (
                                                                            <button
                                                                                key={opt}
                                                                                type="button"
                                                                                onClick={() => setNewMed({
                                                                                    ...newMed,
                                                                                    instruction: newMed.instruction
                                                                                        ? (newMed.instruction.includes(opt) ? newMed.instruction : `${newMed.instruction}, ${opt}`)
                                                                                        : opt
                                                                                })}
                                                                                className={`px-2 py-0.5 text-[10px] rounded-md border transition-colors ${newMed.instruction?.includes(opt)
                                                                                    ? 'bg-gray-200 border-gray-300 text-gray-800'
                                                                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                                                                    }`}
                                                                            >
                                                                                {opt}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>

                                                                <div className="flex gap-2.5 pt-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleAddMed}
                                                                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-md disabled:opacity-50"
                                                                        style={{ background: '#0D614E' }}
                                                                    >
                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                        Add to Prescription
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setShowAddMed(false);
                                                                            setShowDropdown(false);
                                                                            setSearch('');
                                                                            setNewMed({ medicine_name: '', dosage: '', frequency: '', duration: '', instruction: '', medicine: '', medicinedata: {} });
                                                                        }}
                                                                        className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-all"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {formData.prescriptions.length > 0 ? (
                                                    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
                                                        <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                                            <div className="col-span-4">Medicine</div>
                                                            <div className="col-span-2">Dosage</div>
                                                            <div className="col-span-2">Frequency</div>
                                                            <div className="col-span-2">Duration</div>
                                                            <div className="col-span-2 text-right">Actions</div>
                                                        </div>
                                                        <div className="divide-y divide-gray-100">
                                                            {formData.prescriptions.map((med, index) => (
                                                                <div key={med.id} className="group">
                                                                    {editingPrescription?.id === med.id ? (
                                                                        <div className="p-4 bg-emerald-50/40 space-y-3">
                                                                            <div className="flex items-center justify-between">
                                                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                                    Editing medicine #{index + 1}
                                                                                </span>
                                                                            </div>
                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                                                                                <div className="space-y-1">
                                                                                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Medicine</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={editingPrescription.medicine_name || ''}
                                                                                        onChange={e => setEditingPrescription({ ...editingPrescription, medicine_name: e.target.value })}
                                                                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 outline-none bg-white"
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Dosage</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={editingPrescription.dosage || ''}
                                                                                        onChange={e => setEditingPrescription({ ...editingPrescription, dosage: e.target.value })}
                                                                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 outline-none bg-white"
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Frequency</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={editingPrescription.frequency || ''}
                                                                                        onChange={e => setEditingPrescription({ ...editingPrescription, frequency: e.target.value })}
                                                                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 outline-none bg-white"
                                                                                    />
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Duration</label>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={editingPrescription.duration || ''}
                                                                                        onChange={e => setEditingPrescription({ ...editingPrescription, duration: e.target.value })}
                                                                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 outline-none bg-white"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <label className="text-[10px] font-semibold text-gray-500 uppercase">Instructions</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={editingPrescription.instruction || ''}
                                                                                    onChange={e => setEditingPrescription({ ...editingPrescription, instruction: e.target.value })}
                                                                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 outline-none bg-white"
                                                                                    placeholder="Optional instructions"
                                                                                />
                                                                            </div>
                                                                            <div className="flex gap-2">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleUpdatePrescription(med.id, editingPrescription)}
                                                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D614E] hover:bg-[#0a4f3f] text-white rounded-lg text-xs font-semibold transition-all"
                                                                                >
                                                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Save changes
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => setEditingPrescription(null)}
                                                                                    className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold transition-all"
                                                                                >
                                                                                    Cancel
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="p-3.5 sm:px-4 hover:bg-gray-50/80 transition-colors">
                                                                            <div className="flex sm:grid sm:grid-cols-12 gap-3 items-start sm:items-center">
                                                                                <div className="flex items-center gap-3 flex-1 sm:col-span-4 min-w-0">
                                                                                    <span className="w-6 h-6 rounded-md bg-[#0D614E]/10 text-[#0D614E] text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                                                                                        {index + 1}
                                                                                    </span>
                                                                                    {med?.medicinedata?.cover_image ? (
                                                                                        <img
                                                                                            src={med.medicinedata.cover_image}
                                                                                            alt=""
                                                                                            className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                                                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                                                        />
                                                                                    ) : (
                                                                                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                                                            <Pill className="w-4 h-4 text-emerald-600" />
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="min-w-0">
                                                                                        <h5 className="text-sm font-semibold text-gray-800 truncate">{med.medicine_name}</h5>
                                                                                        {(med.brand_name || med?.medicinedata?.brand_name) && (
                                                                                            <p className="text-[11px] text-gray-400 truncate">
                                                                                                {med.brand_name || med?.medicinedata?.brand_name}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                <div className="hidden sm:block sm:col-span-2">
                                                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 bg-sky-50 px-2 py-1 rounded-md">
                                                                                        <Package className="w-3 h-3" />
                                                                                        {med.dosage || '—'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="hidden sm:block sm:col-span-2">
                                                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-md">
                                                                                        <Clock3 className="w-3 h-3" />
                                                                                        {med.frequency || '—'}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="hidden sm:block sm:col-span-2">
                                                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 bg-violet-50 px-2 py-1 rounded-md">
                                                                                        <CalendarDays className="w-3 h-3" />
                                                                                        {med.duration || '—'}
                                                                                    </span>
                                                                                </div>

                                                                                <div className="flex items-center gap-1 sm:col-span-2 sm:justify-end flex-shrink-0">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => setEditingPrescription({ ...med })}
                                                                                        className="p-2 rounded-lg text-gray-400 hover:text-[#0D614E] hover:bg-emerald-50 transition-all"
                                                                                        title="Edit"
                                                                                    >
                                                                                        <Edit2 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleRemovePrescription(med.id)}
                                                                                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                                                                                        title="Remove"
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>

                                                                            {/* Mobile dosage row */}
                                                                            <div className="flex sm:hidden flex-wrap gap-1.5 mt-2.5 ml-9">
                                                                                {med.dosage && (
                                                                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                                                                                        <Package className="w-3 h-3" />{med.dosage}
                                                                                    </span>
                                                                                )}
                                                                                {med.frequency && (
                                                                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                                                                                        <Clock3 className="w-3 h-3" />{med.frequency}
                                                                                    </span>
                                                                                )}
                                                                                {med.duration && (
                                                                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md">
                                                                                        <CalendarDays className="w-3 h-3" />{med.duration}
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {med.instruction && (
                                                                                <div className="mt-2 ml-9 sm:ml-[3.25rem] flex items-start gap-1.5 text-[11px] text-gray-500">
                                                                                    <FileText className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" />
                                                                                    <span>{med.instruction}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : !showAddMed ? (
                                                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                        <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                                                            <Pill className="w-7 h-7 text-gray-300" />
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-500">No medicines prescribed yet</p>
                                                        <p className="text-xs text-gray-400 mt-1 mb-4">Search and add medicines to build the Rx</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowAddMed(true)}
                                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:shadow-md transition-all"
                                                            style={{ background: '#0D614E' }}
                                                        >
                                                            <Plus className="w-4 h-4" /> Add first medicine
                                                        </button>
                                                    </div>
                                                ) : null}
                                            </div>

                                            {/* Clinical Notes */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    <NotebookPen className="w-3.5 h-3.5 text-emerald-600" />
                                                    Clinical Notes
                                                </label>
                                                <textarea
                                                    rows={4}
                                                    value={formData.clinical_notes}
                                                    onChange={e => handleInputChange('clinical_notes', e.target.value)}
                                                    placeholder="Examination findings, clinical observations..."
                                                    className="w-full px-4 py-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all"
                                                />
                                            </div>

                                            {/* Diagnosis */}
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                                                    Diagnosis / Advice
                                                </label>
                                                <textarea
                                                    rows={3}
                                                    value={formData.diagnosis}
                                                    onChange={e => handleInputChange('diagnosis', e.target.value)}
                                                    placeholder="Primary diagnosis and treatment plan..."
                                                    className="w-full px-4 py-3 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-all"
                                                />
                                            </div>


                                            {/* Diet Plan Picker */}
                                            <div className="space-y-3" ref={dietDropdownRef}>
                                                <div className="flex items-center justify-between gap-2">
                                                    <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                        <BiFoodMenu className="w-3.5 h-3.5 text-emerald-600" />
                                                        Diet Plan
                                                    </label>
                                                    {selecteddietplan && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Plan selected
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        value={dietSearchQuery}
                                                        placeholder="Search by name, prakriti, or condition..."
                                                        onFocus={() => {
                                                            if (dietSearchQuery.trim().length >= 2 || (filterdietplans && filterdietplans.length > 0)) {
                                                                setShowDropdowndiet(true);
                                                            }
                                                        }}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setDietSearchQuery(value);
                                                            setShowDropdowndiet(true);
                                                            searchdietplans(value);
                                                        }}
                                                        className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                                    />
                                                    {dietloading ? (
                                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 animate-spin" />
                                                    ) : dietSearchQuery ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setDietSearchQuery("");
                                                                setFilterdietplans([]);
                                                                setShowDropdowndiet(false);
                                                            }}
                                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                                            aria-label="Clear search"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    ) : null}

                                                    {showDropdowndiet && (
                                                        <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                                                            <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
                                                                <p className="text-[11px] font-medium text-gray-500">
                                                                    {dietloading
                                                                        ? "Searching diet plans…"
                                                                        : dietSearchQuery.trim().length < 2
                                                                            ? "Type at least 2 characters"
                                                                            : `${(filterdietplans || []).filter((d) => d?.is_active !== false).length} plan(s) found`}
                                                                </p>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowDropdowndiet(false)}
                                                                    className="text-[11px] text-gray-400 hover:text-gray-600"
                                                                >
                                                                    Close
                                                                </button>
                                                            </div>

                                                            <div className="max-h-80 overflow-y-auto">
                                                                {dietloading ? (
                                                                    <div className="flex flex-col items-center justify-center py-10 px-4">
                                                                        <Loader2 className="w-6 h-6 text-emerald-600 animate-spin mb-2" />
                                                                        <p className="text-sm text-gray-500">Loading diet plans…</p>
                                                                    </div>
                                                                ) : dietSearchQuery.trim().length < 2 ? (
                                                                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                                                        <Search className="w-8 h-8 text-gray-300 mb-2" />
                                                                        <p className="text-sm font-medium text-gray-700">Start typing to search</p>
                                                                        <p className="text-xs text-gray-400 mt-1">Search by plan name, prakriti, or health condition</p>
                                                                    </div>
                                                                ) : (filterdietplans || []).filter((d) => d?.is_active !== false).length === 0 ? (
                                                                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                                                        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-2">
                                                                            <AlertCircle className="w-6 h-6 text-amber-500" />
                                                                        </div>
                                                                        <p className="text-sm font-medium text-gray-800">No diet plans found</p>
                                                                        <p className="text-xs text-gray-500 mt-1">Try another name or create a plan in Diet Plans</p>
                                                                    </div>
                                                                ) : (
                                                                    (filterdietplans || [])
                                                                        .filter((item) => item?.is_active !== false)
                                                                        .map((item) => {
                                                                            const cover =
                                                                                item.diet_plan_gallery?.find((g) => g.is_cover)?.image_url ||
                                                                                item.diet_plan_gallery?.[0]?.image_url ||
                                                                                null;
                                                                            const isSelected = String(getDietPlanId(selecteddietplan) || "") === String(item.id);
                                                                            const diseases = item.health_diseases || [];

                                                                            return (
                                                                                <button
                                                                                    type="button"
                                                                                    key={item.id}
                                                                                    onClick={() => {
                                                                                        setSelecteddietplan(item);
                                                                                        setShowDropdowndiet(false);
                                                                                        setDietSearchQuery(item.name || "");
                                                                                    }}
                                                                                    className={`w-full text-left px-3 py-3 border-b border-gray-50 last:border-0 transition-colors ${isSelected
                                                                                        ? "bg-emerald-50/80"
                                                                                        : "hover:bg-gray-50"
                                                                                        }`}
                                                                                >
                                                                                    <div className="flex gap-3">
                                                                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                                                                            {cover ? (
                                                                                                <img
                                                                                                    src={cover}
                                                                                                    alt=""
                                                                                                    className="w-full h-full object-cover"
                                                                                                    onError={(e) => {
                                                                                                        e.currentTarget.style.display = "none";
                                                                                                    }}
                                                                                                />
                                                                                            ) : (
                                                                                                <Leaf className="w-5 h-5 text-emerald-500" />
                                                                                            )}
                                                                                        </div>

                                                                                        <div className="min-w-0 flex-1">
                                                                                            <div className="flex items-start justify-between gap-2">
                                                                                                <div className="min-w-0">
                                                                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                                                                        {item.name || "Unnamed Diet Plan"}
                                                                                                    </p>
                                                                                                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-500">
                                                                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                                                                                                            <Leaf className="w-3 h-3" />
                                                                                                            {item.prakriti || "—"}
                                                                                                        </span>
                                                                                                        {item.season && (
                                                                                                            <span className="px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100 capitalize">
                                                                                                                {String(item.season).replace(/_/g, " ")}
                                                                                                            </span>
                                                                                                        )}
                                                                                                        <span className="px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-600 border border-gray-100">
                                                                                                            {item.total_days ?? "—"} days
                                                                                                        </span>
                                                                                                        <span className="px-1.5 py-0.5 rounded-md bg-gray-50 text-gray-600 border border-gray-100">
                                                                                                            {item.meals_per_day ?? "—"} meals/day
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                                                                    <span
                                                                                                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${item.is_paid
                                                                                                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                                                                                                            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                                                                            }`}
                                                                                                    >
                                                                                                        {item.is_paid ? `₹${item.price || 0}` : "Free"}
                                                                                                    </span>
                                                                                                    {isSelected && (
                                                                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                                                                {item.is_common && (
                                                                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                                                                                                        Common
                                                                                                    </span>
                                                                                                )}
                                                                                                {diseases.slice(0, 3).map((disease) => (
                                                                                                    <span
                                                                                                        key={disease.id || disease.name}
                                                                                                        className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100"
                                                                                                    >
                                                                                                        {disease.name}
                                                                                                    </span>
                                                                                                ))}
                                                                                                {diseases.length > 3 && (
                                                                                                    <span className="text-[10px] text-gray-400">
                                                                                                        +{diseases.length - 3} more
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </button>
                                                                            );
                                                                        })
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Selected diet confirmation card */}
                                                {selecteddietplan ? (
                                                    <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white overflow-hidden">
                                                        <div className="px-3.5 py-2.5 border-b border-emerald-100 flex items-center justify-between gap-2 bg-emerald-50/50">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                                                                        Assigned diet plan
                                                                    </p>
                                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                                        {selecteddietplan.name || "Unnamed plan"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelecteddietplan(null);
                                                                    setDietSearchQuery("");
                                                                }}
                                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-colors"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                Remove
                                                            </button>
                                                        </div>

                                                        <div className="p-3.5 space-y-3">
                                                            <div className="flex gap-3">
                                                                {(() => {
                                                                    const cover =
                                                                        selecteddietplan.diet_plan_gallery?.find((g) => g.is_cover)?.image_url ||
                                                                        selecteddietplan.diet_plan_gallery?.[0]?.image_url ||
                                                                        null;
                                                                    return (
                                                                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center shrink-0">
                                                                            {cover ? (
                                                                                <img
                                                                                    src={cover}
                                                                                    alt=""
                                                                                    className="w-full h-full object-cover"
                                                                                    onError={(e) => {
                                                                                        e.currentTarget.style.display = "none";
                                                                                    }}
                                                                                />
                                                                            ) : (
                                                                                <Leaf className="w-6 h-6 text-emerald-500" />
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}

                                                                <div className="min-w-0 flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                                    <div className="rounded-lg bg-white border border-gray-100 px-2.5 py-2">
                                                                        <p className="text-[10px] uppercase tracking-wide text-gray-400">Prakriti</p>
                                                                        <p className="text-xs font-semibold text-gray-800 mt-0.5 truncate">
                                                                            {selecteddietplan.prakriti || "—"}
                                                                        </p>
                                                                    </div>
                                                                    <div className="rounded-lg bg-white border border-gray-100 px-2.5 py-2">
                                                                        <p className="text-[10px] uppercase tracking-wide text-gray-400">Season</p>
                                                                        <p className="text-xs font-semibold text-gray-800 mt-0.5 truncate capitalize">
                                                                            {selecteddietplan.season
                                                                                ? String(selecteddietplan.season).replace(/_/g, " ")
                                                                                : "—"}
                                                                        </p>
                                                                    </div>
                                                                    <div className="rounded-lg bg-white border border-gray-100 px-2.5 py-2">
                                                                        <p className="text-[10px] uppercase tracking-wide text-gray-400">Duration</p>
                                                                        <p className="text-xs font-semibold text-gray-800 mt-0.5">
                                                                            {selecteddietplan.total_days ?? "—"} days
                                                                        </p>
                                                                    </div>
                                                                    <div className="rounded-lg bg-white border border-gray-100 px-2.5 py-2">
                                                                        <p className="text-[10px] uppercase tracking-wide text-gray-400">Meals</p>
                                                                        <p className="text-xs font-semibold text-gray-800 mt-0.5">
                                                                            {selecteddietplan.meals_per_day ?? "—"} / day
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span
                                                                    className={`text-[11px] font-semibold px-2 py-1 rounded-full ${selecteddietplan.is_paid
                                                                        ? "bg-amber-50 text-amber-700 border border-amber-100"
                                                                        : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                                        }`}
                                                                >
                                                                    {selecteddietplan.is_paid
                                                                        ? `Paid · ₹${selecteddietplan.price || 0}`
                                                                        : "Free plan"}
                                                                </span>
                                                                {selecteddietplan.is_common && (
                                                                    <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                                                        Common plan
                                                                    </span>
                                                                )}
                                                                {selecteddietplan.created_by_name && (
                                                                    <span className="text-[11px] text-gray-500 px-2 py-1 rounded-full bg-gray-50 border border-gray-100">
                                                                        By {selecteddietplan.created_by_name}
                                                                        {selecteddietplan.created_by_role
                                                                            ? ` · ${selecteddietplan.created_by_role}`
                                                                            : ""}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {selecteddietplan.health_diseases?.length > 0 && (
                                                                <div>
                                                                    <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5">
                                                                        Health conditions
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {selecteddietplan.health_diseases.map((disease) => (
                                                                            <span
                                                                                key={disease.id || disease.name}
                                                                                className="text-[11px] font-medium px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-100"
                                                                            >
                                                                                {disease.name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {selecteddietplan.diet_plan_gallery?.length > 0 && (
                                                                <div>
                                                                    <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1.5">
                                                                        Gallery preview
                                                                    </p>
                                                                    <div className="flex items-center gap-1.5">
                                                                        {selecteddietplan.diet_plan_gallery.slice(0, 5).map((img, idx) => (
                                                                            <div
                                                                                key={img.id || idx}
                                                                                className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
                                                                                title={img.caption || `Image ${idx + 1}`}
                                                                            >
                                                                                <img
                                                                                    src={img.image_url}
                                                                                    alt=""
                                                                                    className="w-full h-full object-cover"
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                        {selecteddietplan.diet_plan_gallery.length > 5 && (
                                                                            <span className="text-[11px] text-gray-500 px-2">
                                                                                +{selecteddietplan.diet_plan_gallery.length - 5}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 py-4 text-center">
                                                        <Leaf className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                                                        <p className="text-sm text-gray-500">No diet plan assigned yet</p>
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            Search above and select a plan for this patient
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2 relative">
                                                <label className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                                                    Do's and Don'ts
                                                </label>

                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                                    <input
                                                        type="text"
                                                        value={doDontSearchQuery}
                                                        placeholder="Search by prakriti, condition, do or don't…"
                                                        onFocus={() => setShowDropdowndo(true)}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setDoDontSearchQuery(value);
                                                            searchDoDonts(value);
                                                            setShowDropdowndo(true);
                                                        }}
                                                        className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                                    />
                                                    {doDontSearchQuery ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setDoDontSearchQuery("");
                                                                searchDoDonts("");
                                                                setShowDropdowndo(true);
                                                            }}
                                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                                            aria-label="Clear search"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    ) : null}
                                                </div>

                                                {showDropdowndo && (
                                                    <div className="absolute z-50 w-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                                                        <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
                                                            <p className="text-[11px] font-medium text-gray-500">
                                                                {doDontSearchQuery.trim().length > 0 && doDontSearchQuery.trim().length < 2
                                                                    ? "Type at least 2 characters"
                                                                    : `${(filterdoDonts || []).length} template(s) found`}
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowDropdowndo(false)}
                                                                className="text-[11px] text-gray-400 hover:text-gray-600"
                                                            >
                                                                Close
                                                            </button>
                                                        </div>

                                                        <div className="max-h-80 overflow-y-auto">
                                                            {(filterdoDonts || []).length === 0 ? (
                                                                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                                                    <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mb-2">
                                                                        <AlertCircle className="w-6 h-6 text-amber-500" />
                                                                    </div>
                                                                    <p className="text-sm font-medium text-gray-800">No Do's & Don'ts found</p>
                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                        Try another prakriti, condition, or advice keyword
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                (filterdoDonts || []).map((item) => {
                                                                    const diseases = item.health_diseases || [];
                                                                    const dosList = Array.isArray(item.dos) ? item.dos : [];
                                                                    const dontsList = Array.isArray(item.donts) ? item.donts : [];
                                                                    const isSelected = selectedDoDontId === item.id;

                                                                    return (
                                                                        <button
                                                                            type="button"
                                                                            key={item.id}
                                                                            onClick={() => {
                                                                                setFormData((prev) => ({
                                                                                    ...prev,
                                                                                    dos: dosList.map((text) => `• ${text}`).join("\n"),
                                                                                    donts: dontsList.map((text) => `• ${text}`).join("\n"),
                                                                                }));
                                                                                setSelectedDoDontId(item.id);
                                                                                setDoDontSearchQuery(
                                                                                    [item.prakriti, diseases[0]?.name].filter(Boolean).join(" · ") || "Selected template"
                                                                                );
                                                                                setShowDropdowndo(false);
                                                                            }}
                                                                            className={`w-full text-left px-3 py-3 border-b border-gray-50 last:border-0 transition-colors ${isSelected ? "bg-emerald-50/80" : "hover:bg-gray-50"
                                                                                }`}
                                                                        >
                                                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                                                <div className="min-w-0 flex-1">
                                                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                                                                                            <Leaf className="w-3 h-3" />
                                                                                            {item.prakriti || "—"}
                                                                                        </span>
                                                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                                                            <CheckCircle2 className="w-3 h-3" />
                                                                                            {dosList.length} Do's
                                                                                        </span>
                                                                                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-100">
                                                                                            <XCircle className="w-3 h-3" />
                                                                                            {dontsList.length} Don'ts
                                                                                        </span>
                                                                                    </div>

                                                                                    {diseases.length > 0 && (
                                                                                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                                                                            {diseases.slice(0, 4).map((disease) => (
                                                                                                <span
                                                                                                    key={disease.id || disease.name}
                                                                                                    className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100"
                                                                                                >
                                                                                                    {disease.name}
                                                                                                </span>
                                                                                            ))}
                                                                                            {diseases.length > 4 && (
                                                                                                <span className="text-[10px] text-gray-400">
                                                                                                    +{diseases.length - 4} more
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>

                                                                                <div className="shrink-0 flex flex-col items-end gap-1">
                                                                                    {isSelected ? (
                                                                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                                                                    ) : (
                                                                                        <span className="text-[10px] font-semibold text-emerald-600 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-100">
                                                                                            Use
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                                <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-2">
                                                                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 mb-1 flex items-center gap-1">
                                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                                        Do's
                                                                                    </p>
                                                                                    <ul className="space-y-0.5">
                                                                                        {dosList.slice(0, 3).map((doItem, index) => (
                                                                                            <li
                                                                                                key={index}
                                                                                                className="text-[11px] text-emerald-800 leading-snug line-clamp-1"
                                                                                            >
                                                                                                • {doItem}
                                                                                            </li>
                                                                                        ))}
                                                                                        {dosList.length === 0 && (
                                                                                            <li className="text-[11px] text-gray-400">No items</li>
                                                                                        )}
                                                                                        {dosList.length > 3 && (
                                                                                            <li className="text-[10px] text-emerald-600/70">
                                                                                                +{dosList.length - 3} more
                                                                                            </li>
                                                                                        )}
                                                                                    </ul>
                                                                                </div>

                                                                                <div className="rounded-lg border border-rose-100 bg-rose-50/50 p-2">
                                                                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-700 mb-1 flex items-center gap-1">
                                                                                        <XCircle className="w-3 h-3" />
                                                                                        Don'ts
                                                                                    </p>
                                                                                    <ul className="space-y-0.5">
                                                                                        {dontsList.slice(0, 3).map((dontItem, index) => (
                                                                                            <li
                                                                                                key={index}
                                                                                                className="text-[11px] text-rose-800 leading-snug line-clamp-1"
                                                                                            >
                                                                                                • {dontItem}
                                                                                            </li>
                                                                                        ))}
                                                                                        {dontsList.length === 0 && (
                                                                                            <li className="text-[11px] text-gray-400">No items</li>
                                                                                        )}
                                                                                        {dontsList.length > 3 && (
                                                                                            <li className="text-[10px] text-rose-600/70">
                                                                                                +{dontsList.length - 3} more
                                                                                            </li>
                                                                                        )}
                                                                                    </ul>
                                                                                </div>
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                                {/* DO's */}
                                                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                                        </div>

                                                        <div>
                                                            <h3 className="font-semibold text-emerald-700">
                                                                Do's
                                                            </h3>
                                                            <p className="text-xs text-emerald-600">
                                                                Advise the patient what they should follow.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {
                                                        console.log(formData.dos)
                                                    }

                                                    <textarea
                                                        rows={6}
                                                        value={formData.dos}
                                                        onChange={(e) => handleInputChange("dos", e.target.value)}
                                                        onKeyDown={(e) => handleBulletList(e, "dos")}
                                                        onFocus={() => handleFocus("dos")}
                                                        placeholder={`• Drink 2-3 liters of water daily`}
                                                        className="w-full rounded-xl border border-emerald-200 bg-white p-4 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                                                    />
                                                </div>

                                                {/* DON'Ts */}
                                                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                                            <XCircle className="w-5 h-5 text-red-600" />
                                                        </div>

                                                        <div>
                                                            <h3 className="font-semibold text-red-700">
                                                                Don'ts
                                                            </h3>
                                                            <p className="text-xs text-red-600">
                                                                Mention activities or foods to avoid.
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <textarea
                                                        rows={6}
                                                        value={formData.donts}
                                                        onKeyDown={(e) => handleBulletList(e, "donts")}
                                                        onChange={(e) => handleInputChange("donts", e.target.value)}
                                                        onFocus={() => handleFocus("donts")}
                                                        placeholder={`• Avoid oily and spicy food`}
                                                        className="w-full rounded-xl border border-red-200 bg-white p-4 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                                    />
                                                </div>

                                            </div>

                                            {/* Follow-up */}
                                            <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input type="checkbox" checked={formData.follow_up.schedule}
                                                        onChange={e => handleInputChange('follow_up', { ...formData.follow_up, schedule: e.target.checked })}
                                                        className="w-4 h-4 rounded accent-emerald-600" />
                                                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                        <CalendarDays className="w-4 h-4 text-emerald-600" />
                                                        Schedule Follow-up Appointment
                                                    </span>
                                                </label>
                                                {formData.follow_up.schedule && (
                                                    <div className="mt-4 space-y-3 pl-7">
                                                        <input type="date" value={formData.follow_up.date}
                                                            onChange={e => handleInputChange('follow_up', { ...formData.follow_up, date: e.target.value })}
                                                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                                        <input type="text" placeholder="Reason for follow-up" value={formData.follow_up.reason}
                                                            onChange={e => handleInputChange('follow_up', { ...formData.follow_up, reason: e.target.value })}
                                                            className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Save Prescription Button */}
                                            <div className="flex justify-end gap-3 pt-4">
                                                {editingPrescriptionId && (
                                                    <button
                                                        type="button"
                                                        onClick={handleCancelEditPrescription}
                                                        disabled={updating}
                                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-all disabled:opacity-50"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Cancel Edit
                                                    </button>
                                                )}
                                                <button
                                                    onClick={handleSavePrescription}
                                                    disabled={
                                                        updating ||
                                                        !formData?.symptom_description?.trim()
                                                        // || formData.prescriptions.length === 0
                                                    }
                                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-lg ${updating ||
                                                        !formData?.symptom_description?.trim()
                                                        // || formData.prescriptions.length === 0
                                                        ? "bg-gray-400 cursor-not-allowed"
                                                        : "bg-gradient-to-r from-[#0D614E] to-[#0a4a3d]"
                                                        }`}
                                                >
                                                    <Save className="w-4 h-4" />
                                                    {updating
                                                        ? (editingPrescriptionId ? "Updating..." : "Saving...")
                                                        : (editingPrescriptionId ? "Update Prescription" : "Save Prescription")}
                                                </button>
                                            </div>
                                        </div>
                                        :
                                        // appointment?.status == "completed" ?
                                        //     <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-10">
                                        //         <div className="flex flex-col items-center text-center">
                                        //             <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-5">
                                        //                 <FileText className="w-10 h-10 text-emerald-600" />
                                        //             </div>

                                        //             <h3 className="text-xl font-bold text-slate-900">
                                        //                 Ready to Create Prescription
                                        //             </h3>

                                        //             <p className="text-slate-600 mt-2 max-w-lg">
                                        //                 This consultation has been completed successfully. You can now create,
                                        //                 manage, and share prescriptions for this patient.
                                        //             </p>

                                        //             <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700">
                                        //                 <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        //                 Appointment Status: Completed
                                        //             </div>
                                        //         </div>
                                        //     </div>
                                        //     :
                                        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-10">
                                            <div className="flex flex-col items-center text-center">
                                                <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mb-5">
                                                    <FileText className="w-10 h-10 text-amber-600" />
                                                </div>

                                                <h3 className="text-xl font-bold text-slate-900">
                                                    Unable to Add Prescription
                                                </h3>

                                                {/* <p className="text-slate-600 mt-2 max-w-lg">
                                                    This consultation was {appointment?.status} before completion. Prescription
                                                    generation is disabled for {appointment?.status} appointments to maintain
                                                    accurate medical records.
                                                </p> */}
                                                {
                                                    appointment?.status === "completed" && (
                                                        <p className="text-slate-600 mt-2 max-w-lg">
                                                            The prescription has already been provided for this appointment.
                                                        </p>
                                                    )
                                                }

                                                <div className={"mt-6 flex capitalize items-center gap-2 px-4 py-2 rounded-full  " + (appointment?.status == "cancelled" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                                                    {/* <span className="w-2 h-2 rounded-full bg-red-500 "></span> */}
                                                    Appointment Status: {appointment?.status}
                                                </div>
                                            </div>
                                        </div>
                                )}
                                {activeTab === 'questions' && (
                                    <DoctorQAPanelPremium patientid={appointment?.patient?.id} />
                                )}

                                {activeTab === 'diet-progress' && (
                                    <DietProgress patientId={appointment?.patient?.id} />
                                )}

                                {/* History Tab */}
                                {activeTab === 'history' && (
                                    <>
                                        <div className="w-full space-y-4">
                                            {/* Header Section */}
                                            <div className="mb-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <h2 className="text-2xl font-bold text-gray-900">Medical History</h2>
                                                        <p className="text-sm text-gray-600 mt-1">{patientHistory.length} consultation{patientHistory.length !== 1 ? 's' : ''} on record</p>
                                                    </div>
                                                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                                                        <p className="text-xs text-emerald-700 font-semibold uppercase tracking-widest">Last Visit</p>
                                                        <p className="text-sm font-bold text-emerald-900 mt-1">
                                                            {patientHistory.length > 0 ? formatDate(patientHistory[0].appointment_date) : '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Timeline View */}
                                            {patientHistory.length > 0 ? (
                                                <div className="space-y-3">
                                                    {patientHistory.map((record, idx) => (
                                                        <div key={record.id} className="relative">
                                                            {/* Timeline Connector */}
                                                            {idx !== patientHistory.length - 1 && (
                                                                <div className="absolute left-7 top-16 bottom-0 w-0.5 bg-gradient-to-b from-emerald-300 to-transparent"></div>
                                                            )}

                                                            {/* Timeline Dot */}
                                                            <div className="absolute left-3 top-5 w-8 h-8 bg-white border-2 border-emerald-500 rounded-full flex items-center justify-center">
                                                                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                                            </div>

                                                            {/* Main Card */}
                                                            <div className="ml-16 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">

                                                                {/* Card Header - Click to Expand */}
                                                                <div
                                                                    onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                                                                    className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-50 transition-colors group cursor-pointer"
                                                                >
                                                                    <div className="flex-1 text-left">
                                                                        {/* Date & Time */}
                                                                        <div className="flex items-center gap-3 mb-2">
                                                                            <Calendar className="w-4 h-4 text-emerald-600" />
                                                                            <p className="font-semibold text-gray-900">
                                                                                {formatSlotDateTime(record.appointment_date, record.start_time)}
                                                                            </p>
                                                                            {record.start_time && record.end_time && (
                                                                                <span className="text-xs text-gray-500">
                                                                                    {formatTime(record.start_time)} – {formatTime(record.end_time)}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        {/* Quick Summary - Chief Complaint Preview */}
                                                                        {record.symptom_description && (
                                                                            <p className="text-sm text-gray-600 line-clamp-2 ml-7">
                                                                                {record.symptom_description}
                                                                            </p>
                                                                        )}
                                                                    </div>

                                                                    {/* Status Badges */}
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex gap-2">
                                                                            {/* Medicine Count Badge */}
                                                                            <span className="px-4 py-2 rounded-full text-sm font-semibold bg-blue-50 border border-blue-200 text-blue-700 flex items-center gap-2">
                                                                                <Pill className="w-3.5 h-3.5" />
                                                                                {record.prescription_items?.length || 0}
                                                                            </span>

                                                                            {(record.diets?.length || 0) > 0 && (
                                                                                <span className="px-4 py-2 rounded-full text-sm font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-2">
                                                                                    <Leaf className="w-3.5 h-3.5" />
                                                                                    {record.diets.length}
                                                                                </span>
                                                                            )}

                                                                            {/* Status Badge */}
                                                                            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(record.status)}`}>
                                                                                {record.status?.charAt(0).toUpperCase() + record.status?.slice(1) || 'Pending'}
                                                                            </span>
                                                                        </div>

                                                                        {/* Edit Icon */}
                                                                        {isPrescriptionStillEditable(record) && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => handleEditPrescriptionForm(record, e)}
                                                                                className={`cursor-pointer p-2 rounded-xl transition ${editingPrescriptionId === record.id
                                                                                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                                                                    : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                                                                    }`}
                                                                                title="Edit prescription"
                                                                            >
                                                                                <PencilIcon className={`w-5 h-5 ${editingPrescriptionId === record.id ? "text-white" : "text-emerald-600"}`} />
                                                                            </button>
                                                                        )}

                                                                        {/* Expand Icon */}
                                                                        <div className={`text-gray-400 transition-transform ${expandedIdx === idx ? 'rotate-180' : ''}`}>
                                                                            {expandedIdx === idx ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Expandable Content */}
                                                                {expandedIdx === idx && (
                                                                    <div className="border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white px-6 py-6 space-y-6">

                                                                        {/* Chief Complaint Section */}
                                                                        {record.symptom_description && (
                                                                            <div className="rounded-xl p-4 border border-amber-200 bg-amber-50">
                                                                                <div className="flex items-start gap-3">
                                                                                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                                                                    <div className="flex-1">
                                                                                        <p className="text-xs font-bold text-amber-900 uppercase tracking-widest">Chief Complaint</p>
                                                                                        <p className="text-sm text-amber-900 mt-2 leading-relaxed">{record.symptom_description}</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Medical History Details */}
                                                                        {(record.history_of_past_illness || record.allergies || record.family_history || record.surgical_history) && (
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                {record.history_of_past_illness && (
                                                                                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                                                                                        <p className="flex gap-2 text-xs font-bold text-orange-900 uppercase tracking-widest mb-2"><Notebook size={16} /> Past Illness</p>
                                                                                        <p className="text-sm text-orange-900">{record.history_of_past_illness}</p>
                                                                                    </div>
                                                                                )}

                                                                                {record.allergies && (
                                                                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                                                                        <p className="flex gap-2 text-xs font-bold text-red-900 uppercase tracking-widest mb-2"><FaAllergies /> Allergies</p>
                                                                                        <p className="text-sm text-red-900">{record.allergies}</p>
                                                                                    </div>
                                                                                )}

                                                                                {record.family_history && (
                                                                                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                                                                                        <p className="flex gap-2 text-xs font-bold text-purple-900 uppercase tracking-widest mb-2"><MdFamilyRestroom size={14} /> Family History</p>
                                                                                        <p className="text-sm text-purple-900">{record.family_history}</p>
                                                                                    </div>
                                                                                )}

                                                                                {record.surgical_history && (
                                                                                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                                                                                        <p className="text-xs font-bold text-red-900 uppercase tracking-widest mb-2">Surgical History</p>
                                                                                        <p className="text-sm text-red-900">{record.surgical_history}</p>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {/* Diagnosis Section */}
                                                                        {record.diagnosis_advice && (
                                                                            <div className="rounded-xl p-4 border border-emerald-200 bg-emerald-50">
                                                                                <div className="flex items-start gap-3">
                                                                                    <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                                                                    <div className="flex-1">
                                                                                        <p className="text-xs font-bold text-emerald-900 uppercase tracking-widest">Diagnosis</p>
                                                                                        <p className="text-sm text-emerald-900 mt-2 leading-relaxed">{record.diagnosis_advice}</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Prescriptions Table */}
                                                                        {record.prescription_items && record.prescription_items.length > 0 && (
                                                                            <div>
                                                                                <div className="flex items-center gap-2 mb-4">
                                                                                    <Pill className="w-5 h-5 text-emerald-600" />
                                                                                    <h4 className="font-bold text-gray-900">Prescribed Medicines</h4>
                                                                                </div>

                                                                                <div className="overflow-hidden rounded-xl border border-gray-200">
                                                                                    <table className="w-full text-sm">
                                                                                        <thead className="bg-[#0D614E] text-white">
                                                                                            <tr>
                                                                                                <th className="px-4 py-3 text-left font-semibold">Medicine</th>
                                                                                                <th className="px-4 py-3 text-left font-semibold">Dosage</th>
                                                                                                <th className="px-4 py-3 text-left font-semibold">Frequency</th>
                                                                                                <th className="px-4 py-3 text-left font-semibold">Duration</th>
                                                                                                <th className="px-4 py-3 text-left font-semibold">Instructions</th>
                                                                                            </tr>
                                                                                        </thead>
                                                                                        <tbody>
                                                                                            {record.prescription_items.map((med, i) => (
                                                                                                <tr
                                                                                                    key={med.id || i}
                                                                                                    className={`border-t border-gray-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-[#0D614E]/10 transition-colors`}
                                                                                                >
                                                                                                    <td className="px-4 py-4 font-semibold text-gray-900">{med.product_name || med.medicine_name || '—'}</td>
                                                                                                    <td className="px-4 py-4 text-gray-700">{med.dosage || '—'}</td>
                                                                                                    <td className="px-4 py-4 text-gray-700">{med.frequency || '—'}</td>
                                                                                                    <td className="px-4 py-4 text-gray-700">{formatDurationLabel(med.duration)}</td>
                                                                                                    <td className="px-4 py-4 text-sm text-gray-600 italic">{med.instruction || '—'}</td>
                                                                                                </tr>
                                                                                            ))}
                                                                                        </tbody>
                                                                                    </table>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {record.diets && record.diets.length > 0 && (
                                                                            <div>
                                                                                <div className="flex items-center gap-2 mb-4">
                                                                                    <Leaf className="w-5 h-5 text-emerald-600" />
                                                                                    <h4 className="font-bold text-gray-900">Diet Plans</h4>
                                                                                </div>

                                                                                <div className="grid grid-cols-1 gap-4">
                                                                                    {record.diets.map((diet) => (
                                                                                        <div key={diet.id || diet.name} className="bg-white border border-emerald-200 rounded-xl p-4 shadow-sm">
                                                                                            <div className="flex items-start justify-between gap-4">
                                                                                                <div className="flex items-start gap-3">
                                                                                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                                                                                        <Leaf className="w-5 h-5 text-emerald-600" />
                                                                                                    </div>
                                                                                                    <div>
                                                                                                        <h5 className="font-semibold text-gray-900">{diet.name}</h5>
                                                                                                        <p className="text-sm text-gray-500 mt-1">Assigned with this prescription</p>
                                                                                                    </div>
                                                                                                </div>
                                                                                                <div className="text-right flex flex-wrap gap-2 justify-end">
                                                                                                    <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-0.5 rounded">{formatDurationLabel(diet.duration)}</span>
                                                                                                    {diet.meals_per_day != null && diet.meals_per_day !== '' && (
                                                                                                        <span className="inline-block bg-sky-100 text-sky-800 text-xs font-medium px-2.5 py-0.5 rounded">{diet.meals_per_day} meals/day</span>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Clinical Observations */}
                                                                        {record.clinical_notes && (
                                                                            <div className="rounded-xl p-4 border border-blue-200 bg-blue-50">
                                                                                <div className="flex items-start gap-3">
                                                                                    <Thermometer className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                                                                    <div className="flex-1">
                                                                                        <p className="text-xs font-bold text-blue-900 uppercase tracking-widest">Clinical Notes & Observations</p>
                                                                                        <p className="text-sm text-blue-900 mt-2 leading-relaxed">{record.clinical_notes}</p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {(toAdviceList(record.dos).length > 0 || toAdviceList(record.donts).length > 0) && (
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                                                {toAdviceList(record.dos).length > 0 && (
                                                                                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                                                                                        <div className="flex items-center gap-3 mb-4">
                                                                                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                                                                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                                                                            </div>
                                                                                            <div>
                                                                                                <h3 className="font-semibold text-emerald-700">Do's</h3>
                                                                                                <p className="text-xs text-emerald-600">Advise the patient what they should follow.</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        <ul className="space-y-2">
                                                                                            {toAdviceList(record.dos).map((item, i) => (
                                                                                                <li key={i} className="flex gap-2 text-sm text-emerald-900">
                                                                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                                                                                    <span>{item}</span>
                                                                                                </li>
                                                                                            ))}
                                                                                        </ul>
                                                                                    </div>
                                                                                )}

                                                                                {toAdviceList(record.donts).length > 0 && (
                                                                                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                                                                                        <div className="flex items-center gap-3 mb-4">
                                                                                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                                                                                <XCircle className="w-5 h-5 text-red-600" />
                                                                                            </div>
                                                                                            <div>
                                                                                                <h3 className="font-semibold text-red-700">Don'ts</h3>
                                                                                                <p className="text-xs text-red-600">Mention activities or foods to avoid.</p>
                                                                                            </div>
                                                                                        </div>
                                                                                        <ul className="space-y-2">
                                                                                            {toAdviceList(record.donts).map((item, i) => (
                                                                                                <li key={i} className="flex gap-2 text-sm text-red-900">
                                                                                                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                                                                                    <span>{item}</span>
                                                                                                </li>
                                                                                            ))}
                                                                                        </ul>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {/* Follow-up Information */}
                                                                        {record.follow_up?.schedule && record.follow_up?.date && (
                                                                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-300 rounded-xl p-4">
                                                                                <div className="flex items-start gap-3">
                                                                                    <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                                                                    <div className="flex-1">
                                                                                        <p className="text-xs font-bold text-blue-900 uppercase tracking-widest">Follow-up Scheduled</p>
                                                                                        <p className="text-md font-bold text-blue-900 mt-2">
                                                                                            {new Date(record.follow_up.date).toLocaleDateString('en-IN', {
                                                                                                day: 'numeric',
                                                                                                month: 'long',
                                                                                                year: 'numeric'
                                                                                            })}
                                                                                        </p>
                                                                                        {record.follow_up.reason && (
                                                                                            <p className="text-sm text-blue-800 mt-2">{record.follow_up.reason}</p>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                    <p className="text-gray-600 font-medium">No medical history available</p>
                                                    <p className="text-sm text-gray-500 mt-1">Past consultations will appear here</p>
                                                </div>
                                            )}
                                        </div>
                                        <br />
                                        {
                                            appointment?.appointments &&
                                            <div className="mb-6 mt-12 border-t border-gray-200 pt-8">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <h2 className="text-2xl font-bold text-gray-900">Appointment History</h2>
                                                        <p className="text-sm text-gray-600 mt-1">{appointment?.appointments?.length} consultation{appointment?.appointments?.length !== 1 ? 's' : ''} on record</p>
                                                    </div>
                                                </div>
                                            </div>
                                        }

                                        {
                                            appointment?.appointments &&
                                            <div className="space-y-3">
                                                {appointment?.appointments.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="relative bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-200"
                                                    >
                                                        {/* Status Bar */}
                                                        <div className={`h-1 ${item.status === "confirmed" || item.status === "completed" ? "bg-emerald-500" : "bg-red-500"}`} />

                                                        <div className="p-5">
                                                            <div className="flex items-start justify-between gap-4">
                                                                {/* Main Content */}
                                                                <div className="flex-1">
                                                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                                                        <div className="flex items-center gap-2">
                                                                            {item.status === "confirmed" || item.status === "completed" ? (
                                                                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                                                            ) : (
                                                                                <XCircle className="w-5 h-5 text-red-600" />
                                                                            )}
                                                                            <span className="text-sm font-mono text-slate-500">
                                                                                #{item.id.slice(-6)}
                                                                            </span>
                                                                        </div>

                                                                        <div className="h-4 w-px bg-slate-200" />

                                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full                ${item.status === "confirmed" || item.status === "completed"
                                                                            ? "bg-emerald-50 text-emerald-700"
                                                                            : "bg-red-50 text-red-700"
                                                                            }`}>
                                                                            {item.status}
                                                                        </span>
                                                                    </div>

                                                                    <h3 className="font-semibold text-slate-900 mb-1">
                                                                        {formatDateTime(item.appointment_date + ":" + item.start_time)}
                                                                    </h3>

                                                                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500 mb-3">
                                                                        <span>{item.start_time} - {item.end_time}</span>
                                                                        <span className="hidden sm:inline">•</span>
                                                                        <span className="flex items-center gap-1">
                                                                            <Video className="w-3.5 h-3.5" />
                                                                            {item.consultation_type}
                                                                        </span>
                                                                        <span className="hidden sm:inline">•</span>
                                                                        <span className="flex items-center gap-1 font-medium text-slate-700">
                                                                            {/* <IndianRupee className="w-3.5 h-3.5" /> */}
                                                                            ₹{item?.amount?.toLocaleString('en-IN')}
                                                                        </span>
                                                                    </div>

                                                                    {item.concern && (
                                                                        <div className="mt-2">
                                                                            <p className="text-xs text-slate-400 mb-1">Concern</p>
                                                                            <p className="text-sm text-slate-600 line-clamp-2 italic">
                                                                                "{item.concern}"
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Actions */}
                                                                <div>
                                                                    <a href={`/doctor/appointments/appointment/${item.id}`} className="px-4 py-1.5 rounded-lg text-sm font-medium text-indigo-600 
              hover:bg-indigo-50 transition-colors duration-200">
                                                                        View Details →
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        }
                                    </>
                                )}
                                {/* Documents Tab */}
                                {activeTab === 'documents' && (
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                                <FileHeart className="w-3.5 h-3.5 text-emerald-600" />
                                                Medical Records
                                            </p>
                                            <label className="cursor-pointer">
                                                <span className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-md"
                                                    style={{ background: '#0D614E' }}>
                                                    <Upload className="w-4 h-4" /> Upload Document
                                                </span>
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    multiple
                                                    className="hidden"
                                                    onChange={handleFileUpload}
                                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                />
                                            </label>
                                        </div>

                                        {uploading && (
                                            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                                <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#0D614E', borderTopColor: 'transparent' }} />
                                                <span className="text-sm text-[#0D614E]">Uploading document(s)...</span>
                                            </div>
                                        )}

                                        {patientDocument?.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-3">
                                                {patientDocument.map((doc) => (
                                                    <div
                                                        key={doc.id}
                                                        className="group flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-[#0D614E]/20 hover:shadow-md transition-all"
                                                    >
                                                        <div className="w-12 h-12 rounded-xl bg-[#0D614E]/10 flex items-center justify-center">
                                                            {doc.file_type === "image" ? (
                                                                <Image className="w-5 h-5 text-[#0D614E]" />
                                                            ) : (
                                                                <FileText className="w-5 h-5 text-[#0D614E]" />
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-semibold text-gray-800 capitalize">
                                                                {doc.medical_record_type}
                                                            </h4>

                                                            <p className="text-xs text-gray-500 truncate mt-1">
                                                                {doc.description || "Medical Document"}
                                                            </p>

                                                            <p className="text-xs text-gray-400 mt-1">
                                                                Uploaded on{" "}
                                                                {new Date(doc.created_at).toLocaleDateString("en-IN", {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                })}
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center gap-2">
                                                            <a
                                                                href={doc.file_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                                                            >
                                                                <Eye size={16} />
                                                            </a>
                                                            {
                                                                appointment?.doctor_id == doc?.added_by?.id && (
                                                                    <a onClick={() => handleDeleteDocument(doc.id)} className="cursor-pointer p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition">
                                                                        <XCircleIcon className="w-5 h-5 text-red-600 " />
                                                                    </a>
                                                                )
                                                            }
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                                <FileHeart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                                <p className="text-sm font-semibold text-gray-500">
                                                    No Medical Documents
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Upload prescriptions, reports, scans, and medical records
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Billing Tab */}
                                {activeTab === 'billing' && (
                                    <div className="space-y-5">
                                        {/* Payment Summary */}
                                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 overflow-hidden">
                                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                                                    Payment Summary
                                                </p>
                                            </div>
                                            <div className="divide-y divide-gray-100">
                                                <div className="flex justify-between px-6 py-4">
                                                    <span className="text-sm text-gray-600">Consultation Fee</span>
                                                    <span className="text-sm font-semibold text-gray-800">₹{appointment?.amount}</span>
                                                </div>
                                                <div className="flex justify-between px-6 py-4">
                                                    <span className="text-sm text-gray-600">Platform Fee</span>
                                                    <span className="text-sm text-gray-600">Included</span>
                                                </div>
                                                <div className="flex justify-between px-6 py-4 bg-emerald-50/30">
                                                    <span className="font-bold text-gray-800">Total Amount</span>
                                                    <span className="text-xl font-bold text-[#0D614E]">₹{appointment?.amount}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payment Details */}
                                        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 overflow-hidden">
                                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                                                    Payment Details
                                                </p>
                                            </div>
                                            <div className="px-6 py-4 space-y-3">
                                                <InfoRow label="Status" value={
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${appointment?.payment_id ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {appointment?.payment_id ? '✓ Paid' : 'Pending'}
                                                    </span>
                                                } />
                                                {appointment?.payment_id && <InfoRow label="Payment ID" value={appointment?.payment_id} mono />}
                                                {appointment?.payment_method && <InfoRow label="Payment Method" value={appointment?.payment_method?.toUpperCase()} />}
                                                {appointment?.transaction_id && <InfoRow label="Transaction ID" value={appointment?.transaction_id} mono />}
                                            </div>
                                        </div>

                                        {/* Insurance Details */}
                                        {(patient?.insurance_provider || patient?.insurance_policy_number) && (
                                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 overflow-hidden">
                                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                                                        <Shield className="w-3.5 h-3.5 text-emerald-600" />
                                                        Insurance Information
                                                    </p>
                                                </div>
                                                <div className="px-6 py-4">
                                                    <InfoRow label="Provider" value={patient?.insurance_provider || 'Not available'} />
                                                    <InfoRow label="Policy Number" value={patient?.insurance_policy_number || 'Not available'} mono />
                                                    <InfoRow label="Valid Through" value={patient?.insurance_valid_thru ? formatDate(patient.insurance_valid_thru) : 'Not available'} />
                                                </div>
                                            </div>
                                        )}

                                        {/* <button onClick={generateInvoicePDF}
                                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-all">
                                            <Download className="w-4 h-4" /> Download Invoice
                                        </button> */}
                                    </div>
                                )}
                            </div>
                        </SectionCard>
                        {showCall && (
                            <Rnd
                                default={{
                                    x: (0 - (window.innerWidth / 2.6)),
                                    y: 0,
                                    width: 500,
                                    height: 400,
                                }}
                                minWidth={550}
                                minHeight={550}
                                bounds="window"
                                style={{
                                    zIndex: 9999999,
                                    position: "fixed",
                                }}
                            >
                                <div className=" fixed bottom-6 left-6 w-[550px] h-[550px] rounded-3xl overflow-hidden shadow-2xl bg-black" style={{ zIndex: "99999999999" }}>
                                    <DoctorVideoCall consultationId={appointment?.id} patientDetails={patient} />
                                    <span className='crossicomn' onClick={e => setshowCall(!showCall)}>
                                        <X size={16} />
                                    </span>
                                </div>
                            </Rnd>
                        )}
                    </div>
                </div>
            </div>

            {showUploadModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Upload Medical Record</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {selectedUploadFiles.length} file{selectedUploadFiles.length !== 1 ? 's' : ''} selected
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={resetUploadForm}
                                disabled={uploading}
                                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                {selectedUploadFiles.map((file, index) => (
                                    <div key={`${file.name}-${index}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <FileText className="w-4 h-4 text-[#0D614E] shrink-0" />
                                        <span className="text-sm text-gray-700 truncate">{file.name}</span>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Medical Record Type
                                </label>
                                <select
                                    value={uploadMeta.medical_record_type}
                                    onChange={(e) => setUploadMeta((prev) => ({ ...prev, medical_record_type: e.target.value }))}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D614E]/20 focus:border-[#0D614E]"
                                >
                                    {MEDICAL_RECORD_TYPES.map((item) => (
                                        <option key={item.value} value={item.value}>{item.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    value={uploadMeta.description}
                                    onChange={(e) => setUploadMeta((prev) => ({ ...prev, description: e.target.value }))}
                                    placeholder="e.g. Post-consultation prescription"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D614E]/20 focus:border-[#0D614E] resize-none"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={resetUploadForm}
                                disabled={uploading}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmitDocumentUpload}
                                disabled={uploading}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-md disabled:opacity-60"
                                style={{ background: '#0D614E' }}
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Prescription Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center  p-4 animate-in fade-in duration-200">
                    {/* Modal Container */}
                    <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">

                        {/* ─────────────────────────────────────────────────────────────────────────────── */}
                        {/* PREMIUM HEADER */}
                        {/* ─────────────────────────────────────────────────────────────────────────────── */}
                        <div className="sticky top-0 z-20 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-800 border-b-4 border-emerald-600 px-6 py-5">
                            <div className="flex items-center justify-between">

                                {/* Left Section - Title */}
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <FileText className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Prescription</h2>
                                        <p className="text-emerald-100 text-sm mt-0.5">Digital Medical Record</p>
                                    </div>
                                </div>

                                {/* Right Section - Actions */}
                                <div className="flex items-center gap-2">
                                    {/* Download PDF Button */}
                                    {/* <button
                                        onClick={handleDownloadPDF}
                                        className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-semibold transition-all duration-200 backdrop-blur-sm border border-white/30"
                                        title="Download as PDF"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span>PDF</span>
                                    </button>

                                    <button
                                        onClick={handlePrint}
                                        className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-semibold transition-all duration-200 backdrop-blur-sm border border-white/30"
                                        title="Print Prescription"
                                    >
                                        <Printer className="w-4 h-4" />
                                        <span>Print</span>
                                    </button> */}

                                    {/* Share Button */}
                                    {/* <button
                                        onClick={handleShare}
                                        className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 backdrop-blur-sm border ${copySuccess
                                            ? 'bg-green-500/30 border-green-400 text-green-100'
                                            : 'bg-white/20 hover:bg-white/30 border-white/30 text-white'
                                            } text-sm font-semibold`}
                                        title="Share Prescription"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        <span>{copySuccess ? 'Copied!' : 'Share'}</span>
                                    </button> */}

                                    {/* Close Button */}
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="p-2.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all duration-200 backdrop-blur-sm border border-white/30 group"
                                        title="Close Modal"
                                    >
                                        <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                                    </button>
                                </div>
                            </div>

                            {/* Doctor & Patient Quick Info */}
                            <div className="mt-4 flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                                    <span className="text-emerald-200">👨‍⚕️</span>
                                    <span className="text-white font-medium">{doctor?.doctor_name}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                                    <span className="text-emerald-200">👤</span>
                                    <span className="text-white font-medium">{patient?.first_name} {patient?.last_name}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                                    <span className="text-emerald-200">📅</span>
                                    <span className="text-white font-medium">{new Date().toLocaleDateString('en-IN')}</span>
                                </div>
                            </div>
                        </div>

                        {/* ─────────────────────────────────────────────────────────────────────────────── */}
                        {/* SCROLLABLE CONTENT */}
                        {/* ─────────────────────────────────────────────────────────────────────────────── */}
                        <div className="overflow-y-auto flex-1 bg-gradient-to-b from-gray-50 via-white to-gray-50 p-6">
                            {/* White Container for Prescription */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                <PrescriptionTemplate
                                    ref={prescriptionRef}
                                    appointment={appointment}
                                    formData={formData}
                                    doctor={doctor}
                                    patient={patient}
                                    date={new Date()}
                                    dietPlans={selecteddietplan ? [selecteddietplan] : []}
                                />
                            </div>
                        </div>

                        {/* ─────────────────────────────────────────────────────────────────────────────── */}
                        {/* FOOTER */}
                        {/* ─────────────────────────────────────────────────────────────────────────────── */}
                        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center">
                            <p className="text-xs text-gray-500">
                                Prescription ID: <span className="font-mono font-semibold text-gray-700">{appointment?.id?.slice(0, 8) || 'RX-000'}</span>
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="px-6 py-2.5 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200"
                                >
                                    Close
                                </button>
                                {/* <button
                                    onClick={handlePrint}
                                    className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                                >
                                    <Printer className="w-4 h-4" />
                                    Print Now
                                </button> */}
                            </div>
                        </div>
                    </div>

                    {/* Custom Animations */}
                    <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
 
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
 
        .animate-in {
          animation: fadeIn 0.2s ease-out;
        }
 
        .fade-in {
          animation: fadeIn 0.2s ease-out;
        }
 
        .zoom-in {
          animation: zoomIn 0.3s ease-out;
        }
 
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
                </div>
            )}

            {/* Hidden Invoice Template for PDF generation */}
            <div className="hidden">
                <InvoiceTemplate
                    ref={invoiceRef}
                    appointment={appointment}
                    patient={patient}
                    doctor={doctor}
                />
            </div>
        </div>
    );
};

export default AppointmentDetail;