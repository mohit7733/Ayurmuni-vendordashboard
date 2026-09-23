// VendorProfile.jsx - Optimized & Scalable Version (No functionality changes)
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Building, Store, Package, MapPin, FileText, Upload, CheckCircle, AlertCircle,
    ChevronRight, Trash2, Eye, Award, Shield, Sparkles, Gift, RefreshCw, X,
    Banknote, FileCheck, Calendar, Edit, Save, Plus, User, Phone, Mail,
    Globe, CreditCard, Home, Briefcase, Star, Clock, Truck, ShieldCheck,
    TrendingUp, Users, Info, Camera, Linkedin, Twitter, Facebook, Instagram,
    Settings, Bell, Lock, AlertTriangle, DollarSign, Percent
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { vendorService } from '../../../services/vendorService';

// ==================== CONSTANTS ====================
const BUSINESS_TYPES = [
    'Proprietorship', 'Partnership', 'Private Limited', 'Public Limited',
    'LLP', 'Trust', 'Society'
];

const PAYMENT_TERMS = [
    { value: "15", label: "Net 15 days" },
    { value: "30", label: "Net 30 days" },
    { value: "45", label: "Net 45 days" },
    { value: "60", label: "Net 60 days" }
];

const TABS = ['business', 'contact', 'documents', 'bank', 'settings'];

const DOCUMENT_REQUIREMENTS = {
    gst_certificate: { label: 'GST Certificate', required: true, accepted: ['PDF', 'JPG', 'PNG'], maxSize: 5 },
    pan_card: { label: 'PAN Card', required: true, accepted: ['PDF', 'JPG', 'PNG'], maxSize: 2 },
    establishment_certificate: { label: 'Shop & Establishment Certificate', required: false, accepted: ['PDF'], maxSize: 5 },
    fssai_license: { label: 'FSSAI License', required: false, accepted: ['PDF'], maxSize: 5 },
    ayurvedic_manufacturing_license: { label: 'Ayurvedic Manufacturing License', required: false, accepted: ['PDF'], maxSize: 5 },
    bank_statement: { label: 'Bank Statement (Last 6 months)', required: false, accepted: ['PDF'], maxSize: 10 },
    cancelled_cheque: { label: 'Cancelled Cheque', required: true, accepted: ['PDF', 'JPG', 'PNG'], maxSize: 2 },
    product_catalog: { label: 'Product Catalog/Brochure', required: false, accepted: ['PDF'], maxSize: 20 },
    company_logo: { label: 'Company Logo', required: false, accepted: ['JPG', 'PNG'], maxSize: 1 }
};

// ==================== INITIAL STATE ====================
const INITIAL_BANK_STATE = {
    account_holder_name: "",
    account_number: "",
    ifsc_code: "",
    bank_name: "",
    branch_name: "",
    upi_id: "",
    payment_terms: "30",
    is_selected: false
};

const INITIAL_VENDOR_STATE = {
    id: "", vendorId: "", status: "pending", joinedDate: "", lastActive: "",
    profileImage: null, approval_status: "pending", is_verified: false, is_active: false,
    business_name: "", legal_name: "", business_type: "", gst_number: "", pan_number: "",
    license_number: "", fssai_number: "", year_established: "", employee_count: "",
    business_email: "", business_phone: "", alternate_phone: "", website: "", business_description: "",
    street_address: "", city: "", state: "", pincode: "",
    contact_person_name: "", contact_person_designation: "", contact_person_email_address: "",
    contact_person_phone_number: "", contact_person_alternate_phone: "",
    bank_details: [],
    documents: {
        gst_certificate: null, pan_card: null, establishment_certificate: null,
        fssai_license: null, ayurvedic_manufacturing_license: null, bank_statement: null,
        cancelled_cheque: null, product_catalog: null, company_logo: null
    },
    agreement: { terms_n_service: true, privacy_policy: true, agreement_n_code_of_conduct: true, digital_signature: null, date: "" },
    stats: { totalProducts: 0, totalOrders: 0, totalRevenue: 0, averageRating: 0, onTimeDelivery: 0, returnRate: 0, customerSatisfaction: 0, thisMonthEarnings: 0, lifetimeEarnings: 0, pendingOrders: 0, activeListings: 0 },
    settings: { emailNotifications: true, smsAlerts: false, orderReminders: true, showInDirectory: true, allowBulkOrders: true, autoAcceptOrders: false }
};

// ==================== REUSABLE COMPONENTS ====================
const TabButton = ({ tab, activeTab, setActiveTab }) => {
    const iconMap = {
        business: Building, contact: MapPin, bank: Banknote, documents: FileText, settings: Settings
    };
    const Icon = iconMap[tab];

    return (
        <button
            type="button"
            onClick={() => setActiveTab(tab)}
            aria-selected={activeTab === tab}
            role="tab"
            className={`flex items-center gap-2 py-3 px-5 text-sm font-medium border-b-2 transition-all duration-200 ds-focus capitalize active:scale-[0.98] ${activeTab === tab
                ? 'border-[#0D614E] text-[#0D614E] bg-[#0D614E]/5'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/80'
                }`}
        >
            <Icon size={16} />
            <span className="capitalize">{tab}</span>
        </button>
    );
};

const InputField = ({ label, value, onChange, disabled, type = "text", required = false, placeholder = "" }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            className="auth-card__input w-full px-4 py-2.5 border border-gray-200 rounded-xl transition-all duration-200 ds-focus disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
    </div>
);

const SelectField = ({ label, value, onChange, disabled, options, placeholder = "" }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="auth-card__input w-full px-4 py-2.5 border border-gray-200 rounded-xl transition-all duration-200 ds-focus disabled:bg-gray-50 disabled:cursor-not-allowed"
        >
            <option value="">{placeholder || `Select ${label}`}</option>
            {options.map(opt => (
                <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                    {typeof opt === 'string' ? opt : opt.label}
                </option>
            ))}
        </select>
    </div>
);

const TextAreaField = ({ label, value, onChange, disabled, rows = 4 }) => (
    <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea
            rows={rows}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="auth-card__input w-full px-4 py-2.5 border border-gray-200 rounded-xl transition-all duration-200 ds-focus disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
    </div>
);

const DocumentCard = ({ keyName, docUrl, req, onView, onUpload, uploadingDoc }) => (
    <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-md transition-all">
        <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100">
                <FileText size={20} className="text-gray-500" />
            </div>
            <div>
                <p className="font-medium text-gray-800 capitalize text-sm">{req.label}</p>
                <p className={"text-xs " + (docUrl ? 'text-[#0D614E]' : 'text-gray-400')}>
                    {docUrl ? 'Uploaded' : 'Not uploaded'}
                </p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            {docUrl && (
                <button onClick={() => onView(docUrl)} className="p-1.5 text-gray-500 hover:text-[#0D614E] transition">
                    <Eye size={16} />
                </button>
            )}
            <button onClick={() => onUpload(keyName)} className="text-[#0D614E] hover:text-emerald-700 text-xs flex items-center gap-1" disabled={uploadingDoc}>
                <Upload size={12} />
                {docUrl ? 'Replace' : 'Upload'}
            </button>
        </div>
    </div>
);

const BankCard = ({ data, index, isEditing, editBankIndex, onPrimaryChange, onEdit, onBankInputChange, onSave, onCancel }) => {
    const isSelected = data.is_selected;
    const isEditMode = editBankIndex === index;

    return (
        <div className={`relative rounded-2xl p-5 text-white shadow-xl transition-all duration-300 ${isSelected ? "border-[#0D614E] border-2 bg-[#0D614E]/10" : "bg-gradient-to-r from-gray-300/50 to-gray-400/50 backdrop-blur-sm"
            }`}>
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">{data.bank_name || "Your Bank"}</h2>
                <input
                    type="radio"
                    name="selectedBank"
                    checked={isSelected === true}
                    onChange={() => onPrimaryChange(data)}
                    className="w-4 h-4 accent-[#0D614E]"
                />
                {isSelected && (
                    <span className="absolute -top-2 -right-2 bg-[#0D614E] text-white px-2 py-0.5 rounded-full text-xs">
                        Primary
                    </span>
                )}
            </div>

            <p className="mt-3 text-xl tracking-widest font-mono text-gray-800">
                **** **** **** {data.account_number?.slice(-4) || "0000"}
            </p>

            <div className="flex justify-between mt-2 text-sm">
                <div>
                    <p className="opacity-70 text-sm">Holder</p>
                    <p className="font-medium text-black">{data.account_holder_name}</p>
                </div>
                <div>
                    <p className="opacity-70 text-sm">IFSC</p>
                    <p className="font-medium text-black">{data.ifsc_code}</p>
                </div>
            </div>

            <div className="mt-4">
                {data.is_verified ? (
                    <span className="px-2 py-1 rounded text-xs bg-[#0D614E]">✔ Verified</span>
                ) : (
                    <span className="bg-yellow-300 text-black px-2 py-1 rounded text-xs">Pending</span>
                )}
            </div>

            {isEditing && !isEditMode && (
                <div className="flex gap-2 mt-5">
                    <button onClick={() => onEdit(index)} className="bg-[#0D614E] px-3 py-1 rounded text-sm hover:bg-[#0D614E]/80 transition">
                        Edit
                    </button>
                </div>
            )}

            {isEditMode && (
                <div className="mt-4 bg-white text-black p-4 rounded-xl shadow-lg border border-gray-200">
                    <h4 className="font-semibold text-sm mb-3">Edit Bank Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input value={data.account_holder_name} onChange={(e) => onBankInputChange(index, "account_holder_name", e.target.value)}
                            className="auth-card__input w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D614E] focus:border-[#0D614E]" placeholder="Account Holder Name" />
                        <input value={data.account_number} onChange={(e) => onBankInputChange(index, "account_number", e.target.value)}
                            className="auth-card__input w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D614E]" placeholder="Account Number" />
                        <input value={data.ifsc_code} onChange={(e) => onBankInputChange(index, "ifsc_code", e.target.value.toUpperCase())}
                            className="auth-card__input w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D614E]" placeholder="IFSC Code" />
                        <input value={data.bank_name} onChange={(e) => onBankInputChange(index, "bank_name", e.target.value)}
                            className="auth-card__input w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D614E]" placeholder="Bank Name" />
                        <input value={data.branch_name} onChange={(e) => onBankInputChange(index, "branch_name", e.target.value)}
                            className="auth-card__input w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D614E]" placeholder="Branch Name" />
                        <input value={data.upi_id} onChange={(e) => onBankInputChange(index, "upi_id", e.target.value)}
                            className="auth-card__input w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0D614E]" placeholder="UPI ID" />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <button onClick={onCancel} className="px-3 py-1 border rounded">Cancel</button>
                        <button onClick={() => onSave(index)} className="px-3 py-1 bg-[#0D614E] text-white rounded">Save</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const LoadingSpinner = () => (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#0D614E] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Loading profile...</p>
        </div>
    </div>
);

// ==================== HELPER FUNCTIONS ====================
const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
};

const getStatusBadge = (status) => {
    if (status === 'approved') return 'bg-emerald-100 text-emerald-700';
    if (status === 'pending') return 'bg-amber-100 text-amber-700';
    if (status === 'rejected') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
};

const getStatusText = (status) => {
    if (status === 'approved') return 'Approved Vendor';
    if (status === 'pending') return 'Pending Verification';
    if (status === 'rejected') return 'Application Rejected';
    return 'Unknown Status';
};

// ==================== MAIN COMPONENT ====================
const VendorProfile = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(() => {
        const tab = searchParams.get('tab');
        return TABS.includes(tab) ? tab : 'business';
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [showBankModal, setShowBankModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [editBankIndex, setEditBankIndex] = useState(null);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const fileInputRef = useRef(null);
    const docInputRef = useRef(null);

    const [newBank, setNewBank] = useState(INITIAL_BANK_STATE);
    const [vendorData, setVendorData] = useState(INITIAL_VENDOR_STATE);

    // ==================== API CALLS ====================
    const fetchVendorProfile = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await vendorService?.getProfile();
            console.log("API Response:", response);

            if (response?.data?.success && response?.data?.data) {
                const apiData = response.data.data;
                if (apiData.vendor?.approval_status === 'approved') {
                    let data = sessionStorage.getItem('profile');
                    sessionStorage.setItem('profile', JSON.stringify({ ...JSON.parse(data), verify: true })); // Store the entire profile data in sessionStorage
                }
                setVendorData(prev => ({
                    ...prev,
                    id: apiData.vendor?.id || "",
                    vendorId: apiData.vendor?.id?.slice(0, 8)?.toUpperCase(),
                    approval_status: apiData.vendor?.approval_status || "pending",
                    is_verified: apiData.vendor?.is_verified || false,
                    is_active: apiData.vendor?.is_active || false,
                    joinedDate: apiData.agreement?.date || new Date().toISOString().split('T')[0],
                    business_name: apiData.vendor?.business_name || "",
                    legal_name: apiData.vendor?.legal_name || "",
                    business_type: apiData.vendor?.business_type || "",
                    gst_number: apiData.vendor?.gst_number || "",
                    pan_number: apiData.vendor?.pan_number || "",
                    license_number: apiData.vendor?.license_number || "",
                    fssai_number: apiData.vendor?.fssai_number || "",
                    year_established: apiData.vendor?.year_established || "",
                    employee_count: apiData.vendor?.employee_count || "",
                    business_email: apiData.vendor?.business_email || "",
                    business_phone: apiData.vendor?.business_phone || "",
                    alternate_phone: apiData.vendor?.alternate_phone || "",
                    website: apiData.vendor?.website || "",
                    business_description: apiData.vendor?.business_description || "",
                    street_address: apiData.vendor?.street_address || "",
                    city: apiData.vendor?.city || "",
                    state: apiData.vendor?.state || "",
                    pincode: apiData.vendor?.pincode || "",
                    contact_person_name: apiData.vendor?.contact_person_name || "",
                    contact_person_designation: apiData.vendor?.contact_person_designation || "",
                    contact_person_email_address: apiData.vendor?.contact_person_email_address || "",
                    contact_person_phone_number: apiData.vendor?.contact_person_phone_number || "",
                    contact_person_alternate_phone: apiData.vendor?.contact_person_alternate_phone || "",
                    documents: {
                        gst_certificate: apiData.documents?.gst_certificate || null,
                        pan_card: apiData.documents?.pan_card || null,
                        establishment_certificate: apiData.documents?.establishment_certificate || null,
                        fssai_license: apiData.documents?.fssai_license || null,
                        ayurvedic_manufacturing_license: apiData.documents?.ayurvedic_manufacturing_license || null,
                        bank_statement: apiData.documents?.bank_statement || null,
                        cancelled_cheque: apiData.documents?.cancelled_cheque || null,
                        product_catalog: apiData.documents?.product_catalog || null,
                        company_logo: apiData.documents?.company_logo || null
                    },
                    bank_details: apiData.bank_details?.map((bank, index) => ({ ...bank, is_selected: index === 0, is_verified: false })) || [],
                    agreement: {
                        terms_n_service: apiData.agreement?.terms_n_service || true,
                        privacy_policy: apiData.agreement?.privacy_policy || true,
                        agreement_n_code_of_conduct: apiData.agreement?.agreement_n_code_of_conduct || true,
                        digital_signature: apiData.agreement?.digital_signature || null,
                        date: apiData.agreement?.date || new Date().toISOString().split('T')[0]
                    }
                }));
            }
        } catch (error) {
            console.error('Failed to load profile data:', error);
            toast.error('Failed to load profile data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleSaveProfile = useCallback(async () => {
        setIsSaving(true);
        try {
            const profileData = {
                business_name: vendorData.business_name,
                legal_name: vendorData.legal_name,
                business_type: vendorData.business_type,
                gst_number: vendorData.gst_number,
                pan_number: vendorData.pan_number,
                license_number: vendorData.license_number,
                fssai_number: vendorData.fssai_number,
                year_established: vendorData.year_established ? parseInt(vendorData.year_established) : null,
                employee_count: vendorData.employee_count,
                business_email: vendorData.business_email,
                business_phone: vendorData.business_phone,
                alternate_phone: vendorData.alternate_phone,
                website: vendorData.website,
                business_description: vendorData.business_description,
                street_address: vendorData.street_address,
                city: vendorData.city,
                state: vendorData.state,
                pincode: vendorData.pincode,
                contact_person_name: vendorData.contact_person_name,
                contact_person_designation: vendorData.contact_person_designation,
                contact_person_email_address: vendorData.contact_person_email_address,
                contact_person_phone_number: vendorData.contact_person_phone_number,
                contact_person_alternate_phone: vendorData.contact_person_alternate_phone
            };
            const response = await vendorService?.updateProfile(profileData);
            if (response?.data?.success) {
                toast.success('Profile updated successfully!');
                setIsEditing(false);
                let data = JSON.parse(sessionStorage.getItem('profile'));
                if (data) {
                    const profile = { ...data, business_name: vendorData.business_name};
                    sessionStorage.setItem('profile', JSON.stringify(profile)); // Update sessionStorage with new business name
                }
                fetchVendorProfile();
            } else {
                toast.error(response?.data?.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Update error:', error);
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    }, [vendorData, fetchVendorProfile]);

    const handleDocumentUpload = useCallback(async () => {
        if (!selectedFile || !selectedDocument) {
            toast.error('Please select a file');
            return;
        }
        setUploadingDoc(true);
        try {
            const data = await vendorService.uploadfiles(selectedFile, "vendor_document");
            if (data?.data?.success) {
                const response = await vendorService?.updateProfile({ "documents": { [selectedDocument]: data?.data?.data?.url } });
                if (response?.data?.success) {
                    setVendorData(prev => ({
                        ...prev,
                        documents: { ...prev.documents, [selectedDocument]: response.data.data.url }
                    }));
                    toast.success(`${selectedDocument.replace(/_/g, ' ')} uploaded successfully!`);
                    setShowDocumentModal(false);
                    setSelectedDocument(null);
                    setSelectedFile(null);
                    fetchVendorProfile();
                } else {
                    toast.error(response?.data?.message || 'Upload failed');
                }
            } else {
                toast.error(data?.data?.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload document');
        } finally {
            setUploadingDoc(false);
        }
    }, [selectedFile, selectedDocument, fetchVendorProfile]);

    const addBankDetail = useCallback(async () => {
        if (!newBank.account_holder_name || !newBank.account_number || !newBank.ifsc_code) {
            toast.error('Please fill required fields (Account Holder, Account Number, IFSC)');
            return;
        }
        try {
            const bankData = { ...newBank };
            const response = await vendorService?.addBankDetail(bankData);
            if (response?.data?.success) {
                toast.success('Bank account added successfully!');
                setShowBankModal(false);
                setNewBank(INITIAL_BANK_STATE);
                fetchVendorProfile();
            } else {
                toast.error(response?.data?.message || 'Failed to add bank account');
            }
        } catch (error) {
            console.error('Add bank error:', error);
            toast.error('Failed to add bank account');
        }
    }, [newBank, fetchVendorProfile]);

    const updateBankDetail = useCallback(async (index) => {
        const bankToUpdate = vendorData.bank_details[index];
        if (!bankToUpdate.account_holder_name || !bankToUpdate.account_number || !bankToUpdate.ifsc_code) {
            toast.error('Please fill required fields');
            return;
        }
        try {
            const bankData = {
                id: bankToUpdate.id,
                account_holder_name: bankToUpdate.account_holder_name,
                account_number: bankToUpdate.account_number,
                ifsc_code: bankToUpdate.ifsc_code,
                bank_name: bankToUpdate.bank_name,
                branch_name: bankToUpdate.branch_name,
                upi_id: bankToUpdate.upi_id,
                payment_terms: bankToUpdate.payment_terms,
                is_selected: bankToUpdate?.is_selected
            };
            const response = await vendorService?.updateBankDetail(bankData);
            if (response?.data?.success) {
                toast.success('Bank details updated successfully!');
                setEditBankIndex(null);
                fetchVendorProfile();
            } else {
                toast.error(response?.data?.message || 'Failed to update bank details');
            }
        } catch (error) {
            console.error('Update bank error:', error);
            toast.error('Failed to update bank details');
        }
    }, [vendorData.bank_details, fetchVendorProfile]);

    const setPrimaryBank = useCallback(async (bank) => {
        try {
            const response = await vendorService?.updateBankDetail({ ...bank, is_selected: !bank?.is_selected });
            if (response?.data?.success) {
                toast.success('Primary bank updated successfully!');
                fetchVendorProfile();
            } else {
                toast.error(response?.data?.message || 'Failed to set primary bank');
            }
        } catch (error) {
            console.error('Set primary bank error:', error);
            toast.error('Failed to set primary bank');
        }
    }, [fetchVendorProfile]);

    const removeBankDetail = useCallback(async (index) => {
        const bankToRemove = vendorData.bank_details[index];
        if (bankToRemove.is_selected && vendorData.bank_details.length > 1) {
            toast.error('Cannot delete primary bank. Please select another bank as primary first.');
            return;
        }
        try {
            const response = await vendorService?.deleteBankDetail({ bank_detail_id: bankToRemove.id });
            if (response?.data?.success) {
                toast.success('Bank account removed successfully!');
                fetchVendorProfile();
            } else {
                toast.error(response?.data?.message || 'Failed to remove bank account');
            }
        } catch (error) {
            console.error('Delete bank error:', error);
            toast.error('Failed to remove bank account');
        }
    }, [vendorData.bank_details, fetchVendorProfile]);

    // ==================== HANDLERS ====================
    const handleInputChange = useCallback((field, value) => {
        setVendorData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleBankInputChange = useCallback((index, field, value) => {
        setVendorData(prev => {
            const updatedBanks = [...prev.bank_details];
            updatedBanks[index] = { ...updatedBanks[index], [field]: value };
            return { ...prev, bank_details: updatedBanks };
        });
    }, []);

    const handlePhotoUpload = useCallback(async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const data = await vendorService.uploadfiles(file, "vendor_document");
        if (data?.data?.success) {
            const response = await vendorService?.updateProfile({ "documents": { "company_logo": data?.data?.data?.url } });
            if (response?.data?.success) {
                fetchVendorProfile();
            }
        }
    }, [fetchVendorProfile]);

    const handleDeleteAccount = useCallback(async () => {
        try {
            await vendorService?.deleteAccount();
            sessionStorage.clear();
            toast.success('Account deleted successfully');
            navigate('/login');
        } catch (error) {
            toast.error('Failed to delete account');
        }
        setShowDeleteModal(false);
    }, [navigate]);

    // ==================== EFFECTS ====================
    useEffect(() => {
        fetchVendorProfile();
    }, [fetchVendorProfile]);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && TABS.includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    // ==================== MEMOIZED VALUES ====================
    const statusBadge = useMemo(() => getStatusBadge(vendorData.approval_status), [vendorData.approval_status]);
    const statusText = useMemo(() => getStatusText(vendorData.approval_status), [vendorData.approval_status]);

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen pb-10 mt-10 ds-animate-in">
            <div className="mx-auto px-4 sm:px-6 lg:px-8 -mt-8">

                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden ds-card border-0">
                    <div className="h-32 bg-gradient-to-r from-[#0D614E] to-[#0a4d3e] relative">
                        <Link to="/dashboard" className="flex items-center max-w-[200px] space-x-2 px-4 py-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition text-white absolute top-4 right-4 hover:text-white z-10">
                            <ChevronRight size={18} />
                            <span>Dashboard</span>
                        </Link>
                        <div className="absolute -bottom-14 left-8">
                            <div className="relative group">
                                <div className="w-28 h-28 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-lg">
                                    {vendorData.documents?.company_logo ? (
                                        <img src={vendorData.documents.company_logo} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-emerald-100">
                                            <Store size={44} className="text-[#0D614E]" />
                                        </div>
                                    )}
                                </div>
                                {isEditing && (
                                    <button className="absolute bottom-0 right-0 p-1.5 bg-[#0D614E] text-white rounded-full shadow-lg hover:bg-emerald-700 transition-all hover:scale-110">
                                        <Camera size={14} />
                                        <input onChange={handlePhotoUpload} type="file" accept="image/*" className="absolute left-0 top-0 w-[24px] h-[24px] cursor-pointer opacity-0" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-16 pl-8 pr-8 pb-6">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                            <div>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h2 className="text-2xl font-bold text-gray-800">{vendorData.business_name || "Your Business"}</h2>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge}`}>{statusText}</span>
                                </div>
                                <div className="flex items-center gap-4 mt-2 text-gray-500 flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                        <Building size={15} className="text-[#0D614E]" />
                                        <span className="text-sm">{vendorData.business_type || "Business Type"}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Award size={15} className="text-[#0D614E]" />
                                        <span className="text-sm">Since {vendorData.year_established || "N/A"}</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 mt-1">Vendor ID: {vendorData.vendorId} • Joined: {formatDate(vendorData.joinedDate)}</p>
                            </div>
                            <div className="flex gap-3">
                                {!isEditing ? (
                                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#0D614E] text-white rounded-xl hover:bg-[#0D614E]/90 transition-all shadow-md hover:shadow-lg">
                                        <Edit size={18} /><span>Edit Profile</span>
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all">
                                            <X size={18} /><span>Cancel</span>
                                        </button>
                                        <button onClick={handleSaveProfile} disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 bg-[#0D614E] text-white rounded-xl hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50">
                                            {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />}
                                            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mt-6">
                    <div className="border-b border-gray-200 bg-white rounded-t-xl">
                        <nav className="flex flex-wrap gap-1 px-4">
                            {TABS.map(tab => <TabButton key={tab} tab={tab} activeTab={activeTab} setActiveTab={setActiveTab} />)}
                        </nav>
                    </div>

                    <div className="bg-white rounded-b-xl shadow-sm p-6">

                        {/* Business Tab */}
                        {activeTab === 'business' && (
                            <div className="space-y-6">
                                <div className="border-b border-gray-200 pb-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Business Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <InputField label="Business Name" value={vendorData.business_name} onChange={(e) => handleInputChange('business_name', e.target.value)} disabled={!isEditing} required />
                                        <InputField label="Legal Name" value={vendorData.legal_name} onChange={(e) => handleInputChange('legal_name', e.target.value)} disabled={!isEditing} />
                                        <SelectField label="Business Type" value={vendorData.business_type} onChange={(e) => handleInputChange('business_type', e.target.value)} disabled={!isEditing} options={BUSINESS_TYPES} />
                                        <InputField label="GST Number" value={vendorData.gst_number} onChange={(e) => handleInputChange('gst_number', e.target.value)} disabled={!isEditing} />
                                        <InputField label="PAN Number" value={vendorData.pan_number} onChange={(e) => handleInputChange('pan_number', e.target.value)} disabled={!isEditing} />
                                        <InputField label="AYUSH License Number" value={vendorData.license_number} onChange={(e) => handleInputChange('license_number', e.target.value)} disabled={!isEditing} />
                                        <InputField label="FSSAI Number" value={vendorData.fssai_number} onChange={(e) => handleInputChange('fssai_number', e.target.value)} disabled={!isEditing} />
                                        <InputField label="Year Established" value={vendorData.year_established} onChange={(e) => handleInputChange('year_established', e.target.value)} disabled={!isEditing} />
                                        <InputField label="Employee Count" value={vendorData.employee_count} onChange={(e) => handleInputChange('employee_count', e.target.value)} disabled={!isEditing} />
                                        <InputField label="Business Email" value={vendorData.business_email} onChange={(e) => handleInputChange('business_email', e.target.value)} disabled={!isEditing} type="email" />
                                        <InputField label="Business Phone" value={vendorData.business_phone} onChange={(e) => handleInputChange('business_phone', e.target.value)} disabled={!isEditing} type="tel" />
                                        <InputField label="Alternate Phone" value={vendorData.alternate_phone} onChange={(e) => handleInputChange('alternate_phone', e.target.value)} disabled={!isEditing} type="tel" />
                                        <InputField label="Website" value={vendorData.website} onChange={(e) => handleInputChange('website', e.target.value)} disabled={!isEditing} type="url" />
                                        <TextAreaField label="Business Description" value={vendorData.business_description} onChange={(e) => handleInputChange('business_description', e.target.value)} disabled={!isEditing} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Contact Tab */}
                        {activeTab === 'contact' && (
                            <div className="space-y-6">
                                <div className="border-b border-gray-200 pb-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Address Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2">
                                            <InputField label="Street Address" value={vendorData.street_address} onChange={(e) => handleInputChange('street_address', e.target.value)} disabled={!isEditing} />
                                        </div>
                                        <InputField label="City" value={vendorData.city} onChange={(e) => handleInputChange('city', e.target.value)} disabled={!isEditing} />
                                        <InputField label="State" value={vendorData.state} onChange={(e) => handleInputChange('state', e.target.value)} disabled={!isEditing} />
                                        <InputField label="Pincode" value={vendorData.pincode} onChange={(e) => handleInputChange('pincode', e.target.value)} disabled={!isEditing} />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Primary Contact Person</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <InputField label="Contact Person Name" value={vendorData.contact_person_name} onChange={(e) => handleInputChange('contact_person_name', e.target.value)} disabled={!isEditing} />
                                        <InputField label="Designation" value={vendorData.contact_person_designation} onChange={(e) => handleInputChange('contact_person_designation', e.target.value)} disabled={!isEditing} />
                                        <InputField label="Email Address" value={vendorData.contact_person_email_address} onChange={(e) => handleInputChange('contact_person_email_address', e.target.value)} disabled={!isEditing} type="email" />
                                        <InputField label="Phone Number" value={vendorData.contact_person_phone_number} onChange={(e) => handleInputChange('contact_person_phone_number', e.target.value)} disabled={!isEditing} type="tel" />
                                        <InputField label="Alternate Phone" value={vendorData.contact_person_alternate_phone} onChange={(e) => handleInputChange('contact_person_alternate_phone', e.target.value)} disabled={!isEditing} type="tel" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Documents Tab */}
                        {activeTab === 'documents' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(DOCUMENT_REQUIREMENTS).map(([key, req]) => (
                                        <DocumentCard
                                            key={key}
                                            keyName={key}
                                            docUrl={vendorData.documents?.[key]}
                                            req={req}
                                            onView={(url) => window.open(url, '_blank')}
                                            onUpload={() => { setSelectedDocument(key); setShowDocumentModal(true); }}
                                            uploadingDoc={uploadingDoc}
                                        />
                                    ))}
                                </div>
                                <div className="mt-6 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle size={18} className="text-amber-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-amber-800">Document Verification</p>
                                            <p className="text-xs text-amber-700">Documents are typically verified within 24-48 hours. Please ensure all uploaded documents are clear and legible.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Bank Tab */}
                        {activeTab === 'bank' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-gray-800">Bank Accounts</h3>
                                    <button onClick={() => setShowBankModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0D614E] text-white rounded-xl hover:bg-[#0D614E]/90 transition shadow-md">
                                        <Plus size={18} /><span>Add Bank Account</span>
                                    </button>
                                </div>

                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {vendorData.bank_details.map((data, index) => (
                                        <BankCard
                                            key={index}
                                            data={data}
                                            index={index}
                                            isEditing={isEditing}
                                            editBankIndex={editBankIndex}
                                            onPrimaryChange={setPrimaryBank}
                                            onEdit={setEditBankIndex}
                                            onBankInputChange={handleBankInputChange}
                                            onSave={updateBankDetail}
                                            onCancel={() => setEditBankIndex(null)}
                                        />
                                    ))}
                                </div>

                                {vendorData.bank_details.length === 0 && (
                                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                                        <Banknote size={48} className="mx-auto text-gray-400 mb-3" />
                                        <p className="text-gray-500">No bank accounts added yet</p>
                                        <button onClick={() => setShowBankModal(true)} className="mt-3 text-[#0D614E] hover:text-emerald-700 text-sm font-medium">
                                            + Add your first bank account
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Settings Tab */}
                        {activeTab === 'settings' && (
                            <div className="space-y-6">
                                <div className="border border-rose-200 rounded-xl p-5 bg-rose-50/30">
                                    <div className="flex items-center gap-3 mb-3">
                                        <AlertTriangle size={18} className="text-rose-600" />
                                        <h4 className="font-medium text-rose-800">Delete Account</h4>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
                                    <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700 transition">
                                        Delete Account
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals - Remain exactly the same */}
            {showBankModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Add New Bank Account</h3>
                            <button onClick={() => setShowBankModal(false)} className="p-1 hover:bg-gray-100 rounded-full transition"><X size={24} /></button>
                        </div>
                        <p className="text-gray-500 text-sm mb-4">Enter your bank account details for payment settlements</p>
                        <div className="space-y-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name <span className="text-red-500">*</span></label>
                                <input placeholder="As per bank records" value={newBank.account_holder_name} onChange={(e) => setNewBank({ ...newBank, account_holder_name: e.target.value })} className="auth-card__input w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D614E]" />
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Account Number <span className="text-red-500">*</span></label>
                                <input placeholder="Enter account number" value={newBank.account_number} onChange={(e) => setNewBank({ ...newBank, account_number: e.target.value })} className="auth-card__input w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D614E]" />
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code <span className="text-red-500">*</span></label>
                                <input placeholder="SBIN0001234" value={newBank.ifsc_code} onChange={(e) => setNewBank({ ...newBank, ifsc_code: e.target.value.toUpperCase() })} className="auth-card__input w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D614E]" />
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                                <input placeholder="Name of bank" value={newBank.bank_name} onChange={(e) => setNewBank({ ...newBank, bank_name: e.target.value })} className="auth-card__input w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D614E]" />
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                                <input placeholder="Branch name" value={newBank.branch_name} onChange={(e) => setNewBank({ ...newBank, branch_name: e.target.value })} className="auth-card__input w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D614E]" />
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                                <input placeholder="yourname@bank" value={newBank.upi_id} onChange={(e) => setNewBank({ ...newBank, upi_id: e.target.value })} className="auth-card__input w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D614E]" />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowBankModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">Cancel</button>
                            <button onClick={addBankDetail} className="flex-1 px-4 py-2 bg-[#0D614E] text-white rounded-lg hover:bg-[#0D614E]/90 transition">Add Bank Account</button>
                        </div>
                    </div>
                </div>
            )}

            {showDocumentModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Upload {selectedDocument?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                            <button onClick={() => setShowDocumentModal(false)}><X size={24} /></button>
                        </div>
                        <p className="text-gray-500 text-sm mb-4">Upload clear document (PDF, JPG, PNG, max 5MB)</p>
                        <div className="w-full border border-gray-200 rounded-lg relative">
                            {selectedFile ? (
                                <div className="flex items-center gap-3 p-4"><FileText size={20} className="text-gray-500" /><span className="text-sm text-gray-700">{selectedFile.name}</span></div>
                            ) : (
                                <>
                                    <input ref={docInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setSelectedFile(e.target.files[0])} />
                                    <div className="flex items-center justify-center gap-2 p-6 text-gray-500 hover:text-[#0D614E] transition cursor-pointer"><Upload size={20} /><span className="text-sm">Click to select file</span></div>
                                </>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setShowDocumentModal(false); setSelectedFile(null); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                            <button onClick={handleDocumentUpload} disabled={!selectedFile || uploadingDoc} className="flex-1 px-4 py-2 bg-[#0D614E] text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300">
                                {uploadingDoc ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-center w-12 h-12 bg-rose-100 rounded-full mx-auto mb-4"><AlertTriangle size={24} className="text-rose-600" /></div>
                        <h3 className="text-xl font-bold text-gray-800 text-center mb-2">Delete Account</h3>
                        <p className="text-gray-500 text-center mb-6">Are you sure? All your data will be permanently removed.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg">Cancel</button>
                            <button onClick={handleDeleteAccount} className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default VendorProfile;