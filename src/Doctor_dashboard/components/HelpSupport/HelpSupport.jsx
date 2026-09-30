// HelpSupport.jsx
import React, { useState, useRef, useEffect } from 'react';
import {
    HelpCircle,
    MessageCircle,
    Mail,
    Phone,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Send,
    Paperclip,
    Smile,
    MoreVertical,
    Search,
    Filter,
    Star,
    Award,
    TrendingUp,
    Users,
    FileText,
    BookOpen,
    Video,
    Download,
    Upload,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Plus,
    Minus,
    ThumbsUp,
    ThumbsDown,
    Copy,
    ExternalLink,
    Link,
    Calendar,
    User,
    Building,
    Globe,
    // Facebook,
    // Twitter,
    // Linkedin,
    // Youtube,
    // Instagram,
    MessageSquare,
    Headphones,
    LifeBuoy,
    Shield,
    Lock,
    Settings,
    Bell,
    Zap,
    Sparkles,
    Leaf,
    Heart,
    Brain,
    Wind,
    Sun,
    Moon,
    Activity,
    Pill,
    Stethoscope,
    Users as UsersIcon,
    Calendar as CalendarIcon,
    Clock as ClockIcon,
    CheckCheck,
    X,
    Menu,
    Grid,
    List,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    ArrowDown,
    Minimize2,
    Maximize2,
    Volume2,
    VolumeX,
    Mic,
    MicOff,
    Camera,
    CameraOff,
    PhoneCall,
    PhoneOff,
    Video as VideoIcon,
    VideoOff,
    Monitor,
    Smartphone,
    Tablet,
    Laptop,
    Wifi,
    WifiOff,
    Battery,
    BatteryCharging,
    Signal,
    SignalLow,
    SignalMedium,
    SignalHigh,
    Bluetooth,
    BluetoothConnected,
    Usb,
    Printer,
    Scanner,
    HardDrive,
    Cpu,
    Server,
    Cloud,
    CloudRain,
    CloudSnow,
    CloudLightning,
    Sun as SunIcon,
    Moon as MoonIcon,
    Cloudy,
    Wind as WindIcon,
    Droplet as DropletIcon,
    Thermometer as ThermometerIcon,
    Umbrella,
    Snowflake,
    Zap as ZapIcon,
    Flame,
    Droplets,
    Waves,
    Mountain,
    TreePine,
    Flower2,
    Leaf as LeafIcon,
    Sprout,
    Trees,
    Bird,
    Fish,
    Dog,
    Cat,
    Rabbit,
    Turtle,
    Snail,
    Bug,
    Bee,
    Butterfly,
    Ladybug,
    Spider,
    Ant,
    Grasshopper,
    Dragonfly,
    Firefly,
    Worm,
    Snail as SnailIcon,
    DollarSign,
    Eye
} from 'lucide-react';

const HelpSupport = () => {
    const [activeTab, setActiveTab] = useState('faq');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { id: 1, sender: 'support', message: 'Hello! Welcome to AyurMuni Support. How can I help you today?', time: '10:30 AM', type: 'text' },
        { id: 2, sender: 'user', message: 'I need help with patient management', time: '10:31 AM', type: 'text' },
        { id: 3, sender: 'support', message: 'Sure! I can help you with that. What specific issue are you facing?', time: '10:32 AM', type: 'text' }
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [ticketStatus, setTicketStatus] = useState('open');
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackText, setFeedbackText] = useState('');
    const messagesEndRef = useRef(null);
    const chatInputRef = useRef(null);

    // FAQ Data
    const faqCategories = [
        { id: 'all', name: 'All Topics', icon: HelpCircle, count: 24 },
        { id: 'getting-started', name: 'Getting Started', icon: Rocket, count: 6 },
        { id: 'patient-management', name: 'Patient Management', icon: Users, count: 8 },
        { id: 'appointments', name: 'Appointments', icon: Calendar, count: 5 },
        { id: 'billing', name: 'Billing & Payments', icon: DollarSign, count: 4 },
        { id: 'technical', name: 'Technical Issues', icon: Settings, count: 7 }
    ];

    const faqs = [
        {
            id: 1,
            category: 'getting-started',
            question: 'How do I create a new patient profile?',
            answer: 'To create a new patient profile, click on "Patient Management" from the sidebar, then click the "Add New Patient" button. Fill in the patient\'s personal information, medical history, and ayurvedic details. Click "Save" to create the profile. You can also import patients via CSV file using the import button.',
            helpful: 245,
            notHelpful: 12,
            tags: ['patient', 'create', 'profile']
        },
        {
            id: 2,
            category: 'getting-started',
            question: 'How do I schedule an appointment?',
            answer: 'Navigate to "Appointments" from the main menu, click "New Appointment", select the patient, choose date and time, select appointment type, and click "Schedule". You can also schedule from the patient profile page by clicking "Schedule Appointment".',
            helpful: 189,
            notHelpful: 8,
            tags: ['appointment', 'schedule', 'booking']
        },
        {
            id: 3,
            category: 'patient-management',
            question: 'How do I add medical history for a patient?',
            answer: 'Go to the patient\'s profile, click on the "Medical History" tab. You can add past treatments, current medications, allergies, and lifestyle information. Click "Save" to update the patient\'s records.',
            helpful: 167,
            notHelpful: 5,
            tags: ['medical', 'history', 'record']
        },
        {
            id: 4,
            category: 'patient-management',
            question: 'How to track patient health progress?',
            answer: 'The dashboard provides health scores and progress tracking. You can also view health trends in the patient profile under "Health Metrics". Regular follow-ups and updating vitals helps track improvement over time.',
            helpful: 234,
            notHelpful: 3,
            tags: ['health', 'progress', 'tracking']
        },
        {
            id: 5,
            category: 'appointments',
            question: 'How to reschedule an appointment?',
            answer: 'Go to Appointments, find the appointment you want to reschedule, click on the edit icon, select new date and time, and confirm. The patient will receive an automatic notification about the change.',
            helpful: 156,
            notHelpful: 7,
            tags: ['reschedule', 'appointment', 'change']
        },
        {
            id: 6,
            category: 'appointments',
            question: 'Can I set recurring appointments?',
            answer: 'Yes, when scheduling an appointment, you can select "Recurring" option and choose the frequency (daily, weekly, monthly). The system will automatically create follow-up appointments.',
            helpful: 98,
            notHelpful: 4,
            tags: ['recurring', 'repeat', 'series']
        },
        {
            id: 7,
            category: 'billing',
            question: 'How to generate invoices for patients?',
            answer: 'Go to Finance section, find the transaction, click on the invoice icon. You can view, print, or email the invoice to the patient. Invoices include GST details and payment information.',
            helpful: 212,
            notHelpful: 6,
            tags: ['invoice', 'billing', 'payment']
        },
        {
            id: 8,
            category: 'billing',
            question: 'What payment methods are accepted?',
            answer: 'AyurMuni supports multiple payment methods including Credit/Debit Cards, UPI, Net Banking, Cash, and Wallet payments. You can configure payment gateways in Settings.',
            helpful: 145,
            notHelpful: 2,
            tags: ['payment', 'methods', 'gateway']
        },
        {
            id: 9,
            category: 'technical',
            question: 'How to export data from the system?',
            answer: 'Most modules have an export button. You can export patient lists, appointments, financial data, and reports in CSV, Excel, or PDF formats. Go to the respective module and click "Export".',
            helpful: 178,
            notHelpful: 9,
            tags: ['export', 'data', 'backup']
        },
        {
            id: 10,
            category: 'technical',
            question: 'How to backup my data?',
            answer: 'Automatic backups are performed daily. You can also manually backup from Settings > Data Management. Click "Create Backup" to download a copy of all your data.',
            helpful: 134,
            notHelpful: 3,
            tags: ['backup', 'data', 'security']
        },
        {
            id: 11,
            category: 'getting-started',
            question: 'How to add multiple users/doctors?',
            answer: 'Go to Settings > User Management. Click "Add User", fill in the details, assign role (Doctor, Admin, Receptionist), and set permissions. Each user will have their own login credentials.',
            helpful: 156,
            notHelpful: 11,
            tags: ['user', 'doctor', 'staff']
        },
        {
            id: 12,
            category: 'patient-management',
            question: 'How to send notifications to patients?',
            answer: 'Use the messaging feature in patient profile or send bulk notifications from Communications center. You can send SMS, Email, or in-app notifications for appointments, reminders, and health tips.',
            helpful: 143,
            notHelpful: 5,
            tags: ['notification', 'sms', 'email']
        }
    ];

    // Support Tickets
    const [tickets, setTickets] = useState([
        {
            id: 'TKT-001',
            subject: 'Cannot access patient records',
            status: 'open',
            priority: 'high',
            category: 'technical',
            created: '2024-01-15',
            lastUpdate: '2024-01-15',
            messages: [
                { sender: 'user', message: 'I am unable to view patient records after the recent update', time: '10:00 AM' },
                { sender: 'support', message: 'We are looking into this issue. Can you please clear your browser cache and try again?', time: '10:30 AM' }
            ]
        },
        {
            id: 'TKT-002',
            subject: 'Payment gateway integration',
            status: 'in-progress',
            priority: 'medium',
            category: 'billing',
            created: '2024-01-14',
            lastUpdate: '2024-01-14',
            messages: [
                { sender: 'user', message: 'Need help integrating Razorpay payment gateway', time: '02:00 PM' },
                { sender: 'support', message: 'I will share the integration documentation with you', time: '03:00 PM' }
            ]
        },
        {
            id: 'TKT-003',
            subject: 'Invoice template customization',
            status: 'resolved',
            priority: 'low',
            category: 'billing',
            created: '2024-01-10',
            lastUpdate: '2024-01-12',
            messages: [
                { sender: 'user', message: 'How to customize invoice template?', time: '11:00 AM' },
                { sender: 'support', message: 'You can customize from Settings > Invoice Settings', time: '11:30 AM' },
                { sender: 'user', message: 'Thank you! Found it.', time: '12:00 PM' }
            ]
        }
    ]);

    // Knowledge Base Articles
    const knowledgeBase = [
        {
            id: 1,
            title: 'Getting Started with AyurMuni',
            category: 'getting-started',
            readTime: '5 min',
            views: 1234,
            helpful: 456,
            icon: Rocket
        },
        {
            id: 2,
            title: 'Patient Management Best Practices',
            category: 'patient-management',
            readTime: '8 min',
            views: 892,
            helpful: 345,
            icon: Users
        },
        {
            id: 3,
            title: 'Understanding Ayurvedic Dashboard Analytics',
            category: 'analytics',
            readTime: '6 min',
            views: 567,
            helpful: 234,
            icon: TrendingUp
        },
        {
            id: 4,
            title: 'Setting Up Online Consultations',
            category: 'technical',
            readTime: '10 min',
            views: 678,
            helpful: 289,
            icon: VideoIcon
        },
        {
            id: 5,
            title: 'Financial Management & Reporting',
            category: 'billing',
            readTime: '7 min',
            views: 445,
            helpful: 198,
            icon: DollarSign
        }
    ];

    // Video Tutorials
    const videoTutorials = [
        {
            id: 1,
            title: 'Dashboard Overview',
            duration: '4:32',
            views: 2341,
            thumbnail: 'https://via.placeholder.com/320x180/0D614E/FFFFFF?text=Dashboard+Tutorial'
        },
        {
            id: 2,
            title: 'Patient Management Guide',
            duration: '6:15',
            views: 1876,
            thumbnail: 'https://via.placeholder.com/320x180/0D614E/FFFFFF?text=Patient+Guide'
        },
        {
            id: 3,
            title: 'Appointment Scheduling',
            duration: '3:48',
            views: 1543,
            thumbnail: 'https://via.placeholder.com/320x180/0D614E/FFFFFF?text=Appointments'
        },
        {
            id: 4,
            title: 'Financial Reports',
            duration: '5:22',
            views: 987,
            thumbnail: 'https://via.placeholder.com/320x180/0D614E/FFFFFF?text=Finance'
        }
    ];

    // Filter FAQs based on search and category
    const filteredFaqs = faqs.filter(faq => {
        const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Scroll chat to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Simulate typing indicator
    useEffect(() => {
        if (!isTyping) return undefined;
        const timer = setTimeout(() => {
            setIsTyping(false);
            setChatMessages(prev => [...prev, {
                id: prev.length + 1,
                sender: 'support',
                message: 'I understand. Let me help you with that. Could you provide more details?',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'text'
            }]);
        }, 2000);
        return () => clearTimeout(timer);
    }, [isTyping]);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        const userMessage = {
            id: chatMessages.length + 1,
            sender: 'user',
            message: newMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: 'text'
        };

        setChatMessages([...chatMessages, userMessage]);
        setNewMessage('');
        setIsTyping(true);
    };

    const handleFaqHelpful = (faqId, isHelpful) => {
        const faq = faqs.find(f => f.id === faqId);
        if (faq) {
            if (isHelpful) {
                faq.helpful++;
            } else {
                faq.notHelpful++;
            }
        }
        // Show feedback notification
        alert(`Thank you for your ${isHelpful ? 'positive' : 'negative'} feedback!`);
    };

    const handleSubmitFeedback = () => {
        if (feedbackRating > 0) {
            alert(`Thank you for rating us ${feedbackRating} stars! Your feedback: ${feedbackText}`);
            setFeedbackRating(0);
            setFeedbackText('');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'open': return 'bg-rose-100 text-rose-700';
            case 'in-progress': return 'bg-yellow-100 text-yellow-700';
            case 'resolved': return 'bg-emerald-100 text-emerald-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-rose-600 bg-rose-50';
            case 'medium': return 'text-yellow-600 bg-yellow-50';
            case 'low': return 'text-emerald-600 bg-emerald-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0D614E] to-[#0a4d3e] text-white">
                <div className="px-8 py-12">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4">
                            <LifeBuoy size={32} />
                        </div>
                        <h1 className="text-3xl font-bold mb-2">How can we help you?</h1>
                        <p className="text-emerald-100 mb-6">Get answers to your questions, watch tutorials, or contact our support team</p>

                        {/* Search Bar */}
                        <div className="relative max-w-2xl mx-auto">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search for help articles, guides, or ask a question..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-24 py-3 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white"
                            />
                            <button className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-[#0D614E] text-white rounded-lg hover:bg-opacity-90">
                                Search
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="px-8">
                    <div className="flex space-x-8 overflow-x-auto">
                        {[
                            { id: 'faq', label: 'FAQ', icon: HelpCircle },
                            { id: 'tickets', label: 'Support Tickets', icon: Ticket },
                            { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
                            { id: 'tutorials', label: 'Video Tutorials', icon: Video },
                            { id: 'contact', label: 'Contact Us', icon: Mail }
                        ].map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center space-x-2 py-4 border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id
                                            ? 'border-[#0D614E] text-[#0D614E]'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <Icon size={18} />
                                    <span className="font-medium">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* FAQ Tab */}
                {activeTab === 'faq' && (
                    <div>
                        {/* Categories Filter */}
                        <div className="flex flex-wrap gap-3 mb-8">
                            {faqCategories.map((category) => {
                                const Icon = category.icon;
                                return (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${selectedCategory === category.id
                                                ? 'bg-[#0D614E] text-white shadow-md'
                                                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                            }`}
                                    >
                                        <Icon size={16} />
                                        <span>{category.name}</span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedCategory === category.id ? 'bg-white bg-opacity-20' : 'bg-gray-100'
                                            }`}>
                                            {category.count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* FAQ Items */}
                        <div className="space-y-4">
                            {filteredFaqs.map((faq) => (
                                <div key={faq.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
                                    <button
                                        onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                                        className="w-full px-6 py-4 flex justify-between items-center text-left"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="text-xs font-medium text-[#0D614E] bg-emerald-50 px-2 py-0.5 rounded-full">
                                                    {faqCategories.find(c => c.id === faq.category)?.name}
                                                </span>
                                                <div className="flex items-center space-x-1 text-xs text-gray-400">
                                                    <ThumbsUp size={12} />
                                                    <span>{faq.helpful}</span>
                                                    <ThumbsDown size={12} className="ml-2" />
                                                    <span>{faq.notHelpful}</span>
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-800">{faq.question}</h3>
                                        </div>
                                        {expandedFaq === faq.id ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                    </button>

                                    {expandedFaq === faq.id && (
                                        <div className="px-6 pb-6 pt-2 border-t border-gray-100">
                                            <p className="text-gray-600 mb-4">{faq.answer}</p>
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {faq.tags.map((tag, idx) => (
                                                    <span key={idx} className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">#{tag}</span>
                                                ))}
                                            </div>
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                                <div className="flex items-center space-x-4">
                                                    <span className="text-sm text-gray-500">Was this helpful?</span>
                                                    <button
                                                        onClick={() => handleFaqHelpful(faq.id, true)}
                                                        className="flex items-center space-x-1 text-gray-600 hover:text-emerald-600 transition-colors"
                                                    >
                                                        <ThumbsUp size={16} />
                                                        <span className="text-sm">Yes ({faq.helpful})</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleFaqHelpful(faq.id, false)}
                                                        className="flex items-center space-x-1 text-gray-600 hover:text-rose-600 transition-colors"
                                                    >
                                                        <ThumbsDown size={16} />
                                                        <span className="text-sm">No ({faq.notHelpful})</span>
                                                    </button>
                                                </div>
                                                <button className="text-sm text-[#0D614E] hover:underline">
                                                    Still have questions? Contact Support
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {filteredFaqs.length === 0 && (
                            <div className="text-center py-12">
                                <HelpCircle size={48} className="mx-auto text-gray-400 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">No results found</h3>
                                <p className="text-gray-500">Try adjusting your search or browse by category</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Support Tickets Tab */}
                {activeTab === 'tickets' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Support Tickets</h2>
                                <p className="text-gray-500 mt-1">Track and manage your support requests</p>
                            </div>
                            <button className="px-4 py-2 bg-[#0D614E] text-white rounded-lg flex items-center space-x-2 hover:bg-opacity-90 transition-all">
                                <Plus size={18} />
                                <span>New Ticket</span>
                            </button>
                        </div>

                        {/* Ticket Filters */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            {['all', 'open', 'in-progress', 'resolved'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setTicketStatus(status)}
                                    className={`px-4 py-2 rounded-lg capitalize transition-all ${ticketStatus === status
                                            ? 'bg-[#0D614E] text-white'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {status === 'all' ? 'All Tickets' : status}
                                </button>
                            ))}
                        </div>

                        {/* Tickets List */}
                        <div className="space-y-4">
                            {tickets.filter(t => ticketStatus === 'all' || t.status === ticketStatus).map((ticket) => (
                                <div key={ticket.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center space-x-3 mb-2">
                                                <span className="text-sm font-mono text-gray-500">{ticket.id}</span>
                                                <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(ticket.status)}`}>
                                                    {ticket.status}
                                                </span>
                                                <span className={`text-xs px-2 py-1 rounded-full capitalize ${getPriorityColor(ticket.priority)}`}>
                                                    {ticket.priority} priority
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-800">{ticket.subject}</h3>
                                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                                <span className="flex items-center space-x-1">
                                                    <Calendar size={14} />
                                                    <span>Created: {ticket.created}</span>
                                                </span>
                                                <span className="flex items-center space-x-1">
                                                    <Clock size={14} />
                                                    <span>Last update: {ticket.lastUpdate}</span>
                                                </span>
                                            </div>
                                        </div>
                                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                                            <MoreVertical size={18} className="text-gray-400" />
                                        </button>
                                    </div>

                                    {/* Preview of last message */}
                                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Latest: </span>
                                            {ticket.messages[ticket.messages.length - 1].message}
                                        </p>
                                    </div>

                                    <button className="text-[#0D614E] text-sm font-medium hover:underline flex items-center space-x-1">
                                        <MessageCircle size={14} />
                                        <span>View Conversation ({ticket.messages.length} messages)</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Knowledge Base Tab */}
                {activeTab === 'knowledge' && (
                    <div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Categories Sidebar */}
                            <div className="lg:col-span-1">
                                <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                                    <h3 className="font-semibold text-gray-800 mb-4">Categories</h3>
                                    <div className="space-y-2">
                                        {faqCategories.filter(c => c.id !== 'all').map((category) => {
                                            const Icon = category.icon;
                                            return (
                                                <button
                                                    key={category.id}
                                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <Icon size={18} className="text-gray-500" />
                                                        <span className="text-gray-700">{category.name}</span>
                                                    </div>
                                                    <ChevronRight size={16} className="text-gray-400" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Articles List */}
                            <div className="lg:col-span-2">
                                <div className="space-y-4">
                                    {knowledgeBase.map((article) => {
                                        const Icon = article.icon;
                                        return (
                                            <div key={article.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6">
                                                <div className="flex items-start space-x-4">
                                                    <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                                                        <Icon size={24} style={{ color: '#0D614E' }} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{article.title}</h3>
                                                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                                                            <span className="flex items-center space-x-1">
                                                                <Clock size={14} />
                                                                <span>{article.readTime} read</span>
                                                            </span>
                                                            <span className="flex items-center space-x-1">
                                                                <Eye size={14} />
                                                                <span>{article.views} views</span>
                                                            </span>
                                                            <span className="flex items-center space-x-1">
                                                                <ThumbsUp size={14} />
                                                                <span>{article.helpful} helpful</span>
                                                            </span>
                                                        </div>
                                                        <button className="text-[#0D614E] text-sm font-medium hover:underline flex items-center space-x-1">
                                                            <span>Read Article</span>
                                                            <ChevronRight size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Video Tutorials Tab */}
                {activeTab === 'tutorials' && (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {videoTutorials.map((video) => (
                                <div key={video.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
                                    <div className="relative group cursor-pointer">
                                        <img src={video.thumbnail} alt={video.title} className="w-full h-40 object-cover" />
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                                                <Play size={24} className="text-[#0D614E] ml-1" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                                            {video.duration}
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-800 mb-1">{video.title}</h3>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">{video.views} views</span>
                                            <button className="text-[#0D614E] text-xs hover:underline">Watch Now</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Contact Us Tab */}
                {activeTab === 'contact' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Contact Information */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Get in Touch</h2>
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-4">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <Mail size={18} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">Email Support</p>
                                            <p className="text-sm text-gray-500">support@ayurmuni.com</p>
                                            <p className="text-xs text-gray-400">Response within 24 hours</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <Phone size={18} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">Phone Support</p>
                                            <p className="text-sm text-gray-500">+91 1800 123 4567</p>
                                            <p className="text-xs text-gray-400">Mon-Fri, 9 AM - 6 PM IST</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-4">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                            <MessageCircle size={18} className="text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">Live Chat</p>
                                            <p className="text-sm text-gray-500">Available 24/7</p>
                                            <button
                                                onClick={() => setShowChat(true)}
                                                className="text-xs text-[#0D614E] hover:underline"
                                            >
                                                Start a chat now
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Office Hours */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h3 className="font-semibold text-gray-800 mb-4">Office Hours</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Monday - Friday</span>
                                        <span className="text-gray-800">9:00 AM - 6:00 PM</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Saturday</span>
                                        <span className="text-gray-800">10:00 AM - 4:00 PM</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Sunday</span>
                                        <span className="text-gray-800">Closed</span>
                                    </div>
                                </div>
                            </div>

                            {/* Social Media */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h3 className="font-semibold text-gray-800 mb-4">Connect With Us</h3>
                                <div className="flex space-x-4">
                                    <button className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:scale-110 transition-transform">
                                        {/* <Facebook size={18} /> */}
                                    </button>
                                    <button className="w-10 h-10 rounded-full bg-sky-500 text-white flex items-center justify-center hover:scale-110 transition-transform">
                                        {/* <Twitter size={18} /> */}
                                    </button>
                                    <button className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center hover:scale-110 transition-transform">
                                        {/* <Youtube size={18} /> */}
                                    </button>
                                    <button className="w-10 h-10 rounded-full bg-pink-600 text-white flex items-center justify-center hover:scale-110 transition-transform">
                                        {/* <Instagram size={18} /> */}
                                    </button>
                                    <button className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center hover:scale-110 transition-transform">
                                        {/* <Linkedin size={18} /> */}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">Send us a Message</h2>
                            <form className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                    <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                                    <input type="email" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                                    <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                                    <textarea rows="5" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E]"></textarea>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input type="checkbox" className="rounded border-gray-300 text-[#0D614E]" />
                                    <span className="text-sm text-gray-600">I agree to the terms and privacy policy</span>
                                </div>
                                <button type="submit" className="w-full px-6 py-3 bg-[#0D614E] text-white rounded-lg font-medium hover:bg-opacity-90 transition-all">
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Live Chat Widget */}
            {showChat && (
                <div className="fixed bottom-4 right-4 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 animate-slide-in">
                    {/* Chat Header */}
                    <div className="bg-gradient-to-r from-[#0D614E] to-[#0a4d3e] text-white p-4 rounded-t-xl flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                                    <LifeBuoy size={20} />
                                </div>
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white"></div>
                            </div>
                            <div>
                                <p className="font-semibold">Support Team</p>
                                <p className="text-xs text-emerald-100">Online • Usually replies in minutes</p>
                            </div>
                        </div>
                        <button onClick={() => setShowChat(false)} className="p-1 hover:bg-white hover:bg-opacity-20 rounded">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Chat Messages */}
                    <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {chatMessages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg p-3 ${msg.sender === 'user'
                                        ? 'bg-[#0D614E] text-white'
                                        : 'bg-white text-gray-800 shadow-sm'
                                    }`}>
                                    <p className="text-sm">{msg.message}</p>
                                    <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-emerald-100' : 'text-gray-400'}`}>
                                        {msg.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white rounded-lg p-3 shadow-sm">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 bg-white border-t border-gray-200 rounded-b-xl">
                        <div className="flex items-center space-x-2">
                            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <Paperclip size={18} className="text-gray-500" />
                            </button>
                            <input
                                ref={chatInputRef}
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type your message..."
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E]"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim()}
                                className="p-2 bg-[#0D614E] text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                            <div className="flex items-center space-x-1">
                                <Lock size={10} />
                                <span>End-to-end encrypted</span>
                            </div>
                            <span>Powered by AyurMuni Support</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Section */}
            <div className="bg-white border-t border-gray-200 mt-12">
                <div className="max-w-4xl mx-auto px-8 py-12 text-center">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Was this help center useful?</h3>
                    <p className="text-gray-500 mb-4">Your feedback helps us improve our support</p>
                    <div className="flex justify-center space-x-2 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setFeedbackRating(star)}
                                className="focus:outline-none"
                            >
                                <Star
                                    size={32}
                                    className={`transition-all ${star <= feedbackRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                            </button>
                        ))}
                    </div>
                    {feedbackRating > 0 && (
                        <div className="max-w-md mx-auto">
                            <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Tell us what we can improve..."
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D614E] mb-3"
                                rows="3"
                            />
                            <button
                                onClick={handleSubmitFeedback}
                                className="px-6 py-2 bg-[#0D614E] text-white rounded-lg hover:bg-opacity-90"
                            >
                                Submit Feedback
                            </button>
                        </div>
                    )}
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
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .animate-bounce {
                    animation: bounce 1s infinite;
                }
            `}</style>
        </div>
    );
};

// Missing icon imports
const Rocket = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></svg>;
const Ticket = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M13 5v2" /><path d="M13 17v2" /><path d="M13 11v2" /></svg>;
const Play = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
const Target = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;

export default HelpSupport;