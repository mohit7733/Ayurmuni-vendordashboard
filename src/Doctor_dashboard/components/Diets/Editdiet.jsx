import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { vendorService } from '../../../services/vendorService';
import toast from 'react-hot-toast';
import { doctorService } from '../../../services/doctorService';
import {
    Star,
    X,
    Plus,
    ImageIcon,
    ChevronDown,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Sunrise,
    Coffee,
    Sun,
    UtensilsCrossed,
    Moon,
    Info,
    Trash2,
    Pencil,
} from 'lucide-react';
import { useParams } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Small shared UI primitives (kept local so this file stays a drop-in swap)
// ---------------------------------------------------------------------------

const Toggle = ({ checked, onChange, label, id, name }) => (
    <label htmlFor={id} className="flex items-center gap-3 cursor-pointer select-none">
        <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
            <input
                id={id}
                name={name}
                type="checkbox"
                checked={checked}
                onChange={onChange}
                className="peer sr-only"
            />
            <span className="absolute inset-0 rounded-full bg-gray-300 peer-checked:bg-[#0D614E] transition-colors" />
            <span className="absolute left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
        </span>
        <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
);

const SectionHeader = ({ title, description, action }) => (
    <div className="flex items-start justify-between gap-4 mb-4">
        <div>
            <h4 className="text-base font-semibold text-gray-900">{title}</h4>
            {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
        </div>
        {action}
    </div>
);

const mealMeta = {
    morning: { label: 'Morning', Icon: Sunrise },
    breakfast: { label: 'Breakfast', Icon: Coffee },
    midday: { label: 'Midday', Icon: Sun },
    lunch: { label: 'Lunch', Icon: UtensilsCrossed },
    dinner: { label: 'Dinner', Icon: Moon },
};

const mealTypes = ['morning', 'breakfast', 'midday', 'lunch', 'dinner'];
const SEASON_OPTIONS = ['summer', 'winter', 'spring', 'autumn', 'monsoon', 'all_seasons'];

const emptyNutrition = () => ({
    total_calories: { value: '', unit: 'kcal' },
    carbs: { value: '', unit: 'g' },
    protein: { value: '', unit: 'g' },
    fat: { value: '', unit: 'g' },
});

const emptyDietItem = () => ({
    name: '',
    quantity: '',
    notes: '',
    recipe: [''],
    diet_gallery: [],
    preparation_steps: [''],
    nutrition: emptyNutrition(),
});

const emptyMeal = () => ({
    diet: [emptyDietItem()],
});

const emptyGuidance = () => [''];

const toStringArray = (value, fallback = ['']) => {
    if (Array.isArray(value) && value.length) {
        return value.map((v) => (v == null ? '' : String(v)));
    }
    if (typeof value === 'string' && value.trim()) return [value];
    return fallback;
};

const hasFilledNutrition = (nutrition) => {
    const src = nutrition || {};
    return ['total_calories', 'carbs', 'protein', 'fat'].some((key) => {
        const value = src[key]?.value;
        return value !== '' && value != null && String(value).trim() !== '';
    });
};

const normalizeDietItem = (item) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
        const recipes = toStringArray(item.recipe, ['']);
        return {
            name: item.name || '',
            quantity: item.quantity || '',
            notes: item.notes || '',
            recipe: recipes.length ? recipes : [''],
            diet_gallery: Array.isArray(item.diet_gallery)
                ? item.diet_gallery.map(normalizeMealGalleryItem).filter((img) => img.image_url)
                : [],
            preparation_steps: toStringArray(item.preparation_steps, ['']),
            nutrition: normalizeNutrition(item.nutrition),
        };
    }
    return {
        name: typeof item === 'string' ? item : '',
        quantity: '',
        notes: '',
        recipe: [''],
        diet_gallery: [],
        preparation_steps: [''],
        nutrition: emptyNutrition(),
    };
};

const cloneNutrition = (nutrition) => {
    const src = normalizeNutrition(nutrition);
    return {
        total_calories: { ...src.total_calories },
        carbs: { ...src.carbs },
        protein: { ...src.protein },
        fat: { ...src.fat },
    };
};

const cloneDietItem = (item) => {
    const src = normalizeDietItem(item);
    return {
        name: src.name,
        quantity: src.quantity,
        notes: src.notes,
        recipe: [...(src.recipe || [''])],
        diet_gallery: (src.diet_gallery || []).map((img) => ({ ...img })),
        preparation_steps: [...(src.preparation_steps || [''])],
        nutrition: cloneNutrition(src.nutrition),
    };
};

const normalizeNutrition = (nutrition) => {
    const src = nutrition || {};
    const pick = (key, unit) => ({
        value: src[key]?.value ?? '',
        unit: src[key]?.unit || unit,
    });
    return {
        total_calories: pick('total_calories', 'kcal'),
        carbs: pick('carbs', 'g'),
        protein: pick('protein', 'g'),
        fat: pick('fat', 'g'),
    };
};

const normalizeMealGalleryItem = (img) => ({
    image_url: img?.image_url || img?.url || '',
    caption: img?.caption || '',
});

const normalizeMeal = (meal) => {
    const src = meal || {};
    const diet = Array.isArray(src.diet) && src.diet.length
        ? src.diet.map(normalizeDietItem)
        : [emptyDietItem()];

    const mealGallery = Array.isArray(src.diet_gallery)
        ? src.diet_gallery.map(normalizeMealGalleryItem).filter((img) => img.image_url)
        : [];
    const mealPrep = toStringArray(src.preparation_steps, ['']);
    const mealNutrition = normalizeNutrition(src.nutrition);
    const first = diet[0];

    // Older plans store gallery/steps/nutrition on the meal. Move them onto item 1
    // unless that item already has its own values.
    if (first) {
        if (!first.diet_gallery.length && mealGallery.length) {
            first.diet_gallery = mealGallery;
        }
        if (!first.preparation_steps.some((step) => String(step).trim()) && mealPrep.some((step) => String(step).trim())) {
            first.preparation_steps = mealPrep;
        }
        if (!hasFilledNutrition(first.nutrition) && hasFilledNutrition(mealNutrition)) {
            first.nutrition = mealNutrition;
        }
    }

    return { diet };
};

const initializeSchedule = (days) => {
    const schedule = {};
    for (let i = 1; i <= days; i++) {
        const dayKey = `day_${i}`;
        schedule[dayKey] = {};
        mealTypes.forEach((meal) => {
            schedule[dayKey][meal] = emptyMeal();
        });
    }
    return schedule;
};

const normalizeSchedule = (schedule) => {
    if (!schedule || typeof schedule !== 'object') return initializeSchedule(1);
    const keys = Object.keys(schedule)
        .filter((k) => /^day_\d+$/.test(k))
        .sort((a, b) => Number(a.split('_')[1]) - Number(b.split('_')[1]));
    if (!keys.length) return initializeSchedule(1);
    const next = {};
    keys.forEach((dayKey) => {
        next[dayKey] = {};
        mealTypes.forEach((meal) => {
            next[dayKey][meal] = normalizeMeal(schedule[dayKey]?.[meal]);
        });
    });
    return next;
};

const normalizeGuidance = (plan) => {
    const src = plan?.guidance ?? plan?.Guidance;

    const fromItem = (item) => {
        if (typeof item === 'string') return [item];
        if (item && typeof item === 'object') {
            const nested = [
                ...(Array.isArray(item.content) ? item.content : []),
                ...(Array.isArray(item.tips) ? item.tips : []),
                item.content,
                item.description,
                item.message,
                item.text,
            ];
            return nested.filter((v) => typeof v === 'string');
        }
        return [];
    };

    let items = [];
    if (Array.isArray(src)) {
        items = src.flatMap(fromItem);
    } else if (src && typeof src === 'object') {
        items = fromItem(src);
    } else if (typeof src === 'string') {
        items = [src];
    }

    const cleaned = items.map((s) => String(s).trim()).filter(Boolean);
    return cleaned.length ? cleaned : emptyGuidance();
};

const nutrientNumber = (value) => {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
};

const serializeNutrition = (nutrition) => {
    const src = normalizeNutrition(nutrition);
    return {
        total_calories: {
            value: nutrientNumber(src.total_calories?.value),
            unit: src.total_calories?.unit || 'kcal',
        },
        carbs: {
            value: nutrientNumber(src.carbs?.value),
            unit: src.carbs?.unit || 'g',
        },
        protein: {
            value: nutrientNumber(src.protein?.value),
            unit: src.protein?.unit || 'g',
        },
        fat: {
            value: nutrientNumber(src.fat?.value),
            unit: src.fat?.unit || 'g',
        },
    };
};

const sumNutrition = (items) => {
    const acc = {
        total_calories: { value: 0, unit: 'kcal' },
        carbs: { value: 0, unit: 'g' },
        protein: { value: 0, unit: 'g' },
        fat: { value: 0, unit: 'g' },
    };
    (items || []).forEach((item) => {
        const nutrition = serializeNutrition(item?.nutrition);
        ['total_calories', 'carbs', 'protein', 'fat'].forEach((key) => {
            acc[key].value += nutrition[key].value;
            acc[key].unit = nutrition[key].unit || acc[key].unit;
        });
    });
    return acc;
};

const cloneMeal = (meal) => {
    const src = meal || emptyMeal();
    return {
        diet: (src.diet && src.diet.length ? src.diet : [emptyDietItem()]).map(cloneDietItem),
    };
};

const DietPlanManager = () => {
    const { id } = useParams();
    const [formData, setFormData] = useState({
        name: '',
        prakriti: '',
        season: '',
        health_diseases: [],
        is_personalized_plan: false,
        is_paid: false,
        price: '',
        is_common: false,
        diet_plan_gallery: [],
        schedule: {},
        guidance: emptyGuidance(),
    });

    const [numberOfDays, setNumberOfDays] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isEditMode, setIsEditMode] = useState((id ? true : false));
    const [dietPlanId, setDietPlanId] = useState(id || '');
    const [activeDay, setActiveDay] = useState('day_1');
    const [diseasesCategories, setDiseasesCategories] = useState([]);
    const [galleryImages, setGalleryImages] = useState([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [draggedIndex, setDraggedIndex] = useState(null);
    // UI-only: which meal accordions are open per day (key = `${dayKey}-${meal}`)
    const [expandedMeals, setExpandedMeals] = useState(new Set(['day_1-morning']));
    const [uploadingMealImages, setUploadingMealImages] = useState(false);
    const [mealUploadTarget, setMealUploadTarget] = useState(null);
    const fileInputRef = useRef(null);
    const mealFileInputRef = useRef(null);
    const mealUploadTargetRef = useRef(null);

    useEffect(() => {
        fetchdatabrandcat();
        if (id) {
            fetchDietPlanData(id);
        }
    }, []);

    const fetchDietPlanData = async (id) => {
        try {
            const response = await doctorService.getdietbyid(id);
            const raw = response?.data?.data || response?.data || {};
            const dietPlan = Array.isArray(raw) ? (raw[0] || {}) : raw;
            const schedule = normalizeSchedule(dietPlan.schedule);
            setFormData({
                name: dietPlan.name || '',
                prakriti: dietPlan.prakriti || '',
                season: dietPlan.season || '',
                health_diseases: Array.isArray(dietPlan.health_diseases) ? dietPlan.health_diseases : [],
                is_paid: !!dietPlan.is_paid,
                price: dietPlan.price ?? '',
                is_personalized_plan: !!dietPlan.is_personalized_plan,
                is_common: !!dietPlan.is_common,
                diet_plan_gallery: dietPlan.diet_plan_gallery || [],
                schedule,
                guidance: normalizeGuidance(dietPlan),
            });
            setGalleryImages(dietPlan?.diet_plan_gallery || []);
            const dayCount = Object.keys(schedule).length || 1;
            setNumberOfDays(dayCount);
            setActiveDay('day_1');
            setExpandedMeals(new Set(['day_1-morning']));
        } catch (error) {
            console.error("Error fetching diet plan data:", error);
            toast.error(error?.message || "Failed to fetch diet plan data");
        }
    };
    const normalizeDiseases = (payload) => {
        const list = payload?.data?.data || payload?.data || payload?.diseases?.data || payload?.diseases || payload;
        return Array.isArray(list) ? list : [];
    };
    const fetchdatabrandcat = async () => {
        try {
            // const data = await doctorService.getdiet();
            const [diseasescat] = await Promise.allSettled([
                doctorService.getPrakritiAndDiseases()
                // vendorService.getbrandandcategory("health-diseases"),
            ]);
            const diseasescate = diseasescat.status === "fulfilled" ? normalizeDiseases(diseasescat.value) : [];

            setDiseasesCategories(diseasescate);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error(error?.message || "Failed to fetch data");
        }
    };

    // Initialize form for create mode only
    useEffect(() => {
        if (id) return;
        setFormData((prev) => ({
            ...prev,
            schedule: initializeSchedule(1),
            guidance: emptyGuidance(),
        }));
    }, []);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const selectedDiseaseIds = useMemo(
        () => new Set((formData.health_diseases || []).map((d) => String(d.id))),
        [formData.health_diseases]
    );

    const availableDiseases = useMemo(
        () => diseasesCategories.filter((category) => !selectedDiseaseIds.has(String(category.id))),
        [diseasesCategories, selectedDiseaseIds]
    );

    const addDisease = (disease) => {
        if (!disease || selectedDiseaseIds.has(String(disease.id))) return;
        setFormData((prev) => ({
            ...prev,
            health_diseases: [...(prev.health_diseases || []), { id: disease.id, name: disease.name }],
        }));
    };

    const removeDisease = (index) => {
        setFormData((prev) => ({
            ...prev,
            health_diseases: prev.health_diseases.filter((_, i) => i !== index),
        }));
    };

    const handleDiseaseChange = (e) => {
        const selectedDisease = diseasesCategories.find(
            (cat) => String(cat.id) === String(e.target.value)
        );
        if (selectedDisease) addDisease(selectedDisease);
    };

    // Upload images to S3
    const handleGalleryUpload = async (e, type = 'diet') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingImages(true);
        const uploadedUrls = [];

        try {
            const validFiles = Array.from(files).filter(file => file && file.type && file.type.startsWith('image/'));

            if (validFiles.length === 0) {
                toast.error('Please select valid image files');
                setUploadingImages(false);
                return;
            }

            for (let i = 0; i < validFiles.length; i++) {
                try {
                    const file = validFiles[i];
                    const response = await vendorService.uploadfiles(file, "diet_plan_images");
                    const imageUrl = response?.data?.data?.url || response?.data?.url;

                    if (imageUrl) {
                        uploadedUrls.push(imageUrl);
                    } else {
                        console.error('No URL in response for image', i);
                        toast.error(`Failed to upload image ${i + 1}`);
                    }
                } catch (error) {
                    console.error(`Error uploading image ${i + 1}:`, error);
                    toast.error(`Error uploading image ${i + 1}: ${error.message || 'Unknown error'}`);
                }
            }

            if (uploadedUrls.length > 0) {
                const newImages = uploadedUrls.map((url, index) => ({
                    id: `temp_${Date.now()}_${index}`,
                    image_url: url,
                    is_cover: galleryImages.length === 0 && index === 0,
                    caption: `Image ${galleryImages.length + index + 1}`
                }));

                setGalleryImages(prev => [...prev, ...newImages]);
                toast.success(`Successfully uploaded ${uploadedUrls.length} image(s)`);
            } else {
                toast.error('No images were uploaded successfully');
            }
        } catch (error) {
            console.error('Error in upload process:', error);
            toast.error('Failed to upload images');
        } finally {
            setUploadingImages(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Handle file selection
    const handleFileSelect = (e) => {
        handleGalleryUpload(e, 'diet');
    };

    // Handle drag and drop
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            // Create a synthetic event for handleGalleryUpload
            const syntheticEvent = { target: { files } };
            handleGalleryUpload(syntheticEvent, 'diet');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    // Drag and drop reordering
    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOverItem = (e, index, type = 'diet') => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newImages = [...galleryImages];
        const draggedItem = newImages[draggedIndex];
        newImages.splice(draggedIndex, 1);
        newImages.splice(index, 0, draggedItem);
        setGalleryImages(newImages);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    // Handle gallery image management
    const addGalleryImage = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleSetAsCover = (index) => {
        const updatedImages = galleryImages.map((img, idx) => ({
            ...img,
            is_cover: idx === index
        }));
        setGalleryImages(updatedImages);
        toast.success('Cover image updated successfully');
    };

    const handleRemoveImage = (index) => {
        setGalleryImages(prev => prev.filter((_, idx) => idx !== index));
        toast.success('Image removed successfully');
    };

    const handleGalleryCaption = (index, caption) => {
        setGalleryImages((prev) => prev.map((img, idx) => (idx === index ? { ...img, caption } : img)));
    };

    // Handle day schedule changes
    const updateMeal = (dayKey, mealType, updater) => {
        setFormData((prev) => {
            const updatedSchedule = { ...prev.schedule };
            const day = { ...(updatedSchedule[dayKey] || {}) };
            const meal = cloneMeal(day[mealType]);
            day[mealType] = updater(meal);
            updatedSchedule[dayKey] = day;
            return { ...prev, schedule: updatedSchedule };
        });
    };

    const handleDietItemChange = (dayKey, mealType, index, field, value) => {
        updateMeal(dayKey, mealType, (meal) => {
            const diet = [...meal.diet];
            diet[index] = { ...cloneDietItem(diet[index]), [field]: value };
            meal.diet = diet;
            return meal;
        });
    };

    const updateDietItem = (dayKey, mealType, dietIndex, updater) => {
        updateMeal(dayKey, mealType, (meal) => {
            const diet = [...meal.diet];
            diet[dietIndex] = updater(cloneDietItem(diet[dietIndex]));
            meal.diet = diet;
            return meal;
        });
    };

    const handleDietRecipeChange = (dayKey, mealType, dietIndex, recipeIndex, value) => {
        updateDietItem(dayKey, mealType, dietIndex, (item) => {
            const recipe = [...(item.recipe || [''])];
            recipe[recipeIndex] = value;
            return { ...item, recipe };
        });
    };

    const addDietRecipe = (dayKey, mealType, dietIndex) => {
        updateDietItem(dayKey, mealType, dietIndex, (item) => ({
            ...item,
            recipe: [...(item.recipe || ['']), ''],
        }));
    };

    const removeDietRecipe = (dayKey, mealType, dietIndex, recipeIndex) => {
        updateDietItem(dayKey, mealType, dietIndex, (item) => {
            const recipe = [...(item.recipe || [''])];
            if (recipe.length <= 1) return { ...item, recipe: [''] };
            recipe.splice(recipeIndex, 1);
            return { ...item, recipe };
        });
    };

    const handleDietPrepChange = (dayKey, mealType, dietIndex, stepIndex, value) => {
        updateDietItem(dayKey, mealType, dietIndex, (item) => {
            const preparation_steps = [...(item.preparation_steps || [''])];
            preparation_steps[stepIndex] = value;
            return { ...item, preparation_steps };
        });
    };

    const addDietPrepStep = (dayKey, mealType, dietIndex) => {
        updateDietItem(dayKey, mealType, dietIndex, (item) => ({
            ...item,
            preparation_steps: [...(item.preparation_steps || ['']), ''],
        }));
    };

    const removeDietPrepStep = (dayKey, mealType, dietIndex, stepIndex) => {
        updateDietItem(dayKey, mealType, dietIndex, (item) => {
            const preparation_steps = [...(item.preparation_steps || [''])];
            if (preparation_steps.length <= 1) return { ...item, preparation_steps: [''] };
            preparation_steps.splice(stepIndex, 1);
            return { ...item, preparation_steps };
        });
    };

    const handleDietNutritionChange = (dayKey, mealType, dietIndex, nutrient, value) => {
        updateDietItem(dayKey, mealType, dietIndex, (item) => ({
            ...item,
            nutrition: {
                ...cloneNutrition(item.nutrition),
                [nutrient]: {
                    ...(item.nutrition?.[nutrient] || { value: '', unit: nutrient === 'total_calories' ? 'kcal' : 'g' }),
                    value,
                },
            },
        }));
    };

    const handleMealGalleryCaption = (dayKey, mealType, dietIndex, index, caption) => {
        updateDietItem(dayKey, mealType, dietIndex, (item) => {
            const gallery = [...(item.diet_gallery || [])];
            if (!gallery[index]) return item;
            gallery[index] = { ...gallery[index], caption };
            return { ...item, diet_gallery: gallery };
        });
    };

    const removeMealGalleryImage = (dayKey, mealType, dietIndex, index) => {
        updateDietItem(dayKey, mealType, dietIndex, (item) => ({
            ...item,
            diet_gallery: (item.diet_gallery || []).filter((_, idx) => idx !== index),
        }));
    };

    const openMealGalleryPicker = (dayKey, mealType, dietIndex) => {
        const target = { dayKey, mealType, dietIndex };
        mealUploadTargetRef.current = target;
        setMealUploadTarget(target);
        if (mealFileInputRef.current) {
            mealFileInputRef.current.click();
        }
    };

    const handleMealGalleryUpload = async (e) => {
        const files = e.target.files;
        const target = mealUploadTargetRef.current || mealUploadTarget;
        if (!files || files.length === 0 || !target || typeof target.dietIndex !== 'number') return;

        setUploadingMealImages(true);
        try {
            const validFiles = Array.from(files).filter((file) => file && file.type && file.type.startsWith('image/'));
            if (validFiles.length === 0) {
                toast.error('Please select valid image files');
                return;
            }

            const uploaded = [];
            for (let i = 0; i < validFiles.length; i++) {
                try {
                    const response = await vendorService.uploadfiles(validFiles[i], 'diet_plan_images');
                    const imageUrl = response?.data?.data?.url || response?.data?.url;
                    if (imageUrl) {
                        uploaded.push({ image_url: imageUrl, caption: '' });
                    } else {
                        toast.error(`Failed to upload meal image ${i + 1}`);
                    }
                } catch (error) {
                    toast.error(`Error uploading meal image ${i + 1}: ${error.message || 'Unknown error'}`);
                }
            }

            if (uploaded.length > 0) {
                updateDietItem(target.dayKey, target.mealType, target.dietIndex, (item) => ({
                    ...item,
                    diet_gallery: [...(item.diet_gallery || []), ...uploaded],
                }));
                toast.success(`Successfully uploaded ${uploaded.length} meal image(s)`);
            }
        } catch (error) {
            toast.error('Failed to upload meal images');
        } finally {
            setUploadingMealImages(false);
            mealUploadTargetRef.current = null;
            setMealUploadTarget(null);
            if (mealFileInputRef.current) mealFileInputRef.current.value = '';
        }
    };

    const handleGuidanceChange = (index, value) => {
        setFormData((prev) => {
            const next = [...(prev.guidance || [''])];
            next[index] = value;
            return { ...prev, guidance: next };
        });
    };

    const addGuidanceItem = () => {
        setFormData((prev) => ({
            ...prev,
            guidance: [...(prev.guidance || ['']), ''],
        }));
    };

    const removeGuidanceItem = (index) => {
        setFormData((prev) => {
            const list = [...(prev.guidance || [''])];
            return {
                ...prev,
                guidance: list.length <= 1 ? [''] : list.filter((_, i) => i !== index),
            };
        });
    };

    // Add a complete diet item replica (item, quantity, notes, recipe, image, steps, nutrition)
    const addScheduleItem = (dayKey, mealType, field) => {
        updateMeal(dayKey, mealType, (meal) => {
            if (field === 'diet') {
                meal.diet = [...(meal.diet || []), emptyDietItem()];
            }
            return meal;
        });
    };

    // Remove item from diet
    const removeScheduleItem = (dayKey, mealType, field, index) => {
        updateMeal(dayKey, mealType, (meal) => {
            if (field !== 'diet') return meal;
            const list = [...(meal.diet || [])];
            if (list.length <= 1) {
                meal.diet = [emptyDietItem()];
                return meal;
            }
            list.splice(index, 1);
            meal.diet = list;
            return meal;
        });
    };

    // Add new day
    const addDay = () => {
        const newDayCount = numberOfDays + 1;
        setNumberOfDays(newDayCount);
        const newDayKey = `day_${newDayCount}`;
        setFormData(prev => {
            const updatedSchedule = { ...prev.schedule };
            updatedSchedule[newDayKey] = {};
            mealTypes.forEach(meal => {
                updatedSchedule[newDayKey][meal] = emptyMeal();
            });
            console.log('Added new day:', updatedSchedule);
            return { ...prev, schedule: updatedSchedule };
        });

        setActiveDay(newDayKey);
        setExpandedMeals(new Set([`${newDayKey}-morning`]));
    };

    // Remove last day
    const removeDay = () => {
        if (numberOfDays <= 1) return;
        const dayKey = `day_${numberOfDays}`;
        setFormData(prev => {
            const updatedSchedule = { ...prev.schedule };
            delete updatedSchedule[dayKey];
            return { ...prev, schedule: updatedSchedule };
        });
        setNumberOfDays(prev => prev - 1);
        setActiveDay(`day_${numberOfDays - 1}`);
    };

    const buildPayload = () => {
        if (galleryImages.length <= 0) {
            toast.error('Please add at least one gallery image');
            return false;
        }
        const validGallery = galleryImages
            .filter((img) => img.image_url && img.image_url.trim() !== '')
            .map((img) => ({
                image_url: img.image_url,
                is_cover: img.is_cover || false,
                caption: img.caption || '',
            }));

        const schedule = {};
        Object.keys(formData.schedule || {}).forEach((dayKey) => {
            schedule[dayKey] = {};
            mealTypes.forEach((mealType) => {
                const mealData = cloneMeal(formData.schedule[dayKey]?.[mealType]);
                const dietItems = (mealData.diet || [])
                    .map((item) => {
                        const normalized = cloneDietItem(item);
                        return {
                            name: (normalized.name || '').trim(),
                            quantity: (normalized.quantity || '').trim(),
                            notes: (normalized.notes || '').trim(),
                            recipe: (normalized.recipe || []).map((url) => (url || '').trim()).filter(Boolean),
                            diet_gallery: (normalized.diet_gallery || [])
                                .filter((img) => img.image_url)
                                .map((img) => ({
                                    image_url: img.image_url,
                                    caption: img.caption || '',
                                })),
                            preparation_steps: (normalized.preparation_steps || [])
                                .map((step) => (step || '').trim())
                                .filter(Boolean),
                            nutrition: serializeNutrition(normalized.nutrition),
                        };
                    })
                    .filter((item) => item.name);
                schedule[dayKey][mealType] = {
                    diet: dietItems,
                    // diet_gallery: dietItems.flatMap((item) => item.diet_gallery || []),
                    // preparation_steps: dietItems.flatMap((item) => item.preparation_steps || []),
                    // nutrition: sumNutrition(dietItems),
                };
            });
        });

        return {
            name: formData.name,
            prakriti: formData.prakriti,
            season: formData.season,
            health_diseases: formData.health_diseases,
            is_personalized_plan: formData.is_personalized_plan,
            is_paid: formData.is_paid,
            price: formData.is_paid ? nutrientNumber(formData.price) : 0.00,
            is_common: formData.is_common,
            diet_plan_gallery: validGallery,
            schedule,
            guidance: (formData.guidance || [])
                .map((item) => (item || '').trim())
                .filter(Boolean),
        };
    };

    // Submit form (Create)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const payload = buildPayload();
            if (!payload.health_diseases.length) {
                toast.error('Please add at least one health disease');
                setLoading(false);
                return;
            }
            await doctorService.adddiet(payload);
            setMessage({ type: 'success', text: 'Diet plan created successfully!' });
            toast.success('Diet plan created successfully!');
            resetForm();
        } catch (error) {
            console.error('Error creating diet plan:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create diet plan' });
        } finally {
            setLoading(false);
        }
    };

    // Update form (Edit)
    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!dietPlanId) {
            setMessage({ type: 'error', text: 'Please provide a diet plan ID to update' });
            return;
        }
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const payload = buildPayload();
            if (!payload.health_diseases.length) {
                toast.error('Please add at least one health disease');
                setLoading(false);
                return;
            }
            const response = await doctorService.updatediet(dietPlanId, payload);
            setMessage({ type: 'success', text: 'Diet plan updated successfully!' });
            toast.success('Diet plan updated successfully!');
            console.log('Response:', response.data);
        } catch (error) {
            console.error('Error updating diet plan:', error);
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update diet plan' });
        } finally {
            setLoading(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: '',
            prakriti: '',
            season: '',
            health_diseases: [],
            is_personalized_plan: true,
            is_paid: false,
            price: '',
            is_common: false,
            diet_plan_gallery: [],
            schedule: initializeSchedule(1),
            guidance: emptyGuidance(),
        });
        setGalleryImages([]);
        setNumberOfDays(1);
        setActiveDay('day_1');
        setIsEditMode(false);
        setDietPlanId('');
        setExpandedMeals(new Set(['day_1-morning']));
    };

    // Load data for edit mode
    const loadEditData = (data) => {
        setIsEditMode(true);
        const schedule = normalizeSchedule(data.schedule);
        setFormData({
            name: data.name || '',
            prakriti: data.prakriti || '',
            season: data.season || '',
            health_diseases: Array.isArray(data.health_diseases) ? data.health_diseases : [],
            is_paid: !!data.is_paid,
            price: data.price ?? '',
            is_common: !!data.is_common,
            diet_plan_gallery: data.diet_plan_gallery || [],
            schedule,
            guidance: normalizeGuidance(data),
        });
        const gallery = data.diet_plan_gallery || [];
        setGalleryImages(gallery.map((img, index) => ({
            ...img,
            id: img.id || `existing_${index}`
        })));
        const days = Object.keys(schedule).length;
        setNumberOfDays(days);
        setActiveDay('day_1');
    };

    // Get cover image
    const getCoverImage = () => {
        return galleryImages.find(img => img.is_cover) || galleryImages[0] || null;
    };

    // UI-only: toggle a meal accordion open/closed
    const toggleMeal = (dayKey, mealType) => {
        const key = `${dayKey}-${mealType}`;
        setExpandedMeals(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    // UI-only: how many diet items have real content, for the meal summary chip
    const filledCount = (arr) => (arr || []).filter((v) => {
        if (typeof v === 'string') return v.trim() !== '';
        return v && String(v.name || '').trim() !== '';
    }).length;

    // Render meal section for a day
    const renderMealSection = (dayKey, mealType) => {
        const mealData = formData.schedule[dayKey]?.[mealType];
        if (!mealData) return null;

        const { label: mealLabel, Icon: MealIcon } = mealMeta[mealType] || { label: mealType, Icon: UtensilsCrossed };
        const isOpen = expandedMeals.has(`${dayKey}-${mealType}`);
        const dietCount = filledCount(mealData.diet);
        return (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <button
                    type="button"
                    onClick={() => toggleMeal(dayKey, mealType)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0D614E]/10 text-[#0D614E]">
                            <MealIcon size={16} />
                        </span>
                        <span className="font-semibold text-gray-800">{mealLabel}</span>
                        {dietCount > 0 && (
                            <span className="text-xs text-gray-400">
                                {dietCount} item{dietCount > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                    <ChevronDown
                        size={18}
                        className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                </button>

                {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-4">
                        {/* Diet Items */}
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
                                Diet Items
                            </label>
                            <div className="space-y-3">
                                {(mealData.diet || []).map((item, idx) => {
                                    const dietItem = normalizeDietItem(item);
                                    return (
                                        <div key={idx} className="rounded-md border border-gray-100 p-2.5 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={dietItem.name}
                                                    onChange={(e) => handleDietItemChange(dayKey, mealType, idx, 'name', e.target.value)}
                                                    placeholder={`Item ${idx + 1}`}
                                                />
                                                {mealData.diet.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeScheduleItem(dayKey, mealType, 'diet', idx)}
                                                        className="shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                        title="Remove item"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                value={dietItem.quantity}
                                                onChange={(e) => handleDietItemChange(dayKey, mealType, idx, 'quantity', e.target.value)}
                                                placeholder="Quantity (e.g. 1 cup)"
                                            />
                                            <input
                                                type="text"
                                                value={dietItem.notes}
                                                onChange={(e) => handleDietItemChange(dayKey, mealType, idx, 'notes', e.target.value)}
                                                placeholder="Notes"
                                            />
                                            <div>
                                                <p className="text-[11px] text-gray-400 mb-1">Recipe links</p>
                                                <div className="space-y-1.5">
                                                    {(dietItem.recipe || ['']).map((url, rIdx) => (
                                                        <div key={rIdx} className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={url}
                                                                onChange={(e) => handleDietRecipeChange(dayKey, mealType, idx, rIdx, e.target.value)}
                                                                placeholder="youtube.abc.com"
                                                            />
                                                            {(dietItem.recipe || []).length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeDietRecipe(dayKey, mealType, idx, rIdx)}
                                                                    className="shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                                    title="Remove recipe link"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => addDietRecipe(dayKey, mealType, idx)}
                                                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[#0D614E] hover:text-[#0A4D3D]"
                                                >
                                                    <Plus size={12} /> Add recipe link
                                                </button>
                                            </div>

                                            {/* <div>
                                                <p className="text-[11px] text-gray-400 mb-1">Meal image</p>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {(dietItem.diet_gallery || []).map((image, index) => (
                                                        <div key={`${image.image_url}-${index}`} className="w-24">
                                                            <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group">
                                                                <img
                                                                    src={image.image_url}
                                                                    alt={image.caption || `Meal ${index + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.target.onerror = null;
                                                                        e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                                                                    }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeMealGalleryImage(dayKey, mealType, idx, index)}
                                                                    className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/55 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    title="Remove image"
                                                                >
                                                                    <X size={9} />
                                                                </button>
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={image.caption || ''}
                                                                onChange={(e) => handleMealGalleryCaption(dayKey, mealType, idx, index, e.target.value)}
                                                                placeholder="Caption"
                                                                className="mt-1"
                                                            />
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        onClick={() => openMealGalleryPicker(dayKey, mealType, idx)}
                                                        disabled={uploadingMealImages}
                                                        className="w-24 aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-[#0D614E] hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                                                    >
                                                        {uploadingMealImages && mealUploadTarget?.dayKey === dayKey && mealUploadTarget?.mealType === mealType && mealUploadTarget?.dietIndex === idx ? (
                                                            <Loader2 className="w-4 h-4 text-[#0D614E] animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Plus className="w-4 h-4 text-gray-400" />
                                                                <span className="text-[9px] font-medium text-gray-600">Upload</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div> */}

                                            <div>
                                                <p className="text-[11px] text-gray-400 mb-1">Preparation steps</p>
                                                <div className="space-y-2">
                                                    {(dietItem.preparation_steps || ['']).map((step, stepIdx) => (
                                                        <div key={stepIdx} className="flex items-center gap-2">
                                                            <span className="shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-semibold flex items-center justify-center">
                                                                {stepIdx + 1}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={step}
                                                                onChange={(e) => handleDietPrepChange(dayKey, mealType, idx, stepIdx, e.target.value)}
                                                                placeholder={`Step ${stepIdx + 1}`}
                                                            />
                                                            {(dietItem.preparation_steps || []).length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeDietPrepStep(dayKey, mealType, idx, stepIdx)}
                                                                    className="shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                                    title="Remove step"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => addDietPrepStep(dayKey, mealType, idx)}
                                                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[#0D614E] hover:text-[#0A4D3D]"
                                                >
                                                    <Plus size={12} /> Add step
                                                </button>
                                            </div>

                                            <div>
                                                <p className="text-[11px] text-gray-400 mb-1">Nutrition</p>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                                                    {['total_calories', 'carbs', 'protein', 'fat'].map((nutrient) => (
                                                        <div key={nutrient}>
                                                            <label className="block text-xs text-gray-500 mb-1 capitalize">
                                                                {nutrient.replace('_', ' ')}
                                                            </label>
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={dietItem.nutrition?.[nutrient]?.value ?? ''}
                                                                    onChange={(e) => handleDietNutritionChange(dayKey, mealType, idx, nutrient, e.target.value)}
                                                                    placeholder="0"
                                                                />
                                                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
                                                                    {dietItem.nutrition?.[nutrient]?.unit}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <button
                                type="button"
                                onClick={() => addScheduleItem(dayKey, mealType, 'diet')}
                                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#0D614E] hover:text-[#0A4D3D]"
                            >
                                <Plus size={14} /> Add item
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const cover = getCoverImage();

    return (
        <div className="max-w-8xl mx-auto p-6 min-h-screen">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div className="mb-4">
                    <h1 className="text-3xl font-bold  text-[#0D614E]  bg-clip-text">
                        {isEditMode ? 'Update Diet Plan' : 'Create New Diet Plan'}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {isEditMode ? 'Editing an existing plan.' : 'Build a day-by-day diet plan for your patients.'}
                    </p>
                </div>

                {/* Mode switch, moved up next to the title */}
                {/* <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                        type="button"
                        onClick={() => setIsEditMode(false)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${!isEditMode ? 'bg-white text-[#0D614E] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Create
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsEditMode(true)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${isEditMode ? 'bg-white text-[#0D614E] shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Pencil size={13} /> Edit
                    </button>
                </div> */}
            </div>

            {/* {isEditMode && (
                <div className="mb-6 flex items-center gap-2">
                    <input
                        type="text"
                        value={dietPlanId}
                        onChange={(e) => setDietPlanId(e.target.value)}
                        placeholder="Enter Diet Plan ID to update"
                        className="w-72 px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D614E] focus:border-transparent"
                    />
                </div>
            )} */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                {/* Message */}
                {message.text && (
                    <div
                        className={`flex items-start gap-2.5 p-3.5 rounded-lg mb-5 border ${message.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-700'
                            }`}
                    >
                        {message.type === 'success' ? (
                            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                        )}
                        <p className="text-sm flex-1">{message.text}</p>
                        <button
                            type="button"
                            onClick={() => setMessage({ type: '', text: '' })}
                            className="shrink-0 text-current opacity-60 hover:opacity-100"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <form onSubmit={isEditMode ? handleUpdate : handleSubmit}>
                    {/* ---------------------------------------------------- */}
                    {/* Gallery Section                                      */}
                    {/* ---------------------------------------------------- */}
                    <div className="pb-6 mb-6 border-b border-gray-100">
                        <SectionHeader
                            title="Diet Plan Images"
                            description="Upload high-quality images. The first image will be your cover image."
                            action={<span className="text-xs text-gray-400 shrink-0">Max 8 images · JPG/PNG up to 5MB</span>}
                        />

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <input
                            ref={mealFileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleMealGalleryUpload}
                            className="hidden"
                        />

                        {/* Cover + tips */}
                        <div className="flex flex-col sm:flex-row gap-5 mb-5">
                            <div className="items-center relative w-1/2 max-h-[450px]  shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                                {cover ? (
                                    <>
                                        <img
                                            src={cover.image_url}
                                            alt="Cover"
                                            className=" object-cover mx-auto min-h-[300px] max-h-[450px] "
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const coverIndex = galleryImages.findIndex(img => img.is_cover);
                                                if (coverIndex !== -1) handleRemoveImage(coverIndex);
                                            }}
                                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/55 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                                            title="Remove cover image"
                                        >
                                            <X size={11} />
                                        </button>
                                        <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 bg-white text-gray-800 text-[9px] font-semibold px-1.5 py-0.5 rounded-full shadow">
                                            <Star size={8} className="text-amber-400 fill-amber-400" />
                                            Cover
                                        </div>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={addGalleryImage}
                                        className="w-full h-full flex flex-col items-center justify-center gap-1 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#0D614E] hover:bg-gray-50 transition-colors"
                                    >
                                        <ImageIcon className="w-6 h-6 text-gray-300" />
                                        <span className="text-[10px] text-gray-400">Add cover</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 space-y-2.5 min-w-0">
                                <div className="rounded-lg bg-blue-50/70 border border-blue-100 px-3 py-2.5">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <Star size={12} className="text-blue-500 fill-blue-500" />
                                        <p className="text-xs font-semibold text-gray-800">Cover Image</p>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-snug">
                                        This image will be displayed as the main image for this diet plan.
                                    </p>
                                </div>

                                <div className="rounded-lg bg-blue-50/70 border border-blue-100 px-3 py-2.5">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <Info size={12} className="text-blue-500" />
                                        <p className="text-[11px] font-semibold tracking-wide text-blue-700">
                                            TIPS FOR BEST RESULTS
                                        </p>
                                    </div>
                                    <ul className="space-y-1">
                                        {[
                                            'Use high resolution images',
                                            'Good lighting and clear background',
                                            'Show the meal clearly',
                                            'Recommended background (100% white)',
                                        ].map((tip) => (
                                            <li key={tip} className="flex items-start gap-1.5 text-xs text-gray-600">
                                                <span className="text-blue-500 mt-0.5">✓</span>
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Gallery grid */}
                        <div>
                            <div className="flex items-baseline gap-2 mb-2.5">
                                <p className="text-sm font-medium text-gray-800">
                                    Diet Gallery
                                    {galleryImages.length > 0 && (
                                        <span className="text-gray-400 font-normal"> ({galleryImages.length}/8)</span>
                                    )}
                                </p>
                                <span className="text-xs text-gray-400">Drag to reorder</span>
                            </div>

                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2.5 max-w-6xl"
                            >
                                {galleryImages.map((image, index) => (
                                    <div key={image.id || index} className="space-y-1">
                                        <div
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, index)}
                                            onDragOver={(e) => handleDragOverItem(e, index, 'diet')}
                                            onDragEnd={handleDragEnd}
                                            className={`relative group aspect-square rounded-lg overflow-hidden border-2 bg-gray-50 cursor-move transition-all ${image.is_cover ? 'border-[#0D614E] ring-2 ring-[#0D614E]/25' : 'border-transparent'
                                                }`}
                                        >
                                            <img
                                                src={image.image_url}
                                                alt={`Gallery ${index + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />

                                            {image.is_cover && (
                                                <div className="absolute top-1 left-1 flex items-center gap-0.5 bg-white text-gray-800 text-[9px] font-semibold px-1.5 py-0.5 rounded-full shadow">
                                                    <Star size={8} className="text-amber-400 fill-amber-400" />
                                                    Cover
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/55 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Remove image"
                                            >
                                                <X size={9} />
                                            </button>

                                            {!image.is_cover && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSetAsCover(index)}
                                                    className="absolute bottom-1 left-1 right-1 flex items-center justify-center gap-0.5 bg-white/90 hover:bg-white text-gray-700 text-[8px] font-medium py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                                >
                                                    <Star size={8} />
                                                    Cover
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            value={image.caption || ''}
                                            onChange={(e) => handleGalleryCaption(index, e.target.value)}
                                            placeholder="Caption"
                                        />
                                    </div>
                                ))}

                                {galleryImages.length < 8 && (
                                    <button
                                        type="button"
                                        onClick={addGalleryImage}
                                        disabled={uploadingImages}
                                        className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-[#0D614E] hover:bg-gray-50 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                                    >
                                        {uploadingImages ? (
                                            <Loader2 className="w-4 h-4 text-[#0D614E] animate-spin" />
                                        ) : (
                                            <>
                                                <Plus className="w-4 h-4 text-gray-400" />
                                                <span className="text-[9px] font-medium text-gray-600">Upload</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {uploadingImages && (
                                <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Uploading images…
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ---------------------------------------------------- */}
                    {/* Basic Information                                    */}
                    {/* ---------------------------------------------------- */}
                    <div className="pb-6 mb-6 border-b border-gray-100">
                        <SectionHeader title="Basic Information" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Plan Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="e.g., Weight Loss Diet Plan"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Prakriti <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="prakriti"
                                    value={formData.prakriti}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Prakriti</option>
                                    <option value="Vata">Vata</option>
                                    <option value="Pitta">Pitta</option>
                                    <option value="Kapha">Kapha</option>
                                    <option value="Vata-Pitta">Vata-Pitta</option>
                                    <option value="Vata-Kapha">Vata-Kapha</option>
                                    <option value="Pitta-Kapha">Pitta-Kapha</option>
                                    <option value="Tridoshic">Tridoshic</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Season <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="season"
                                    value={formData.season}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Season</option>
                                    {(SEASON_OPTIONS.includes(formData.season) || !formData.season
                                        ? SEASON_OPTIONS
                                        : [...SEASON_OPTIONS, formData.season]
                                    ).map((season) => (
                                        <option key={season} value={season}>
                                            {season.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Health Diseases <span className="text-red-500">*</span>
                                </label>
                                <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                                    {(formData.health_diseases || []).map((disease, index) => (
                                        <span
                                            key={disease.id || index}
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
                                    {(!formData.health_diseases || formData.health_diseases.length === 0) && (
                                        <span className="text-xs text-gray-400">No diseases added yet</span>
                                    )}
                                </div>
                                <select
                                    value=""
                                    onChange={handleDiseaseChange}
                                >
                                    <option value="">Add a health disease</option>
                                    {availableDiseases.map((category) => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ---------------------------------------------------- */}
                    {/* Pricing & Settings                                   */}
                    {/* ---------------------------------------------------- */}
                    <div className="pb-6 mb-6 border-b border-gray-100">
                        <SectionHeader title="Pricing & Visibility" />
                        <div className="flex flex-wrap items-center gap-6 mb-4">
                            <Toggle
                                id="is_paid"
                                name="is_paid"
                                checked={formData.is_paid}
                                onChange={handleInputChange}
                                label="Paid Plan"
                            />
                            <Toggle
                                id="is_common"
                                name="is_common"
                                checked={formData.is_common}
                                onChange={handleInputChange}
                                label="Common Plan"
                            />
                            <Toggle
                                id="is_personalized_plan"
                                name="is_personalized_plan"
                                checked={formData.is_personalized_plan}
                                onChange={handleInputChange}
                                label="Personalized Plan"
                            />
                        </div>

                        {formData.is_paid && (
                            <div className="max-w-xs animate-in fade-in">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    placeholder="0.00"
                                />
                            </div>
                        )}
                    </div>

                    {/* ---------------------------------------------------- */}
                    {/* Guidance                                             */}
                    {/* ---------------------------------------------------- */}
                    <div className="pb-6 mb-6 border-b border-gray-100">
                        <SectionHeader
                            title="Guidance"
                            description="Add practical guidance points for patients."
                        />
                        <div className="space-y-2">
                            {(formData.guidance || ['']).map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <span className="shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-[11px] font-semibold flex items-center justify-center">
                                        {idx + 1}
                                    </span>
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => handleGuidanceChange(idx, e.target.value)}
                                        placeholder={`Guidance ${idx + 1}`}
                                    />
                                    {(formData.guidance || []).length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeGuidanceItem(idx)}
                                            className="shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                            title="Remove guidance"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button
                            type="button"
                            onClick={addGuidanceItem}
                            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#0D614E] hover:text-[#0A4D3D]"
                        >
                            <Plus size={14} /> Add guidance
                        </button>
                    </div>

                    {/* ---------------------------------------------------- */}
                    {/* Day-by-day schedule                                  */}
                    {/* ---------------------------------------------------- */}
                    <div className="pb-2">
                        <SectionHeader
                            title="Daily Schedule"
                            description="Add meals and nutrition details for each day of the plan."
                        />

                        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                                {Array.from({ length: numberOfDays }, (_, i) => i + 1).map((dayNum) => {
                                    const dayKey = `day_${dayNum}`;
                                    return (
                                        <button
                                            key={dayKey}
                                            type="button"
                                            onClick={() => setActiveDay(dayKey)}
                                            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${activeDay === dayKey
                                                ? 'bg-[#0D614E] text-white'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            Day {dayNum}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button
                                    type="button"
                                    onClick={addDay}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0D614E] text-white rounded-md hover:bg-[#0A4D3D] text-sm font-medium"
                                >
                                    <Plus size={14} /> Add Day
                                </button>
                                {numberOfDays > 1 && (
                                    <button
                                        type="button"
                                        onClick={removeDay}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-md hover:bg-red-50 text-sm font-medium"
                                    >
                                        <Trash2 size={14} /> Remove Day
                                    </button>
                                )}
                            </div>
                        </div>

                        {activeDay && formData.schedule[activeDay] && (
                            <div className="space-y-2.5">

                                {mealTypes.map((meal) => (
                                    <div key={meal}>{renderMealSection(activeDay, meal)}</div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ---------------------------------------------------- */}
                    {/* Form Actions — sticky within the card                */}
                    {/* ---------------------------------------------------- */}
                    <div className="sticky bottom-0 -mx-6 mt-6 px-6 py-4 bg-white/95 backdrop-blur border-t border-gray-100 flex flex-wrap gap-3">
                        <button
                            type="submit"
                            disabled={loading || uploadingImages || uploadingMealImages}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0D614E] text-white rounded-lg hover:bg-[#0A4D3D] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {loading ? 'Processing…' : isEditMode ? 'Update Plan' : 'Create Plan'}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                        >
                            Reset
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DietPlanManager;