import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Search,
    Send,
    Paperclip,
    User,
    Check,
    CheckCheck,
    X,
    ChevronLeft,
    Users,
    Calendar,
    Activity,
    Stethoscope,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
    fetchConversationList,
    fetchConversationMessages,
    mapConversationListItems,
    normalizePatientId,
    notifyChatActivity,
    notifyConversationListRefresh,
    sendChatMessageRest,
    uploadChatImage,
    mapBackendMessageToUi,
    applySeenReceiptToMessages,
    countUnreadPeerMessages,
    mergeMessagesById,
    createConsultationChatConnection,
    disconnectActiveConsultationChat,
    getChatSyncChannel,
    apiErrorMessage,
} from '../../../services/consultationChatService';
import { useParams } from 'react-router-dom';

const CHAT_SENDER_DOCTOR = 'doctor';
const CHAT_SENDER_PATIENT = 'patient';

const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatTime = (date) => {
    if (!date) return '';
    const value = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(value.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(value);
};

const formatDate = (date) => {
    const value = date instanceof Date ? date : new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (value.toDateString() === today.toDateString()) {
        return 'Today';
    }
    if (value.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(value);
};

const Avatar = ({ src, name, className = 'w-12 h-12' }) => {
    if (src) {
        return (
            <img
                src={src}
                alt={name}
                className={`${className} rounded-full object-cover`}
            />
        );
    }
    return (
        <div
            className={`${className} rounded-full bg-[#0D614E]/15 flex items-center justify-center text-[#0D614E] font-semibold text-sm`}
        >
            {getInitials(name)}
        </div>
    );
};

const MessageItem = ({ message }) => {
    const isOwn = message.senderId === CHAT_SENDER_DOCTOR;

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
            <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${isOwn
                    ? 'bg-[#0D614E] !text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                    }`}>
                    {message.type === 'image' && message.attachments?.length > 0 && (
                        <div className="space-y-2 mb-2">
                            {message.attachments.map((attachment, index) => (
                                <a
                                    key={`${message.id}-img-${index}`}
                                    href={attachment.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img
                                        src={attachment.file_url}
                                        alt={attachment.file_name || 'Attachment'}
                                        className="max-w-full rounded-lg max-h-48 object-cover"
                                    />
                                </a>
                            ))}
                        </div>
                    )}
                    {message.content && (
                        <p className={`text-sm whitespace-pre-wrap break-words ${isOwn ? '!text-white' : ''}`}>
                            {message.content}
                        </p>
                    )}
                </div>
                <div className={`flex items-center mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs text-gray-400">
                        {formatTime(message.timestamp)}
                    </span>
                    {isOwn && (
                        <span className="ml-1.5">
                            {message.status === 'sent' && <Check className="w-3.5 h-3.5 text-gray-400" />}
                            {message.status === 'delivered' && <CheckCheck className="w-3.5 h-3.5 text-gray-400" />}
                            {message.status === 'read' && <CheckCheck className="w-3.5 h-3.5 text-blue-400" />}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const PatientListItem = ({ patient, isSelected, onClick }) => (
    <div
        className={`flex items-center px-4 py-3 cursor-pointer transition-all duration-200 ${isSelected
            ? 'bg-[#0D614E]/10 border-l-4 border-[#0D614E]'
            : 'hover:bg-gray-50 border-l-4 border-transparent'
            }`}
        onClick={onClick}
    >
        <div className="relative flex-shrink-0">
            <Avatar src={patient.avatar} name={patient.name} />
            {patient.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
            )}
        </div>
        <div className="flex-1 min-w-0 ml-3">
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800 text-sm truncate">{patient.name}</h4>
                {patient.lastMessageTime && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatTime(patient.lastMessageTime)}
                    </span>
                )}
            </div>
            <div className="flex items-center justify-between mt-0.5">
                <p className="text-xs text-gray-500 truncate">
                    {patient.lastMessage || ''}
                </p>
                {patient.unreadCount > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 bg-[#0D614E] text-white text-xs rounded-full flex items-center justify-center font-medium">
                        {patient.unreadCount}
                    </span>
                )}
            </div>
        </div>
    </div>
);

const PatientInfoSidebar = ({ patient, onClose }) => (
    <div className="fixed inset-0 z-50 w-full bg-gray-50 flex flex-col h-full md:static md:inset-auto md:z-auto md:w-80 md:border-l md:border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Patient Info</h3>
            <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
                <X className="w-5 h-5 text-gray-500" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col items-center text-center mb-6">
                <Avatar src={patient.avatar} name={patient.name} className="w-20 h-20" />
                <h4 className="text-lg font-semibold text-gray-800 mt-3">{patient.name}</h4>
            </div>

            <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <User className="w-4 h-4" />
                        <span>Personal Details</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        {patient.age && (
                            <div>
                                <p className="text-gray-400 text-xs">Age</p>
                                <p className="font-medium text-gray-700">{patient.age} years</p>
                            </div>
                        )}
                        {patient.gender && (
                            <div>
                                <p className="text-gray-400 text-xs">Gender</p>
                                <p className="font-medium text-gray-700">{patient.gender}</p>
                            </div>
                        )}
                        {patient.bloodGroup && (
                            <div>
                                <p className="text-gray-400 text-xs">Blood Group</p>
                                <p className="font-medium text-gray-700">{patient.bloodGroup}</p>
                            </div>
                        )}
                        {/* {patient.phone && (
                            <div>
                                <p className="text-gray-400 text-xs">Phone</p>
                                <p className="font-medium text-gray-700 text-xs">{patient.phone}</p>
                            </div>
                        )} */}
                    </div>
                </div>

                {patient.allergies?.length > 0 && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <Activity className="w-4 h-4" />
                            <span>Allergies</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {patient.allergies.map((allergy, index) => (
                                <span key={index} className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full">
                                    {allergy}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {patient.medicalHistory?.length > 0 && (
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                            <Stethoscope className="w-4 h-4" />
                            <span>Medical History</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {patient.medicalHistory.map((condition, index) => (
                                <span key={index} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">
                                    {condition}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>Consultation</span>
                    </div>
                    {patient.chatAccess?.active_phase && (
                        <p className="text-sm text-gray-700 capitalize">
                            Chat: {patient.chatAccess.active_phase.replace(/_/g, ' ')}
                        </p>
                    )}
                    {patient.chatAccess?.call_status && (
                        <p className="text-sm text-gray-700 capitalize mt-1">
                            Call: {patient.chatAccess.call_status.replace(/_/g, ' ')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    </div>
);

const Messenger = ({ onSendMessage, onPatientSelect }) => {
    const profile = (() => {
        try {
            return JSON.parse(sessionStorage.getItem('profile') || '{}');
        } catch {
            return {};
        }
    })();
    const doctorName = profile.first_name
        ? `${profile.first_name} ${profile.last_name || ''}`.trim()
        : 'Doctor';

    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isPatientInfoOpen, setIsPatientInfoOpen] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [chatAccess, setChatAccess] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const inputRef = useRef(null);
    const wsConnectionRef = useRef(null);
    const selectedPatientRef = useRef(null);
    const messagesByPatientRef = useRef(new Map());
    const wsSessionRef = useRef(0);
    const historyRequestRef = useRef(0);
    const wsAppointmentIdRef = useRef(null);
    const ensureWebSocketForAccessRef = useRef(() => { });
    const tabIdRef = useRef(`tab-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const listRefreshTimerRef = useRef(null);
    const { patientId } = useParams();

    const isActivePatient = useCallback(
        (patientId) => normalizePatientId(selectedPatientRef.current?.patientId)
            === normalizePatientId(patientId),
        []
    );

    const updateConversationPreview = useCallback((patientId, messageList) => {
        if (!messageList?.length) return;
        const last = messageList[messageList.length - 1];
        const unread = countUnreadPeerMessages(messageList);

        setPatients((prev) => {
            const normalizedId = normalizePatientId(patientId);
            const index = prev.findIndex(
                (p) => normalizePatientId(p.patientId) === normalizedId
            );
            if (index === -1) return prev;

            const updated = {
                ...prev[index],
                lastMessage: last.content,
                lastMessageTime: last.timestamp,
                unreadCount: isActivePatient(patientId) ? 0 : unread,
            };

            const remaining = prev.filter((_, i) => i !== index);
            return [updated, ...remaining].sort(
                (a, b) => (b.lastMessageTime?.getTime() || 0) - (a.lastMessageTime?.getTime() || 0)
            );
        });
    }, [isActivePatient]);

    const scheduleConversationListRefresh = useCallback(() => {
        if (listRefreshTimerRef.current) {
            clearTimeout(listRefreshTimerRef.current);
        }
        listRefreshTimerRef.current = setTimeout(() => {
            listRefreshTimerRef.current = null;
            notifyConversationListRefresh(tabIdRef.current);
            fetchConversationsRef.current?.({ silent: true });
        }, 400);
    }, []);

    const broadcastChatActivity = useCallback((patientId) => {
        notifyChatActivity(patientId, tabIdRef.current);
        scheduleConversationListRefresh();
    }, [scheduleConversationListRefresh]);

    const syncMessagesForPatient = useCallback((patientId, nextMessages, { broadcast = true } = {}) => {
        const normalizedId = normalizePatientId(patientId);
        messagesByPatientRef.current.set(normalizedId, nextMessages);
        if (normalizePatientId(selectedPatientRef.current?.patientId) === normalizedId) {
            setMessages(nextMessages);
        }
        updateConversationPreview(normalizedId, nextMessages);
        if (broadcast) {
            broadcastChatActivity(normalizedId);
        }
    }, [updateConversationPreview, broadcastChatActivity]);

    const applyConversationAccess = useCallback((patientId, access) => {
        if (!access) return;

        const previousAppointmentId = selectedPatientRef.current?.appointmentId ?? null;
        const nextAppointmentId = access.active_appointment_id || null;

        setChatAccess(access);
        setSelectedPatient((prev) => {
            if (!prev || normalizePatientId(prev.patientId) !== normalizePatientId(patientId)) {
                return prev;
            }
            return {
                ...prev,
                appointmentId: nextAppointmentId,
                chatAccess: access,
            };
        });
        setPatients((prev) => prev.map((p) => (
            normalizePatientId(p.patientId) === normalizePatientId(patientId)
                ? { ...p, appointmentId: nextAppointmentId, chatAccess: access }
                : p
        )));

        const appointmentChanged = nextAppointmentId !== previousAppointmentId;
        const needsSocket = Boolean(nextAppointmentId);
        const socketMissing = needsSocket && !wsConnectionRef.current?.isConnected();
        const socketWrongRoom = needsSocket
            && wsAppointmentIdRef.current
            && wsAppointmentIdRef.current !== nextAppointmentId;

        if (appointmentChanged || socketMissing || socketWrongRoom || (!needsSocket && wsConnectionRef.current)) {
            ensureWebSocketForAccessRef.current(access);
        }
    }, []);

    const loadConversationHistory = useCallback(async (
        patientId,
        { markRead = true, broadcast = true } = {}
    ) => {
        const requestId = ++historyRequestRef.current;
        setIsLoadingMessages(true);
        try {
            const data = await fetchConversationMessages(patientId);
            if (requestId !== historyRequestRef.current) return data;
            if (!isActivePatient(patientId)) return data;

            const uiMessages = (data.messages || []).map((msg) =>
                mapBackendMessageToUi(msg, patientId)
            );
            syncMessagesForPatient(patientId, uiMessages, { broadcast });

            const access = data.conversation?.chat_access || null;
            if (access) {
                applyConversationAccess(patientId, access);
            }

            const activeAppointmentId = access?.active_appointment_id;
            if (
                markRead
                && activeAppointmentId
                && isActivePatient(patientId)
                && wsConnectionRef.current?.isConnected()
            ) {
                wsConnectionRef.current.sendChatRead();
            }

            return data;
        } catch (error) {
            if (requestId === historyRequestRef.current && isActivePatient(patientId)) {
                toast.error(apiErrorMessage(error, 'Failed to load conversation'));
            }
            throw error;
        } finally {
            if (requestId === historyRequestRef.current && isActivePatient(patientId)) {
                setIsLoadingMessages(false);
            }
        }
    }, [syncMessagesForPatient, isActivePatient, applyConversationAccess]);

    const handleChatEvent = useCallback((event, appointmentId, patientId, sessionId) => {
        if (wsSessionRef.current !== sessionId) return;

        switch (event.type) {
            case 'chat.connected':
                if (isActivePatient(patientId) && event.data?.chat_access) {
                    applyConversationAccess(patientId, {
                        ...event.data.chat_access,
                        active_appointment_id: appointmentId,
                    });
                }
                break;

            case 'chat.message': {
                const uiMessage = mapBackendMessageToUi(event.message, patientId);
                const existing = messagesByPatientRef.current.get(normalizePatientId(patientId)) || [];
                const merged = mergeMessagesById(existing, [uiMessage]);
                syncMessagesForPatient(patientId, merged);

                if (
                    uiMessage.senderRole === CHAT_SENDER_PATIENT
                    && isActivePatient(patientId)
                    && wsSessionRef.current === sessionId
                    && wsConnectionRef.current?.isConnected()
                ) {
                    wsConnectionRef.current.sendChatRead([uiMessage.id]);
                }
                break;
            }

            case 'chat.seen': {
                if (!isActivePatient(patientId)) break;
                const existing = messagesByPatientRef.current.get(normalizePatientId(patientId)) || [];
                const updated = applySeenReceiptToMessages(existing, event.data);
                syncMessagesForPatient(patientId, updated);
                break;
            }

            case 'chat.error':
                if (isActivePatient(patientId)) {
                    toast.error(event.message || 'Chat error');
                }
                break;

            default:
                break;
        }
    }, [syncMessagesForPatient, isActivePatient, applyConversationAccess]);

    const connectWebSocket = useCallback((patient) => {
        const appointmentId = patient?.appointmentId;
        const { patientId } = patient || {};

        if (!appointmentId || !patientId) {
            wsSessionRef.current += 1;
            disconnectActiveConsultationChat();
            wsConnectionRef.current = null;
            wsAppointmentIdRef.current = null;
            return;
        }

        const sessionId = ++wsSessionRef.current;
        wsAppointmentIdRef.current = appointmentId;

        if (wsConnectionRef.current) {
            wsConnectionRef.current.disconnect();
            wsConnectionRef.current = null;
        }

        wsConnectionRef.current = createConsultationChatConnection(appointmentId, {
            onOpen: (isReconnect) => {
                if (wsSessionRef.current !== sessionId) return;
                toast.dismiss(`chat-reconnect-${appointmentId}`);
                if (!isActivePatient(patientId)) return;
                if (isReconnect) {
                    loadConversationHistory(patientId, { markRead: true }).catch(() => { });
                } else {
                    wsConnectionRef.current?.sendChatRead();
                }
            },
            onEvent: (event) => handleChatEvent(event, appointmentId, patientId, sessionId),
            onReconnecting: () => {
                if (wsSessionRef.current !== sessionId) return;
                toast.loading('Reconnecting chat…', { id: `chat-reconnect-${appointmentId}` });
            },
            onClose: (event) => {
                if (wsSessionRef.current !== sessionId) return;
                if (event.code === 1000) {
                    toast.dismiss(`chat-reconnect-${appointmentId}`);
                }
            },
            onError: (error) => {
                if (wsSessionRef.current !== sessionId) return;
                if (error?.message && isActivePatient(patientId)) {
                    toast.error(error.message);
                }
            },
        });
    }, [handleChatEvent, loadConversationHistory, isActivePatient]);

    const ensureWebSocketForAccess = useCallback((access) => {
        const patient = selectedPatientRef.current;
        if (!patient) return;

        const nextAppointmentId = access?.active_appointment_id || null;

        if (!nextAppointmentId) {
            wsSessionRef.current += 1;
            disconnectActiveConsultationChat();
            wsConnectionRef.current = null;
            wsAppointmentIdRef.current = null;
            return;
        }

        const connectedAppointmentId = wsConnectionRef.current?.getAppointmentId?.()
            ?? wsAppointmentIdRef.current;

        if (
            connectedAppointmentId === nextAppointmentId
            && wsConnectionRef.current?.isConnected()
        ) {
            return;
        }

        connectWebSocket({
            ...patient,
            patientId: patient.patientId,
            appointmentId: nextAppointmentId,
        });
    }, [connectWebSocket]);

    ensureWebSocketForAccessRef.current = ensureWebSocketForAccess;

    const refreshActiveConversationAccess = useCallback(async (patientId) => {
        if (!patientId || !isActivePatient(patientId)) return;

        try {
            const data = await fetchConversationList();
            const conversation = (data.conversations || []).find(
                (item) => normalizePatientId(item.patient_id) === normalizePatientId(patientId)
            );
            if (!conversation?.chat_access || !isActivePatient(patientId)) return;

            applyConversationAccess(patientId, conversation.chat_access);
        } catch {
            // Polling/background refresh should not interrupt the open thread.
        }
    }, [applyConversationAccess, isActivePatient]);

    const fetchConversationsRef = useRef(async () => { });

    const fetchConversations = useCallback(async ({ silent = false, search = '' } = {}) => {
        if (!silent) setIsLoadingConversations(true);
        try {
            const data = await fetchConversationList({ search });
            const conversations = mapConversationListItems(data.conversations);
            const activePatientId = normalizePatientId(selectedPatientRef.current?.patientId);
            setPatients(
                activePatientId
                    ? conversations.map((conversation) => (
                        normalizePatientId(conversation.patientId) === activePatientId
                            ? { ...conversation, unreadCount: 0 }
                            : conversation
                    ))
                    : conversations
            );
        } catch (error) {
            if (!silent) {
                toast.error(apiErrorMessage(error, 'Failed to load conversations'));
                setPatients([]);
            }
        } finally {
            if (!silent) setIsLoadingConversations(false);
        }
    }, []);

    fetchConversationsRef.current = fetchConversations;

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchConversations({
                silent: Boolean(searchQuery),
                search: searchQuery,
            });
        }, searchQuery ? 300 : 0);
        return () => clearTimeout(timer);
    }, [searchQuery, fetchConversations]);

    useEffect(() => {
        const channel = getChatSyncChannel();
        if (!channel) return undefined;

        const handleCrossTabSync = (event) => {
            const { type, patientId, tabId } = event.data || {};
            if (tabId === tabIdRef.current) return;

            if (type === 'conversations-refresh' || type === 'chat-activity') {
                fetchConversations({ silent: true });
            }

            if (
                type === 'chat-activity'
                && patientId
                && selectedPatientRef.current?.patientId === patientId
            ) {
                loadConversationHistory(patientId, { markRead: true, broadcast: false }).catch(() => { });
            }
        };

        channel.addEventListener('message', handleCrossTabSync);
        return () => {
            channel.removeEventListener('message', handleCrossTabSync);
            channel.close();
        };
    }, [fetchConversations, loadConversationHistory]);

    useEffect(() => () => {
        if (listRefreshTimerRef.current) {
            clearTimeout(listRefreshTimerRef.current);
        }
    }, []);

    useEffect(() => () => {
        historyRequestRef.current += 1;
        wsSessionRef.current += 1;
        disconnectActiveConsultationChat();
        wsConnectionRef.current = null;
    }, []);

    useEffect(() => {
        selectedPatientRef.current = selectedPatient;
    }, [selectedPatient]);

    const selectedPatientId = selectedPatient?.patientId ?? null;

    useEffect(() => {
        if (!selectedPatientId) {
            wsSessionRef.current += 1;
            historyRequestRef.current += 1;
            disconnectActiveConsultationChat();
            wsConnectionRef.current = null;
            wsAppointmentIdRef.current = null;
            setMessages([]);
            setChatAccess(null);
            return undefined;
        }

        const cached = messagesByPatientRef.current.get(normalizePatientId(selectedPatientId));
        setMessages(cached || []);
        setPatients((prev) => prev.map((p) => (
            normalizePatientId(p.patientId) === normalizePatientId(selectedPatientId)
                ? { ...p, unreadCount: 0 }
                : p
        )));

        loadConversationHistory(selectedPatientId, { markRead: true }).catch(() => { });

        const handleOnline = () => {
            const current = selectedPatientRef.current;
            if (!current?.patientId) return;
            refreshActiveConversationAccess(current.patientId)
                .then(() => {
                    if (selectedPatientRef.current?.appointmentId) {
                        wsConnectionRef.current?.reconnect();
                    }
                })
                .catch(() => { });
        };

        const handleVisibility = () => {
            if (document.visibilityState !== 'visible' || !selectedPatientRef.current) return;
            loadConversationHistory(
                selectedPatientRef.current.patientId,
                { markRead: true }
            ).catch(() => { });
        };

        const accessPollId = setInterval(() => {
            refreshActiveConversationAccess(selectedPatientId);
        }, 30000);

        window.addEventListener('online', handleOnline);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            clearInterval(accessPollId);
            window.removeEventListener('online', handleOnline);
            document.removeEventListener('visibilitychange', handleVisibility);
            wsSessionRef.current += 1;
            historyRequestRef.current += 1;
            disconnectActiveConsultationChat();
            wsConnectionRef.current = null;
            wsAppointmentIdRef.current = null;
        };
    }, [selectedPatientId, loadConversationHistory, refreshActiveConversationAccess]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const filteredPatients = patients;

    const canSend = Boolean(chatAccess?.can_send);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !selectedPatient || !canSend || isSending) return;

        const text = inputMessage.trim();
        const { patientId } = selectedPatient;
        const appointmentId = selectedPatientRef.current?.appointmentId
            || chatAccess?.active_appointment_id;
        if (!appointmentId) {
            toast.error('No active consultation to send messages.');
            return;
        }

        setInputMessage('');
        setIsSending(true);

        try {
            const sentViaWs = wsConnectionRef.current?.sendChatMessage({ text });

            if (!sentViaWs) {
                const data = await sendChatMessageRest(appointmentId, { text });
                if (data.chat_access) {
                    applyConversationAccess(patientId, {
                        ...data.chat_access,
                        active_appointment_id: appointmentId,
                    });
                }
                if (data.message) {
                    const uiMessage = mapBackendMessageToUi(data.message, patientId);
                    const existing = messagesByPatientRef.current.get(normalizePatientId(patientId)) || [];
                    syncMessagesForPatient(
                        patientId,
                        mergeMessagesById(existing, [uiMessage])
                    );
                }
            }

            if (onSendMessage) {
                onSendMessage({ text, appointmentId, patientId });
            }
        } catch (error) {
            setInputMessage(text);
            toast.error(apiErrorMessage(error, 'Failed to send message'));
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !selectedPatient || !canSend || isUploading) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Only image attachments are supported.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const { patientId } = selectedPatient;
        const appointmentId = selectedPatientRef.current?.appointmentId
            || chatAccess?.active_appointment_id;
        if (!appointmentId) {
            toast.error('No active consultation to send images.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsUploading(true);

        try {
            const attachment = await uploadChatImage(file);
            const sentViaWs = wsConnectionRef.current?.sendChatMessage({
                text: '',
                attachments: [attachment],
            });

            if (!sentViaWs) {
                const data = await sendChatMessageRest(appointmentId, {
                    text: '',
                    attachments: [attachment],
                });
                if (data.chat_access) {
                    applyConversationAccess(patientId, {
                        ...data.chat_access,
                        active_appointment_id: appointmentId,
                    });
                }
                if (data.message) {
                    const uiMessage = mapBackendMessageToUi(data.message, patientId);
                    const existing = messagesByPatientRef.current.get(normalizePatientId(patientId)) || [];
                    syncMessagesForPatient(
                        patientId,
                        mergeMessagesById(existing, [uiMessage])
                    );
                }
            }
        } catch (error) {
            toast.error(apiErrorMessage(error, 'Failed to upload image'));
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handlePatientSelect = (patient) => {
        setSelectedPatient(patient);
        setIsPatientInfoOpen(false);
        if (onPatientSelect) {
            onPatientSelect(patient);
        }
    };

    useEffect(() => {
        if (!patientId || patients.length === 0) return;
        const match = patients.find(
            (p) => normalizePatientId(p.patientId) === normalizePatientId(patientId)
        );
        if (match) {
            handlePatientSelect(match);
        }
    }, [patientId, patients]);

    const renderEmptyState = () => (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-20 h-20 bg-[#0D614E]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-10 h-10 text-[#0D614E]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700">No Patient Selected</h3>
                <p className="text-sm text-gray-500 mt-1 max-w-sm">
                    Choose a patient from the list to start messaging
                </p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col md:flex-row h-auto md:h-[calc(84vh)] min-h-[70vh] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
            <div className="flex w-full md:w-80 max-h-[42vh] md:max-h-none border-b md:border-b-0 md:border-r border-gray-200 flex-col bg-gray-50 min-w-0 shrink-0">
                <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-gray-800">Messages</h2>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D614E]/50 focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoadingConversations ? (
                        <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
                            Loading conversations…
                        </div>
                    ) : filteredPatients.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
                            No conversations yet
                        </div>
                    ) : (
                        filteredPatients.map((patient) => (
                            <PatientListItem
                                key={patient.id || patient.patientId}
                                patient={patient}
                                isSelected={
                                    normalizePatientId(selectedPatient?.patientId)
                                    === normalizePatientId(patient.patientId)
                                }
                                onClick={() => {
                                    if (patientId) {
                                        window.location.replace(`/doctor/messenger`)
                                    }
                                    handlePatientSelect(patient)
                                }}
                            />
                        ))
                    )}
                </div>

                <div className="p-3 border-t border-gray-200 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#0D614E] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {doctorName?.charAt(0)}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-700">{doctorName}</p>
                            <p className="text-xs text-gray-400">Online</p>
                        </div>
                    </div>
                </div>
            </div>

            {selectedPatient ? (
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="px-3 sm:px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <button
                                type="button"
                                className="md:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 shrink-0"
                                onClick={() => {
                                    if (patientId) {
                                        window.location.replace("/doctor/messenger");
                                        return;
                                    }
                                    setSelectedPatient(null);
                                }}
                                aria-label="Back to conversations"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <Avatar src={selectedPatient.avatar} name={selectedPatient.name} className="w-10 h-10 shrink-0" />
                            <div className="min-w-0">
                                <h3 className="font-medium text-gray-800 truncate">{selectedPatient.name}</h3>
                                <p className="text-xs text-gray-400">
                                    {chatAccess?.active_phase
                                        ? `${chatAccess.active_phase.replace(/_/g, ' ')} chat`
                                        : chatAccess?.can_send
                                            ? 'Chat available'
                                            : 'Read-only chat'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                onClick={() => setIsPatientInfoOpen(!isPatientInfoOpen)}
                            >
                                <User className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                        <div className="flex flex-col">
                            {isLoadingMessages && messages.length === 0 ? (
                                <div className="text-center text-sm text-gray-500 py-8">
                                    Loading messages…
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-sm text-gray-500 py-8">
                                    No messages yet. Start the conversation.
                                </div>
                            ) : (
                                messages.map((message, index) => {
                                    const previous = messages[index - 1];
                                    const showAppointmentSeparator = !previous
                                        || previous.appointmentId !== message.appointmentId;

                                    return (
                                        <React.Fragment key={message.id}>
                                            {showAppointmentSeparator && (
                                                <div className="text-center my-4">
                                                    <span className="text-xs text-gray-400 bg-gray-200 px-3 py-1 rounded-full">
                                                        Consultation · {formatDate(message.timestamp)}
                                                    </span>
                                                </div>
                                            )}
                                            <MessageItem message={message} />
                                        </React.Fragment>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    <div className="p-3 border-t border-gray-200 bg-white">
                        {!canSend && (
                            <p className="text-xs text-amber-600 mb-2">
                                Messaging is only available during a live consultation or active follow-up period.
                            </p>
                        )}
                        <div className="flex items-end gap-2">
                            <div className="flex items-center gap-1">
                                <button
                                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 disabled:opacity-50"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={!canSend || isUploading}
                                >
                                    <Paperclip className="w-5 h-5" />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                            <textarea
                                ref={inputRef}
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder={canSend ? 'Type a message...' : 'Chat is read-only'}
                                disabled={!canSend || isSending}
                                className="flex-1 resize-none border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D614E]/50 focus:border-transparent max-h-32 min-h-[34px] disabled:bg-gray-50 disabled:text-gray-400"
                                rows={1}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputMessage.trim() || !canSend || isSending}
                                className={`p-2.5 rounded-lg transition-all ${inputMessage.trim() && canSend && !isSending
                                    ? 'bg-[#0D614E] hover:bg-[#0A4D3E] text-white shadow-sm'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
                            ) : (
                <div className="flex flex-1 min-w-0 min-h-[280px]">
                    {renderEmptyState()}
                </div>
            )}

            {isPatientInfoOpen && selectedPatient && (
                <PatientInfoSidebar
                    patient={selectedPatient}
                    onClose={() => setIsPatientInfoOpen(false)}
                />
            )}
        </div>
    );
};

export default Messenger;
