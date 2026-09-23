import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
    Activity,
    ArrowLeft,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Droplet,
    Inbox,
    Leaf,
    Loader2,
    Moon,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    Sparkles,
    Sun,
    Wind,
    XCircle,
} from "lucide-react";
import { doctorService } from "../../../services/doctorService";
import { vendorService } from "../../../services/vendorService";

const PRAKRITI_OPTIONS = [
    "Vata",
    "Pitta",
    "Kapha",
    "Vata-Pitta",
    "Vata-Kapha",
    "Pitta-Kapha",
    "Tridoshic",
];

const getPrakritiInfo = (prakriti) => {
    const info = {
        Vata: { icon: Wind, color: "bg-purple-100 text-purple-700 border-purple-100", label: "Vata" },
        Pitta: { icon: Sun, color: "bg-orange-100 text-orange-700 border-orange-100", label: "Pitta" },
        Kapha: { icon: Moon, color: "bg-blue-100 text-blue-700 border-blue-100", label: "Kapha" },
        "Vata-Pitta": { icon: Sparkles, color: "bg-indigo-100 text-indigo-700 border-indigo-100", label: "Vata-Pitta" },
        "Pitta-Kapha": { icon: Droplet, color: "bg-teal-100 text-teal-700 border-teal-100", label: "Pitta-Kapha" },
        "Vata-Kapha": { icon: Leaf, color: "bg-emerald-100 text-emerald-700 border-emerald-100", label: "Vata-Kapha" },
        Tridoshic: { icon: Activity, color: "bg-amber-100 text-amber-700 border-amber-100", label: "Tridoshic" },
    };
    return info[prakriti] || { icon: Activity, color: "bg-gray-100 text-gray-700 border-gray-100", label: prakriti || "—" };
};

const timeAgo = (dateStr) => {
    if (!dateStr) return "—";
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
};

const normalizeDiseases = (payload) => {
    const list = payload?.data?.data || payload?.data || payload?.diseases?.data || payload?.diseases || payload;
    return Array.isArray(list) ? list : [];
};

const unwrapList = (response) => {
    const body = response?.data;
    const data = body?.data ?? body;
    if (Array.isArray(data)) return { items: data, body };
    if (Array.isArray(data?.data)) return { items: data.data, body: data };
    if (data && typeof data === "object") return { items: [data], body };
    return { items: [], body };
};

const unwrapTemplate = (response) => {
    const { items } = unwrapList(response);
    return items[0] || null;
};

const PrakritiBadge = ({ prakriti }) => {
    const info = getPrakritiInfo(prakriti);
    const Icon = info.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${info.color}`}>
            <Icon size={12} />
            {info.label}
        </span>
    );
};

const DoDontsDetails = ({ id }) => {
    const navigate = useNavigate();
    const [template, setTemplate] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await doctorService.getDoDontsTemplates({ id });
                const item = unwrapTemplate(response);
                if (!item) {
                    toast.error("Template not found");
                    navigate("/doctor/do-donts");
                    return;
                }
                setTemplate(item);
            } catch (error) {
                toast.error(error?.message || "Failed to load template");
                navigate("/doctor/do-donts");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="max-w-8xl mx-auto p-4 min-h-screen flex flex-col items-center justify-center gap-2 text-gray-400">
                <Loader2 className="animate-spin" size={22} />
                <span className="text-sm">Loading template…</span>
            </div>
        );
    }

    if (!template) return null;

    const dosList = Array.isArray(template.dos) ? template.dos : [];
    const dontsList = Array.isArray(template.donts) ? template.donts : [];
    const diseases = template.health_diseases || [];

    return (
        <div className="max-w-8xl mx-auto p-4 min-h-screen">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                    <button
                        type="button"
                        onClick={() => navigate("/doctor/do-donts")}
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0D614E] mb-2"
                    >
                        <ArrowLeft size={14} /> Back to templates
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Do's & Don'ts Template</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Lifestyle guidance for {template.prakriti || "all prakriti"}
                    </p>
                </div>
                <Link
                    to={`/doctor/edit-do-donts/${template.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0D614E] rounded-lg hover:bg-[#0A4D3D] hover:text-white transition-colors"
                >
                    <Pencil size={15} /> Edit Template
                </Link>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 mb-4">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                    <PrakritiBadge prakriti={template.prakriti} />
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <CheckCircle2 size={12} /> {dosList.length} Do's
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-100">
                        <XCircle size={12} /> {dontsList.length} Don'ts
                    </span>
                </div>
                {diseases.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {diseases.map((disease) => (
                            <span
                                key={disease.id || disease.name}
                                className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100"
                            >
                                {disease.name}
                            </span>
                        ))}
                    </div>
                )}
                <p className="text-xs text-gray-400 mt-3">Updated {timeAgo(template.updated_at || template.created_at)}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-emerald-700">Do's</h3>
                            <p className="text-xs text-emerald-600">What patients should follow</p>
                        </div>
                    </div>
                    <ul className="space-y-2">
                        {dosList.map((item, index) => (
                            <li key={index} className="flex gap-2 text-sm text-emerald-900 leading-snug">
                                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold flex items-center justify-center">
                                    {index + 1}
                                </span>
                                {item}
                            </li>
                        ))}
                        {dosList.length === 0 && <li className="text-sm text-emerald-600/70">No do's added yet.</li>}
                    </ul>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                            <XCircle className="w-5 h-5 text-rose-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-rose-700">Don'ts</h3>
                            <p className="text-xs text-rose-600">What patients should avoid</p>
                        </div>
                    </div>
                    <ul className="space-y-2">
                        {dontsList.map((item, index) => (
                            <li key={index} className="flex gap-2 text-sm text-rose-900 leading-snug">
                                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-semibold flex items-center justify-center">
                                    {index + 1}
                                </span>
                                {item}
                            </li>
                        ))}
                        {dontsList.length === 0 && <li className="text-sm text-rose-600/70">No don'ts added yet.</li>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

const DoDontsList = () => {
    const navigate = useNavigate();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [count, setCount] = useState(0);
    const [nextUrl, setNextUrl] = useState(null);
    const [prevUrl, setPrevUrl] = useState(null);
    const [prakritiFilter, setPrakritiFilter] = useState("all");
    const [diseaseFilter, setDiseaseFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [diseases, setDiseases] = useState([]);

    const fetchTemplates = useCallback(
        async (url) => {
            setLoading(true);
            setError("");
            const page = url?.split("page=")?.[1]
                ? url.split("page=")[1].split("&")[0]
                : url?.split("page=")?.[1] || 1;
            try {
                const response = await doctorService.getDoDontsTemplates({
                    page,
                    prakriti: prakritiFilter,
                    health_disease_id: diseaseFilter,
                });
                const { items, body } = unwrapList(response);
                setTemplates(items);
                setCount(body?.count ?? items.length);
                setNextUrl(body?.next || null);
                setPrevUrl(body?.previous || null);
            } catch (err) {
                setError(err?.message || "Failed to load templates");
                toast.error("Failed to load Do's & Don'ts templates");
            } finally {
                setLoading(false);
            }
        },
        [prakritiFilter, diseaseFilter]
    );

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    useEffect(() => {
        const loadDiseases = async () => {
            try {
                const [doctorRes] = await Promise.allSettled([
                    doctorService.getPrakritiAndDiseases(),
                    // vendorService.getbrandandcategory("health-diseases"),
                ]);
                const doctorList = doctorRes.status === "fulfilled" ? normalizeDiseases(doctorRes.value) : [];
                // const vendorList = vendorRes.status === "fulfilled" ? normalizeDiseases(vendorRes.value) : [];
                // vendorList.length ? vendorList :
                setDiseases(doctorList);
            } catch (error) {
                console.error("Failed to load health conditions", error);
            }
        };
        loadDiseases();
    }, []);

    const filteredTemplates = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return templates;
        return templates.filter((item) => {
            const diseaseMatch = item.health_diseases?.some((d) => d.name?.toLowerCase().includes(q));
            const dosMatch = item.dos?.some((text) => text.toLowerCase().includes(q));
            const dontsMatch = item.donts?.some((text) => text.toLowerCase().includes(q));
            return item.prakriti?.toLowerCase().includes(q) || diseaseMatch || dosMatch || dontsMatch;
        });
    }, [templates, search]);

    return (
        <div className="max-w-8xl mx-auto p-4 min-h-screen">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Do's & Don'ts</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {count} template{count === 1 ? "" : "s"} total
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fetchTemplates()}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    <Link
                        to="/doctor/add-do-donts"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#0D614E] rounded-lg hover:bg-[#0A4D3D] hover:text-white transition-colors"
                    >
                        <Plus size={15} /> Add Template
                    </Link>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-3.5 mb-4 flex items-center gap-2.5">
                <div className="relative flex-1 min-w-[340px]">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search prakriti, condition, do or don't…"
                        className="w-full min-w-[340px] pl-8"
                    />
                </div>
                <select value={prakritiFilter} onChange={(e) => setPrakritiFilter(e.target.value)}>
                    <option value="all">All prakriti</option>
                    {PRAKRITI_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
                <select value={diseaseFilter} onChange={(e) => setDiseaseFilter(e.target.value)}>
                    <option value="all">All conditions</option>
                    {diseases.map((disease) => (
                        <option key={disease.id} value={disease.id}>
                            {disease.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-2 text-gray-400">
                        <Loader2 className="animate-spin" size={22} />
                        <span className="text-sm">Loading templates…</span>
                    </div>
                ) : error ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-2 text-red-500">
                        <span className="text-sm">{error}</span>
                        <button
                            type="button"
                            onClick={() => fetchTemplates()}
                            className="text-sm font-medium text-[#0D614E] hover:underline"
                        >
                            Try again
                        </button>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center gap-2 text-gray-400">
                        <Inbox size={28} />
                        <span className="text-sm">No templates match your filters.</span>
                        <Link to="/doctor/add-do-donts" className="text-sm font-medium text-[#0D614E] hover:underline">
                            Create your first template
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-0">
                        {filteredTemplates.map((item) => {
                            const diseasesList = item.health_diseases || [];
                            const dosList = Array.isArray(item.dos) ? item.dos : [];
                            const dontsList = Array.isArray(item.donts) ? item.donts : [];
                            return (
                                <article
                                    key={item.id}
                                    className="border-b xl:odd:border-r border-gray-100 p-4 hover:bg-gray-50/60 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                                <PrakritiBadge prakriti={item.prakriti} />
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                    <CheckCircle2 size={11} /> {dosList.length} Do's
                                                </span>
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-100">
                                                    <XCircle size={11} /> {dontsList.length} Don'ts
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {diseasesList.slice(0, 4).map((disease) => (
                                                    <span
                                                        key={disease.id || disease.name}
                                                        className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100"
                                                    >
                                                        {disease.name}
                                                    </span>
                                                ))}
                                                {diseasesList.length > 4 && (
                                                    <span className="text-[10px] text-gray-400">+{diseasesList.length - 4} more</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/doctor/do-donts/${item.id}`)}
                                                className="px-2.5 py-1.5 text-[11px] font-semibold text-[#0D614E] bg-[#0D614E]/5 border border-[#0D614E]/20 rounded-md hover:bg-[#0D614E]/10"
                                            >
                                                View
                                            </button>
                                            <Link
                                                to={`/doctor/edit-do-donts/${item.id}`}
                                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#0D614E] hover:bg-gray-100 rounded-md transition-colors"
                                                title="Edit template"
                                            >
                                                <Pencil size={14} />
                                            </Link>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-2">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 mb-1 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Do's
                                            </p>
                                            <ul className="space-y-0.5">
                                                {dosList.slice(0, 3).map((doItem, index) => (
                                                    <li key={index} className="text-[11px] text-emerald-800 leading-snug line-clamp-1">
                                                        • {doItem}
                                                    </li>
                                                ))}
                                                {dosList.length === 0 && <li className="text-[11px] text-gray-400">No items</li>}
                                                {dosList.length > 3 && (
                                                    <li className="text-[10px] text-emerald-600/70">+{dosList.length - 3} more</li>
                                                )}
                                            </ul>
                                        </div>
                                        <div className="rounded-lg border border-rose-100 bg-rose-50/50 p-2">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-700 mb-1 flex items-center gap-1">
                                                <XCircle className="w-3 h-3" /> Don'ts
                                            </p>
                                            <ul className="space-y-0.5">
                                                {dontsList.slice(0, 3).map((dontItem, index) => (
                                                    <li key={index} className="text-[11px] text-rose-800 leading-snug line-clamp-1">
                                                        • {dontItem}
                                                    </li>
                                                ))}
                                                {dontsList.length === 0 && <li className="text-[11px] text-gray-400">No items</li>}
                                                {dontsList.length > 3 && (
                                                    <li className="text-[10px] text-rose-600/70">+{dontsList.length - 3} more</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-2">Updated {timeAgo(item.updated_at || item.created_at)}</p>
                                </article>
                            );
                        })}
                    </div>
                )}

                {!loading && !error && templates.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400">
                            Showing {templates.length} of {count}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => prevUrl && fetchTemplates(prevUrl)}
                                disabled={!prevUrl}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={14} /> Prev
                            </button>
                            <button
                                type="button"
                                onClick={() => nextUrl && fetchTemplates(nextUrl)}
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

const DoDontsPage = () => {
    const { id } = useParams();
    if (id) return <DoDontsDetails id={id} />;
    return <DoDontsList />;
};

export default DoDontsPage;
