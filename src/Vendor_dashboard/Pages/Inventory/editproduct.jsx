// src/pages/admin/EditProduct.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ChevronLeft,
    Upload,
    X,
    Star,
    Plus,
    AlertCircle,
    Check,
    Trash2,
    Package,
    Layers,
    IndianRupee,
    Edit,
    Save,
} from "lucide-react";
import "./AddProduct.css";
import { vendorService } from "../../../services/vendorService";
import toast from "react-hot-toast";
import UnicommerceNotice from "../../components/shared/UnicommerceNotice";
import DashboardPageShell from "../../components/shared/DashboardPageShell";
import Button from "../../components/shared/Button";
import { PageLoader } from "../../components/shared/PageState";
import {
    extractApiErrorMessage,
    getVariantQuantity,
    isUnicommerceSyncError,
    mapVariantFromApi,
    mapVariantToApiPayload,
    UNICOMMERCE_NOTICES,
} from "../../../utils/unicommerceHelpers";

const roundToTwo = (value) => {
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
    return Math.round((num + Number.EPSILON) * 100) / 100;
};

const formatMoney = (value) =>
    roundToTwo(value).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

export default function EditProduct() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("product");
    const [errors, setErrors] = useState({});
    const [priceType, setPriceType] = useState("TP");
    const [gst, setGst] = useState(18);
    const [varient, setVarient] = useState(false);
    const [platformFee, setPlatformFee] = useState(10);
    const [lists, setlists] = useState({
        productcat: [],
        brand: [],
        maincategory: [],
        diseasescate: [],
    });
    const [selectedServiceCategory, setSelectedServiceCategory] = useState("");

    // Product Information State
    const [name, setName] = useState("");
    const [coverImage, setCoverImage] = useState(null);
    const [galleryImages, setGalleryImages] = useState([]);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [lodervr, setlodervr] = useState(false)

    const [formData, setFormData] = useState({
        product_subcategory_id: "",
        brand_name_id: "",
        manufacturer: "",
        origin: "",
        short_description: "",
        full_description: "",
        how_to_use: "",
        benifits: "",
        treatment_type: "",
        compositions: "",
        side_effects: "",
        dosages: "",
        ayushLicense: "",
        safety_information: "",
        model_number: "",
        is_nutrition: true,
        is_featured: false,
        is_active: true,
    });

    const [originalData, setOriginalData] = useState(null);
    const [healthConcerns, setHealthConcerns] = useState([]);

    // Variants State
    const [variants, setVariants] = useState([]);
    const [editingVariant, setEditingVariant] = useState(null);
    const [showVariantModal, setShowVariantModal] = useState(false);
    const [variantForm, setVariantForm] = useState({
        vendor_sku_code: "",
        title: "",
        mrp: "",
        selling_price: "",
        discount: "",
        cost_per_item: "",
        stock: "",
        low_stock_threshold: "",
        is_free_shipping: false,
        shipping_amount: "",
        is_returnable: false,
        returnable_days: "",
        pay_on_delivery: false,
        galleryImages: [],
        hsn_code: "",
        physical_state: "",
        calculation_mode: "selling_price",
        taxes: [
            { name: "GST", rate: gst },
            { name: "Platform Fee", rate: platformFee }
        ],
        weightage: "g",
        size: "",
        is_default: false,
        prescription_required: false,
        coverImage: null,
        vendor_price: "",
        is_active: true
    });

    useEffect(() => {
        fetchProductData();
        fetchdatabrandcat();
    }, [id]);

    const fetchProductData = async () => {
        try {
            setLoading(true);
            const response = await vendorService.getSingleProduct(id);

            if (response.data.success) {
                const product = response.data.data;
                setName(product.name || "");
                setSelectedServiceCategory((product.service_category_name || "").trim());
                setFormData({
                    product_subcategory_id: product.product_subcategory_id || "",
                    brand_name_id: product.brand_name_id || "",
                    manufacturer: product.manufacturer || "",
                    origin: product.origin || "",
                    short_description: product.short_description || "",
                    full_description: product.full_description || "",
                    how_to_use: product.how_to_use || "",
                    benifits: product.benifits || "",
                    treatment_type: product.treatment_type || "",
                    compositions: product.compositions || "",
                    side_effects: product.side_effects || "",
                    dosages: product.dosages || "",
                    ayushLicense: product.ayushLicense || "",
                    safety_information: product.safety_information || "",
                    model_number: product.model_number || "",
                    is_nutrition: product.is_nutrition || true,
                    is_featured: product.is_featured || false,
                    is_active: product.is_active !== undefined ? product.is_active : true,
                });

                setHealthConcerns(product.health_disease_ids || []);

                const processedVariants = product.variants.map(variant => ({
                    ...variant,
                    galleryImages: variant.media?.map(media => ({
                        id: media.id,
                        media_url: media.media_url,
                        media_type: media.media_type,
                        is_cover: media.is_cover,
                        preview: media.media_url,
                        file: null
                    })) || [],
                    coverImage: variant.cover_image ? {
                        id: variant.cover_image.id,
                        media_url: variant.cover_image.media_url,
                        preview: variant.cover_image.media_url,
                        file: null
                    } : (variant.media?.find(m => m.is_cover) ? {
                        id: variant.media.find(m => m.is_cover).id,
                        media_url: variant.media.find(m => m.is_cover).media_url,
                        preview: variant.media.find(m => m.is_cover).media_url,
                        file: null
                    } : null),
                    vendor_price:
                        variant.vendor_price !== undefined &&
                        variant.vendor_price !== null &&
                        variant.vendor_price !== ""
                            ? variant.vendor_price
                            : calculateVendorPrice(variant),
                })
                );

                setVariants(processedVariants);
                setOriginalData({
                    product: {
                        name: product.name || "",
                        health_disease_ids: product.health_disease_ids || "",
                        product_subcategory_id: product.product_subcategory_id || "",
                        brand_name_id: product.brand_name_id || "",
                        manufacturer: product.manufacturer || "",
                        origin: product.origin || "",
                        short_description: product.short_description || "",
                        full_description: product.full_description || "",
                        how_to_use: product.how_to_use || "",
                        benifits: product.benifits || "",
                        treatment_type: product.treatment_type || "",
                        compositions: product.compositions || "",
                        side_effects: product.side_effects || "",
                        dosages: product.dosages || "",
                        ayushLicense: product.ayushLicense || "",
                        safety_information: product.safety_information || "",
                        model_number: product.model_number || "",
                        is_nutrition: product.is_nutrition || true,
                        is_featured: product.is_featured || false,
                        is_active: product.is_active !== undefined ? product.is_active : true,
                    },
                    variants: processedVariants
                });

                if (processedVariants.length > 0) {
                    const firstVariant = processedVariants[0];
                    setPriceType(firstVariant.calculation_mode === "trade_price" ? "TP" : "SP");
                }
            } else {
                toast.error("Failed to load product data");
            }
        } catch (error) {
            toast.error(error.message || "Failed to load product data");
        } finally {
            setLoading(false);
        }
    };

    const getFeeBreakdown = (basePrice) => {
        const price = Number(basePrice) || 0;
        const platformFeeAmount = roundToTwo((price * platformFee) / 100);
        const gstOnFee = roundToTwo((platformFeeAmount * gst) / 100);
        return { platformFeeAmount, gstOnFee };
    };

    const calculatePricesFromInput = (enteredPrice, mode = priceType) => {
        const { platformFeeAmount, gstOnFee } = getFeeBreakdown(enteredPrice);
        if (mode === "TP") {
            return {
                vendor_price: roundToTwo(enteredPrice),
                selling_price: roundToTwo(Number(enteredPrice) + platformFeeAmount + gstOnFee),
                platformFeeAmount,
                gstOnFee,
            };
        }
        return {
            vendor_price: roundToTwo(Number(enteredPrice) - platformFeeAmount - gstOnFee),
            selling_price: roundToTwo(enteredPrice),
            platformFeeAmount,
            gstOnFee,
        };
    };

    const calculateVendorPrice = (variant) => {
        const sellingPrice = parseFloat(variant.selling_price);
        if (!Number.isFinite(sellingPrice)) return 0;
        if (variant.calculation_mode === "trade_price") {
            return roundToTwo(sellingPrice);
        }
        return calculatePricesFromInput(sellingPrice, "SP").vendor_price;
    };

    const fetchdatabrandcat = async () => {
        try {
            const [brand, productcat, diseasescat] = await Promise.all([
                vendorService.getbrandandcategory("brand-name"),
                vendorService.getbrandandcategory("product-subcategory"),
                vendorService.getbrandandcategory("health-diseases"),
            ]);

            const brandData = brand?.data?.data || brand?.data || [];
            const catData = productcat?.data?.data || productcat?.data || [];
            const diseasescate = diseasescat?.data?.data || diseasescat?.data || [];

            setlists(prev => ({
                ...prev,
                brand: brandData,
                productcat: catData,
                diseasescate,
            }));
        } catch (error) {
            toast.error(error?.message || "Failed to fetch data");
        }
    };

    const getServiceCategoryName = (item) => (item?.service_category_name || "").trim();

    const serviceCategories = Array.from(
        new Map(
            (lists.productcat || [])
                .filter((item) => getServiceCategoryName(item))
                .map((item) => {
                    const name = getServiceCategoryName(item);
                    return [name.toLowerCase(), name];
                })
        ).values()
    );

    const filteredSubcategories = selectedServiceCategory
        ? (lists.productcat || []).filter(
            (item) =>
                getServiceCategoryName(item).toLowerCase() ===
                selectedServiceCategory.toLowerCase()
        )
        : [];

    useEffect(() => {
        if (!formData.product_subcategory_id || !lists.productcat?.length) {
            return;
        }
        const match = (lists.productcat || []).find(
            (item) => String(item?.id) === String(formData.product_subcategory_id)
        );
        const name = getServiceCategoryName(match);
        if (name && name.toLowerCase() !== selectedServiceCategory.toLowerCase()) {
            setSelectedServiceCategory(name);
        }
    }, [lists.productcat, formData.product_subcategory_id, selectedServiceCategory]);

    const handleServiceCategorySelect = (category) => {
        if (selectedServiceCategory.toLowerCase() === category.toLowerCase()) return;

        setSelectedServiceCategory(category);
        const stillValid = (lists.productcat || []).some(
            (item) =>
                String(item?.id) === String(formData.product_subcategory_id) &&
                getServiceCategoryName(item).toLowerCase() === category.toLowerCase()
        );

        if (!stillValid) {
            setFormData((prev) => ({ ...prev, product_subcategory_id: "" }));
        }
        if (errors.product_subcategory_id) {
            setErrors((prev) => ({ ...prev, product_subcategory_id: "" }));
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const handleGalleryUpload = async (e, type) => {
        const files = Array.from(e.target.files);
        const validFiles = files.filter(file => {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} is larger than 5MB`);
                return false;
            }
            if (!file.type.match(/image\/(jpeg|png|jpg)/)) {
                toast.error(`${file.name} is not a valid image format`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        const currentGallery = type === "variant" ? variantForm.galleryImages : galleryImages;
        if (currentGallery.length + validFiles.length > 8) {
            toast.error("Maximum 8 images allowed");
            return;
        }

        const uploadedImages = await Promise.all(
            validFiles.map(async (file, index) => {
                try {
                    const imageupload = await vendorService.uploadfiles(file, "variants_images");
                    const imageUrl = imageupload?.data?.data?.url;

                    if (!imageUrl) {
                        throw new Error("Failed to upload image");
                    }

                    return {
                        id: Date.now() + Math.random() + index,
                        file: file,
                        preview: URL.createObjectURL(file),
                        name: file.name,
                        media_url: imageUrl,
                        media_type: "image",
                        is_cover: false,
                        is_new: true
                    };
                } catch (error) {
                    toast.error(`Failed to upload ${file.name}`);
                    return null;
                }
            })
        );

        const successfulUploads = uploadedImages.filter(img => img !== null);

        if (successfulUploads.length === 0) {
            toast.error("Failed to upload images");
            return;
        }

        if (type === "variant") {
            if (!variantForm.coverImage && successfulUploads.length > 0) {
                successfulUploads[0].is_cover = true;
                setVariantForm(prev => ({
                    ...prev,
                    galleryImages: [...prev.galleryImages, ...successfulUploads],
                    coverImage: {
                        file: successfulUploads[0].file,
                        preview: successfulUploads[0].preview,
                        name: successfulUploads[0].name,
                        media_url: successfulUploads[0].media_url
                    }
                }));
            } else {
                setVariantForm(prev => ({
                    ...prev,
                    galleryImages: [...prev.galleryImages, ...successfulUploads]
                }));
            }
        }
    };

    const handleSetAsCover = (id, type) => {
        if (type === "variant") {
            const selectedImage = variantForm.galleryImages.find(img => img.id === id);
            if (selectedImage) {
                setVariantForm(prev => ({
                    ...prev,
                    coverImage: {
                        file: selectedImage.file,
                        preview: selectedImage.preview,
                        name: selectedImage.name,
                        media_url: selectedImage.media_url
                    },
                    galleryImages: prev.galleryImages.map(img => ({
                        ...img,
                        is_cover: img.id === id
                    }))
                }));
                toast.success("Cover image updated");
            }
        }
    };

    const handleRemoveImage = (id, type) => {
        const imageToRemove = type === "variant"
            ? variantForm.galleryImages.find(img => img.id === id)
            : galleryImages.find(img => img.id === id);

        if (imageToRemove?.preview && imageToRemove.preview.startsWith('blob:')) {
            URL.revokeObjectURL(imageToRemove.preview);
        }

        if (type === "variant") {
            const updatedGallery = variantForm.galleryImages.filter(img => img.id !== id);

            if (variantForm.coverImage?.id === id && updatedGallery.length > 0) {
                const newCover = updatedGallery[0];
                newCover.is_cover = true;
                setVariantForm(prev => ({
                    ...prev,
                    galleryImages: updatedGallery,
                    coverImage: {
                        file: newCover.file,
                        preview: newCover.preview,
                        name: newCover.name,
                        media_url: newCover.media_url,
                        id: newCover.id
                    }
                }));
                // toast.info("New cover image set");
            } else {
                setVariantForm(prev => ({
                    ...prev,
                    galleryImages: updatedGallery
                }));
            }
            toast.success("Image removed");
        }
    };

    const handleRemoveCoverImage = (type) => {
        if (type === "variant") {
            if (variantForm.coverImage?.preview && variantForm.coverImage.preview.startsWith('blob:')) {
                URL.revokeObjectURL(variantForm.coverImage.preview);
            }
            setVariantForm(prev => ({ ...prev, coverImage: null }));
            // toast.info("Cover image removed");
        }
    };

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, index, type) => {
        e.preventDefault();
        if (draggedIndex === null) return;
        if (draggedIndex !== index) {
            const newImages = type === "variant" ? [...variantForm.galleryImages] : [...galleryImages];
            const draggedItem = newImages[draggedIndex];
            newImages.splice(draggedIndex, 1);
            newImages.splice(index, 0, draggedItem);
            if (type === "variant") {
                setVariantForm(prev => ({ ...prev, galleryImages: newImages }));
            }
            setDraggedIndex(index);
        }
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleHealthConcernToggle = (id) => {
        let data = healthConcerns.filter(opt => opt == id);
        if (data.length != 0) {
            setHealthConcerns(healthConcerns.filter(opt => opt != id));
        } else {
            setHealthConcerns([...healthConcerns, id]);
        }
    };

    const handleVariantInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setVariantForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const generateSKU = () => {
        const prefix = name.substring(0, 3).toUpperCase() || "PRD";
        const random = Math.floor(Math.random() * 10000);
        const timestamp = Date.now().toString().slice(-4);
        return `${prefix}-${random}${timestamp}`;
    };

    const validateVariantForm = () => {
        if (!variantForm.coverImage) {
            toast.error("Cover image is required");
            return false;
        }
        if (!variantForm.galleryImages || variantForm.galleryImages.length < 3) {
            toast.error("Minimum 3 gallery images are required");
            return false;
        }
        if (!variantForm.title) {
            toast.error("Title is required");
            return false;
        }
        if (!variantForm.selling_price) {
            toast.error("Selling price is required");
            return false;
        }
        if (!variantForm.mrp) {
            toast.error("MRP is required");
            return false;
        }
        if (!variantForm.size) {
            toast.error("Size is required");
            return false;
        }
        if (!variantForm.physical_state) {
            toast.error("Product type is required");
            return false;
        }
        if (variantForm.mrp && variantForm.selling_price) {
            const finalSellingPrice = calculatePricesFromInput(variantForm.selling_price, priceType).selling_price;
            if (Number(variantForm.mrp) < finalSellingPrice) {
                toast.error("MRP must be greater than or equal to selling price");
                return false;
            }
        }
        return true;
    };

    const addVariant = async () => {
        if (!validateVariantForm()) return;
        setVarient(true);
        try {
            const mediaurls = variantForm.galleryImages.map((item) => ({
                media_url: item.media_url,
                media_type: "image",
                is_cover: item.is_cover || (variantForm.coverImage?.id === item.id)
            }));

            const enteredPrice = Number(variantForm.selling_price);
            const newMode = priceType === "TP" ? "trade_price" : "selling_price";
            const computed = calculatePricesFromInput(enteredPrice, priceType);
            const originalMode = editingVariant?.calculation_mode || newMode;
            const originalEntered = originalMode === "trade_price"
                ? Number(editingVariant?.vendor_price)
                : Number(editingVariant?.selling_price);
            const amountUnchanged = Boolean(
                editingVariant &&
                originalMode === newMode &&
                roundToTwo(originalEntered) === roundToTwo(enteredPrice)
            );

            const mrp = Number(variantForm.mrp) || 0;
            const sellingPrice = Number(variantForm.selling_price) || 0;
            const discount = mrp > 0 && sellingPrice < mrp ? Math.round(((mrp - sellingPrice) / mrp) * 100) : 0;

            const newVariant = {
                id: editingVariant ? editingVariant.id : Date.now(),
                vendor_sku_code: variantForm.vendor_sku_code || generateSKU(),
                title: variantForm.title,
                mrp: roundToTwo(variantForm.mrp),
                discount: discount || "",
                cost_per_item: variantForm.cost_per_item ? roundToTwo(variantForm.cost_per_item) : "",
                stock: parseInt(variantForm.stock),
                low_stock_threshold: variantForm.low_stock_threshold || "",
                is_free_shipping: variantForm.is_free_shipping || false,
                shipping_amount: variantForm.shipping_amount || "",
                is_returnable: variantForm.is_returnable,
                returnable_days: variantForm.is_returnable ? variantForm.returnable_days : null,
                pay_on_delivery: variantForm.pay_on_delivery,
                media: mediaurls,
                galleryImages: variantForm.galleryImages,
                hsn_code: variantForm.hsn_code,
                calculation_mode: newMode,
                taxes: [
                    { name: "GST", rate: gst },
                    { name: "Platform Fee", rate: platformFee }
                ],
                physical_state: variantForm.physical_state,
                weightage: variantForm.weightage,
                size: variantForm.size,
                is_default: editingVariant ? variantForm.is_default : (variants.length === 0),
                prescription_required: variantForm.prescription_required,
                coverImage: variantForm.coverImage,
                is_active: true,
                vendor_price: amountUnchanged ? editingVariant.vendor_price : computed.vendor_price,
                selling_price: amountUnchanged ? editingVariant.selling_price : computed.selling_price,
            };

            if (editingVariant) {
                setlodervr(true)
                const originalVariant = originalData.variants.find(
                    (data) => data.id === newVariant.id
                );

                const onlyupdate = originalVariant
                    ? getUpdatedFields(newVariant, originalVariant)
                    : newVariant;

                const response = await vendorService?.updateVariants(
                    id,
                    editingVariant.id,
                    mapVariantToApiPayload({
                        ...onlyupdate,
                        approval_status: "pending" || editingVariant.approval_status,
                    })
                )
                if (response.data.success) {
                    setVariants(variants.map(v => v.id === editingVariant.id ? newVariant : v));
                    toast.success("Variant updated successfully");
                    setlodervr(false)
                }
            } else {
                setlodervr(true)
                const response = await vendorService?.addVariants(
                    id,
                    mapVariantToApiPayload({ ...newVariant, approval_status: "pending" })
                )
                if (response.data.success) {
                    toast.success("Variant added successfully");
                    setlodervr(false)
                    setVariants((prevVariants) => [
                        ...prevVariants,
                        {
                            ...newVariant,
                            id: response.data?.data?.id,
                        },
                    ]);
                }
            }

            resetVariantForm();
            setShowVariantModal(false);
        } catch (error) {
            console.log(error);
            toast.error("Failed to save variant");
            setlodervr(false)
        } finally {
            setVarient(false);
        }
    };

    const resetVariantForm = () => {
        if (variantForm.galleryImages) {
            variantForm.galleryImages.forEach(img => {
                if (img.preview && img.preview.startsWith('blob:')) {
                    URL.revokeObjectURL(img.preview);
                }
            });
        }
        if (variantForm.coverImage?.preview && variantForm.coverImage.preview.startsWith('blob:')) {
            URL.revokeObjectURL(variantForm.coverImage.preview);
        }

        setVariantForm({
            vendor_sku_code: "",
            title: "",
            mrp: "",
            selling_price: "",
            discount: "",
            cost_per_item: "",
            stock: "",
            low_stock_threshold: "",
            is_free_shipping: false,
            shipping_amount: "",
            is_returnable: false,
            returnable_days: "",
            pay_on_delivery: false,
            galleryImages: [],
            hsn_code: "",
            physical_state: "",
            calculation_mode: priceType == "TP" ? "trade_price" : "selling_price",
            taxes: [
                { name: "GST", rate: gst },
                { name: "Platform Fee", rate: platformFee }
            ],
            weightage: "g",
            size: "",
            is_default: false,
            prescription_required: false,
            coverImage: null,
        });
        setErrors({});
    };

    const editVariant = (variant) => {
        setEditingVariant(variant);

        const restoredGallery = variant.galleryImages?.map(img => ({
            ...img,
            preview: img.media_url,
            file: null,
        })) || [];

        const isTradePrice = variant.calculation_mode === "trade_price";
        const enteredPrice = isTradePrice
            ? (variant.vendor_price ?? variant.selling_price)
            : (variant.selling_price ?? variant.vendor_price);

        setVariantForm({
            vendor_sku_code: variant.vendor_sku_code,
            title: variant.title,
            mrp: variant.mrp,
            selling_price: enteredPrice !== undefined && enteredPrice !== null && enteredPrice !== ""
                ? roundToTwo(enteredPrice)
                : "",
            discount: variant.discount || "",
            cost_per_item: variant.cost_per_item || "",
            stock: variant.stock,
            low_stock_threshold: variant.low_stock_threshold || "",
            is_free_shipping: variant.is_free_shipping || false,
            shipping_amount: variant.shipping_amount || "",
            is_returnable: variant.is_returnable,
            returnable_days: variant.returnable_days || "",
            pay_on_delivery: variant.pay_on_delivery,
            galleryImages: restoredGallery,
            hsn_code: variant.hsn_code,
            physical_state: variant.physical_state,
            weightage: variant.weightage,
            size: variant.size,
            is_default: variant.is_default,
            prescription_required: variant.prescription_required,
            coverImage: variant.coverImage || (restoredGallery.find(img => img.is_cover) || restoredGallery[0]),
            calculation_mode: variant.calculation_mode || (priceType == "TP" ? "trade_price" : "selling_price"),
            vendor_price:
                variant.vendor_price !== undefined &&
                variant.vendor_price !== null &&
                variant.vendor_price !== ""
                    ? variant.vendor_price
                    : calculateVendorPrice(variant),
            taxes: variant.taxes || [
                { name: "GST", rate: gst },
                { name: "Platform Fee", rate: platformFee }
            ],
        });

        setPriceType(variant.calculation_mode === "trade_price" ? "TP" : "SP");
        setShowVariantModal(true);
    };

    const deleteVariant = async (vid) => {
        if (window.confirm("Are you sure you want to delete this variant?")) {
            const updatedVariants = variants.filter(v => v.id !== vid);
            const response = await vendorService.deleteVariants(id, vid);
            if (response.data.success) {
                if (updatedVariants.length > 0 && !updatedVariants.some(v => v.is_default)) {
                    updatedVariants[0].is_default = true;
                }
                setVariants(updatedVariants);
                toast.success("Variant deleted successfully");
            }
        }
    };

    const setDefaultVariant = (id) => {
        setVariants(variants.map(v => ({ ...v, is_default: v.id === id })));
        toast.success("Default variant updated");
    };

    const validateProductInfo = () => {
        if (!name.trim()) {
            toast.error("Product name is required");
            return false;
        }
        if (!selectedServiceCategory) {
            toast.error("Please select Product or Medicine");
            return false;
        }
        if (!formData.product_subcategory_id) {
            toast.error("Category is required");
            return false;
        }
        if (!formData.brand_name_id) {
            toast.error("Brand name is required");
            return false;
        }
        if (!formData.manufacturer) {
            toast.error("Manufacturer is required");
            return false;
        }
        if (!formData.full_description) {
            toast.error("Full description is required");
            return false;
        }
        return true;
    };

    const handleNextTab = () => {
        if (validateProductInfo()) {
            setActiveTab("variant");
        }
    };

    const handlePrevTab = () => {
        setActiveTab("product");
    };

    const EXCLUDED_KEYS = [
        "sku_code",
        "status",
        "approval_status",
        "approved_at",
        "created_at",
        "updated_at",
        "reason",
        "cover_image",
        "coverImage",
        "stock",
        "low_stock_threshold",
    ];

    const getUpdatedFields = (current, original) => {
        const result = {};
        Object.keys(current).forEach((key) => {
            if (EXCLUDED_KEYS.includes(key)) return;
            const value = current[key];
            const oldValue = original?.[key];

            if (
                value === "" ||
                value === null ||
                value === undefined ||
                (Array.isArray(value) && value.length === 0)
            ) {
                return;
            }

            if (
                typeof value === "object" &&
                value !== null
            ) {
                if (JSON.stringify(value) !== JSON.stringify(oldValue)) {
                    result[key] = value;
                }
                return;
            }

            const bothNumeric =
                typeof value !== "boolean" &&
                typeof oldValue !== "boolean" &&
                value !== "" &&
                oldValue !== "" &&
                oldValue !== null &&
                oldValue !== undefined &&
                Number.isFinite(Number(value)) &&
                Number.isFinite(Number(oldValue));

            if (bothNumeric && roundToTwo(value) === roundToTwo(oldValue)) {
                return;
            }

            if (value !== oldValue) {
                result[key] = value;
            }
        });

        return result;
    };

    const handleSubmit = async (type) => {
        if (!validateProductInfo()) return;

        if (variants.length === 0) {
            toast.error("At least one variant is required");
            return;
        }

        const productData = {
            product: getUpdatedFields({
                name,
                ...formData,
                health_disease_ids: healthConcerns,
            }, originalData.product),
            variants: variants
                .map((variant, index) => {
                    const updated = getUpdatedFields(
                        variant,
                        originalData.variants[index]
                    );
                    if (variant.id) {
                        updated.id = variant.id;
                    }
                    return Object.keys(updated).length > 1 ? updated : null;
                })
                .filter(Boolean),
        };

        try {
            const response = await vendorService.updateProduct(id, (type === "product" ? productData.product : productData?.variants));
            if (response.data.success) {
                toast.success(response.data.message || "Product updated successfully");
                setTimeout(() => {
                    window.location.reload()
                }, 1000);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update product. Please try again.");
        }
    };

    const handleCancel = () => {
        if (window.confirm("Are you sure you want to cancel? All unsaved changes will be lost.")) {
            navigate("/vendor/products");
        }
    };

    const totalStock = variants.reduce((sum, v) => sum + getVariantQuantity(v), 0);
    const hasApprovedVariant = variants.some((v) => v.approval_status === "approved");
    const priceRange = variants.length > 0 ? {
        min: Math.min(...variants.map(v => v.selling_price)),
        max: Math.max(...variants.map(v => v.selling_price))
    } : null;

    if (loading) {
        return (
            <DashboardPageShell
                title="Edit"
                accent="Product"
                subtitle="Loading product details..."
                breadcrumbs={[{ label: "Dashboard" }, { label: "Products" }, { label: "Edit" }]}
            >
                <PageLoader message="Loading product data..." />
            </DashboardPageShell>
        );
    }

    return (
        <DashboardPageShell
            title="Edit"
            accent="Product"
            subtitle="Update your product information, variants, and inventory details."
            breadcrumbs={[{ label: "Dashboard" }, { label: "Products" }, { label: "Edit Product" }]}
            actions={
                <Button variant="secondary" onClick={handleCancel}>
                    <ChevronLeft size={16} className="mr-1" aria-hidden />
                    Back
                </Button>
            }
            contentClassName="p-4 sm:p-6 lg:p-8 max-w-8xl"
        >

            <UnicommerceNotice>
                {hasApprovedVariant
                    ? UNICOMMERCE_NOTICES.approvedStock
                    : UNICOMMERCE_NOTICES.pendingVariant}{" "}
                {UNICOMMERCE_NOTICES.systemSku}
            </UnicommerceNotice>

            <div className="product-tabs">
                <button
                    className={`tab-btn ${activeTab === "product" ? "active" : ""}`}
                    onClick={() => setActiveTab("product")}
                >
                    <Package size={18} />
                    Product Information
                </button>
                <button
                    className={`tab-btn ${activeTab === "variant" ? "active" : ""}`}
                    onClick={() => {
                        if (activeTab === "product") {
                            if (!validateProductInfo()) return;
                            setActiveTab("variant");
                            return;
                        }
                    }}
                >
                    <Layers size={18} />
                    Product Variants
                    {variants.length === 0 ? (
                        <span className="tab-warning">⚠️ Required</span>
                    ) : (
                        <span className="tab-success">✓ {variants.length}</span>
                    )}
                </button>
            </div>

            <div className="form-container">
                {activeTab === "product" ? (
                    <>
                        <div className="form-section">
                            <div className="product-details-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>PRODUCT NAME <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Enter product name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Item Type <span className="required">*</span></label>
                                        <div className="service-category-pills">
                                            {serviceCategories.length === 0 ? (
                                                <span className="field-note">No types available</span>
                                            ) : (
                                                serviceCategories.map((category) => (
                                                    <button
                                                        type="button"
                                                        key={category}
                                                        className={`service-category-pill ${selectedServiceCategory.toLowerCase() === category.toLowerCase()
                                                                ? "active"
                                                                : ""
                                                            }`}
                                                        onClick={() => handleServiceCategorySelect(category)}
                                                    >
                                                        {category}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>CATEGORY <span className="required">*</span></label>
                                        <select
                                            name="product_subcategory_id"
                                            value={formData.product_subcategory_id}
                                            onChange={handleInputChange}
                                            className={errors.product_subcategory_id ? "error" : ""}
                                            disabled={!selectedServiceCategory}
                                        >
                                            <option value="">
                                                {selectedServiceCategory ? "Select Category" : "Select type first"}
                                            </option>
                                            {filteredSubcategories.map((data) => (
                                                <option key={data?.id} value={data?.id}>{data?.name}</option>
                                            ))}
                                        </select>
                                        {errors.product_subcategory_id && <span className="error-text">{errors.product_subcategory_id}</span>}
                                    </div>
                                    <div className="form-group">
                                        <label>BRAND NAME <span className="required">*</span></label>
                                        <select
                                            name="brand_name_id"
                                            value={formData.brand_name_id}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Select Brand</option>
                                            {lists?.brand?.map((data) => (
                                                <option key={data?.id} value={data?.id}>{data?.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>MANUFACTURER <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            name="manufacturer"
                                            placeholder="Enter manufacturer name"
                                            value={formData.manufacturer}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>ORIGIN</label>
                                        <input
                                            type="text"
                                            name="origin"
                                            placeholder="Enter origin country"
                                            value={formData.origin}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Short Description</label>
                                    <textarea
                                        name="short_description"
                                        placeholder="Brief description of the product"
                                        value={formData.short_description}
                                        onChange={handleInputChange}
                                        rows="3"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>FULL DESCRIPTION <span className="required">*</span></label>
                                    <textarea
                                        name="full_description"
                                        placeholder="Detailed product description"
                                        value={formData.full_description}
                                        onChange={handleInputChange}
                                        rows="6"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Benefits</label>
                                    <textarea
                                        name="benifits"
                                        placeholder="Key benefits"
                                        value={formData.benifits}
                                        onChange={handleInputChange}
                                        rows="4"
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>HOW TO USE</label>
                                        <input
                                            type="text"
                                            name="how_to_use"
                                            placeholder="Instructions for usage"
                                            value={formData.how_to_use}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Safety information</label>
                                        <input
                                            type="text"
                                            name="safety_information"
                                            placeholder="Safety precautions"
                                            value={formData.safety_information}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Compositions (Comma Separated)</label>
                                        <input
                                            type="text"
                                            name="compositions"
                                            placeholder="e.g., Ginger, Turmeric, Ashwagandha"
                                            value={formData.compositions}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Side effects</label>
                                        <input
                                            type="text"
                                            name="side_effects"
                                            placeholder="Possible side effects"
                                            value={formData.side_effects}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="health-section">
                                <h3>Health Disease [Multi-select]</h3>
                                <div className="health-tags !block">
                                    <div className="md:col-span-2">
                                        <div className="flex flex-wrap gap-2 mb-2">
                                            {healthConcerns?.map((item, idx) => {
                                                const selectedOption = lists?.diseasescate?.find(opt => opt.id === item);
                                                return (
                                                    <span
                                                        key={idx}
                                                        className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm"
                                                    >
                                                        <span>{selectedOption?.name}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleHealthConcernToggle(item)}
                                                            className="hover:text-emerald-900"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    handleHealthConcernToggle(e.target.value);
                                                    e.target.value = '';
                                                }
                                            }}
                                            className="auth-card__input w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D614E]"
                                        >
                                            <option value="">Select Diseases</option>
                                            {lists?.diseasescate?.filter(opt => !healthConcerns.includes(opt.id)).map(opt => (
                                                <option key={opt.id} value={opt.id}>{opt.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="variants-section">
                        <div className="variants-header">
                            <div>
                                <h3>Product Variants</h3>
                                <p>Add different variations of your product (size, weight, etc.)</p>
                            </div>
                            <button className="add-variant-btn" onClick={() => {
                                resetVariantForm();
                                setEditingVariant(null);
                                setShowVariantModal(true);
                            }}>
                                <Plus size={18} />
                                Add Variant
                            </button>
                        </div>

                        {variants.length > 0 && (
                            <div className="variants-summary">
                                <div className="summary-card">
                                    <Package size={20} />
                                    <div>
                                        <strong>Total Variants</strong>
                                        <p>{variants.length}</p>
                                    </div>
                                </div>
                                <div className="summary-card">
                                    <IndianRupee size={20} />
                                    <div>
                                        <strong>Price Range</strong>
                                        <p>₹{formatMoney(priceRange?.min)} - ₹{formatMoney(priceRange?.max)}</p>
                                    </div>
                                </div>
                                <div className="summary-card">
                                    <Package size={20} />
                                    <div>
                                        <strong>Total stock</strong>
                                        <p>{totalStock} units</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {variants.length === 0 ? (
                            <div className="empty-variants">
                                <Package size={48} />
                                <h4>No Variants Added</h4>
                                <p>Click the "Add Variant" button to add your first product variant.</p>
                            </div>
                        ) : (
                            <div className="variants-table-container">
                                <div className="variants-table">
                                    <div className="variants-table-header">
                                        <div className="col-variant">Variant</div>
                                        <div className="col-mrp">MRP</div>
                                        <div className="col-price">Selling Price</div>
                                        <div className="col-price">Receive Amount</div>
                                        <div className="col-stock">Stock</div>
                                        <div className="col-sku">Vendor SKU</div>
                                        {/* <div className="col-sku">System SKU</div> */}
                                        <div className="col-default">Default</div>
                                        <div className="col-actions">Actions</div>
                                    </div>
                                    {variants.map((variant) => (
                                        <div key={variant.id} className="variants-table-row">
                                            <div className="col-variant">
                                                <img
                                                    src={variant.coverImage?.media_url || variant.coverImage?.preview || "https://via.placeholder.com/50"}
                                                    alt={variant.title || "Varient Image"}
                                                // onError={(e) => e.target.src = "https://via.placeholder.com/50"}
                                                />
                                                <div>
                                                    <strong>{variant.title}</strong>
                                                    <p>Size: {variant.size}{variant.weightage}</p>
                                                </div>
                                            </div>
                                            <div className="col-mrp">₹{formatMoney(variant.mrp)}</div>
                                            <div className="col-price">₹{formatMoney(variant.selling_price)}</div>
                                            <div className="col-price">₹{variant.vendor_price !== undefined && variant.vendor_price !== null && variant.vendor_price !== "" ? formatMoney(variant.vendor_price) : "N/A"}</div>
                                            <div className="col-stock">
                                                <span className={`stock-badge ${getVariantQuantity(variant) <= (variant.low_stock_threshold || 5) ? 'low-stock' : ''}`}>
                                                    {getVariantQuantity(variant)} in stock
                                                </span>
                                                {variant.approval_status !== "approved" && (
                                                    <span className="block text-xs text-amber-700 mt-1">Pending approval</span>
                                                )}
                                            </div>
                                            <div className="col-sku">{variant?.vendor_sku_code || "—"}</div>
                                            {/* <div className="col-sku">
                                                <code className="text-xs">{variant?.sku_code || "Assigned after approval"}</code>
                                            </div> */}
                                            <div className="col-default">
                                                <button
                                                    className={`default-checkbox ${variant.is_default ? "active" : ""}`}
                                                    onClick={() => setDefaultVariant(variant.id)}
                                                >
                                                    {variant.is_default && <Check size={14} />}
                                                </button>
                                            </div>
                                            <div className="col-actions">
                                                <button onClick={() => editVariant(variant)} title="Edit">
                                                    <Edit size={16} />
                                                </button>
                                                <button onClick={() => deleteVariant(variant.id)} title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="form-actions">
                    <button className="btn-cancel" onClick={handleCancel}>
                        Cancel
                    </button>
                    {activeTab === "product" ? (
                        <>
                            <button className="btn-next" onClick={handleNextTab}>
                                Next: Add Variants →
                            </button>
                            <button disabled={Object.keys(getUpdatedFields({
                                name,
                                ...formData,
                                health_disease_ids: healthConcerns,
                            }, originalData.product)).length === 0} className="btn-submit flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-800 disabled:border-gray-300 disabled:shadow-none disabled:hover:scale-100" onClick={e => handleSubmit("product")}>
                                <Save size={16} /> Update Product
                            </button>
                        </>
                    ) : (
                        <div className="action-buttons">
                            <button className="btn-prev" onClick={handlePrevTab}>
                                ← Back to Product Info
                            </button>
                            {
                                activeTab === "product" &&
                                <button className="btn-submit flex items-center gap-2" onClick={e => handleSubmit("variants")}>
                                    <Save size={16} /> Update Variants
                                </button>
                            }
                        </div>
                    )}
                </div>
            </div>

            {/* Variant Modal */}
            {
                showVariantModal && (
                    <div className="modal-overlay" onClick={() => setShowVariantModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{editingVariant ? "Edit Variant" : "Add New Variant"}</h3>
                                <button className="modal-close" onClick={() => setShowVariantModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <div className="images-section">
                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <h4>Variant Images</h4>
                                            <p className="section-desc">Upload high-quality images of your Variant. The first image will be your cover image.</p>
                                        </div>
                                        <div className="image-requirements">
                                            <span>Max 8 images | JPG, PNG up to 5MB</span>
                                        </div>
                                    </div>

                                    <div className="image-grid !mb-0">
                                        <div className="cover-image-section">
                                            <div className="cover-image-area variant-cover-area">
                                                <div>
                                                    {!variantForm?.coverImage ? (
                                                        <label className="upload-cover-area">
                                                            <Upload size={32} />
                                                            <span>Cover Image</span>
                                                            <input type="file" accept="image/*" onChange={e => handleGalleryUpload(e, 'variant')} hidden />
                                                        </label>
                                                    ) : (
                                                        <div className="cover-image-preview">
                                                            <img src={variantForm.coverImage.media_url || variantForm.coverImage.preview} alt="Cover" />
                                                            <button className="remove-image" onClick={() => handleRemoveCoverImage('variant')}>
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="image-tips !mt-0">
                                                        <Star size={14} className="icons" />
                                                        <div>
                                                            <strong className="text-[#0D614E]">Cover Image</strong>
                                                            <p className="image-desc !mb-0">This image will be displayed as the main product image for this variant.</p>
                                                        </div>
                                                    </div>
                                                    <div className="image-tips">
                                                        <AlertCircle size={14} className="icons !text-[#1E40AF]" />
                                                        <div>
                                                            <strong className="text-[#1E40AF]">TIPS FOR BEST RESULTS</strong>
                                                            <ul>
                                                                <li><Check size={16} /> Use high resolution images</li>
                                                                <li><Check size={16} /> Good lighting and clear background</li>
                                                                <li><Check size={16} /> Show the product clearly</li>
                                                                <li><Check size={16} /> Recommended background (100% white)</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="product-gallery">
                                        <div className="flex gap-3 items-center mb-2">
                                            <h4>Variant Gallery</h4>
                                            <p className="gallery-desc">(You can drag to reorder images)</p>
                                        </div>

                                        <div className="gallery-grid variant-gallery-items">
                                            {variantForm?.galleryImages?.map((image, index) => (
                                                <div
                                                    key={image.id}
                                                    className="gallery-item"
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, index)}
                                                    onDragOver={(e) => handleDragOver(e, index, 'variant')}
                                                    onDragEnd={handleDragEnd}
                                                >
                                                    <button className="remove-gallery-btn" onClick={() => handleRemoveImage(image.id, 'variant')}>
                                                        <X size={14} />
                                                    </button>
                                                    <img src={image.preview || image.media_url} alt={`Gallery ${index + 1}`} />
                                                    <div className="gallery-actions">
                                                        <button className="set-cover-btn" onClick={() => handleSetAsCover(image.id, 'variant')}>
                                                            <Star size={14} />
                                                            Set as Cover
                                                        </button>
                                                    </div>
                                                    {image.is_cover && <div className="gallery-cover-badge"><Star size={14} className="fill-[#EAB308]" /> Cover</div>}
                                                </div>
                                            ))}

                                            {variantForm?.galleryImages?.length < 8 && (
                                                <label className="upload-more-area">
                                                    <Plus size={24} />
                                                    <span>Upload More</span>
                                                    <input type="file" accept="image/*" multiple onChange={e => handleGalleryUpload(e, 'variant')} hidden />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Title <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            name="title"
                                            placeholder="Enter Title"
                                            value={variantForm.title}
                                            onChange={handleVariantInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>SKU <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            name="vendor_sku_code"
                                            placeholder="Enter SKU"
                                            value={variantForm.vendor_sku_code}
                                            onChange={handleVariantInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>{priceType === "TP" ? "Vendor Price" : "Selling Price"} <span className="required">*</span></label>
                                        <input
                                            type="number"
                                            name="selling_price"
                                            placeholder="0.00"
                                            value={variantForm.selling_price}
                                            onChange={handleVariantInputChange}
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Maximum Retail Price (MRP) <span className="required">*</span></label>
                                        <input
                                            type="number"
                                            name="mrp"
                                            placeholder="0.00"
                                            value={variantForm.mrp}
                                            onChange={handleVariantInputChange}
                                            step="0.01"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Cost per item</label>
                                        <input
                                            type="number"
                                            name="cost_per_item"
                                            placeholder="0.00"
                                            value={variantForm.cost_per_item}
                                            onChange={handleVariantInputChange}
                                            step="0.01"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Type <span className="required">*</span></label>
                                        <select name="physical_state" value={variantForm.physical_state} onChange={handleVariantInputChange}>
                                            <option value="">Select Type</option>
                                            {[
                                                { value: "tablet", label: "Tablet" },
                                                { value: "capsule", label: "Capsule" },
                                                { value: "powder", label: "Powder" },
                                                { value: "syrup", label: "Syrup" },
                                                { value: "oil", label: "Oil" },
                                                { value: "cream", label: "Cream" },
                                                { value: "gel", label: "Gel" },
                                                { value: "drops", label: "Drops" },
                                                { value: "juice", label: "Juice" },
                                                { value: "other", label: "Other" }
                                            ].map((data) => (
                                                <option key={data.value} value={data.value}>{data.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Size/Weight <span className="required">*</span></label>
                                        <div className="weight-input">
                                            <input
                                                type="number"
                                                name="size"
                                                placeholder="size"
                                                value={variantForm.size}
                                                onChange={handleVariantInputChange}
                                                step="0.01"
                                            />
                                            <select name="weightage" value={variantForm.weightage} onChange={handleVariantInputChange}>
                                                <option value="g">g</option>
                                                <option value="kg">kg</option>
                                                <option value="ml">ml</option>
                                                <option value="L">L</option>
                                                <option value="pcs">Pieces</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="is_returnable"
                                                checked={variantForm.is_returnable}
                                                onChange={handleVariantInputChange}
                                            />
                                            Returnable
                                        </label>
                                        {variantForm.is_returnable && (
                                            <input
                                                type="number"
                                                name="returnable_days"
                                                placeholder="Returnable days (e.g., 7)"
                                                value={variantForm.returnable_days}
                                                onChange={handleVariantInputChange}
                                                className="mt-2"
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="pay_on_delivery"
                                                checked={variantForm.pay_on_delivery}
                                                onChange={handleVariantInputChange}
                                            />
                                            COD Available
                                        </label>
                                    </div>
                                    <div className="form-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="is_default"
                                                checked={variantForm.is_default}
                                                onChange={handleVariantInputChange}
                                            />
                                            Set as Default Variant
                                        </label>
                                    </div>
                                    <div className="form-group">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                name="prescription_required"
                                                checked={variantForm.prescription_required}
                                                onChange={handleVariantInputChange}
                                            />
                                            Prescription Required
                                        </label>
                                    </div>
                                </div>

                                {variantForm?.selling_price > 0 && (
                                    <div className="price-calculator">
                                        <div className="calculator-header">
                                            <h4>Price Calculator</h4>
                                            <div className="calculator-mode">
                                                <button
                                                    type="button"
                                                    className={`mode-btn ${priceType === "TP" ? "active" : ""}`}
                                                    onClick={() => setPriceType("TP")}
                                                >
                                                    Trade Price → Selling Price
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`mode-btn ${priceType === "SP" ? "active" : ""}`}
                                                    onClick={() => setPriceType("SP")}
                                                >
                                                    Selling Price → Trade Price
                                                </button>
                                            </div>
                                        </div>

                                        <div className="calculator-content">
                                            {(() => {
                                                const breakdown = calculatePricesFromInput(variantForm.selling_price, priceType);
                                                return priceType === "TP" ? (
                                                    <>
                                                        <div className="calc-row">
                                                            <span>💰 Vendor Price (Trade Price):</span>
                                                            <strong>₹{formatMoney(variantForm.selling_price)}</strong>
                                                        </div>
                                                        <div className="calc-row">
                                                            <span>🎯 Platform Fee ({platformFee}%):</span>
                                                            <span className="text-amber-600">+ ₹{formatMoney(breakdown.platformFeeAmount)}</span>
                                                        </div>
                                                        <div className="calc-row">
                                                            <span>📊 GST on Fee ({gst}%):</span>
                                                            <span className="text-amber-600">+ ₹{formatMoney(breakdown.gstOnFee)}</span>
                                                        </div>
                                                        <div className="calc-row total">
                                                            <span>💰 Final Selling Price:</span>
                                                            <strong className="text-emerald-600">
                                                                ₹{formatMoney(breakdown.selling_price)}
                                                            </strong>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="calc-row">
                                                            <span>💰 Selling Price:</span>
                                                            <strong>₹{formatMoney(variantForm.selling_price)}</strong>
                                                        </div>
                                                        <div className="calc-row">
                                                            <span>🎯 Platform Fee ({platformFee}%):</span>
                                                            <span className="text-red-500">- ₹{formatMoney(breakdown.platformFeeAmount)}</span>
                                                        </div>
                                                        <div className="calc-row">
                                                            <span>📊 GST on Fee ({gst}%):</span>
                                                            <span className="text-red-500">- ₹{formatMoney(breakdown.gstOnFee)}</span>
                                                        </div>
                                                        <div className="calc-row total">
                                                            <span>💰 Vendor Price:</span>
                                                            <strong className="text-blue-600">
                                                                ₹{formatMoney(breakdown.vendor_price)}
                                                            </strong>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button className="btn-cancel" onClick={() => setShowVariantModal(false)}>
                                    Cancel
                                </button>
                                <button className="btn-submit" onClick={addVariant} disabled={varient || lodervr}>
                                    {varient || lodervr ? "Processing..." : editingVariant ? "Update Variant" : "Add Variant"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

        </DashboardPageShell>
    );
}