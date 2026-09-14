// VendorOnboarding.jsx - Optimized & Scalable Version (No functionality changes)
import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
    Building, Store, MapPin, FileText, Upload, CheckCircle, AlertCircle,
    ChevronRight, Trash2, Eye, Award, Shield, Sparkles, Gift, RefreshCw,
    X, ArrowLeft, Info, Banknote, FileCheck
} from 'lucide-react';
import { vendorService } from '../../../services/vendorService';
import { acceptLegalPolicies } from '../../../services/policyService';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import PoliciesListPopup from '../../../Doctor_dashboard/components/onboarding/policyslist';

// ==================== CONSTANTS ====================
const BUSINESS_TYPES = [
    'Proprietorship', 'Partnership', 'Private Limited', 'Public Limited',
    'LLP', 'Trust', 'Society', 'Co-operative', 'Individual'
];

const PAYMENT_TERMS = [
    { value: 'net15', label: 'Net 15 days' },
    { value: 'net30', label: 'Net 30 days' },
    { value: 'net45', label: 'Net 45 days' },
    { value: 'net60', label: 'Net 60 days' }
];

const PRODUCT_CATEGORIES = [
    'Ayurvedic Medicines', 'Herbal Supplements', 'Personal Care', 'Skin Care',
    'Hair Care', 'Health Drinks', 'Essential Oils', 'Incense & Aromatherapy',
    'Ayurvedic Books', 'Panchakarma Equipment', 'Herbal Teas', 'Organic Products'
];

const PRODUCT_TYPES = [
    'Tablets/Capsules', 'Powders', 'Liquids/Syrups', 'Oils', 'Creams/Ointments',
    'Raw Herbs', 'Churnas', 'Vatis', 'Asavas/Arishtas', 'Lehyams', 'Rasayanas'
];

const CERTIFICATIONS = [
    'GMP Certified', 'ISO Certified', 'USDA Organic', 'India Organic',
    'Halal Certified', 'Kosher Certified', 'Non-GMO', 'Vegan Certified',
    'Ayush Premium Mark', 'WHO-GMP'
];

const DOCUMENT_REQUIREMENTS = {
    gstCertificate: { label: 'GST Certificate', required: true, accepted: ['PDF', 'JPG', 'PNG'], maxSize: 5, errorKey: 'gstCertificate' },
    panCard: { label: 'PAN Card', required: true, accepted: ['PDF', 'JPG', 'PNG'], maxSize: 2, errorKey: 'panCard' },
    shopEstablishment: { label: 'Shop & Establishment Certificate', required: false, accepted: ['PDF'], maxSize: 5, errorKey: 'shopEstablishment' },
    fssaiLicense: { label: 'FSSAI License', required: false, accepted: ['PDF'], maxSize: 5, errorKey: 'fssaiLicense' },
    ayurvedicLicense: { label: 'Ayurvedic Manufacturing License', required: false, accepted: ['PDF'], maxSize: 5, errorKey: 'ayurvedicLicense' },
    bankStatement: { label: 'Bank Statement (Last 6 months)', required: false, accepted: ['PDF'], maxSize: 10, errorKey: 'bankStatement' },
    cancelledCheque: { label: 'Cancelled Cheque', required: true, accepted: ['PDF', 'JPG', 'PNG'], maxSize: 2, errorKey: 'cancelledCheque' },
    productCatalog: { label: 'Product Catalog/Brochure', required: false, accepted: ['PDF'], maxSize: 20, errorKey: 'productCatalog' },
    logo: { label: 'Company Logo', required: false, accepted: ['JPG', 'PNG'], maxSize: 1, errorKey: 'logo' }
};

const VALIDATION_PATTERNS = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[6-9]\d{9}$/,
    pincode: /^[1-9][0-9]{5}$/,
    ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/i,
    gst: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    fssai: /^\d{14}$/,
    ayush: /^[A-Z0-9\/-]{6,30}$/i
};

const STEPS = [1, 2, 3, 4, 5];
const STEP_LABELS = { 1: 'Business', 2: 'Contact', 3: 'Bank', 4: 'Documents', 5: 'Agreement' };

// ==================== INITIAL STATE ====================
const INITIAL_FORM_STATE = {
    businessInfo: {
        businessName: '', legalName: '', businessType: '', gstNumber: '', panNumber: '',
        yearEstablished: '', employeeCount: '', website: '', businessEmail: '', businessPhone: '',
        alternatePhone: '', description: '', ayushLicenseNumber: '', fssaiNumber: ''
    },
    contactInfo: {
        address: { street: '', city: '', state: '', pincode: '', country: 'India' },
        contactPerson: { name: '', designation: '', email: '', phone: '', alternatePhone: '' }
    },
    productInfo: {
        productCategories: [], productTypes: [], primaryProducts: [], certifications: [],
        qualityAssurance: '', deliveryTimeline: '', minimumOrderQuantity: '',
        sampleAvailable: false, returnPolicy: '', warrantyInfo: ''
    },
    bankInfo: {
        accountHolderName: '', accountNumber: '', confirmAccountNumber: '', ifscCode: '',
        bankName: '', branchName: '', upiId: '', paymentTerms: 'net30'
    },
    documents: {
        gstCertificate: null, panCard: null, shopEstablishment: null, fssaiLicense: null,
        ayurvedicLicense: null, bankStatement: null, cancelledCheque: null, productCatalog: null, logo: null
    },
    agreements: {
        termsAccepted: false, privacyAccepted: false, vendorAgreementAccepted: false,
        allPoliciesAccepted: false,
        signature: '', agreeDate: new Date().toISOString().split('T')[0]
    }
};

// ==================== HELPER FUNCTIONS ====================
const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const getDocumentUrl = (doc) => doc?.url || null;

const transformToApiFormat = (formData) => ({
    business_name: formData.businessInfo.businessName,
    legal_name: formData.businessInfo.legalName,
    business_type: formData.businessInfo.businessType,
    gst_number: formData.businessInfo.gstNumber,
    pan_number: formData.businessInfo.panNumber,
    license_number: formData.businessInfo.ayushLicenseNumber,
    fssai_number: formData.businessInfo.fssaiNumber,
    year_established: formData.businessInfo.yearEstablished ? parseInt(formData.businessInfo.yearEstablished) : null,
    employee_count: formData.businessInfo.employeeCount,
    business_email: formData.businessInfo.businessEmail,
    business_phone: formData.businessInfo.businessPhone,
    alternate_phone: formData.businessInfo.alternatePhone,
    website: formData.businessInfo.website,
    business_description: formData.businessInfo.description,
    street_address: formData.contactInfo.address.street,
    city: formData.contactInfo.address.city,
    state: formData.contactInfo.address.state,
    pincode: formData.contactInfo.address.pincode,
    contact_person_name: formData.contactInfo.contactPerson.name,
    contact_person_designation: formData.contactInfo.contactPerson.designation,
    contact_person_email_address: formData.contactInfo.contactPerson.email,
    contact_person_phone_number: formData.contactInfo.contactPerson.phone,
    contact_person_alternate_phone: formData.contactInfo.contactPerson.alternatePhone,
    documents: {
        gst_certificate: getDocumentUrl(formData.documents.gstCertificate),
        pan_card: getDocumentUrl(formData.documents.panCard),
        establishment_certificate: getDocumentUrl(formData.documents.shopEstablishment),
        fssai_license: getDocumentUrl(formData.documents.fssaiLicense),
        ayurvedic_manufacturing_license: getDocumentUrl(formData.documents.ayurvedicLicense),
        bank_statement: getDocumentUrl(formData.documents.bankStatement),
        cancelled_cheque: getDocumentUrl(formData.documents.cancelledCheque),
        product_catalog: getDocumentUrl(formData.documents.productCatalog),
        company_logo: getDocumentUrl(formData.documents.logo)
    },
    bank_details: {
        account_holder_name: formData.bankInfo.accountHolderName,
        account_number: formData.bankInfo.accountNumber,
        ifsc_code: formData.bankInfo.ifscCode,
        bank_name: formData.bankInfo.bankName,
        branch_name: formData.bankInfo.branchName,
        upi_id: formData.bankInfo.upiId,
        payment_terms: formData.bankInfo.paymentTerms.replace('net', '')
    },
    agreement: {
        digital_signature: formData.agreements.signature || null,
        date: formData.agreements.agreeDate
    }
});

// ==================== REUSABLE COMPONENTS ====================
const StepIndicator = ({ steps, currentStep, labels }) => {
    const getStepStatus = (step) => {
        if (step < currentStep) return 'completed';
        if (step === currentStep) return 'current';
        return 'pending';
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6">
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
                                <div className={`absolute top-6 left-1/2 w-full h-0.5 -z-0 ${step < currentStep ? 'bg-emerald-600' : 'bg-gray-300'
                                    }`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const FormInput = ({ label, name, value, onChange, error, required, placeholder, type = "text", ...props }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${error ? 'border-rose-500 focus:ring-rose-500 bg-rose-50' : 'border-gray-200 focus:ring-[#0D614E]'
                }`}
            {...props}
        />
        {error && <FormError message={error} />}
    </div>
);

const FormSelect = ({ label, name, value, onChange, error, required, options, placeholder }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <select
            name={name}
            value={value}
            onChange={onChange}
            className={`w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 transition-all ${error ? 'border-rose-500 focus:ring-rose-500 bg-rose-50' : 'border-gray-200 focus:ring-[#0D614E]'
                }`}
        >
            <option value="">{placeholder || `Select ${label}`}</option>
            {options.map(opt => (
                <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                    {typeof opt === 'string' ? opt : opt.label}
                </option>
            ))}
        </select>
        {error && <FormError message={error} />}
    </div>
);

const FormTextArea = ({ label, name, value, onChange, rows = 4, placeholder }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea
            rows={rows}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D614E]"
        />
    </div>
);

const FormError = ({ message }) => (
    <div className="flex items-center space-x-1 mt-1">
        <AlertCircle size={12} className="text-rose-500" />
        <p className="text-xs text-rose-500">{message}</p>
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
                {req.required && <span className="text-xs text-rose-500">*</span>}
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
                        <button type="button" onClick={() => onView(document.preview)} className="p-1 hover:bg-emerald-200 rounded">
                            <Eye size={16} />
                        </button>
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
            {error && <FormError message={error} />}
        </div>
    );
};

const SuccessModal = ({ show, onClose }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={40} className="text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Vendor Registration Successful! 🎉</h3>
                <p className="text-gray-500 mb-4">Your application has been submitted successfully. Our team will review your details and contact you within 48 hours.</p>
                <Link to="/dashboard" className="w-full px-6 py-3 bg-[#0D614E] text-white rounded-lg font-medium hover:bg-opacity-90 hover:text-white transition-all">
                    Go to Dashboard
                </Link>
            </div>
        </div>
    );
};

const CelebrationParticles = ({ show }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(15)].map((_, i) => (
                <div key={i} className="absolute animate-float" style={{
                    left: `${Math.random() * 100}%`,
                    top: '50%',
                    animationDelay: `${Math.random() * 2}s`
                }}>
                    <Sparkles size={16 + Math.random() * 16} className="text-emerald-500" />
                </div>
            ))}
        </div>
    );
};

const SectionHeader = ({ icon: Icon, title, description }) => (
    <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Icon size={20} className="text-[#0D614E]" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                <p className="text-gray-500 mt-1">{description}</p>
            </div>
        </div>
    </div>
);

// ==================== MAIN COMPONENT ====================
const VendorOnboarding = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [touchedFields, setTouchedFields] = useState({});
    const [showCelebration, setShowCelebration] = useState(false);
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
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 2000);
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

    const handleFileUpload = useCallback(async (field, file) => {
        if (file) {
            const data = await vendorService.uploadfiles(file, "vendor_document");
            if (data?.data?.success) {
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
                                url: data?.data?.data?.url || ""
                            }
                        }
                    }));
                    setUploadProgress(prev => ({ ...prev, [`documents.${field}`]: 100 }));
                    setTouchedFields(prev => ({ ...prev, [`documents.${field}`]: true }));
                    if (errors[field]) {
                        setErrors(prev => ({ ...prev, [field]: '' }));
                    }
                };
                reader.readAsDataURL(file);
            } else {
                toast.error("Try again.");
            }
        }
    }, [errors]);

    // ==================== VALIDATION ====================
    const validateStep = useCallback(() => {
        const newErrors = {};

        switch (currentStep) {
            case 1:
                if (!formData.businessInfo.businessName?.trim()) newErrors.businessName = "Business name is required";
                if (!formData.businessInfo.businessType?.trim()) newErrors.businessType = "Business type is required";
                if (!formData.businessInfo.gstNumber?.trim()) newErrors.gstNumber = "GST number is required";
                else if (!VALIDATION_PATTERNS.gst.test(formData.businessInfo.gstNumber)) newErrors.gstNumber = "Invalid GST number format";

                if (!formData.businessInfo.panNumber?.trim()) newErrors.panNumber = "PAN number is required";
                else if (!VALIDATION_PATTERNS.pan.test(formData.businessInfo.panNumber)) newErrors.panNumber = "Invalid PAN number format";

                if (!formData.businessInfo.businessEmail?.trim()) newErrors.businessEmail = "Email is required";
                else if (!VALIDATION_PATTERNS.email.test(formData.businessInfo.businessEmail)) newErrors.businessEmail = "Invalid email format";

                if (!formData.businessInfo.businessPhone?.trim()) newErrors.businessPhone = "Phone number is required";
                else if (!VALIDATION_PATTERNS.phone.test(formData.businessInfo.businessPhone)) newErrors.businessPhone = "Invalid phone number";

                if (!formData.businessInfo.fssaiNumber?.trim()) newErrors.fssaiNumber = "FSSAI number is required";
                else if (!VALIDATION_PATTERNS.fssai.test(formData.businessInfo.fssaiNumber)) newErrors.fssaiNumber = "FSSAI number must be 14 digits";

                if (!formData.businessInfo.ayushLicenseNumber?.trim()) newErrors.ayushLicenseNumber = "AYUSH license number is required";
                else if (!VALIDATION_PATTERNS.ayush.test(formData.businessInfo.ayushLicenseNumber)) newErrors.ayushLicenseNumber = "Invalid AYUSH license number format";
                break;

            case 2:
                if (!formData.contactInfo.address?.city?.trim()) newErrors.city = "City is required";
                if (!formData.contactInfo.address?.state?.trim()) newErrors.state = "State is required";
                if (!formData.contactInfo.address?.pincode?.trim()) newErrors.pincode = "Pincode is required";
                else if (!VALIDATION_PATTERNS.pincode.test(formData.contactInfo.address.pincode)) newErrors.pincode = "Invalid pincode";

                if (!formData.contactInfo.contactPerson?.name?.trim()) newErrors.contactName = "Contact person name is required";
                if (!formData.contactInfo.contactPerson?.email?.trim()) newErrors.contactEmail = "Email is required";
                else if (!VALIDATION_PATTERNS.email.test(formData.contactInfo.contactPerson.email)) newErrors.contactEmail = "Invalid email format";

                if (!formData.contactInfo.contactPerson?.phone?.trim()) newErrors.contactPhone = "Phone is required";
                else if (!VALIDATION_PATTERNS.phone.test(formData.contactInfo.contactPerson.phone)) newErrors.contactPhone = "Invalid phone number";
                break;

            case 3:
                if (!formData.bankInfo.accountHolderName?.trim()) newErrors.accountHolderName = "Account holder name is required";
                if (!formData.bankInfo.accountNumber?.trim()) newErrors.accountNumber = "Account number is required";
                if (!formData.bankInfo.confirmAccountNumber?.trim()) newErrors.confirmAccountNumber = "Confirm account number is required";
                else if (formData.bankInfo.accountNumber !== formData.bankInfo.confirmAccountNumber) newErrors.confirmAccountNumber = "Account numbers do not match";

                if (!formData.bankInfo.ifscCode?.trim()) newErrors.ifscCode = "IFSC code is required";
                else if (!VALIDATION_PATTERNS.ifsc.test(formData.bankInfo.ifscCode)) newErrors.ifscCode = "Invalid IFSC code";
                break;

            case 4:
                if (!formData.documents.gstCertificate) newErrors.gstCertificate = "GST certificate required";
                if (!formData.documents.panCard) newErrors.panCard = "PAN card required";
                if (!formData.documents.cancelledCheque) newErrors.cancelledCheque = "Cancelled cheque required";
                break;

            case 5:
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
            setCurrentStep((prev) => Math.min(prev + 1, 5));
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            setErrors(stepErrors);
            const firstField = Object.keys(stepErrors)[0];
            const el = document.querySelector(`[name="${firstField}"]`);
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                el.focus();
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
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        const finalErrors = validateStep();
        if (Object.keys(finalErrors).length > 0) {
            setErrors(finalErrors);
            return;
        }
        if (!formData.agreements.allPoliciesAccepted) {
            setErrors((prev) => ({
                ...prev,
                allPoliciesAccepted: "Please review and accept all policies",
            }));
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await vendorService?.createOnboarding(transformToApiFormat(formData));
            if (res?.data?.success) {
                try {
                    await acceptLegalPolicies("all");
                } catch (policyError) {
                    console.error(policyError);
                    toast.error(policyError?.message || "Profile saved, but policy acceptance failed");
                }

                let getprofile = JSON?.parse(sessionStorage?.getItem("profile"));
                let localdata = {
                    ...getprofile,
                    "first_name": formData?.businessInfo?.businessName,
                    "business_name": formData?.businessInfo?.businessName,
                    "email": formData?.businessInfo.businessEmail,
                    "verify": false
                };
                sessionStorage.setItem("profile", JSON.stringify(localdata));
                toast.success("All steps completed successfully 🎉");
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    window.location.replace("/vendor/profile");
                }, 4000);
            }
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.message || "Submission failed, Retry");
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateStep]);

    const getStepStatus = useCallback((step) => {
        if (step < currentStep) return 'completed';
        if (step === currentStep) return 'current';
        return 'pending';
    }, [currentStep]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
            <SuccessModal show={showSuccess} />
            <CelebrationParticles show={showCelebration} />

            {/* Header */}
            <div className="bg-gradient-to-r from-[#0D614E] to-[#0a4d3e] text-white pb-12">
                <div className="max-w-6xl mx-auto px-8 py-12">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-20 rounded-full mb-4">
                            <Store size={40} />
                        </div>
                        <h1 className="text-4xl font-bold mb-2 text-white">Partner with AyurMuni</h1>
                        <p className="text-emerald-100 text-lg">Join India's fastest growing Ayurvedic marketplace</p>
                        <div className="mt-6 flex justify-center space-x-8">
                            <div className="text-center"><p className="text-2xl font-bold text-white">200+</p><p className="text-xs text-emerald-100">Active Vendors</p></div>
                            <div className="text-center"><p className="text-2xl font-bold text-white">50k+</p><p className="text-xs text-emerald-100">Products Sold</p></div>
                            <div className="text-center"><p className="text-2xl font-bold text-white">1M+</p><p className="text-xs text-emerald-100">Happy Customers</p></div>
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
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <form onSubmit={handleSubmit}>
                        <div className="p-8">
                            {/* Step 1: Business Information */}
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <SectionHeader icon={Building} title="Business Information" description="Tell us about your business" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormInput label="Business Name" name="businessName" value={formData.businessInfo.businessName}
                                            onChange={(e) => handleInputChange('businessInfo', 'businessName', e.target.value)}
                                            error={errors.businessName} required placeholder="Enter registered business name" />

                                        <FormInput label="Legal Name (as per PAN)" name="legalName" value={formData.businessInfo.legalName}
                                            onChange={(e) => handleInputChange('businessInfo', 'legalName', e.target.value)}
                                            placeholder="Enter legal name" />

                                        <FormSelect label="Business Type" name="businessType" value={formData.businessInfo.businessType}
                                            onChange={(e) => handleInputChange('businessInfo', 'businessType', e.target.value)}
                                            error={errors.businessType} required options={BUSINESS_TYPES} />

                                        <FormInput label="GST Number" name="gstNumber" value={formData.businessInfo.gstNumber}
                                            onChange={(e) => handleInputChange('businessInfo', 'gstNumber', e.target.value.toUpperCase())}
                                            error={errors.gstNumber} required placeholder="22AAAAA0000A1Z" />

                                        <FormInput label="PAN Number" name="panNumber" value={formData.businessInfo.panNumber}
                                            onChange={(e) => handleInputChange('businessInfo', 'panNumber', e.target.value.toUpperCase())}
                                            error={errors.panNumber} required placeholder="AAAAA0000A" />

                                        <FormInput label="AYUSH License Number" name="ayushLicenseNumber" value={formData.businessInfo.ayushLicenseNumber}
                                            onChange={(e) => handleInputChange('businessInfo', 'ayushLicenseNumber', e.target.value)}
                                            error={errors.ayushLicenseNumber} required placeholder="123456..." type="number" />

                                        <FormInput label="FSSAI Number" name="fssaiNumber" value={formData.businessInfo.fssaiNumber}
                                            onChange={(e) => handleInputChange('businessInfo', 'fssaiNumber', e.target.value)}
                                            error={errors.fssaiNumber} required placeholder="12345678901234" type="number" />

                                        <FormInput label="Year Established" name="yearEstablished" value={formData.businessInfo.yearEstablished}
                                            onChange={(e) => handleInputChange('businessInfo', 'yearEstablished', e.target.value)}
                                            placeholder="YYYY" type="number" />

                                        <FormInput label="Employee Count" name="employeeCount" value={formData.businessInfo.employeeCount}
                                            onChange={(e) => handleInputChange('businessInfo', 'employeeCount', e.target.value)}
                                            placeholder="Number of employees" type="number" />

                                        <FormInput label="Business Email" name="businessEmail" value={formData.businessInfo.businessEmail}
                                            onChange={(e) => handleInputChange('businessInfo', 'businessEmail', e.target.value)}
                                            error={errors.businessEmail} required placeholder="contact@yourbusiness.com" type="email" />

                                        <FormInput label="Business Phone" name="businessPhone" value={formData.businessInfo.businessPhone}
                                            onChange={(e) => handleInputChange('businessInfo', 'businessPhone', e.target.value)}
                                            error={errors.businessPhone} required placeholder="9876543210" type="tel" />

                                        <FormInput label="Alternate Phone" name="alternatePhone" value={formData.businessInfo.alternatePhone}
                                            onChange={(e) => handleInputChange('businessInfo', 'alternatePhone', e.target.value)}
                                            placeholder="Optional" type="tel" />

                                        <FormInput label="Website" name="website" value={formData.businessInfo.website}
                                            onChange={(e) => handleInputChange('businessInfo', 'website', e.target.value)}
                                            placeholder="https://yourwebsite.com" />

                                        <div className="md:col-span-2">
                                            <FormTextArea label="Business Description" name="description" value={formData.businessInfo.description}
                                                onChange={(e) => handleInputChange('businessInfo', 'description', e.target.value)}
                                                placeholder="Tell us about your business, products, and values..." />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Contact Information */}
                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <SectionHeader icon={MapPin} title="Contact Information" description="Business address and contact person details" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <FormInput label="Address" name="street" value={formData.contactInfo.address.street}
                                                onChange={(e) => handleNestedInputChange('contactInfo', 'address', 'street', e.target.value)}
                                                placeholder="House No, Building, Street" />
                                        </div>

                                        <FormInput label="City" name="city" value={formData.contactInfo.address.city}
                                            onChange={(e) => handleNestedInputChange('contactInfo', 'address', 'city', e.target.value)}
                                            error={errors.city} required placeholder="Enter city" />

                                        <FormInput label="State" name="state" value={formData.contactInfo.address.state}
                                            onChange={(e) => handleNestedInputChange('contactInfo', 'address', 'state', e.target.value)}
                                            error={errors.state} required placeholder="Enter state" />

                                        <FormInput label="Pincode" name="pincode" value={formData.contactInfo.address.pincode}
                                            onChange={(e) => handleNestedInputChange('contactInfo', 'address', 'pincode', e.target.value)}
                                            error={errors.pincode} required placeholder="6 digit pincode" />

                                        <div className="md:col-span-2 border-t border-gray-200 pt-6">
                                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Primary Contact Person</h3>
                                        </div>

                                        <FormInput label="Contact Person Name" name="contactName" value={formData.contactInfo.contactPerson.name}
                                            onChange={(e) => handleNestedInputChange('contactInfo', 'contactPerson', 'name', e.target.value)}
                                            error={errors.contactName} required placeholder="Full name" />

                                        <FormInput label="Designation" name="designation" value={formData.contactInfo.contactPerson.designation}
                                            onChange={(e) => handleNestedInputChange('contactInfo', 'contactPerson', 'designation', e.target.value)}
                                            placeholder="e.g., Owner, Manager" />

                                        <FormInput label="Email Address" name="contactEmail" value={formData.contactInfo.contactPerson.email}
                                            onChange={(e) => handleNestedInputChange('contactInfo', 'contactPerson', 'email', e.target.value)}
                                            error={errors.contactEmail} required placeholder="contact@yourbusiness.com" type="email" />

                                        <FormInput label="Phone Number" name="contactPhone" value={formData.contactInfo.contactPerson.phone}
                                            onChange={(e) => handleNestedInputChange('contactInfo', 'contactPerson', 'phone', e.target.value)}
                                            error={errors.contactPhone} required placeholder="9876543210" type="tel" />

                                        <FormInput label="Alternate Phone" name="contactAlternatePhone" value={formData.contactInfo.contactPerson.alternatePhone}
                                            onChange={(e) => handleNestedInputChange('contactInfo', 'contactPerson', 'alternatePhone', e.target.value)}
                                            placeholder="Optional" type="tel" />
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Bank Details */}
                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <SectionHeader icon={Banknote} title="Bank Details" description="Payment settlement information" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <FormInput label="Account Holder Name" name="accountHolderName" value={formData.bankInfo.accountHolderName}
                                                onChange={(e) => handleInputChange('bankInfo', 'accountHolderName', e.target.value)}
                                                error={errors.accountHolderName} required placeholder="As per bank records" />
                                        </div>

                                        <FormInput label="Account Number" name="accountNumber" value={formData.bankInfo.accountNumber}
                                            onChange={(e) => handleInputChange('bankInfo', 'accountNumber', e.target.value)}
                                            error={errors.accountNumber} required placeholder="Enter account number" />

                                        <FormInput label="Confirm Account Number" name="confirmAccountNumber" value={formData.bankInfo.confirmAccountNumber}
                                            onChange={(e) => handleInputChange('bankInfo', 'confirmAccountNumber', e.target.value)}
                                            error={errors.confirmAccountNumber} required placeholder="Re-enter account number" />

                                        <FormInput label="IFSC Code" name="ifscCode" value={formData.bankInfo.ifscCode}
                                            onChange={(e) => handleInputChange('bankInfo', 'ifscCode', e.target.value.toUpperCase())}
                                            error={errors.ifscCode} required placeholder="SBIN0001234" />

                                        <FormInput label="Bank Name" name="bankName" value={formData.bankInfo.bankName}
                                            onChange={(e) => handleInputChange('bankInfo', 'bankName', e.target.value)}
                                            placeholder="Name of bank" />

                                        <FormInput label="Branch Name" name="branchName" value={formData.bankInfo.branchName}
                                            onChange={(e) => handleInputChange('bankInfo', 'branchName', e.target.value)}
                                            placeholder="Branch name" />

                                        <FormInput label="UPI ID" name="upiId" value={formData.bankInfo.upiId}
                                            onChange={(e) => handleInputChange('bankInfo', 'upiId', e.target.value)}
                                            placeholder="yourname@upi" />

                                        <div className="md:col-span-2">
                                            <FormSelect label="Payment Terms" name="paymentTerms" value={formData.bankInfo.paymentTerms}
                                                onChange={(e) => handleInputChange('bankInfo', 'paymentTerms', e.target.value)}
                                                options={PAYMENT_TERMS} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Document Upload */}
                            {currentStep === 4 && (
                                <div className="space-y-6">
                                    <SectionHeader icon={FileText} title="Document Upload" description="Upload required documents for verification" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {Object.entries(DOCUMENT_REQUIREMENTS).map(([key, req]) => (
                                            <DocumentUploadCard
                                                key={key}
                                                documentKey={key}
                                                document={formData.documents[key]}
                                                error={errors[req.errorKey]}
                                                onUpload={(field, file) => handleFileUpload(field, file)}
                                                onDelete={(field) => handleInputChange('documents', field, null)}
                                                onView={(url) => window.open(url, '_blank')}
                                                requirements={DOCUMENT_REQUIREMENTS}
                                            />
                                        ))}
                                    </div>
                                    <div className="bg-blue-50 rounded-xl p-4 mt-4">
                                        <div className="flex items-start space-x-3">
                                            <Info size={20} className="text-blue-600 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-medium text-blue-800">Document Guidelines</p>
                                                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                                                    <li>• All documents should be clear and legible</li>
                                                    <li>• PDF documents preferred for certificates</li>
                                                    <li>• Maximum file size: 10MB per document</li>
                                                    <li>• Accepted formats: PDF, JPG, PNG</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Agreement */}
                            {currentStep === 5 && (
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
                                            <FormError message={errors.allPoliciesAccepted} />
                                        )}
                                    </div>

                                    <div className="border-t border-gray-200 pt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                                <input type="date" value={formData.agreements.agreeDate}
                                                    onChange={(e) => handleInputChange('agreements', 'agreeDate', e.target.value)}
                                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D614E]" />
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
                        <div className="flex justify-between items-center px-8 py-6 bg-gray-50 border-t border-gray-200 mt-8 rounded-b-2xl">
                            <button type="button" onClick={prevStep}
                                className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl transition-all ${currentStep > 1 ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:shadow-md'
                                    : 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400'
                                    }`} disabled={currentStep === 1}>
                                <ArrowLeft size={18} /><span>Back</span>
                            </button>

                            {currentStep < 5 ? (
                                <button type="button" onClick={nextStep}
                                    className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-[#0D614E] to-[#0a4d3e] text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105">
                                    <span>Continue</span><ChevronRight size={18} />
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
                @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes scale-up { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes float { 0%, 100% { transform: translateY(0) translateX(0); opacity: 1; } 50% { transform: translateY(-50px) translateX(20px); opacity: 0; } }
                @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .animate-scale-up { animation: scale-up 0.3s ease-out; }
                .animate-float { animation: float 2s ease-in-out infinite; }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
};

export default VendorOnboarding;