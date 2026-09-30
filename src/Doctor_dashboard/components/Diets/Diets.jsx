import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    Search,
    ImageIcon,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Star,
    Loader2,
    Users,
    User,
    Plus,
    Leaf,
    Sun,
    RefreshCw,
    Inbox,
    Upload,
    SearchIcon,
} from 'lucide-react';
import { doctorService } from '../../../services/doctorService';
import { Link } from 'react-router-dom';


const Badge = ({ children, tone = 'gray' }) => {
    const tones = {
        gray: 'bg-gray-100 text-gray-600',
        green: 'bg-green-50 text-green-700',
        amber: 'bg-amber-50 text-amber-700',
        blue: 'bg-blue-50 text-blue-700',
        red: 'bg-red-50 text-red-600',
    };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${tones[tone]}`}>
            {children}
        </span>
    );
};

const getCover = (gallery) => {
    if (!gallery || gallery.length === 0) return null;
    return gallery.find((img) => img.is_cover) || gallery[0];
};

const timeAgo = (dateStr) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
};

// ---------------------------------------------------------------------------

const DietPlanList = ({ onEdit, onCreateNew }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [count, setCount] = useState(0);
    const [nextUrl, setNextUrl] = useState(null);
    const [prevUrl, setPrevUrl] = useState(null);

    const [search, setSearch] = useState('');
    const [seasonFilter, setSeasonFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all'); // all | paid | free
    const [visibilityFilter, setVisibilityFilter] = useState('all'); // all | common | personal

    const [activeMap, setActiveMap] = useState({});
    const [togglingId, setTogglingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);

    const fetchPlans = useCallback(async (url) => {


        setLoading(true);
        setError('');
        const next = url?.split("page=")?.[1] ? url?.split("page=")?.[1]?.split("&")?.[0] : url?.split("page=")?.[1] || 1;
        console.log(
            {
                url,
                next,
                search: search.trim(),
                season: seasonFilter,
                is_paid: typeFilter,
                is_common: visibilityFilter
            }
        );
        try {
            // const response = await doctorService.getdiet(next);
            const filtereddata = await doctorService.getdietbysearch({
                page: next,
                search: search.trim(),
                season: seasonFilter === 'all' ? null : seasonFilter?.toLowerCase(),
                is_paid: typeFilter === 'all' ? null : typeFilter !== 'free' ? true : false,
                is_common: visibilityFilter === 'all' ? null : visibilityFilter === 'common'
            });


            const body = filtereddata.data;
            const data = body?.data || [];
            setPlans(data);
            setCount(body?.count ?? data.length);
            setNextUrl(body?.next || null);
            setPrevUrl(body?.previous || null);
            setActiveMap((prev) => {
                const next = { ...prev };
                data.forEach((p) => {
                    if (!(p.id in next)) next[p.id] = true;
                });
                return next;
            });
        } catch (err) {
            console.error('Error fetching diet plans:', err);
            setError(err?.data?.error?.message || 'Failed to load diet plans');
            toast.error(err?.data?.error?.message);
        } finally {
            setLoading(false);
        }
    }, [search, seasonFilter, typeFilter, visibilityFilter]);

    useEffect(() => {
        fetchPlans();
    }, [fetchPlans]);

    const toggleActive = async (id, isActive) => {
        setTogglingId(id);
        const payload = {
            is_active: isActive,
        };
        try {
            const response = await doctorService.updatediet(id, payload);
            toast.success(`Diet plan ${response?.data?.is_active ? 'activated' : 'deactivated'}`);
            fetchPlans();
        } catch (error) {
            console.error('Error toggling diet plan status:', error);
            toast.error(error?.data?.error?.message || 'Failed to toggle status');
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Remove "${name}"? This can't be undone.`)) return;
        setDeletingId(id);
        try {
            await doctorService.deletediet(id);
            setPlans((prev) => prev.filter((p) => p.id !== id));
            setCount((prev) => Math.max(0, prev - 1));
            toast.success('Diet plan removed');
        } catch (err) {
            console.error('Error deleting diet plan:', err);
            toast.error(err?.data?.error?.message || 'Failed to remove diet plan');
        } finally {
            setDeletingId(null);
        }
    };

    const filteredPlans = plans.filter((plan) => {
        // if (search.trim()) {
        //     const q = search.trim().toLowerCase();
        //     const matchesName = plan.name?.toLowerCase().includes(q);
        //     const matchesDisease = plan.health_diseases?.some((d) => d.name?.toLowerCase().includes(q));
        //     if (!matchesName && !matchesDisease) return false;
        // }
        // if (seasonFilter !== 'all' && plan.season !== seasonFilter) return false;
        // if (typeFilter === 'paid' && !plan.is_paid) return false;
        // if (typeFilter === 'free' && plan.is_paid) return false;
        // if (visibilityFilter === 'common' && !plan.is_common) return false;
        // if (visibilityFilter === 'personal' && plan.is_common) return false;
        return true;
    });

    const seasons = ['summer', 'winter', 'spring', 'autumn', 'monsoon', 'all_seasons'];

    return (
        <div className="max-w-8xl mx-auto p-4 min-h-screen">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Diet Plans</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {count} plan{count === 1 ? '' : 's'} total
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fetchPlans()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <Link
                        to="/doctor/bulk-upload-diets"
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#0D614E] border border-[#0D614E]/30 bg-[#0D614E]/5 rounded-lg hover:bg-[#0D614E]/10 transition-colors"
                    >
                        <Upload size={14} /> Bulk Upload
                    </Link>
                    {/* {onCreateNew && ( */}
                    <Link
                        to={"/doctor/add-diet"}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0D614E] rounded-lg hover:bg-[#0A4D3D] hover:text-white transition-colors"
                    >
                        <Plus size={15} /> Add Diet Plan
                    </Link>
                    {/* )} */}
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-3.5 mb-4 flex  items-center gap-2.5">
                <div className="relative flex-1 min-w-0 w-full sm:min-w-[220px]">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        defaultValue={search}
                        onBlur={(e) => {
                            setSearch(e.target.value)
                        }}
                        placeholder="Search by name or condition…"
                        className="w-full min-w-0 px-8"
                    />
                </div>

                <select
                    value={seasonFilter}
                    onChange={(e) => setSeasonFilter(e.target.value)}
                >
                    <option value="all">All seasons</option>
                    {seasons.map((s) => (
                        <option key={s} value={s} className="capitalize">
                            {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </option>
                    ))}
                </select>

                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                >
                    <option value="all">Paid & Free</option>
                    <option value="paid">Paid only</option>
                    <option value="free">Free only</option>
                </select>

                <select
                    value={visibilityFilter}
                    onChange={(e) => setVisibilityFilter(e.target.value)}
                >
                    <option value="all">Common & Personal</option>
                    <option value="common">Common only</option>
                    <option value="personal">Personal only</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-2 text-gray-400">
                        <Loader2 className="animate-spin" size={22} />
                        <span className="text-sm">Loading diet plans…</span>
                    </div>
                ) : error ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-2 text-red-500">
                        <span className="text-sm">{error}</span>
                        <button
                            type="button"
                            onClick={() => fetchPlans()}
                            className="text-sm font-medium text-[#0D614E] hover:underline"
                        >
                            Try again
                        </button>
                    </div>
                ) : filteredPlans.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-2 text-gray-400">
                        <Inbox size={28} />
                        <span className="text-sm">No diet plans match your filters.</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    <th className="px-4 py-3 font-semibold">Plan</th>
                                    <th className="px-4 py-3 font-semibold">Condition</th>
                                    <th className="px-4 py-3 font-semibold">Prakriti / Season</th>
                                    <th className="px-4 py-3 font-semibold">Type</th>
                                    <th className="px-4 py-3 font-semibold">Visibility</th>
                                    <th className="px-4 py-3 font-semibold">Created</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPlans.map((plan) => {
                                    const cover = getCover(plan.diet_plan_gallery);
                                    const isActive = plan.is_active ?? true;
                                    return (
                                        <tr key={plan.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                                        {cover ? (
                                                            <img
                                                                src={cover.image_url}
                                                                alt={plan.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = 'https://via.placeholder.com/80x80?text=—';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ImageIcon size={14} className="text-gray-300" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-gray-900 truncate max-w-[220px]">{plan.name}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {plan.diet_plan_gallery?.length || 0} image{plan.diet_plan_gallery?.length === 1 ? '' : 's'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {plan.health_diseases?.length ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {plan.health_diseases.map((d) => (
                                                            <Badge key={d.id} tone="blue">{d.name}</Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1.5 text-gray-600">
                                                    <Leaf size={12} className="text-[#0D614E]" />
                                                    {plan.prakriti}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-0.5 capitalize">
                                                    <Sun size={11} />
                                                    {String(plan.season || '').replace(/_/g, ' ')}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {plan.is_paid ? (
                                                    <Badge tone="amber">₹{Number(plan.price).toFixed(0)}</Badge>
                                                ) : (
                                                    <Badge tone="green">Free</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {plan.is_common ? (
                                                    <Badge tone="blue"><Users size={11} /> Common</Badge>
                                                ) : (
                                                    <Badge><User size={11} /> Personal</Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                <div>{timeAgo(plan.created_at)}</div>
                                                <div className="text-xs text-gray-400 truncate max-w-[140px]">
                                                    {plan.created_by_name || '—'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleActive(plan.id, !isActive)}
                                                    // disabled={isActive}
                                                    title="Status is tracked locally until an activate/deactivate API exists"
                                                    className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50"
                                                    style={{ backgroundColor: isActive ? '#0D614E' : '#D1D5DB' }}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0.5'
                                                            }`}
                                                    />
                                                </button>
                                                <div className={`text-[11px] mt-1 font-medium ${isActive ? 'text-[#0D614E]' : 'text-gray-400'}`}>
                                                    {isActive ? 'Active' : 'Inactive'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        to={`/doctor/edit-diet/${plan.id}`}
                                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#0D614E] hover:bg-gray-100 rounded-md transition-colors"
                                                        title="Edit plan"
                                                    >
                                                        <Pencil size={14} />
                                                    </Link>
                                                    {/* <button
                                                        type="button"
                                                        onClick={() => handleDelete(plan.id, plan.name)}
                                                        disabled={deletingId === plan.id}
                                                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                                                        title="Delete plan"
                                                    >
                                                        {deletingId === plan.id ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            <Trash2 size={14} />
                                                        )}
                                                    </button> */}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && !error && plans.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400">
                            Showing {plans.length} of {count}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => prevUrl && fetchPlans(prevUrl)}
                                disabled={!prevUrl}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={14} /> Prev
                            </button>
                            <button
                                type="button"
                                onClick={() => nextUrl && fetchPlans(nextUrl)}
                                disabled={!nextUrl}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DietPlanList;