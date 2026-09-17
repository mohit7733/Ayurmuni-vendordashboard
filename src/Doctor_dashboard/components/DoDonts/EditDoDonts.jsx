import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Loader2,
    Plus,
    Trash2,
    X,
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

const unwrapTemplate = (response) => {
    const body = response?.data;
    const data = body?.data ?? body;
    if (Array.isArray(data)) return data[0] || null;
    if (Array.isArray(data?.data)) return data.data[0] || null;
    return data || null;
};

const normalizeDiseases = (payload) => {
    const list = payload?.data?.data || payload?.data || payload?.diseases?.data || payload?.diseases || payload;
    return Array.isArray(list) ? list : [];
};

const emptyList = (count = 1) => Array.from({ length: count }, () => "");

const AdviceListEditor = ({
    title,
    description,
    items,
    onChange,
    tone = "emerald",
    Icon,
}) => {
    const tones = {
        emerald: {
            wrap: "bg-emerald-50 border-emerald-200",
            iconWrap: "bg-emerald-100",
            icon: "text-emerald-600",
            title: "text-emerald-700",
            desc: "text-emerald-600",
            add: "text-[#0D614E] border-[#0D614E]/20 hover:bg-[#0D614E]/5",
        },
        rose: {
            wrap: "bg-rose-50 border-rose-200",
            iconWrap: "bg-rose-100",
            icon: "text-rose-600",
            title: "text-rose-700",
            desc: "text-rose-600",
            add: "text-rose-700 border-rose-200 hover:bg-rose-100/70",
        },
    };
    const t = tones[tone];

    const updateItem = (index, value) => {
        const next = [...items];
        next[index] = value;
        onChange(next);
    };

    const addItem = () => onChange([...items, ""]);

    const removeItem = (index) => {
        if (items.length === 1) {
            onChange([""]);
            return;
        }
        onChange(items.filter((_, i) => i !== index));
    };

    const moveItem = (index, direction) => {
        const target = index + direction;
        if (target < 0 || target >= items.length) return;
        const next = [...items];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    };

    return (
        <div className={`rounded-2xl border p-5 ${t.wrap}`}>
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.iconWrap}`}>
                        <Icon className={`w-5 h-5 ${t.icon}`} />
                    </div>
                    <div>
                        <h3 className={`font-semibold ${t.title}`}>{title}</h3>
                        <p className={`text-xs ${t.desc}`}>{description}</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={addItem}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border rounded-lg bg-white ${t.add}`}
                >
                    <Plus size={13} /> Add
                </button>
            </div>

            <div className="space-y-2">
                {items.map((item, index) => (
                    <div key={index} className="flex items-start gap-2">
                        <span className="mt-2.5 shrink-0 w-5 h-5 rounded-full bg-white text-[11px] font-semibold flex items-center justify-center text-gray-500 border border-white/80">
                            {index + 1}
                        </span>
                        <textarea
                            rows={2}
                            value={item}
                            onChange={(e) => updateItem(index, e.target.value)}
                            placeholder={`Write ${title.toLowerCase()} item ${index + 1}`}
                            className="flex-1 min-h-[64px] resize-y"
                        />
                        <div className="flex flex-col gap-1 pt-0.5">
                            <button
                                type="button"
                                onClick={() => moveItem(index, -1)}
                                disabled={index === 0}
                                className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                title="Move up"
                            >
                                <ChevronUp size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => moveItem(index, 1)}
                                disabled={index === items.length - 1}
                                className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                title="Move down"
                            >
                                <ChevronDown size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-gray-400 hover:text-red-500"
                                title="Remove"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const EditDoDonts = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditMode);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [diseases, setDiseases] = useState([]);
    const [diseaseQuery, setDiseaseQuery] = useState("");
    const [formData, setFormData] = useState({
        prakriti: "",
        health_diseases: [],
        dos: emptyList(3),
        donts: emptyList(3),
    });

    useEffect(() => {
        const loadDiseases = async () => {
            try {
                const [doctorRes] = await Promise.allSettled([
                    doctorService.getPrakritiAndDiseases(),
                    // vendorService.getbrandandcategory("health-diseases"),
                ]);
                const doctorList = doctorRes.status === "fulfilled" ? normalizeDiseases(doctorRes.value) : [];
                // const vendorList = vendorRes.status === "fulfilled" ? normalizeDiseases(vendorRes.value) : [];
                setDiseases(doctorList);
            } catch (error) {
                toast.error(error?.message || "Failed to load health conditions");
            }
        };
        loadDiseases();
    }, []);

    useEffect(() => {
        if (!id) return;
        const loadTemplate = async () => {
            setFetching(true);
            try {
                const response = await doctorService.getDoDontsTemplates({ id });
                const template = unwrapTemplate(response);
                if (!template) {
                    toast.error("Template not found");
                    navigate("/doctor/do-donts");
                    return;
                }
                setFormData({
                    prakriti: template.prakriti || "",
                    health_diseases: template.health_diseases || [],
                    dos: Array.isArray(template.dos) && template.dos.length ? template.dos : emptyList(1),
                    donts: Array.isArray(template.donts) && template.donts.length ? template.donts : emptyList(1),
                });
            } catch (error) {
                toast.error(error?.message || "Failed to load template");
            } finally {
                setFetching(false);
            }
        };
        loadTemplate();
    }, [id, navigate]);

    const selectedDiseaseIds = useMemo(
        () => new Set(formData.health_diseases.map((d) => d.id)),
        [formData.health_diseases]
    );

    const filteredDiseases = useMemo(() => {
        const q = diseaseQuery.trim().toLowerCase();
        return diseases.filter((disease) => {
            if (selectedDiseaseIds.has(disease.id)) return false;
            if (!q) return true;
            return disease.name?.toLowerCase().includes(q);
        });
    }, [diseases, diseaseQuery, selectedDiseaseIds]);

    const addDisease = (disease) => {
        setFormData((prev) => ({
            ...prev,
            health_diseases: [...prev.health_diseases, { id: disease.id, name: disease.name }],
        }));
        setDiseaseQuery("");
    };

    const removeDisease = (index) => {
        setFormData((prev) => ({
            ...prev,
            health_diseases: prev.health_diseases.filter((_, i) => i !== index),
        }));
    };

    const cleanList = (items) => items.map((item) => item.trim()).filter(Boolean);

    const buildPayload = () => ({
        prakriti: formData.prakriti,
        health_diseases: formData.health_diseases.map((d) => ({ id: d.id, name: d.name })),
        dos: cleanList(formData.dos),
        donts: cleanList(formData.donts),
    });

    const validate = (payload) => {
        if (!payload.prakriti) return "Please select a prakriti.";
        if (!payload.health_diseases.length) return "Please add at least one health condition.";
        if (!payload.dos.length) return "Please add at least one Do.";
        if (!payload.donts.length) return "Please add at least one Don't.";
        return "";
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = buildPayload();
        const errorText = validate(payload);
        if (errorText) {
            setMessage({ type: "error", text: errorText });
            toast.error(errorText);
            return;
        }

        setLoading(true);
        setMessage({ type: "", text: "" });
        try {
            if (isEditMode) {
                await doctorService.updateDoDontsTemplate(id, payload);
                toast.success("Template updated successfully");
                setMessage({ type: "success", text: "Template updated successfully." });
                navigate(`/doctor/do-donts/${id}`);
            } else {
                await doctorService.createDoDontsTemplate(payload);
                toast.success("Template created successfully");
                navigate("/doctor/do-donts");
            }
        } catch (error) {
            const text = error?.message || error?.data?.message || "Failed to save template";
            setMessage({ type: "error", text });
            toast.error(text);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="max-w-8xl mx-auto p-6 min-h-screen flex flex-col items-center justify-center gap-2 text-gray-400">
                <Loader2 className="animate-spin" size={22} />
                <span className="text-sm">Loading template…</span>
            </div>
        );
    }

    return (
        <div className="max-w-8xl mx-auto p-6 min-h-screen">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                    <Link
                        to={isEditMode ? `/doctor/do-donts/${id}` : "/doctor/do-donts"}
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0D614E] mb-2"
                    >
                        <ArrowLeft size={14} /> Back
                    </Link>
                    <h1 className="text-3xl font-bold text-[#0D614E]">
                        {isEditMode ? "Update Do's & Don'ts" : "Create Do's & Don'ts"}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {isEditMode
                            ? "Edit lifestyle guidance for this prakriti and condition set."
                            : "Build a reusable template doctors can assign during consultations."}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {message.text && (
                    <div
                        className={`flex items-start gap-2.5 p-3.5 rounded-lg mb-5 border ${
                            message.type === "success"
                                ? "bg-green-50 border-green-200 text-green-700"
                                : "bg-red-50 border-red-200 text-red-700"
                        }`}
                    >
                        {message.type === "success" ? (
                            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        )}
                        <p className="text-sm flex-1">{message.text}</p>
                        <button
                            type="button"
                            onClick={() => setMessage({ type: "", text: "" })}
                            className="shrink-0 text-current opacity-60 hover:opacity-100"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="pb-6 mb-6 border-b border-gray-100">
                        <h4 className="text-base font-semibold text-gray-900 mb-1">Basic Information</h4>
                        <p className="text-sm text-gray-500 mb-4">
                            Match this template to a prakriti and one or more health conditions.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Prakriti <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="prakriti"
                                    value={formData.prakriti}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, prakriti: e.target.value }))}
                                    required
                                >
                                    <option value="">Select Prakriti</option>
                                    {PRAKRITI_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Health Conditions <span className="text-red-500">*</span>
                                </label>
                                <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                                    {formData.health_diseases.map((disease, index) => (
                                        <span
                                            key={disease.id}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                                        >
                                            {disease.name}
                                            <button
                                                type="button"
                                                onClick={() => removeDisease(index)}
                                                className="hover:text-blue-900"
                                                aria-label={`Remove ${disease.name}`}
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                    {formData.health_diseases.length === 0 && (
                                        <span className="text-xs text-gray-400">No conditions added yet</span>
                                    )}
                                </div>
                                {/* <input
                                    type="text"
                                    value={diseaseQuery}
                                    onChange={(e) => setDiseaseQuery(e.target.value)}
                                    placeholder="Search conditions…"
                                    className="mb-2"
                                /> */}
                                <select
                                    value=""
                                    onChange={(e) => {
                                        const selected = diseases.find((d) => d.id === e.target.value);
                                        if (selected) addDisease(selected);
                                    }}
                                >
                                    <option value="">Add a health condition</option>
                                    {filteredDiseases.map((disease) => (
                                        <option key={disease.id} value={disease.id}>
                                            {disease.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <AdviceListEditor
                            title="Do's"
                            description="Advise the patient what they should follow."
                            items={formData.dos}
                            onChange={(dos) => setFormData((prev) => ({ ...prev, dos }))}
                            tone="emerald"
                            Icon={CheckCircle2}
                        />
                        <AdviceListEditor
                            title="Don'ts"
                            description="Advise the patient what they should avoid."
                            items={formData.donts}
                            onChange={(donts) => setFormData((prev) => ({ ...prev, donts }))}
                            tone="rose"
                            Icon={XCircle}
                        />
                    </div>

                    <div className="sticky bottom-0 -mx-6 mt-6 px-6 py-4 bg-white/95 backdrop-blur border-t border-gray-100 flex flex-wrap gap-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0D614E] text-white rounded-lg hover:bg-[#0A4D3D] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {loading ? "Saving…" : isEditMode ? "Update Template" : "Create Template"}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate("/doctor/do-donts")}
                            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditDoDonts;
