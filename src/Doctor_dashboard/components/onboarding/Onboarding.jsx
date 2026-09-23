// DoctorOnboarding.jsx - Optimized & Scalable Version
import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
    User, Mail, Phone, MapPin, Calendar, FileText, Upload, CheckCircle,
    AlertCircle, ChevronRight, ChevronLeft, Trash2, Eye, FileCheck,
    Stethoscope, Award, X, RefreshCw, Check, Clock, Users, Banknote,
    Linkedin, Twitter, Facebook, Instagram, Globe, Building, Home,
    Shield, Info, ArrowLeft, Sparkles
} from 'lucide-react';
import { doctorService } from '../../../services/doctorService';
import { acceptLegalPolicies } from '../../../services/policyService';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import PoliciesListPopup from './policyslist';

// ==================== CONSTANTS ====================
const TITLES = ['Dr.', 'Prof.', 'Dr. (Prof.)'];
const GENDERS = ['male', 'female', 'other'];
const LANGUAGES = ['English', 'Hindi', 'Sanskrit', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Gujarati', 'Marathi', 'Bengali'];
const DOSHA_OPTIONS = ['Vata', 'Pitta', 'Kapha', 'Vata-Pitta', 'Pitta-Kapha', 'Vata-Kapha'];
const CONSULTATION_MODES = ['Video', 'Chat'];
const PAYMENT_TERMS = [
    { value: 'weekly', label: 'Weekly Settlement' },
    { value: 'bi-weekly', label: 'Bi-Weekly Settlement' },
    { value: 'monthly', label: 'Monthly Settlement' }
];

const AYURVEDIC_SPECIALIZATIONS = [
    'Panchakarma', 'Rasayana', 'Vajikarana', 'Kaya Chikitsa', 'Shalya Tantra',
    'Shalakya Tantra', 'Kaumarbhritya', 'Agada Tantra', 'Bhuta Vidya',
    'Swasthavritta', 'Prasuti Tantra', 'Stri Roga'
];

const THERAPIES = [
    'Abhyanga', 'Shirodhara', 'Pizhichil', 'Njavarakizhi', 'Elakizhi',
    'Udvartanam', 'Vasti', 'Nasya', 'Raktamokshana', 'Lepanam', 'Dhara'
];

const DOCUMENT_REQUIREMENTS = {
    medicalDegree: { label: 'Medical Degree Certificate', required: true, accepted: ['PDF', 'JPG', 'PNG'], maxSize: 5 },
    registrationCertificate: { label: 'Registration Certificate', required: true, accepted: ['PDF', 'JPG', 'PNG'], maxSize: 5 },
    identityProof: { label: 'Identity Proof (Aadhar/PAN)', required: true, accepted: ['PDF', 'JPG', 'PNG'], maxSize: 2 },
    // addressProof: { label: 'Address Proof', required: false, accepted: ['PDF', 'JPG', 'PNG'], maxSize: 2 },
    signature: { label: 'Signature', required: true, accepted: ['JPG', 'PNG'], maxSize: 1 },
    experienceCertificate: { label: 'Experience Certificate', required: true, accepted: ['PDF'], maxSize: 5 },
    // panCard: { label: 'PAN Card', required: false, accepted: ['PDF', 'JPG', 'PNG'], maxSize: 2 },
    gstCertificate: { label: 'GST Certificate', required: false, accepted: ['PDF'], maxSize: 5 },
    bankDetails: { label: 'Cancelled Cheque/Bank Statement', required: false, accepted: ['PDF', 'JPG', 'PNG'], maxSize: 2 },
    passportPhoto: { label: 'Others', required: false, accepted: ['JPG', 'PNG'], maxSize: 1 },
};

const VALIDATION_PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[6-9]\d{9}$/,
    pincode: /^[1-9][0-9]{5}$/,
    ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/i,
    linkedin: /^https?:\/\/(www\.)?linkedin\.com\/.*$/,
    twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.*$/,
    facebook: /^https?:\/\/(www\.)?facebook\.com\/.*$/,
    instagram: /^https?:\/\/(www\.)?instagram\.com\/.*$/
};

const STEPS = [1, 2, 3, 4, 5, 6];
const STEP_LABELS = { 1: 'Personal', 2: 'Contact', 3: 'Professional', 4: 'Documents', 5: 'Bank', 6: 'Agreement' };

// ==================== INITIAL STATE ====================
const INITIAL_FORM_STATE = {
    personalInfo: {
        title: 'Dr.', firstName: '', lastName: '', dateOfBirth: '', gender: '',
        nationality: 'Indian', languages: ['English', 'Hindi'], bio: '', profilePhoto: null
    },
    contactInfo: {
        email: '', phone: '', alternatePhone: '',
        address: { street: '', city: '', state: '', pincode: '', country: 'India' },
        emergencyContact: { name: '', relationship: '', phone: '' }
    },
    professionalInfo: {
        experience: '', qualifications: '', registrationNumber: '', registrationCouncil: '',
        registrationYear: '', consultationFee: '499', followUpFee: '', consultationMode: ['video', 'chat'],
        averageConsultationTime: 30, maxPatientsPerDay: 10, yearsOfPractice: ''
    },
    ayurvedicInfo: {
        primaryDosha: '', primaryDisease: [], specializations: [], therapies: [], panchakarmaCertified: false,
        yearsInAyurveda: '', ayurvedicCouncilId: '', practicingSince: ''
    },
    documents: {
        medicalDegree: null, registrationCertificate: null, identityProof: null,
        addressProof: null, passportPhoto: null, signature: null, experienceCertificate: null,
        panCard: null, gstCertificate: null, bankDetails: null
    },
    bankInfo: {
        accountHolderName: '', accountNumber: '', confirmAccountNumber: '', ifscCode: '',
        bankName: '', branchName: '', upiId: '', paymentTerms: ''
    },
    socialMedia: {
        socialMedia: { linkedin: '', twitter: '', facebook: '', instagram: '' }
    },
    agreements: {
        termsAccepted: false, privacyAccepted: false, communicationAccepted: false,
        allPoliciesAccepted: false,
        agreeDate: new Date().toISOString().split('T')[0]
    }
};

// ==================== HELPER FUNCTIONS ====================
const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};
const removePreview = (obj) => {
    if (obj === null || obj === undefined) {
        return null; // or {}
    }
    const { preview, ...rest } = obj;
    return rest;
};
const transformToApiFormat = (formData) => ({
    title: formData.personalInfo.title,
    first_name: formData.personalInfo.firstName,
    last_name: formData.personalInfo.lastName,
    dob: formData.personalInfo.dateOfBirth,
    gender: formData.personalInfo.gender,
    nationality: formData.personalInfo.nationality,
    bio: formData.personalInfo.bio,
    languages_spoken: formData.personalInfo.languages,
    email: formData.contactInfo.email,
    secondary_number: formData.contactInfo.alternatePhone,
    address_line: formData.contactInfo.address.street,
    city: formData.contactInfo.address.city,
    state: formData.contactInfo.address.state,
    pincode: formData.contactInfo.address.pincode,
    country: formData.contactInfo.address.country,
    emergency_contact_name: formData.contactInfo.emergencyContact.name,
    emergency_contact_relation: formData.contactInfo.emergencyContact.relationship,
    emergency_contact_phone: formData.contactInfo.emergencyContact.phone,
    experience_years: Number(formData.professionalInfo.experience || 0),
    qualification: formData.professionalInfo.qualifications,
    registration_number: formData.professionalInfo.registrationNumber,
    registration_council: formData.professionalInfo.registrationCouncil,
    registration_year: Number(formData.professionalInfo.registrationYear || 0),
    consultation_fee: Number(formData.professionalInfo.consultationFee || 0),
    followup_fee: Number(formData.professionalInfo.followUpFee || 0),
    consultation_modes: formData.professionalInfo.consultationMode,
    average_consultation_time: Number(formData.professionalInfo.averageConsultationTime),
    max_patients_per_day: Number(formData.professionalInfo.maxPatientsPerDay),
    years_of_practice: Number(formData.professionalInfo.experience || 0),
    primary_dosha_expertise: formData.ayurvedicInfo.primaryDosha,
    health_diseases: formData.ayurvedicInfo.primaryDisease,
    specialized_therapies: formData.ayurvedicInfo.therapies,
    is_panchakarma_certified: formData.ayurvedicInfo.panchakarmaCertified,
    ayurveda_practice_years: Number(formData.ayurvedicInfo.yearsInAyurveda || 0),
    ayurvedic_council_id: formData.ayurvedicInfo.ayurvedicCouncilId,
    practicing_since: formData.ayurvedicInfo.practicingSince,
    linkedin_url: formData.socialMedia.socialMedia.linkedin,
    twitter_url: formData.socialMedia.socialMedia.twitter,
    facebook_url: formData.socialMedia.socialMedia.facebook,
    instagram_url: formData.socialMedia.socialMedia.instagram,
    bank_name: formData.bankInfo.bankName,
    account_number: formData.bankInfo.accountNumber,
    ifsc_code: formData.bankInfo.ifscCode,
    account_holder_name: formData.bankInfo.accountHolderName,
    branch_name: formData.bankInfo.branchName,
    upi_id: formData.bankInfo.upiId,
    payment_terms: formData.bankInfo.paymentTerms,
    is_selected: true,

    medical_degree_certificate: removePreview(formData.documents.medicalDegree),
    registration_certificate: removePreview(formData.documents.registrationCertificate),
    identity_proof: removePreview(formData.documents.identityProof),
    address_proof: removePreview(formData.documents.addressProof),
    passport_photo: removePreview(formData.documents.passportPhoto),
    signature: removePreview(formData.documents.signature),
    experience_certificate: removePreview(formData.documents.experienceCertificate),
    pan_card: removePreview(formData.documents.panCard),
    gst_certificate: removePreview(formData.documents.gstCertificate),
    cancelled_cheque_or_bank_statement: removePreview(formData.documents.bankDetails),
});



// ==================== REUSABLE COMPONENTS ====================
const StepIndicator = ({ steps, currentStep, labels }) => {
    const getStepStatus = (step) => {
        if (step < currentStep) return 'completed';
        if (step === currentStep) return 'current';
        return 'pending';
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center relative">
                {steps.map((step) => {
                    const status = getStepStatus(step);
                    return (
                        <div key={step} className="flex-1 text-center relative">
                            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mx-auto mb-2 transition-all z-10 relative ${status === 'completed' ? 'bg-emerald-600 border-emerald-600 text-white' :
                                status === 'current' ? 'border-[#0D614E] bg-[#0D614E] text-white shadow-lg ring-4 ring-emerald-100' :
                                    'border-gray-300 bg-white text-gray-400'
                                }`}>
                                {status === 'completed' ? <CheckCircle size={20} /> : step}
                            </div>
                            <div className={`text-xs font-medium ${status === 'current' ? 'text-[#0D614E]' : 'text-gray-500'}`}>
                                {labels[step]}
                            </div>
                            {step < steps.length && (
                                <div className={`absolute top-5 left-1/2 w-full h-0.5 z-1 ${step < currentStep ? 'bg-emerald-600' : 'bg-gray-300'
                                    }`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const FormInput = ({ label, name, value, onChange, error, required, placeholder, type = "text", max, disabled, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={max}
            max={max}
            disabled={disabled}
            className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${error ? 'border-rose-500 focus:ring-rose-500 bg-rose-50' : 'border-gray-200 focus:ring-[#0D614E]'
                }`}
            {...props}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
);

const FormSelect = ({ label, name, value, onChange, error, required, options, placeholder }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            className={`w-full px-4 py-2.5 border rounded-xl capitalize focus:outline-none focus:ring-2 transition-all ${error ? 'border-rose-500 focus:ring-rose-500 bg-rose-50' : 'border-gray-200 focus:ring-[#0D614E]'
                }`}
        >
            <option value="">{placeholder || `Select ${label}`}</option>

            {
                (name === "primaryDosha" || name === "primarydisease")
                    ? options?.map((opt) => (
                        <option
                            key={typeof opt === "string" ? opt : opt.id}
                            value={typeof opt === "string" ? opt : opt.name}
                        >
                            {typeof opt === "string" ? opt : opt.name}
                        </option>
                    ))
                    : options?.map((opt) => (
                        <option
                            key={typeof opt === "string" ? opt : opt.value}
                            value={typeof opt === "string" ? opt : opt.value}
                        >
                            {typeof opt === "string" ? opt : opt.label}
                        </option>
                    ))
            }
        </select>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
);

const FormTextArea = ({ label, name, value, onChange, error, rows = 4, placeholder }) => (
    <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea
            rows={rows}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${error ? 'border-rose-500 focus:ring-rose-500 bg-rose-50' : 'border-gray-200 focus:ring-[#0D614E]'
                }`}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
);

const CheckboxGroup = ({ options, selectedValues, onChange, label, error }) => (
    <div className="md:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="flex flex-wrap gap-4 pt-4">
            {options.map(option => (
                <label key={option} className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={selectedValues.includes(option)}
                        onChange={(e) => onChange(option, e.target.checked)}
                        className={`rounded border-gray-300 text-[#0D614E] focus:ring-[#0D614E] ${error ? 'border-rose-500 focus:ring-rose-500' : ''}`}
                    />
                    <span className="text-sm text-gray-700 capitalize">{option}</span>
                </label>
            ))}
        </div>
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
);

const ChipInput = ({ label, items, onAdd, onRemove, options, error, placeholder = "Add item" }) => (
    <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="flex flex-wrap gap-2 mb-2">
            {((label === "Primary Disease Expertise")) ? items.map((item, idx) => {
                const selectedOption = options.find((data) => data.id === item);

                return selectedOption ? (
                    <span
                        key={idx}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm"
                    >
                        <span>{selectedOption.name}</span>

                        <button
                            type="button"
                            onClick={() => onRemove(idx)}
                            className="ml-1 hover:text-emerald-900"
                        >
                            <X size={14} />
                        </button>
                    </span>
                ) : null;
            }) : items.map((item, idx) => {
                const selectedOption = options.find((data) => data.id === item);

                return (
                    <span
                        key={idx}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm"
                    >
                        <span>{item}</span>

                        <button
                            type="button"
                            onClick={() => onRemove(idx)}
                            className="ml-1 hover:text-emerald-900"
                        >
                            <X size={14} />
                        </button>
                    </span>
                )
            })}
        </div>
        {
            (label === "Primary Disease Expertise")
                ?
                <select
                    onChange={(e) => { if (e.target.value) { onAdd(e.target.value); e.target.value = ''; } }}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${error ? 'border-rose-500 focus:ring-rose-500 bg-rose-50' : 'border-gray-200 focus:ring-[#0D614E]'
                        }`}
                >
                    <option value="">{placeholder}</option>
                    {options?.filter(opt => !items.includes(opt.id)).map(opt => (
                        <option key={opt} value={opt.id}>{opt.name}</option>
                    ))}
                </select>
                : <select
                    onChange={(e) => { if (e.target.value) { onAdd(e.target.value); e.target.value = ''; } }}
                    className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${error ? 'border-rose-500 focus:ring-rose-500 bg-rose-50' : 'border-gray-200 focus:ring-[#0D614E]'
                        }`}
                >
                    <option value="">{placeholder}</option>
                    {options?.filter(opt => !items.includes(opt)).map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
        }
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
);

const DocumentUploadCard = ({ documentKey, document, error, onUpload, onDelete, onView, requirements }) => {
    const fileInputRef = useRef(null);
    const req = requirements[documentKey];

    return (
        <div className={`border-2 rounded-xl p-4 transition-all ${error ? 'border-rose-300 bg-rose-50' : 'border-gray-200 hover:border-[#0D614E]'
            }`}>
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-semibold text-gray-800">{req.label}</h3>
                    <p className="text-xs text-gray-500">
                        {req.required ? 'Required' : 'Optional'} • {req.accepted.join(', ')} • Max {req.maxSize}MB
                    </p>
                </div>
                {req.required && <span className="text-sm text-rose-500">*</span>}
            </div>

            {document ? (
                <div className="bg-emerald-50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <FileCheck size={20} className="text-emerald-600" />
                        <div>
                            <p className="text-sm font-medium text-gray-800">{document.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(document.size)}</p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        {/* <a href={document.preview} target='_blank' type="button" className="p-1 hover:bg-emerald-200 rounded">
                            <Eye size={16} />
                        </a> */}
                        {/* onClick={() => onView(document.preview)} */}
                        <button type="button" onClick={() => onDelete(documentKey)} className="p-1 hover:bg-emerald-200 rounded">
                            <Trash2 size={16} className="text-rose-600" />
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#0D614E] transition-colors group"
                >
                    <Upload size={24} className="mx-auto text-gray-400 mb-2 group-hover:text-[#0D614E]" />
                    <p className="text-sm text-gray-500 group-hover:text-[#0D614E]">Click to upload</p>
                </button>
            )}
            <input
                ref={fileInputRef}
                type="file"
                accept={req.accepted.map(ext => `.${ext.toLowerCase()}`).join(',')}
                className="hidden"
                onChange={(e) => onUpload(documentKey, e.target.files[0])}
            />
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
    );
};

const SectionHeader = ({ title, description }) => (
    <div className="border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        <p className="text-gray-500 mt-1">{description}</p>
    </div>
);

const SuccessModal = ({ show, onClose }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-xl max-w-md w-full p-8 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={40} className="text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Onboarding Successful!</h3>
                <p className="text-gray-500 mb-4">Your application has been submitted successfully. Our team will review your details and contact you within 48 hours.</p>
                <br />
                <Link to="/dashboard" className="block w-full px-6 py-3 bg-[#0D614E] text-white rounded-lg font-medium hover:bg-opacity-90 hover:text-white transition-all text-center">
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
};

const SectionDivider = ({ title }) => (
    <div className="md:col-span-2 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
    </div>
);

// ==================== MAIN COMPONENT ====================
const DoctorOnboarding = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [prakritiAndDiseases, setprakritiAndDiseases] = useState({})
    const fileInputRefs = useRef({});
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [policiesOpen, setPoliciesOpen] = useState(false);

    // ==================== HANDLER FUNCTIONS ====================
    const handleInputChange = useCallback((section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: value }
        }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    }, [errors]);
    const handleNestedInputChange = useCallback((section, nested, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [nested]: { ...prev[section][nested], [field]: value }
            }
        }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    }, [errors]);

    const handleArrayAdd = useCallback((section, field, value) => {
        if (value && !formData[section][field].includes(value)) {
            setFormData(prev => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: [...prev[section][field], value]
                }
            }));
        }
    }, [formData]);

    const handleArrayRemove = useCallback((section, field, index) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: prev[section][field].filter((_, i) => i !== index)
            }
        }));
    }, []);

    const handleCheckboxToggle = useCallback((section, field, value, checked) => {
        const current = formData[section][field];
        if (checked) {
            handleInputChange(section, field, [...current, value]);
        } else {
            handleInputChange(section, field, current.filter(m => m !== value));
        }
    }, [formData, handleInputChange]);

    const handleFileUpload = useCallback((field, file) => {
        if (file) {
            const maxSize = 5 * 1024 * 1024;
            if (file.size > maxSize) {
                setErrors(prev => ({ ...prev, [field]: 'File size exceeds 5 MB limit' }));
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    documents: {
                        ...prev.documents,
                        [field]: {
                            file: file,
                            preview: reader.result,
                            name: file.name,
                            size: file.size,
                            type: file.type
                        }
                    }
                }));
                setUploadProgress(prev => ({ ...prev, [`documents.${field}`]: 100 }));
                if (errors[field]) {
                    setErrors(prev => ({ ...prev, [field]: '' }));
                }
            };
            reader.readAsDataURL(file);
        }
    }, [errors]);

    const handleDeleteDocument = useCallback((field) => {
        setFormData(prev => ({
            ...prev,
            documents: { ...prev.documents, [field]: null }
        }));
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await doctorService.getPrakritiAndDiseases();
                setprakritiAndDiseases(data)
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    // ==================== VALIDATION ====================
    const validateStep = useCallback(() => {
        const newErrors = {};

        switch (currentStep) {
            case 1:
                if (!formData.personalInfo.firstName?.trim()) newErrors.firstName = "First name is required";
                if (!formData.personalInfo.lastName?.trim()) newErrors.lastName = "Last name is required";
                if (!formData.personalInfo.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
                if (!formData.personalInfo.gender) newErrors.gender = "Gender is required";

                const social = formData.socialMedia.socialMedia;
                if (social.linkedin && !VALIDATION_PATTERNS.linkedin.test(social.linkedin)) newErrors.linkedin = "Invalid LinkedIn URL";
                if (social.twitter && !VALIDATION_PATTERNS.twitter.test(social.twitter)) newErrors.twitter = "Invalid Twitter URL";
                if (social.facebook && !VALIDATION_PATTERNS.facebook.test(social.facebook)) newErrors.facebook = "Invalid Facebook URL";
                if (social.instagram && !VALIDATION_PATTERNS.instagram.test(social.instagram)) newErrors.instagram = "Invalid Instagram URL";
                break;

            case 2:
                if (!formData.contactInfo.email?.trim()) newErrors.email = "Email is required";
                else if (!VALIDATION_PATTERNS.email.test(formData.contactInfo.email)) newErrors.email = "Invalid email format";

                // if (!formData.contactInfo.phone?.trim()) newErrors.phone = "Phone number is required";
                // else if (!VALIDATION_PATTERNS.phone.test(formData.contactInfo.phone)) newErrors.phone = "Invalid phone number";

                if (!formData.contactInfo.address?.street?.trim()) newErrors.street = "Street is required";
                if (!formData.contactInfo.address?.city?.trim()) newErrors.city = "City is required";
                if (!formData.contactInfo.address?.state?.trim()) newErrors.state = "State is required";

                if (!formData.contactInfo.address?.pincode?.trim()) newErrors.pincode = "Pincode is required";
                else if (!VALIDATION_PATTERNS.pincode.test(formData.contactInfo.address.pincode)) newErrors.pincode = "Invalid pincode";
                break;

            case 3:
                if (!formData.professionalInfo.qualifications?.trim()) newErrors.qualifications = "Qualifications are required";
                if (!formData.professionalInfo.registrationNumber?.trim()) newErrors.registrationNumber = "Registration number is required";
                if (!formData.professionalInfo.experience?.toString().trim()) newErrors.experience = "Experience is required";
                // if (!formData.ayurvedicInfo.primaryDosha) newErrors.primaryDosha = "Primary dosha is required";
                if (!formData.ayurvedicInfo.primaryDisease) newErrors.primaryDisease = "Primary disease is required";
                if (!formData.professionalInfo.consultationFee) newErrors.consultationFee = "Consultation fee is required";
                else if (Number(formData.professionalInfo.consultationFee) <= 0) newErrors.consultationFee = "Enter valid fee";
                break;

            case 4:
                if (!formData.documents.medicalDegree) newErrors.medicalDegree = "Medical degree required";
                if (!formData.documents.registrationCertificate) newErrors.registrationCertificate = "Registration certificate required";
                if (!formData.documents.identityProof) newErrors.identityProof = "Identity proof required";
                if (!formData.documents.signature) newErrors.signature = "Signature required";
                if (!formData.documents.experienceCertificate) newErrors.experienceCertificate = "Experience certificate required";
                break;

            case 5:
                if (!formData.bankInfo.accountHolderName?.trim()) newErrors.accountHolderName = "Account holder name required";
                if (!formData.bankInfo.accountNumber?.trim()) newErrors.accountNumber = "Account number required";
                if (!formData.bankInfo.confirmAccountNumber?.trim()) newErrors.confirmAccountNumber = "Confirm account number required";
                else if (formData.bankInfo.accountNumber !== formData.bankInfo.confirmAccountNumber) newErrors.confirmAccountNumber = "Account numbers do not match";

                if (!formData.bankInfo.ifscCode?.trim()) newErrors.ifscCode = "IFSC required";
                else if (!VALIDATION_PATTERNS.ifsc.test(formData.bankInfo.ifscCode)) newErrors.ifscCode = "Invalid IFSC code";
                break;

            case 6:
                if (!formData.agreements.allPoliciesAccepted) {
                    newErrors.allPoliciesAccepted = "Please review and accept all policies";
                }
                break;

            default: break;
        }
        return newErrors;
    }, [formData, currentStep]);

    // ==================== NAVIGATION ====================
    const nextStep = useCallback(() => {
        const stepErrors = validateStep();
        if (Object.keys(stepErrors).length === 0) {
            setErrors({});
            setCurrentStep(prev => Math.min(prev + 1, 6));
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            setErrors(stepErrors);
            const firstErrorKey = Object.keys(stepErrors)[0];
            const element = document.querySelector(`[name="${firstErrorKey}"]`);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                element.focus();
            }
        }
    }, [validateStep]);

    const prevStep = useCallback(() => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handlePoliciesAcceptChange = useCallback((accepted) => {
        setFormData((prev) => ({
            ...prev,
            agreements: {
                ...prev.agreements,
                allPoliciesAccepted: accepted,
                termsAccepted: accepted,
                privacyAccepted: accepted,
            },
        }));
        if (accepted) {
            setErrors((prev) => ({ ...prev, allPoliciesAccepted: "" }));
        }
    }, []);

    // ==================== SUBMIT ====================
    const handleSubmit = useCallback(async () => {
        if (!formData.agreements.allPoliciesAccepted) {
            setErrors((prev) => ({
                ...prev,
                allPoliciesAccepted: "Please review and accept all policies",
            }));
            return;
        }

        const stepErrors = validateStep();
        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors);
            toast.error("Please complete all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await doctorService.createOnboarding(transformToApiFormat(formData));
            if (response?.data?.success) {
                try {
                    await acceptLegalPolicies("all");
                } catch (policyError) {
                    console.error(policyError);
                    toast.error(policyError?.message || "Profile saved, but policy acceptance failed");
                }

                const localdata = {
                    phone_number: formData?.contactInfo?.phone,
                    email: formData?.contactInfo?.email,
                    first_name: formData?.personalInfo?.firstName,
                    last_name: formData?.personalInfo?.lastName,
                    verify: false
                };
                sessionStorage.setItem("profile", JSON.stringify(localdata));
                toast.success("All steps completed successfully 🎉");
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false)
                    window.location.replace("/doctor/profile")
                }, 4000);
            }
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Submission failed, Retry");
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateStep]);

    // ==================== RENDER ====================
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <SuccessModal show={showSuccess} />

            {/* Header */}
            <div className="bg-gradient-to-r from-[#0D614E] to-[#0a4d3e] text-white pb-10">
                <div className="max-w-6xl mx-auto px-8 py-12">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-4">
                            <Stethoscope size={40} />
                        </div>
                        <h1 className="text-4xl font-bold mb-2 text-white">Join Our Healing Community</h1>
                        <p className="text-emerald-100 text-lg">Become a part of India's largest Ayurvedic platform</p>
                        <div className="mt-6 flex justify-center space-x-8">
                            <div className="text-center"><p className="text-2xl font-bold text-white">500+</p><p className="text-xs text-emerald-100">Active Doctors</p></div>
                            <div className="text-center"><p className="text-2xl font-bold text-white">10k+</p><p className="text-xs text-emerald-100">Happy Patients</p></div>
                            <div className="text-center"><p className="text-2xl font-bold text-white">24/7</p><p className="text-xs text-emerald-100">Support</p></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="max-w-6xl mx-auto px-8 -mt-8">
                <StepIndicator steps={STEPS} currentStep={currentStep} labels={STEP_LABELS} />
            </div>

            {/* Form Content */}
            <div className="max-w-6xl mx-auto px-8 py-8">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                        <div className="p-8">
                            {/* Step 1: Personal Information */}
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <SectionHeader title="Personal Information" description="Tell us about yourself" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormSelect label="Title" name="title" value={formData.personalInfo.title}
                                            onChange={(e) => handleInputChange('personalInfo', 'title', e.target.value)}
                                            options={TITLES} />

                                        <FormInput label="First Name" name="firstName" value={formData.personalInfo.firstName}
                                            onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                                            error={errors.firstName} required placeholder="Enter first name" />

                                        <FormInput label="Last Name" name="lastName" value={formData.personalInfo.lastName}
                                            onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                                            error={errors.lastName} required placeholder="Enter last name" />

                                        <FormInput label="Date of Birth" name="dateOfBirth" value={formData.personalInfo.dateOfBirth}
                                            onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
                                            error={errors.dateOfBirth} required type="date"
                                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 25)).toISOString().split("T")[0]} />

                                        <FormSelect label="Gender" name="gender" value={formData.personalInfo.gender}
                                            onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
                                            error={errors.gender} required options={GENDERS} />

                                        <FormInput label="Nationality" name="nationality" value={formData.personalInfo.nationality}
                                            onChange={(e) => handleInputChange('personalInfo', 'nationality', e.target.value)}
                                            placeholder="Indian" />

                                        <ChipInput label="Languages Spoken" items={formData.personalInfo.languages}
                                            onAdd={(val) => handleArrayAdd('personalInfo', 'languages', val)}
                                            onRemove={(idx) => handleArrayRemove('personalInfo', 'languages', idx)}
                                            options={LANGUAGES} error={errors.languages} />

                                        <FormTextArea label="Bio / Professional Summary" name="bio" value={formData.personalInfo.bio}
                                            onChange={(e) => handleInputChange('personalInfo', 'bio', e.target.value)}
                                            placeholder="Tell us about your professional journey, expertise, and philosophy..." />

                                        <SectionDivider title="Social Media Profiles" />

                                        <FormInput label="LinkedIn" name="linkedin" value={formData.socialMedia.socialMedia.linkedin}
                                            onChange={(e) => handleNestedInputChange('socialMedia', 'socialMedia', 'linkedin', e.target.value)}
                                            error={errors.linkedin} placeholder="https://www.linkedin.com/in/username..." type="url" />

                                        <FormInput label="Twitter / X" name="twitter" value={formData.socialMedia.socialMedia.twitter}
                                            onChange={(e) => handleNestedInputChange('socialMedia', 'socialMedia', 'twitter', e.target.value)}
                                            error={errors.twitter} placeholder="https://x.com/username..." type="url" />

                                        <FormInput label="Facebook" name="facebook" value={formData.socialMedia.socialMedia.facebook}
                                            onChange={(e) => handleNestedInputChange('socialMedia', 'socialMedia', 'facebook', e.target.value)}
                                            error={errors.facebook} placeholder="https://www.facebook.com/username..." type="url" />

                                        <FormInput label="Instagram" name="instagram" value={formData.socialMedia.socialMedia.instagram}
                                            onChange={(e) => handleNestedInputChange('socialMedia', 'socialMedia', 'instagram', e.target.value)}
                                            error={errors.instagram} placeholder="https://www.instagram.com/username..." type="url" />
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Contact Information */}
                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <SectionHeader title="Contact Information" description="How can we reach you?" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormInput label="Email Address" name="email" value={formData.contactInfo.email}
                                            onChange={(e) => handleInputChange('contactInfo', 'email', e.target.value)}
                                            error={errors.email} required placeholder="doctor@example.com" type="email" />

                                        {/* <FormInput label="Mobile Number" name="phone" value={formData.contactInfo.phone}
                                            onChange={(e) => handleInputChange('contactInfo', 'phone', e.target.value)}
                                            error={errors.phone} required placeholder="+91 XXXXXXXXXX" type="tel" /> */}

                                        <FormInput label="Alternate Number" max={10} name="alternatePhone" value={formData.contactInfo.alternatePhone}
                                            onChange={(e) => handleInputChange('contactInfo', 'alternatePhone', e.target.value)}
                                            error={errors.alternatePhone} placeholder="Optional" type="tel" />

                                        <div className="md:col-span-2">
                                            <FormInput label="Street Address" name="street" value={formData.contactInfo.address.street}
                                                onChange={(e) => handleNestedInputChange('contactInfo', 'address', 'street', e.target.value)}
                                                error={errors.street} required placeholder="House No, Building, Street" />
                                        </div>

                                        <FormInput label="City" name="city" value={formData.contactInfo.address.city}
                                            onChange={(e) => handleNestedInputChange('contactInfo', 'address', 'city', e.target.value)}
                                            error={errors.city} required placeholder="Enter city" />

                                        <FormInput label="State" name="state" value={formData.contactInfo.address.state}
                                            onChange={(e) => handleNestedInputChange('contactInfo', 'address', 'state', e.target.value)}
                                            error={errors.state} required placeholder="Enter state" />

                                        <FormInput label="Pincode" name="pincode" max={6} value={formData.contactInfo.address.pincode}
                                            onChange={(e) => handleNestedInputChange('contactInfo', 'address', 'pincode', e.target.value)}
                                            error={errors.pincode} required placeholder="Enter pincode" />

                                        <FormInput label="Country" name="country" value={formData.contactInfo.address.country}
                                            onChange={(e) => handleNestedInputChange('contactInfo', 'address', 'country', e.target.value)}
                                            placeholder="Enter country" />

                                        <SectionDivider title="Emergency Contact" />

                                        <FormInput label="Emergency Contact Name" max={10} name="emergencyName" value={formData.contactInfo.emergencyContact.name}
                                            onChange={(e) => handleNestedInputChange('contactInfo', 'emergencyContact', 'name', e.target.value)}
                                            placeholder="Enter emergency contact name" />

                                        <FormInput label="Relationship" name="relationship" value={formData.contactInfo.emergencyContact.relationship}
                                            onChange={(e) => handleNestedInputChange('contactInfo', 'emergencyContact', 'relationship', e.target.value)}
                                            placeholder="Enter relationship" />

                                        <FormInput label="Emergency Phone" name="emergencyPhone" value={formData.contactInfo.emergencyContact.phone}
                                            onChange={(e) => handleNestedInputChange('contactInfo', 'emergencyContact', 'phone', e.target.value)}
                                            placeholder="Enter emergency phone" type="tel" />
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Professional Information */}
                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <SectionHeader title="Professional Information" description="Tell us about your medical practice" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormInput label="Highest Qualification" name="qualifications" value={formData.professionalInfo.qualifications}
                                            onChange={(e) => handleInputChange('professionalInfo', 'qualifications', e.target.value)}
                                            error={errors.qualifications} required placeholder="Qualifications (e.g. BAMS, MD Ayurveda, etc.)" />

                                        <FormInput label="Total Experience" name="experience" value={formData.professionalInfo.experience}
                                            onChange={(e) => handleInputChange('professionalInfo', 'experience', e.target.value)}
                                            error={errors.experience} required type="number" placeholder="Years" />

                                        <FormInput label="Registration Number" name="registrationNumber" value={formData.professionalInfo.registrationNumber}
                                            onChange={(e) => handleInputChange('professionalInfo', 'registrationNumber', e.target.value)}
                                            error={errors.registrationNumber} required placeholder="Medical Council Registration Number" />

                                        <FormInput label="Registration Year" name="registrationYear" value={formData.professionalInfo.registrationYear}
                                            onChange={(e) => handleInputChange('professionalInfo', 'registrationYear', e.target.value)}
                                            type="number" placeholder="Year of registration" />

                                        {/* <FormSelect label="Primary Dosha Expertise" name="primaryDosha" value={formData.ayurvedicInfo.primaryDosha}
                                            onChange={(e) => handleInputChange('ayurvedicInfo', 'primaryDosha', e.target.value)}
                                            error={errors.primaryDosha} required options={prakritiAndDiseases?.prakriti?.data} /> */}

                                        <ChipInput name=" " label="Primary Disease Expertise" items={formData.ayurvedicInfo.primaryDisease}
                                            onAdd={(val) => handleArrayAdd('ayurvedicInfo', 'primaryDisease', val)}
                                            onRemove={(idx) => handleArrayRemove('ayurvedicInfo', 'primaryDisease', idx)}
                                            options={prakritiAndDiseases?.diseases?.data} error={errors.primaryDisease} />
                                        {/* <FormSelect label="Primary Disease Expertise" name="primarydisease" value={formData.ayurvedicInfo.primaryDisease}
                                            onChange={(e) => handleInputChange('ayurvedicInfo', 'primaryDisease', e.target.value)}
                                            error={errors.primaryDisease} required options={DOSHA_OPTIONS} /> */}

                                        <FormInput label="Ayurvedic Council ID" name="ayurvedicCouncilId" value={formData.ayurvedicInfo.ayurvedicCouncilId}
                                            onChange={(e) => handleInputChange('ayurvedicInfo', 'ayurvedicCouncilId', e.target.value)}
                                            placeholder="Ayurvedic Council ID (if registered)" />

                                        <FormInput label="Practicing Since" name="practicingSince" value={formData.ayurvedicInfo.practicingSince}
                                            onChange={(e) => handleInputChange('ayurvedicInfo', 'practicingSince', e.target.value)}
                                            type="date" placeholder="Date you started practicing" />

                                        <FormInput label="Consultation Fee (₹)" name="consultationFee" value={formData.professionalInfo.consultationFee}
                                            // onChange={(e) => handleInputChange('professionalInfo', 'consultationFee', e.target.value)}
                                            disabled={true}
                                            error={errors.consultationFee} required type="number" placeholder="Amount in INR" />

                                        <FormInput label="Follow-up Fee (₹)" name="followUpFee" value={formData.professionalInfo.followUpFee}
                                            onChange={(e) => handleInputChange('professionalInfo', 'followUpFee', e.target.value)}
                                            type="number" placeholder="Amount in INR" />

                                        <FormInput label="Average Consultation Time (minutes)" name="averageConsultationTime" value={formData.professionalInfo.averageConsultationTime}
                                            // onChange={(e) => handleInputChange('professionalInfo', 'averageConsultationTime', e.target.value)}
                                            type="number" placeholder="Average time spent per consultation" />

                                        <FormInput label="Max Patients Per Day" name="maxPatientsPerDay" value={formData.professionalInfo.maxPatientsPerDay}
                                            onChange={(e) => handleInputChange('professionalInfo', 'maxPatientsPerDay', e.target.value)}
                                            type="number" placeholder="Maximum number of patients per day" />

                                        {/* <CheckboxGroup label="Consultation Mode" options={CONSULTATION_MODES}
                                            selectedValues={formData.professionalInfo.consultationMode}
                                            onChange={(mode, checked) => handleCheckboxToggle('professionalInfo', 'consultationMode', mode, checked)} />

                                        <div className="md:col-span-2">
                                            <label className="flex items-center space-x-2">
                                                <input type="checkbox" checked={formData.ayurvedicInfo.panchakarmaCertified}
                                                    onChange={(e) => handleInputChange('ayurvedicInfo', 'panchakarmaCertified', e.target.checked)}
                                                    className="rounded border-gray-300 text-[#0D614E] focus:ring-[#0D614E] w-4 h-4" />
                                                <span className="text-sm text-gray-700">I am Panchakarma Certified</span>
                                            </label>
                                        </div>

                                        <ChipInput label="Specialized Therapies" items={formData.ayurvedicInfo.therapies}
                                            onAdd={(val) => handleInputChange('ayurvedicInfo', 'therapies', [...formData.ayurvedicInfo.therapies, val])}
                                            onRemove={(idx) => handleInputChange('ayurvedicInfo', 'therapies', formData.ayurvedicInfo.therapies.filter((_, i) => i !== idx))}
                                            options={THERAPIES} placeholder="Add Therapy" /> */}
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Document Upload */}
                            {currentStep === 4 && (
                                <div className="space-y-6">
                                    <SectionHeader title="Document Upload" description="Upload required documents for verification" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {Object.entries(DOCUMENT_REQUIREMENTS).map(([key, req]) => (
                                            <DocumentUploadCard
                                                key={key}
                                                documentKey={key}
                                                document={formData.documents[key]}
                                                error={errors[key]}
                                                onUpload={(field, file) => handleFileUpload(field, file)}
                                                onDelete={handleDeleteDocument}
                                                onView={(url) => window.open(url, '_blank')}
                                                requirements={DOCUMENT_REQUIREMENTS}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Bank Details */}
                            {currentStep === 5 && (
                                <div className="space-y-6">
                                    <SectionHeader title="Bank Details" description="Payment settlement information" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <FormInput label="Account Holder Name" name="accountHolderName" value={formData.bankInfo.accountHolderName}
                                                onChange={(e) => handleInputChange('bankInfo', 'accountHolderName', e.target.value)}
                                                error={errors.accountHolderName} required placeholder="Name as per bank records" />
                                        </div>

                                        <FormInput label="Account Number" max={18} name="accountNumber" value={formData.bankInfo.accountNumber}
                                            onChange={(e) => handleInputChange('bankInfo', 'accountNumber', e.target.value)}
                                            error={errors.accountNumber} required placeholder="Bank account number" />

                                        <FormInput label="Confirm Account Number" max={18} name="confirmAccountNumber" value={formData.bankInfo.confirmAccountNumber}
                                            onChange={(e) => handleInputChange('bankInfo', 'confirmAccountNumber', e.target.value)}
                                            error={errors.confirmAccountNumber} required placeholder="Confirm your bank account number" />

                                        <FormInput label="IFSC Code" name="ifscCode" value={formData.bankInfo.ifscCode}
                                            onChange={(e) => handleInputChange('bankInfo', 'ifscCode', e.target.value.toUpperCase())}
                                            error={errors.ifscCode} required placeholder="XXXX0000000" />

                                        <FormInput label="Bank Name" name="bankName" value={formData.bankInfo.bankName}
                                            onChange={(e) => handleInputChange('bankInfo', 'bankName', e.target.value)}
                                            placeholder="Bank Name" />

                                        <FormInput label="Branch Name" name="branchName" value={formData.bankInfo.branchName}
                                            onChange={(e) => handleInputChange('bankInfo', 'branchName', e.target.value)}
                                            placeholder="Branch Name" />

                                        <FormInput label="UPI ID" name="upiId" value={formData.bankInfo.upiId}
                                            onChange={(e) => handleInputChange('bankInfo', 'upiId', e.target.value)}
                                            placeholder="yourname@upi" />

                                        <div className="md:col-span-2">
                                            <FormSelect label="Payment Terms & Conditions" name="paymentTerms" value={formData.bankInfo.paymentTerms}
                                                onChange={(e) => handleInputChange('bankInfo', 'paymentTerms', e.target.value)}
                                                options={PAYMENT_TERMS} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 6: Agreement */}
                            {currentStep === 6 && (
                                <div className="space-y-6">
                                    <SectionHeader icon={Shield} title="Terms of Service & Privacy Policy" description="Review and accept the terms" />

                                    <div className="rounded-2xl border border-gray-200 bg-gray-50/80 p-5">
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">
                                                    Legal policies
                                                </p>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    Open the list, read each policy by name, then accept all.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setPoliciesOpen(true)}
                                                className="inline-flex items-center justify-center rounded-lg bg-[#0D614E] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0a4f3f]"
                                            >
                                                {formData.agreements.allPoliciesAccepted
                                                    ? "View policies"
                                                    : "Review & accept policies"}
                                            </button>
                                        </div>

                                        {formData.agreements.allPoliciesAccepted ? (
                                            <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                                                <CheckCircle size={16} />
                                                All policies accepted
                                            </p>
                                        ) : null}
                                        {errors.allPoliciesAccepted && (
                                            <p className="mt-3 text-sm text-red-500">{errors.allPoliciesAccepted}</p>
                                        )}
                                    </div>

                                    <div className="border-t border-gray-200 pt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                                <input type="date" value={formData.agreements.agreeDate} disabled
                                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50" />
                                            </div>
                                        </div>
                                    </div>

                                    <PoliciesListPopup
                                        open={policiesOpen}
                                        onClose={() => setPoliciesOpen(false)}
                                        accepted={formData.agreements.allPoliciesAccepted}
                                        onAcceptChange={handlePoliciesAcceptChange}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center px-8 py-6 bg-gray-50 border-t border-gray-200">
                            <button type="button" onClick={prevStep}
                                className={`flex items-center space-x-2 px-6 py-2 rounded-lg transition-all ${currentStep > 1
                                    ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                    : 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                                    }`} disabled={currentStep === 1}>
                                <ChevronLeft size={18} /><span>Previous</span>
                            </button>

                            {currentStep < 6 ? (
                                <button type="button" onClick={nextStep}
                                    className="flex items-center space-x-2 px-6 py-2 bg-[#0D614E] text-white rounded-lg hover:bg-opacity-90 transition-all">
                                    <span>Next</span><ChevronRight size={18} />
                                </button>
                            ) : (
                                <button type="submit" disabled={isSubmitting || !formData.agreements.allPoliciesAccepted}
                                    className="flex items-center space-x-2 px-8 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50">
                                    {isSubmitting ? (
                                        <><RefreshCw size={18} className="animate-spin" /><span>Submitting...</span></>
                                    ) : (
                                        <><CheckCircle size={18} /><span>Submit Application</span></>
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in { animation: fade-in 0.3s ease-out; }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default DoctorOnboarding;