// FinanceDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Calendar,
    Download,
    Filter,
    Search,
    Plus,
    Eye,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    Wallet,
    CreditCard,
    Banknote,
    Receipt,
    FileText,
    PieChart,
    BarChart3,
    LineChart,
    Activity,
    Users,
    Calendar as CalendarIcon,
    ChevronDown,
    ChevronRight,
    MoreVertical,
    X,
    Printer,
    Mail,
    MessageCircle,
    Phone,
    MapPin,
    User,
    Building,
    Briefcase,
    Star,
    Award,
    TrendingUp as TrendingUpIcon,
    ArrowUp,
    ArrowDown,
    RefreshCw,
    Settings,
    Bell,
    Shield,
    Lock,
    Eye as EyeIcon,
    EyeOff,
    Copy,
    Check,
    Send,
    Upload,
    Download as DownloadIcon,
    Filter as FilterIcon,
    SortAsc,
    SortDesc,
    Grid3x3,
    List,
    FileJson,
    FileSpreadsheet,
    FileText as FileTextIcon,
    Printer as PrinterIcon,
    Share2,
    Link,
    QrCode,
    Wallet as WalletIcon,
    PiggyBank,
    Coins,
    Gem,
    Crown,
    Sparkles,
    Leaf,
    Heart,
    Brain,
    Wind,
    Sun,
    Moon,
    Gift,
    Pill,
    Info,
    Target,
    IndianRupee,
    ReceiptIndianRupee,
    Video
} from 'lucide-react';
import toast from 'react-hot-toast';
import { doctorService } from '../../../services/doctorService';

const FinanceDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [dateRange, setDateRange] = useState('month');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(1);
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [showPayoutModal, setShowPayoutModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('date');
    const [chartView, setChartView] = useState('line');
    const [showBalance, setShowBalance] = useState(true);
    const [notification, setNotification] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Financial Statistics State
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalRevenueChange: '+0%',
        totalSettlements: 0,
        settlementsChange: '+0%',
        availableForSettlement: 0,
        pendingPayments: 0,
        pendingChange: '-0%',
        averageConsultationFee: 0,
        totalConsultations: 0,
        patientSatisfaction: 0,
        collectionRate: 0
    });

    // Transactions Data State
    const [transactions, setTransactions] = useState([]);

    // Monthly Revenue Data (from API transactions)
    const [monthlyRevenue, setMonthlyRevenue] = useState([]);

    // Revenue by Type (from API transactions)
    const [revenueByType, setRevenueByType] = useState({});

    // Payment Methods Distribution (from API transactions)
    const [paymentMethods, setPaymentMethods] = useState({});

    // Upcoming Payouts (from API)
    const [upcomingPayouts, setUpcomingPayouts] = useState([]);

    // Fetch dashboard data from API
    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            const res = await doctorService.financedashboard();

            if (res?.data?.success && res?.data?.data) {
                const data = res.data.data;

                // Update stats with API data
                setStats({
                    totalRevenue: data.total_revenue?.value || 0,
                    totalRevenueChange: data.total_revenue?.trend_percent ? `+${data.total_revenue.trend_percent}%` : '+0%',
                    totalSettlements: data.total_settlements?.value || 0,
                    settlementsChange: '+0%',
                    availableForSettlement: data.available_for_settlement?.value || 0,
                    pendingPayments: data.pending_payments?.value || 0,
                    pendingChange: '-0%',
                    averageConsultationFee: data.avg_consultation_fee?.value || 0,
                    totalConsultations: data.total_consultations?.value || 0,
                    patientSatisfaction: data.patient_satisfaction?.value || 0,
                    collectionRate: data.collection_rate?.value || 0
                });

                // Process transactions from details array
                const details = data.details || [];
                const processedTransactions = details.map((item, index) => ({
                    id: index + 1,
                    patientName: item.name,
                    patientId: item.id,
                    amount: item.amount,
                    type: item.type,
                    status: item.status === 'success' ? 'completed' : item.status,
                    date: item.date,
                    time: "N/A" || new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    paymentMethod: item.payment_method,
                    transactionId: item.transaction_id || `N/A`,
                    invoiceNumber: item.invoice_id?.slice(0, 8) || `INV-${index + 1}`,
                    consultationType: item.type === 'video' ? 'Video Consultation' : 'Consultation',
                    doctor: 'Dr. Anand Sharma',
                    duration: '45 min',
                    notes: item.status === 'success' ? 'Payment successful' : 'Payment pending',
                    receiptUrl: '#'
                }));

                setTransactions(processedTransactions);

                // Calculate monthly revenue from transactions
                const monthlyData = {};
                details.forEach(item => {
                    const month = new Date(item.date).toLocaleString('default', { month: 'short' });
                    if (!monthlyData[month]) {
                        monthlyData[month] = { revenue: 0, consultations: 0 };
                    }
                    monthlyData[month].revenue += item.amount;
                    monthlyData[month].consultations += 1;
                });

                const monthlyRevenueArray = Object.entries(monthlyData).map(([month, data]) => ({
                    month,
                    revenue: data.revenue,
                    consultations: data.consultations,
                    expenses: data.revenue * 0.15,
                    profit: data.revenue * 0.85
                }));

                setMonthlyRevenue(monthlyRevenueArray);

                // Calculate revenue by type
                const typeData = {};
                details.forEach(item => {
                    const type = item.type;
                    if (!typeData[type]) {
                        typeData[type] = 0;
                    }
                    typeData[type] += item.amount;
                });
                setRevenueByType(typeData);

                // Calculate payment methods distribution
                const methodData = {};
                details.forEach(item => {
                    const method = item.payment_method;
                    if (!methodData[method]) {
                        methodData[method] = { count: 0, amount: 0 };
                    }
                    methodData[method].count += 1;
                    methodData[method].amount += item.amount;
                });

                const totalAmount = details.reduce((sum, item) => sum + item.amount, 0);
                Object.keys(methodData).forEach(method => {
                    methodData[method].percentage = totalAmount > 0 ? (methodData[method].amount / totalAmount * 100).toFixed(1) : 0;
                });

                setPaymentMethods(methodData);

                // Set upcoming payouts (from pending/successful transactions)
                const pendingPayouts = details
                    .filter(item => item.status === 'success')
                    .slice(0, 3)
                    .map((item, idx) => ({
                        id: idx + 1,
                        date: item.date,
                        amount: item.amount,
                        status: 'processing',
                        description: `${item.type === 'video' ? 'Consultation' : 'Service'} Payment`
                    }));
                setUpcomingPayouts(pendingPayouts);
            } else {
                toast.error('Failed to load financial data');
            }
        } catch (error) {
            console.error('Dashboard fetch error:', error);
            toast.error('Error loading dashboard data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Get status badge
    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed':
                return { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Completed' };
            case 'pending':
                return { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending' };
            case 'refunded':
                return { color: 'bg-rose-100 text-rose-700', icon: XCircle, label: 'Refunded' };
            case 'expired':
                return { color: 'bg-gray-100 text-gray-700', icon: AlertCircle, label: 'Expired' };
            case 'success':
                return { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle, label: 'Completed' };
            default:
                return { color: 'bg-gray-100 text-gray-700', icon: AlertCircle, label: status };
        }
    };

    // Get type badge
    const getTypeBadge = (type) => {
        switch (type) {
            case 'video':
                return { color: 'bg-blue-100 text-blue-700', icon: Video, label: 'Video Consultation' };
            case 'consultation':
                return { color: 'bg-blue-100 text-blue-700', icon: User, label: 'Consultation' };
            case 'therapy':
                return { color: 'bg-purple-100 text-purple-700', icon: Activity, label: 'Therapy' };
            case 'followup':
                return { color: 'bg-emerald-100 text-emerald-700', icon: Calendar, label: 'Follow-up' };
            case 'package':
                return { color: 'bg-orange-100 text-orange-700', icon: Gift, label: 'Package' };
            case 'medicine':
                return { color: 'bg-rose-100 text-rose-700', icon: Pill, label: 'Medicine' };
            default:
                return { color: 'bg-gray-100 text-gray-700', icon: CreditCard, label: type };
        }
    };

    // Get payment method icon
    const getPaymentMethodIcon = (method) => {
        switch (method) {
            case 'card': return <CreditCard size={14} />;
            case 'upi': return <QrCode size={14} />;
            case 'cash': return <Banknote size={14} />;
            case 'netbanking': return <Building size={14} />;
            case 'online': return <CreditCard size={14} />;
            default: return <Wallet size={14} />;
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '₹0';
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Filter and sort transactions
    const filteredTransactions = transactions
        .filter(t => {
            const matchesSearch = t.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'date') return new Date(b.date) - new Date(a.date);
            if (sortBy === 'amount') return b.amount - a.amount;
            if (sortBy === 'patient') return (a.patientName || '').localeCompare(b.patientName || '');
            return 0;
        });

    // Calculate total for filtered transactions
    const totalFilteredAmount = filteredTransactions.reduce((sum, t) =>
        t.status === 'completed' || t.status === 'success' ? sum + t.amount : sum, 0
    );

    // Handle generate invoice
    const generateInvoice = (transaction) => {
        setSelectedTransaction(transaction);
        setShowInvoiceModal(true);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#0D614E', borderTopColor: 'transparent' }} />
                    <p className="text-gray-500">Loading financial data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
                <div className="px-4 py-4 sm:px-8 sm:py-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Finance & Earnings</h1>
                            <p className="text-gray-500 mt-1">Track revenue, payments, and financial insights</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                                {['week', 'month', 'year'].map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setDateRange(range)}
                                        className={`px-3 py-1 rounded-md text-sm transition-all ${dateRange === range ? 'bg-[#0D614E] text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                                    >
                                        {range.charAt(0).toUpperCase() + range.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowPayoutModal(true)}
                                className="px-4 py-2 bg-[#0D614E] text-white rounded-lg flex items-center space-x-2 hover:bg-opacity-90 transition-all hover:shadow-md"
                            >
                                <Wallet size={16} />
                                <span>Request Payout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-4 sm:p-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Revenue Card */}
                    <div className="bg-gradient-to-br from-[#0D614E] to-[#0a4d3e] rounded-xl text-white p-6 shadow-lg hover:shadow-xl transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-emerald-100 text-sm">Total Revenue</p>
                                <div className="flex items-center space-x-2 mt-1">
                                    <p className="text-2xl font-bold text-white">
                                        {showBalance ? formatCurrency(stats.totalRevenue) : '••••••'}
                                    </p>
                                    <button onClick={() => setShowBalance(!showBalance)} className="p-1 hover:bg-white hover:bg-opacity-20 rounded">
                                        {showBalance ? <EyeOff size={16} /> : <EyeIcon size={16} />}
                                    </button>
                                </div>
                                <div className="flex items-center space-x-1 mt-2">
                                    <TrendingUp size={14} />
                                    <span className="text-xs">{stats.totalRevenueChange} from last year</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                                <IndianRupee size={24} />
                            </div>
                        </div>
                    </div>

                    {/* Total Settlements Card */}
                    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-sm">Total Settlements</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {showBalance ? (stats.totalSettlements ? formatCurrency(stats.totalSettlements) : '₹0') : '••••••'}
                                </p>
                                <div className="flex items-center space-x-1 mt-2">
                                    <ArrowUp size={12} className="text-emerald-600" />
                                    <span className="text-xs text-emerald-600">{stats.settlementsChange}</span>
                                    <span className="text-xs text-gray-400">vs last month</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <Wallet size={20} className="text-emerald-600" />
                            </div>
                        </div>
                    </div>

                    {/* Available for Settlement Card */}
                    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-sm">Available for Settlement</p>
                                <p className="text-2xl font-bold text-gray-800">
                                    {showBalance ? (stats.availableForSettlement ? formatCurrency(stats.availableForSettlement) : '₹0') : '••••••'}
                                </p>
                                <div className="flex items-center space-x-1 mt-2">
                                    <PiggyBank size={12} className="text-emerald-600" />
                                    <span className="text-xs text-gray-400">Ready to withdraw</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <PiggyBank size={20} className="text-emerald-600" />
                            </div>
                        </div>
                    </div>

                    {/* Pending Payments Card */}
                    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-gray-500 text-sm">Pending Payments</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {showBalance ? formatCurrency(stats.pendingPayments) : '••••••'}
                                </p>
                                <div className="flex items-center space-x-1 mt-2">
                                    <Clock size={12} className="text-yellow-600" />
                                    <span className="text-xs text-gray-400">Awaiting collection</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                                <Clock size={20} className="text-yellow-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-500">Avg. Consultation Fee</p>
                                <p className="text-lg font-bold text-gray-800">{formatCurrency(stats.averageConsultationFee)}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <ReceiptIndianRupee size={14} className="text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-500">Total Consultations</p>
                                <p className="text-lg font-bold text-gray-800">{stats.totalConsultations}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                <Users size={14} className="text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-500">Patient Satisfaction</p>
                                <p className="text-lg font-bold text-gray-800">{stats.patientSatisfaction || 'N/A'} ★</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                <Star size={14} className="text-yellow-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-500">Collection Rate</p>
                                <p className="text-lg font-bold text-gray-800">{stats.collectionRate}%</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <Target size={14} className="text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Revenue Overview</h3>
                                <p className="text-sm text-gray-500">Monthly revenue trends</p>
                            </div>
                        </div>
                        <div className="h-80">
                            {monthlyRevenue.length > 0 ? (
                                <div className="w-full h-full flex items-end space-x-2">
                                    {monthlyRevenue.map((data, idx) => (
                                        <div key={idx} className="flex-1 flex flex-col items-center">
                                            <div className="w-full relative group">
                                                <div
                                                    className="w-full bg-[#0D614E] rounded-t-lg transition-all duration-500 hover:bg-opacity-80 cursor-pointer"
                                                    style={{ height: `${(data.revenue / Math.max(...monthlyRevenue.map(m => m.revenue), 1)) * 200}px` }}
                                                >
                                                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                        {formatCurrency(data.revenue)}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-600 mt-2">{data.month}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    <p>No revenue data available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
                            <button className="text-sm text-[#0D614E] hover:underline">View All</button>
                        </div>
                        <div className="space-y-3">
                            {upcomingPayouts.length > 0 ? (
                                upcomingPayouts.map((payout) => (
                                    <div key={payout.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:shadow-md transition-all">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                                <Clock size={18} className="text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{payout.description}</p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <Calendar size={12} className="text-gray-400" />
                                                    <span className="text-xs text-gray-500">{payout.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-800">{formatCurrency(payout.amount)}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${payout.status === 'processing' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {payout.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <Wallet size={40} className="mx-auto mb-3 opacity-50" />
                                    <p>No recent transactions</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div> */}

                {/* Transactions Table */}
                <div className="bg-white rounded-xl shadow-sm">
                    {/* Table Header with Filters */}
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex flex-wrap gap-4 items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Transactions</h3>
                                <p className="text-sm text-gray-500 mt-1">View and manage all financial transactions</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Search transactions..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E] w-64"
                                    />
                                </div>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E]"
                                >
                                    <option value="all">All Status</option>
                                    <option value="completed">Completed</option>
                                    <option value="pending">Pending</option>
                                    <option value="expired">Expired</option>
                                </select>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E]"
                                >
                                    <option value="date">Sort by Date</option>
                                    <option value="amount">Sort by Amount</option>
                                    <option value="patient">Sort by Patient</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((transaction) => {
                                        const statusInfo = getStatusBadge(transaction.status);
                                        const StatusIcon = statusInfo.icon;
                                        const typeInfo = getTypeBadge(transaction.type);
                                        const TypeIcon = typeInfo.icon;
                                        return (
                                            <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">{transaction.transactionId}</p>
                                                        <p className="text-xs text-gray-400">{transaction.invoiceNumber}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0D614E] to-[#0a4d3e] flex items-center justify-center text-white text-xs font-semibold">
                                                            {transaction.patientName?.charAt(0) || 'P'}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-800">{transaction.patientName}</p>
                                                            <p className="text-xs text-gray-500">ID: {transaction.patientId?.slice(0, 8)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm text-gray-800">{transaction.date}</p>
                                                        <p className="text-xs text-gray-400">{transaction.time}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                                                        <TypeIcon size={12} />
                                                        <span>{typeInfo.label}</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-semibold text-gray-800">{formatCurrency(transaction.amount)}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-1">
                                                        {getPaymentMethodIcon(transaction.paymentMethod)}
                                                        <span className="text-sm text-gray-600 capitalize">{transaction.paymentMethod}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                                        <StatusIcon size={12} />
                                                        <span>{statusInfo.label}</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => generateInvoice(transaction)}
                                                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="View Invoice"
                                                        >
                                                            <ReceiptIndianRupee size={16} className="text-gray-500" />
                                                        </button>
                                                        <button
                                                            onClick={() => setSelectedTransaction(transaction)}
                                                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Eye size={16} className="text-gray-500" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-8 text-center text-gray-400">
                                            <Receipt size={40} className="mx-auto mb-3 opacity-50" />
                                            <p>No transactions found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer */}
                    <div className="p-6 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <p className="text-sm text-gray-500">
                                Showing {filteredTransactions.length} of {transactions.length} transactions
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                                Total: {formatCurrency(totalFilteredAmount)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction Details Modal */}
            {selectedTransaction && !showInvoiceModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800">Transaction Details</h3>
                                <p className="text-sm text-gray-500 mt-1">Complete transaction information</p>
                            </div>
                            <button onClick={() => setSelectedTransaction(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500">Transaction ID</p>
                                        <p className="font-semibold text-gray-800">{selectedTransaction.transactionId}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Invoice Number</p>
                                        <p className="font-semibold text-gray-800">{selectedTransaction.invoiceNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Date & Time</p>
                                        <p className="font-semibold text-gray-800">{selectedTransaction.date} at {selectedTransaction.time}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Amount</p>
                                        <p className="text-2xl font-bold text-[#0D614E]">{formatCurrency(selectedTransaction.amount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Patient Name</p>
                                        <p className="font-semibold text-gray-800">{selectedTransaction.patientName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Doctor</p>
                                        <p className="font-semibold text-gray-800">{selectedTransaction.doctor}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Consultation Type</p>
                                        <p className="font-semibold text-gray-800">{selectedTransaction.consultationType}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Duration</p>
                                        <p className="font-semibold text-gray-800">{selectedTransaction.duration}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Payment Method</p>
                                        <div className="flex items-center space-x-1">
                                            {getPaymentMethodIcon(selectedTransaction.paymentMethod)}
                                            <p className="font-semibold text-gray-800 capitalize">{selectedTransaction.paymentMethod}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Status</p>
                                        <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedTransaction.status).color}`}>
                                            <span>{getStatusBadge(selectedTransaction.status).label}</span>
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                                    <p className="text-sm text-gray-700">{selectedTransaction.notes}</p>
                                </div>
                            </div>
                        </div>
                        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end space-x-3">
                            <button
                                onClick={() => {
                                    setSelectedTransaction(null);
                                    setShowInvoiceModal(true);
                                }}
                                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                            >
                                <Printer size={16} />
                                <span>Print Invoice</span>
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedTransaction(null);
                                }}
                                className="px-4 py-2 bg-[#0D614E] text-white rounded-lg hover:bg-opacity-90 flex items-center space-x-2"
                            >
                                <Send size={16} />
                                <span>Send Invoice</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice Modal */}
            {showInvoiceModal && selectedTransaction && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-800">Invoice</h3>
                                <p className="text-sm text-gray-500 mt-1">{selectedTransaction.invoiceNumber}</p>
                            </div>
                            <button onClick={() => setShowInvoiceModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8">
                            {/* Invoice Header */}
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-[#0D614E] rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Leaf size={32} className="text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">AyurMuni</h2>
                                <p className="text-gray-500">Ayurvedic Health Center</p>
                                <p className="text-xs text-gray-400 mt-2">123 Wellness Street, Mumbai - 400001</p>
                            </div>

                            {/* Invoice Details */}
                            <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-200">
                                <div>
                                    <p className="text-xs text-gray-500">Bill To:</p>
                                    <p className="font-semibold text-gray-800">{selectedTransaction.patientName}</p>
                                    <p className="text-sm text-gray-600">Patient ID: {selectedTransaction.patientId?.slice(0, 8)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Invoice Date:</p>
                                    <p className="font-semibold text-gray-800">{selectedTransaction.date}</p>
                                    <p className="text-sm text-gray-600">Transaction ID: {selectedTransaction.transactionId}</p>
                                </div>
                            </div>

                            {/* Invoice Items */}
                            <table className="w-full mb-6">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Quantity</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Rate</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="px-4 py-3 text-sm text-gray-800">{selectedTransaction.consultationType}</td>
                                        <td className="px-4 py-3 text-right text-sm text-gray-800">1</td>
                                        <td className="px-4 py-3 text-right text-sm text-gray-800">{formatCurrency(selectedTransaction.amount)}</td>
                                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-800">{formatCurrency(selectedTransaction.amount)}</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="3" className="px-4 py-3 text-right font-semibold text-gray-800">Subtotal:</td>
                                        <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(selectedTransaction.amount)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan="3" className="px-4 py-3 text-right font-semibold text-gray-800">Tax (18% GST):</td>
                                        <td className="px-4 py-3 text-right font-semibold text-gray-800">{formatCurrency(selectedTransaction.amount * 0.18)}</td>
                                    </tr>
                                    <tr className="text-lg">
                                        <td colSpan="3" className="px-4 py-3 text-right font-bold text-gray-800">Total:</td>
                                        <td className="px-4 py-3 text-right font-bold text-[#0D614E]">{formatCurrency(selectedTransaction.amount * 1.18)}</td>
                                    </tr>
                                </tfoot>
                            </table>

                            {/* Footer */}
                            <div className="text-center pt-6 border-t border-gray-200">
                                <p className="text-sm text-gray-500">Thank you for choosing AyurMuni</p>
                                <p className="text-xs text-gray-400 mt-1">For any queries, please contact support@ayurmuni.com</p>
                            </div>
                        </div>
                        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-end space-x-3">
                            <button onClick={() => window.print()} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
                                <Printer size={16} />
                                <span>Print</span>
                            </button>
                            <button onClick={() => setShowInvoiceModal(false)} className="px-4 py-2 bg-[#0D614E] text-white rounded-lg hover:bg-opacity-90 flex items-center space-x-2">
                                <Download size={16} />
                                <span>Download PDF</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payout Request Modal */}
            {showPayoutModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">Request Payout</h3>
                            <button onClick={() => setShowPayoutModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                <input type="number" placeholder="Enter amount" className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
                                <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E]">
                                    <option>XXXX-XXXX-1234 (HDFC Bank)</option>
                                    <option>XXXX-XXXX-5678 (ICICI Bank)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                                <textarea rows="3" placeholder="Any additional information..." className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E]" />
                            </div>
                        </div>
                        <div className="flex space-x-3 mt-6">
                            <button onClick={() => setShowPayoutModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                                Cancel
                            </button>
                            <button className="flex-1 px-4 py-2 bg-[#0D614E] text-white rounded-lg hover:bg-opacity-90">
                                Submit Request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slide-in {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default FinanceDashboard;