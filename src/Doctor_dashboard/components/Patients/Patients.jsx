import React, { useState, useEffect, useMemo } from 'react';
import {
    Users,
    Search,
    Eye,
    Filter,
    Download,
    Phone,
    Mail,
    Calendar,
    Activity,
    Wind,
    Sun,
    Moon,
    TrendingUp,
    XCircle,
    User,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Droplet,
    Sparkles,
    Award,
    CheckCircle,
    AlertCircle,
    UserCheck,
    Clock,
    CalendarDays,
    DollarSign,
    BarChart3,
    PieChart,
    Leaf,
    IndianRupee,
    IndianRupeeIcon
} from 'lucide-react';
import { doctorService } from '../../../services/doctorService';
import { BiFemale, BiMale, BiUser } from 'react-icons/bi';
import { Link } from 'react-router-dom';

const PatientManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterPrakriti, setFilterPrakriti] = useState('all');
    const [filterGender, setFilterGender] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [currentPage, setCurrentPage] = useState(1);
    const [patientsData, setPatientsData] = useState({
        results: [],
        count: 0,
        next: null,
        previous: null
    });
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const itemsPerPage = 10;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch patients from API
    const fetchPatients = async () => {
        setIsLoading(true);
        try {
            const response = await doctorService.getPatient(
                'patient', currentPage, itemsPerPage, debouncedSearch, filterPrakriti, filterGender
            );
            const apiData = response?.data?.data || response?.data;

            setPatientsData({
                results: apiData?.results || [],
                count: apiData?.count || 0,
                next: apiData?.next,
                previous: apiData?.previous
            });
        } catch (error) {
            console.error('Error fetching patients:', error);
            showToast('Failed to load patients', 'error');
            // Fallback to empty data
            setPatientsData({
                results: [],
                count: 0,
                next: null,
                previous: null
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, [currentPage, debouncedSearch, filterPrakriti, filterGender]);

    const sortedResults = useMemo(() => {
        const results = [...patientsData.results];
        if (sortBy === 'name') {
            results.sort((a, b) => (a.patient_name || '').localeCompare(b.patient_name || ''));
        } else if (sortBy === 'lastAppointment') {
            results.sort((a, b) => new Date(b.last_appointment_date || 0) - new Date(a.last_appointment_date || 0));
        } else if (sortBy === 'totalAppointments') {
            results.sort((a, b) => (b.total_appointments || 0) - (a.total_appointments || 0));
        }
        return results;
    }, [patientsData.results, sortBy]);

    // Statistics calculations from API data
    const stats = {
        total: patientsData.results.length,
        active: patientsData.results.filter(p => p.total_appointments > 0).length,
        newThisMonth: patientsData.results.filter(p => {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            return p.last_appointment_date && new Date(p.last_appointment_date) > lastMonth;
        }).length,
        avgHealthScore: 78, // Default value until API provides health score
        prakritiDistribution: {
            Vata: patientsData.results.filter(p => p.prakriti_result === 'Vata').length,
            Pitta: patientsData.results.filter(p => p.prakriti_result === 'Pitta').length,
            Kapha: patientsData.results.filter(p => p.prakriti_result === 'Kapha').length,
            'Vata-Pitta': patientsData.results.filter(p => p.prakriti_result === 'Vata-Pitta').length,
            'Pitta-Kapha': patientsData.results.filter(p => p.prakriti_result === 'Pitta-Kapha').length,
            'Vata-Kapha': patientsData.results.filter(p => p.prakriti_result === 'Vata-Kapha').length
        },
        totalRevenue: patientsData.results.reduce((sum, p) => sum + (p.total_appointments * 1500), 0)
    };

    // Get prakriti icon and color
    const getPrakritiInfo = (prakriti) => {
        if (!prakriti) return { icon: Activity, color: 'bg-gray-100 text-gray-700', bg: '#f3f4f6', label: 'Not Assessed' };

        const info = {
            Vata: { icon: Wind, color: 'bg-purple-100 text-purple-700', bg: '#f3e8ff', label: 'Vata' },
            Pitta: { icon: Sun, color: 'bg-orange-100 text-orange-700', bg: '#ffedd5', label: 'Pitta' },
            Kapha: { icon: Moon, color: 'bg-blue-100 text-blue-700', bg: '#dbeafe', label: 'Kapha' },
            'Vata-Pitta': { icon: Sparkles, color: 'bg-indigo-100 text-indigo-700', bg: '#e0e7ff', label: 'Vata-Pitta' },
            'Pitta-Kapha': { icon: Droplet, color: 'bg-teal-100 text-teal-700', bg: '#ccfbf1', label: 'Pitta-Kapha' },
            'Vata-Kapha': { icon: Leaf, color: 'bg-emerald-100 text-emerald-700', bg: '#d1fae5', label: 'Vata-Kapha' }
        };
        return info[prakriti] || { icon: Activity, color: 'bg-gray-100 text-gray-700', bg: '#f3f4f6', label: prakriti };
    };

    // Get unique prakriti values for filter
    const uniquePrakriti = [...new Set(patientsData.results.map(p => p.prakriti_result).filter(Boolean))];

    // Export to CSV
    // const exportToCSV = () => {
    //     const headers = ['Patient Name', 'Gender', 'Age', 'Phone', 'Email', 'Prakriti', 'Total Appointments', 'Last Appointment'];
    //     const csvData = patientsData.results.map(p => {
    //         const age = p.dob ? new Date().getFullYear() - new Date(p.dob).getFullYear() : 'N/A';
    //         return [
    //             p.patient_name,
    //             p.gender,
    //             age,
    //             p.phone_number || 'N/A',
    //             p.email || 'N/A',
    //             p.prakriti_result || 'Not Assessed',
    //             p.total_appointments,
    //             p.last_appointment_date || 'N/A'
    //         ];
    //     });

    //     const csvContent = [headers, ...csvData].map(row => row.join(',')).join('\n');
    //     const blob = new Blob([csvContent], { type: 'text/csv' });
    //     const url = window.URL.createObjectURL(blob);
    //     const a = document.createElement('a');
    //     a.href = url;
    //     a.download = `patients_${new Date().toISOString().split('T')[0]}.csv`;
    //     a.click();
    //     showToast('Patients exported successfully', 'success');
    // };

    // Show toast notification
    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Calculate age from DOB
    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const totalPages = Math.ceil(patientsData.count / itemsPerPage);

    return (
        <>

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Toast Notification */}
                {toast && (
                    <div className="fixed top-4 right-4 z-50 animate-slide-in">
                        <div className={`rounded-lg shadow-lg p-4 flex items-center space-x-3 ${toast.type === 'success' ? 'bg-emerald-500' :
                            toast.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'
                            } text-white`}>
                            {toast.type === 'success' ? <CheckCircle size={20} /> :
                                toast.type === 'error' ? <XCircle size={20} /> : <AlertCircle size={20} />}
                            <span>{toast.message}</span>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                    <div className="px-4 py-4 sm:px-8 sm:py-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">Patient Management</h1>
                                <p className="text-gray-500 mt-1">View and manage all patient information</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="p-4 sm:p-8">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 text-sm">Total Patients</p>
                                    <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                                    <div className="flex items-center space-x-1 mt-2">
                                        <TrendingUp size={12} className="text-emerald-600" />
                                        <span className="text-xs text-emerald-600">+{stats.newThisMonth} this month</span>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                    <Users size={20} style={{ color: '#0D614E' }} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 text-sm">Active Patients</p>
                                    <p className="text-2xl font-bold text-gray-800">{stats.active}</p>
                                    <p className="text-xs text-gray-500 mt-2">with appointments</p>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                                    <UserCheck size={20} className="text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 text-sm">Total Appointments</p>
                                    <p className="text-2xl font-bold text-gray-800">{patientsData.results.reduce((sum, p) => sum + p.total_appointments, 0)}</p>
                                    <p className="text-xs text-gray-500 mt-2">across all patients</p>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                    <CalendarDays size={20} className="text-blue-600" />
                                </div>
                            </div>
                        </div>

                        {/* <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 text-sm">Total Revenue</p>
                                    <p className="text-2xl font-bold text-gray-800">₹{stats.totalRevenue.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500 mt-2">from consultations</p>
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                                    <IndianRupeeIcon size={20} className="text-yellow-600" />
                                </div>
                            </div>
                        </div> */}

                        {/* <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-gray-500 text-sm">Prakriti Distribution</p>
                                        <p className="text-sm font-semibold text-gray-800 mt-1">
                                            V: {stats.prakritiDistribution.Vata || 0} |
                                            P: {stats.prakritiDistribution.Pitta || 0} |
                                            K: {stats.prakritiDistribution.Kapha || 0}
                                        </p>
                                        <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 flex overflow-hidden">
                                            <div className="h-full bg-purple-500" style={{ width: `${((stats.prakritiDistribution.Vata || 0) / stats.total) * 100 || 0}%` }}></div>
                                            <div className="h-full bg-orange-500" style={{ width: `${((stats.prakritiDistribution.Pitta || 0) / stats.total) * 100 || 0}%` }}></div>
                                            <div className="h-full bg-blue-500" style={{ width: `${((stats.prakritiDistribution.Kapha || 0) / stats.total) * 100 || 0}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                        <Sparkles size={20} className="text-purple-600" />
                                    </div>
                                </div>
                            </div> */}
                    </div>

                    {/* Filters and Search */}
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
                        <div className="flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex-1 min-w-0 w-full">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search by name, phone, or email..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E]"
                                    />
                                </div>
                            </div>

                            <div className="flex  gap-3 w-full sm:w-auto">
                                <select
                                    value={filterPrakriti}
                                    onChange={(e) => {
                                        setFilterPrakriti(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E] bg-white"
                                >
                                    <option value="all">All Prakriti</option>
                                    <option value="Vata">Vata</option>
                                    <option value="Pitta">Pitta</option>
                                    <option value="Kapha">Kapha</option>
                                    <option value="Vata-Pitta">Vata-Pitta</option>
                                    <option value="Pitta-Kapha">Pitta-Kapha</option>
                                    <option value="Vata-Kapha">Vata-Kapha</option>
                                </select>

                                <select
                                    value={filterGender}
                                    onChange={(e) => {
                                        setFilterGender(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E] bg-white"
                                >
                                    <option value="all">All Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>

                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E] bg-white"
                                >
                                    <option value="name">Sort by Name</option>
                                    <option value="lastAppointment">Sort by Last Appointment</option>
                                    <option value="totalAppointments">Sort by Total Visits</option>
                                </select>

                                {/* <button
                                        onClick={exportToCSV}
                                        className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 bg-white"
                                    >
                                        <Download size={18} />
                                        <span>Export</span>
                                    </button> */}
                            </div>
                        </div>
                    </div>

                    {/* Patients List View */}
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#0D614E' }} />
                            </div>
                        ) : patientsData.results.length === 0 ? (
                            <div className="text-center py-20">
                                <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500 text-lg">No patients found</p>
                                <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prakriti</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointments</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {sortedResults.map((patient) => {
                                                const prakritiInfo = getPrakritiInfo(patient.prakriti_result);
                                                const PrakritiIcon = prakritiInfo.icon;
                                                const age = calculateAge(patient.dob);

                                                return (
                                                    <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0D614E] to-[#0a4d3e] flex items-center justify-center text-white font-semibold text-sm">
                                                                    {patient.patient_name?.charAt(0) || 'P'}
                                                                </div>
                                                                <div>
                                                                    <p className="font-medium text-gray-800">{patient.patient_name}</p>
                                                                    <p className="text-xs text-gray-500">{age} yrs • {patient.gender}</p>
                                                                    <p className="text-xs text-gray-400 mt-0.5">ID: {patient.id?.slice(0, 8)}...</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {/* <td className="px-6 py-4">
                                                                <div className="flex flex-col space-y-1">
                                                                    {patient.phone_number && (
                                                                        <div className="flex items-center space-x-1">
                                                                            <Phone size={12} className="text-gray-400" />
                                                                            <span className="text-sm text-gray-600">{patient.phone_number}</span>
                                                                        </div>
                                                                    )}
                                                                    {patient.email && (
                                                                        <div className="flex items-center space-x-1">
                                                                            <Mail size={12} className="text-gray-400" />
                                                                            <span className="text-xs text-gray-500 truncate max-w-[150px]">{patient.email}</span>
                                                                        </div>
                                                                    )}
                                                                    {!patient.phone_number && !patient.email && (
                                                                        <span className="text-xs text-gray-400">No contact info</span>
                                                                    )}
                                                                </div>
                                                            </td> */}
                                                        <td className="px-6 py-4">
                                                            {patient.prakriti_result ? (
                                                                <span className={`inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-full text-xs font-medium ${prakritiInfo.color}`}>
                                                                    <PrakritiIcon size={12} />
                                                                    <span>{prakritiInfo.label}</span>
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                                                    Not Assessed
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-semibold text-gray-800">{patient.total_appointments}</span>
                                                                <span className="text-xs text-gray-400">total visits</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {patient.last_appointment_date ? (
                                                                <div className="flex items-center space-x-1">
                                                                    <Calendar size={12} className="text-gray-400" />
                                                                    <span className="text-sm text-gray-600">{formatDate(patient.last_appointment_date)}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-gray-400">No visits yet</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center space-x-2">
                                                                <Link
                                                                    // to={`/doctor/patients/detail/${patient.id}`}
                                                                    to={`patient/${patient.id}`}
                                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                                                                    title="View Full Details"
                                                                >
                                                                    <Eye size={16} className="text-gray-500 group-hover:text-[#0D614E]" />
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="px-3 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-50">
                                        <div className="text-sm text-gray-500">
                                            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, patientsData.count)} of {patientsData.count} patients
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <span className="px-3 py-1.5 rounded-lg" style={{ backgroundColor: '#0D614E', color: 'white' }}>
                                                {currentPage}
                                            </span>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            <style jsx>{`
                @keyframes slide-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

export default PatientManagement;