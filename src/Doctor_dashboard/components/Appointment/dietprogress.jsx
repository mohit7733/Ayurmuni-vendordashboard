import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    Coffee,
    Droplets,
    Flame,
    Inbox,
    ImageIcon,
    Leaf,
    Loader2,
    Moon,
    PauseCircle,
    RefreshCw,
    Repeat,
    StopCircle,
    Sun,
    Sunrise,
    UtensilsCrossed,
    AlertCircle,
    ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { doctorService } from "../../../services/doctorService";

const MEAL_ORDER = ["morning", "breakfast", "midday", "lunch", "dinner"];

const MEAL_META = {
    morning: { label: "Morning", Icon: Sunrise, tone: "bg-amber-50 text-amber-700 border-amber-100" },
    breakfast: { label: "Breakfast", Icon: Coffee, tone: "bg-orange-50 text-orange-700 border-orange-100" },
    midday: { label: "Midday", Icon: Sun, tone: "bg-yellow-50 text-yellow-700 border-yellow-100" },
    lunch: { label: "Lunch", Icon: UtensilsCrossed, tone: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    dinner: { label: "Dinner", Icon: Moon, tone: "bg-indigo-50 text-indigo-700 border-indigo-100" },
};

const STATUS_STYLES = {
    active: { label: "Active", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", Icon: CheckCircle2 },
    paused: { label: "Paused", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", Icon: PauseCircle },
    completed: { label: "Completed", bg: "bg-teal-50", text: "text-[#0D614E]", border: "border-teal-200", Icon: CheckCircle2 },
    stopped: { label: "Stopped", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", Icon: StopCircle },
    inactive: { label: "Inactive", bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", Icon: Clock },
};

const FILTERS = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "paused", label: "Paused" },
    { id: "completed", label: "Completed" },
    { id: "stopped", label: "Stopped" },
    { id: "inactive", label: "Inactive" },
];

const formatDateTime = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const extractDayKeys = (planJson = {}) =>
    Object.keys(planJson)
        .filter((key) => /^day_\d+$/i.test(key))
        .sort((a, b) => Number(a.split("_")[1]) - Number(b.split("_")[1]));

const unwrapPayload = (response) => response?.data?.data ?? response?.data ?? response;

const unwrapPlans = (response) => {
    const data = unwrapPayload(response);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (data && typeof data === "object" && (data.id || data.diet_plan_id)) return [data];
    return [];
};

const unwrapPlan = (response) => unwrapPlans(response)[0] || null;

const getMealProgress = (progressJson = {}) => {
    let total = 0;
    let completed = 0;
    Object.values(progressJson).forEach((day) => {
        Object.values(day || {}).forEach((meal) => {
            if (!meal || typeof meal !== "object") return;
            total += 1;
            if (String(meal.status || "").toLowerCase() === "completed") completed += 1;
        });
    });
    return {
        total,
        completed,
        percent: total ? Math.round((completed / total) * 100) : 0,
    };
};

const getPlanCover = (plan) => {
    const gallery = plan?.diet_plan_gallery || [];
    const cover = gallery.find((image) => image?.is_cover && image?.image_url) || gallery.find((image) => image?.image_url);
    if (cover) return cover;

    const planJson = plan?.plan_json || {};
    for (const dayKey of extractDayKeys(planJson)) {
        for (const meal of MEAL_ORDER) {
            const image = planJson[dayKey]?.[meal]?.diet_gallery?.[0];
            if (image?.image_url) return image;
        }
    }
    return null;
};

const recipeLinks = (item) =>
    (Array.isArray(item?.recipe) ? item.recipe : [])
        .map((url) => String(url || "").trim())
        .filter(Boolean);

const getNutritionValue = (nutrition, key) => {
    const item = nutrition?.[key];
    if (!item) return null;
    const value = item.value ?? item;
    const unit = item.unit || (key === "total_calories" ? "kcal" : "g");
    if (value === undefined || value === null || value === "") return null;
    return `${value} ${unit}`;
};

const getDaySlice = (plan, dayNumber) => {
    const dayKey = `day_${dayNumber}`;
    const planJson = plan?.plan_json || {};
    const progressJson = plan?.progress_json || {};
    const waterJson = plan?.daily_water_intake_progress_json;

    if (planJson[dayKey]) {
        return {
            meals: planJson[dayKey] || {},
            progress: progressJson[dayKey] || {},
            water: typeof waterJson === "object" ? waterJson?.[dayKey] ?? 0 : waterJson ?? 0,
        };
    }

    const looksLikeMeals = MEAL_ORDER.some((meal) => planJson[meal]);
    if (looksLikeMeals) {
        return {
            meals: planJson,
            progress: progressJson[dayKey] || progressJson || {},
            water: typeof waterJson === "number" ? waterJson : waterJson?.[dayKey] ?? 0,
        };
    }

    return { meals: {}, progress: {}, water: 0 };
};

const StatusBadge = ({ status }) => {
    const config = STATUS_STYLES[String(status || "").toLowerCase()] || STATUS_STYLES.inactive;
    const Icon = config.Icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${config.bg} ${config.text} ${config.border}`}>
            <Icon className="w-3 h-3" />
            {config.label}
        </span>
    );
};

const MealStatusBadge = ({ status, completedAt }) => {
    const done = String(status || "").toLowerCase() === "completed";
    return (
        <div className="text-right">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${done ? "bg-emerald-50 text-[#0D614E]" : "bg-amber-50 text-amber-700"}`}>
                {done ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                {done ? "Completed" : "Pending"}
            </span>
            {done && completedAt && (
                <p className="text-[10px] text-gray-400 mt-1">{formatDateTime(completedAt)}</p>
            )}
        </div>
    );
};

const DietProgress = ({ patientId }) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dayLoading, setDayLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedPlanId, setSelectedPlanId] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [currentDay, setCurrentDay] = useState(1);
    const [totalDays, setTotalDays] = useState(1);

    const fetchAssignedPlans = useCallback(async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            const response = await doctorService.getprescribedietplan(patientId);
            setPlans(unwrapPlans(response));
        } catch (error) {
            // toast.error(error?.message || "Failed to load assigned diet plans");
            setPlans([]);
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => {
        fetchAssignedPlans();
    }, [fetchAssignedPlans]);

    const fetchPlanDay = useCallback(async (planId, day, fallbackPlan) => {
        if (!patientId || !planId) return;
        setDayLoading(true);
        try {
            const response = await doctorService.getprescribedietplan(patientId, planId, day);
            const plan = unwrapPlan(response);
            if (plan) {
                const merged = {
                    ...(fallbackPlan || {}),
                    ...plan,
                    diet_plan_gallery: plan.diet_plan_gallery?.length
                        ? plan.diet_plan_gallery
                        : fallbackPlan?.diet_plan_gallery || [],
                };
                setSelectedPlan(merged);
                const days = extractDayKeys(merged.plan_json).length;
                if (days > 1) setTotalDays(days);
            } else if (fallbackPlan) {
                setSelectedPlan(fallbackPlan);
            }
        } catch (error) {
            if (fallbackPlan) {
                setSelectedPlan(fallbackPlan);
            } else {
                toast.error(error?.message || "Failed to load diet plan day");
            }
        } finally {
            setDayLoading(false);
        }
    }, [patientId]);

    const openPlan = (plan) => {
        const days = extractDayKeys(plan.plan_json).length || 1;
        setSelectedPlanId(plan.id);
        setSelectedPlan(plan);
        setTotalDays(days);
        setCurrentDay(1);
        fetchPlanDay(plan.id, 1, plan);
    };

    const closePlan = () => {
        setSelectedPlanId(null);
        setSelectedPlan(null);
        setCurrentDay(1);
        setTotalDays(1);
    };

    const changeDay = (day) => {
        if (day < 1 || day > totalDays || day === currentDay) return;
        setCurrentDay(day);
        const fallback = plans.find((item) => item.id === selectedPlanId) || selectedPlan;
        fetchPlanDay(selectedPlanId, day, fallback);
    };

    const filteredPlans = useMemo(() => {
        if (statusFilter === "all") return plans;
        return plans.filter((plan) => String(plan.status || "").toLowerCase() === statusFilter);
    }, [plans, statusFilter]);

    const counts = useMemo(() => {
        const next = { all: plans.length };
        plans.forEach((plan) => {
            const key = String(plan.status || "inactive").toLowerCase();
            next[key] = (next[key] || 0) + 1;
        });
        return next;
    }, [plans]);

    const daySlice = selectedPlan ? getDaySlice(selectedPlan, currentDay) : { meals: {}, progress: {}, water: 0 };
    const waterGoal = selectedPlan?.daily_water_intake_goal || 0;
    const waterPercent = waterGoal ? Math.min(100, Math.round((Number(daySlice.water || 0) / waterGoal) * 100)) : 0;
    const selectedProgress = getMealProgress(selectedPlan?.progress_json);

    if (!patientId) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <AlertCircle className="w-8 h-8 mb-2" />
                <p className="text-sm">Patient details are required to track diet progress.</p>
            </div>
        );
    }

    if (loading && !selectedPlanId) {
        return (
            <div className="flex items-center justify-center min-h-[240px]">
                <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#0D614E]" />
                    <p className="text-sm text-gray-500 font-medium">Loading assigned diet plans…</p>
                </div>
            </div>
        );
    }

    if (selectedPlanId && selectedPlan) {
        const meals = MEAL_ORDER.filter((meal) => daySlice.meals?.[meal]);
        const cover = getPlanCover(selectedPlan);

        return (
            <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <button
                            type="button"
                            onClick={closePlan}
                            className="mt-0.5 p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#0D614E]/5 border border-gray-100 shrink-0 flex items-center justify-center">
                            {cover?.image_url ? (
                                <img
                                    src={cover.image_url}
                                    alt={cover.caption || selectedPlan.diet_plan_name}
                                    className="w-full h-full object-cover"
                                    onError={(event) => {
                                        event.currentTarget.style.display = "none";
                                    }}
                                />
                            ) : (
                                <Leaf className="w-6 h-6 text-[#0D614E]" />
                            )}
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#0D614E]">Assigned diet plan</p>
                            <h2 className="text-xl font-bold text-gray-900 mt-0.5">{selectedPlan.diet_plan_name}</h2>
                            <p className="text-xs text-gray-500 mt-1">
                                Started {formatDate(selectedPlan.started_at)} · Updated {formatDateTime(selectedPlan.updated_at)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={selectedPlan.status} />
                        {selectedPlan.repeat_count > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                                <Repeat className="w-3 h-3" /> Repeat {selectedPlan.repeat_count}
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-2xl border border-gray-100 bg-white p-4">
                        <p className="text-xs text-gray-500">Meal progress</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                            {selectedProgress.completed}/{selectedProgress.total || 0}
                        </p>
                        <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full bg-[#0D614E]" style={{ width: `${selectedProgress.percent}%` }} />
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-4">
                        <p className="text-xs text-gray-500">Plan days</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{totalDays}</p>
                        <p className="text-xs text-gray-400 mt-1">Viewing day {currentDay}</p>
                    </div>
                    <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                        <p className="text-xs text-sky-700 flex items-center gap-1">
                            <Droplets className="w-3.5 h-3.5" /> Water · Day {currentDay}
                        </p>
                        <p className="text-2xl font-bold text-sky-900 mt-1">
                            {daySlice.water || 0}
                            <span className="text-sm font-medium text-sky-600"> / {waterGoal || 0} ml</span>
                        </p>
                        <div className="mt-2 h-2 rounded-full bg-white overflow-hidden">
                            <div className="h-full rounded-full bg-sky-500" style={{ width: `${waterPercent}%` }} />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <button
                        type="button"
                        onClick={() => changeDay(currentDay - 1)}
                        disabled={currentDay <= 1 || dayLoading}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                        <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {Array.from({ length: totalDays }, (_, index) => index + 1).map((day) => (
                            <button
                                key={day}
                                type="button"
                                onClick={() => changeDay(day)}
                                className={`min-w-[42px] px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                    currentDay === day
                                        ? "bg-[#0D614E] text-white"
                                        : "bg-white border border-gray-200 text-gray-600 hover:border-[#0D614E]/40 hover:text-[#0D614E]"
                                }`}
                            >
                                Day {day}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => changeDay(currentDay + 1)}
                        disabled={currentDay >= totalDays || dayLoading}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    >
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {dayLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-7 h-7 animate-spin text-[#0D614E]" />
                    </div>
                ) : meals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <Inbox className="w-8 h-8 mb-2" />
                        <p className="text-sm">No meals found for day {currentDay}.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {meals.map((mealType) => {
                            const meal = daySlice.meals[mealType];
                            const mealProgress = daySlice.progress?.[mealType] || {};
                            const meta = MEAL_META[mealType] || { label: mealType, Icon: UtensilsCrossed, tone: "bg-gray-50 text-gray-700 border-gray-100" };
                            const MealIcon = meta.Icon;
                            const nutritionItems = [
                                { label: "Calories", value: getNutritionValue(meal.nutrition, "total_calories") },
                                { label: "Carbs", value: getNutritionValue(meal.nutrition, "carbs") },
                                { label: "Protein", value: getNutritionValue(meal.nutrition, "protein") },
                                { label: "Fat", value: getNutritionValue(meal.nutrition, "fat") },
                            ].filter((item) => item.value);

                            return (
                                <div key={mealType} className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
                                    <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-gray-50">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-10 h-10 rounded-xl border flex items-center justify-center ${meta.tone}`}>
                                                <MealIcon className="w-4 h-4" />
                                            </span>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{meta.label}</h3>
                                                <p className="text-xs text-gray-400">{meal.diet?.length || 0} item{(meal.diet?.length || 0) === 1 ? "" : "s"}</p>
                                            </div>
                                        </div>
                                        <MealStatusBadge status={mealProgress.status} completedAt={mealProgress.completed_at} />
                                    </div>

                                    <div className="p-4 space-y-4">
                                        <div className="space-y-2">
                                            {(meal.diet || []).map((item, index) => (
                                                <div key={`${item.name}-${index}`} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                                                            {item.notes && <p className="text-xs text-gray-500 mt-1">{item.notes}</p>}
                                                        </div>
                                                        {item.quantity && (
                                                            <span className="shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-600">
                                                                {item.quantity}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {recipeLinks(item).length > 0 && (
                                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                                            {recipeLinks(item).map((url) => (
                                                                <a
                                                                    key={url}
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    onClick={(event) => event.stopPropagation()}
                                                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0D614E] hover:underline"
                                                                >
                                                                    <ExternalLink className="w-3 h-3" />
                                                                    Recipe
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {nutritionItems.length > 0 && (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                {nutritionItems.map((item) => (
                                                    <div key={item.label} className="rounded-xl border border-gray-100 px-3 py-2">
                                                        <p className="text-[10px] uppercase tracking-wide text-gray-400">{item.label}</p>
                                                        <p className="text-sm font-semibold text-gray-800 mt-0.5">{item.value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {meal.diet_gallery?.length > 0 && (
                                            <div className="flex items-center gap-2 overflow-x-auto">
                                                {meal.diet_gallery.map((image, index) => (
                                                    <div key={`${image.image_url}-${index}`} className="shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                                                        {image.image_url ? (
                                                            <img
                                                                src={image.image_url}
                                                                alt={image.caption || mealType}
                                                                className="w-full h-full object-cover"
                                                                onError={(event) => {
                                                                    event.currentTarget.style.display = "none";
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                <ImageIcon className="w-4 h-4" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {meal.preparation_steps?.length > 0 && (
                                            <div>
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Preparation</p>
                                                <ol className="space-y-1.5">
                                                    {meal.preparation_steps.map((step, index) => (
                                                        <li key={`${step}-${index}`} className="flex gap-2 text-sm text-gray-700">
                                                            <span className="w-5 h-5 rounded-full bg-[#0D614E]/10 text-[#0D614E] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                                {index + 1}
                                                            </span>
                                                            {step}
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {(selectedPlan.guidance?.length > 0 || selectedPlan.additional_notes?.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedPlan.guidance?.length > 0 && (
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                                <h4 className="text-sm font-semibold text-emerald-800 mb-2">Guidance</h4>
                                <ul className="space-y-1.5 text-sm text-emerald-900">
                                    {selectedPlan.guidance.map((item, index) => (
                                        <li key={index}>• {typeof item === "string" ? item : item?.text || JSON.stringify(item)}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {selectedPlan.additional_notes?.length > 0 && (
                            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                                <h4 className="text-sm font-semibold text-amber-800 mb-2">Additional notes</h4>
                                <ul className="space-y-1.5 text-sm text-amber-900">
                                    {selectedPlan.additional_notes.map((item, index) => (
                                        <li key={index}>• {typeof item === "string" ? item : item?.text || JSON.stringify(item)}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Diet Plan Progress</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        {plans.length} plan{plans.length === 1 ? "" : "s"} assigned to this patient
                    </p>
                </div>
                <button
                    type="button"
                    onClick={fetchAssignedPlans}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            <div className="flex flex-wrap gap-2">
                {FILTERS.map((filter) => (
                    <button
                        key={filter.id}
                        type="button"
                        onClick={() => setStatusFilter(filter.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                            statusFilter === filter.id
                                ? "bg-[#0D614E] text-white border-[#0D614E]"
                                : "bg-white text-gray-600 border-gray-200 hover:border-[#0D614E]/40"
                        }`}
                    >
                        {filter.label}
                        {counts[filter.id] ? ` · ${counts[filter.id]}` : ""}
                    </button>
                ))}
            </div>

            {filteredPlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Inbox className="w-8 h-8 mb-2" />
                    <p className="text-sm">No assigned diet plans found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredPlans.map((plan) => {
                        const progress = getMealProgress(plan.progress_json);
                        const cover = getPlanCover(plan);
                        const days = extractDayKeys(plan.plan_json).length;
                        return (
                            <button
                                key={plan.id}
                                type="button"
                                onClick={() => openPlan(plan)}
                                className="text-left rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-[#0D614E]/20 transition-all"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[#0D614E]/5 border border-gray-100 shrink-0 flex items-center justify-center">
                                        {cover?.image_url ? (
                                            <img
                                                src={cover.image_url}
                                                alt={cover.caption || plan.diet_plan_name}
                                                className="w-full h-full object-cover"
                                                onError={(event) => {
                                                    event.currentTarget.style.display = "none";
                                                }}
                                            />
                                        ) : (
                                            <Leaf className="w-6 h-6 text-[#0D614E]" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 truncate">{plan.diet_plan_name}</h3>
                                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                                    <CalendarDays className="w-3.5 h-3.5" />
                                                    Started {formatDate(plan.started_at)}
                                                </p>
                                            </div>
                                            <StatusBadge status={plan.status} />
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-100">
                                                <Flame className="w-3 h-3 text-[#0D614E]" /> {progress.percent}% complete
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-100">
                                                {days} day{days === 1 ? "" : "s"}
                                            </span>
                                            {plan.repeat_count > 0 && (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-sky-50 border border-sky-100 text-sky-700">
                                                    <Repeat className="w-3 h-3" /> Repeat {plan.repeat_count}
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
                                            <div className="h-full rounded-full bg-[#0D614E]" style={{ width: `${progress.percent}%` }} />
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-2">
                                            {progress.completed} of {progress.total} meals completed
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DietProgress;
