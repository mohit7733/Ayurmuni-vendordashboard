// src/pages/admin/AddProduct.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Upload,
  X,
  Star,
  Plus,
  AlertCircle,
  StarsIcon,
  Check,
  Trash2,
  Copy,
  Package,
  Layers,
  IndianRupee,
  Edit,
  AlertTriangle
} from "lucide-react";
import "./AddProduct.css";
import { vendorService } from "../../../services/vendorService";
import toast from "react-hot-toast";
import UnicommerceNotice from "../../components/shared/UnicommerceNotice";
import DashboardPageShell from "../../components/shared/DashboardPageShell";
import Button from "../../components/shared/Button";
import {
  extractApiErrorMessage,
  getSelectedSubcategoryMeta,
  isUnicommerceSyncError,
  mapVariantToApiPayload,
  UNICOMMERCE_NOTICES,
} from "../../../utils/unicommerceHelpers";

export default function AddProduct() {
  const navigate = useNavigate();
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
    calculation_mode: priceType == "TP" ? "trade_price" : "selling_price",
    taxes: [
      {
        "name": "GST",
        "rate": gst
      },
      {
        "name": "Platform Fee",
        "rate": platformFee
      }
    ],
    weightage: "g",
    size: "",
    is_default: false,
    prescription_required: false,
    coverImage: null,
    vendor_price: "",
    is_active: true
  });

  // Update payment_type when priceType, gst, or platformFee changes
  useEffect(() => {
    setVariantForm(prev => ({
      ...prev,
      calculation_mode: priceType == "TP" ? "trade_price" : "selling_price",
      taxes: [
        {
          "name": "GST",
          "rate": gst
        },
        {
          "name": "Platform Fee",
          "rate": platformFee
        }
      ],
    }));
  }, [priceType, gst, platformFee]);

  useEffect(() => {
    fetchdatabrandcat();
  }, []);

  const fetchdatabrandcat = async () => {
    try {
      const [brand, productcat, diseasescat] = await Promise.all([
        vendorService.getbrandandcategory("brand-name"),
        vendorService.getbrandandcategory("product-subcategory"),
        // vendorService.getbrandandcategory("category"),
        vendorService.getbrandandcategory("health-diseases"),
      ]);

      const brandData = brand?.data?.data || brand?.data || [];
      const catData = productcat?.data?.data || productcat?.data || [];
      const diseasescate = diseasescat?.data?.data || diseasescat?.data || [];

      setlists(prev => ({
        ...prev,
        brand: brandData,
        productcat: catData,
        // maincategory,
        diseasescate,
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
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

    // Upload images to S3 immediately for new uploads
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
            is_new: true // Flag to identify newly uploaded images
          };
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`);
          console.error("Upload error:", error);
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
      // Set first image as cover if no cover exists
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
    } else {
      if (!coverImage && successfulUploads.length > 0) {
        successfulUploads[0].is_cover = true;
        setCoverImage({
          file: successfulUploads[0].file,
          preview: successfulUploads[0].preview,
          name: successfulUploads[0].name,
          media_url: successfulUploads[0].media_url
        });
      }
      setGalleryImages([...galleryImages, ...successfulUploads]);
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
    } else {
      const updatedImages = galleryImages.map(img => ({ ...img, is_cover: img.id === id }));
      const newCoverImage = galleryImages.find(img => img.id === id);
      if (newCoverImage) {
        setCoverImage({
          file: newCoverImage.file,
          preview: newCoverImage.preview,
          name: newCoverImage.name,
          media_url: newCoverImage.media_url
        });
      }
      setGalleryImages(updatedImages);
      toast.success("Cover image updated");
    }
  };

  const handleRemoveImage = (id, type) => {
    const imageToRemove = type === "variant"
      ? variantForm.galleryImages.find(img => img.id === id)
      : galleryImages.find(img => img.id === id);

    if (imageToRemove?.preview) {
      URL.revokeObjectURL(imageToRemove.preview);
    }

    if (type === "variant") {
      const updatedGallery = variantForm.galleryImages.filter(img => img.id !== id);

      // If we removed the cover image, set a new cover
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
        toast.info("New cover image set");
      } else {
        setVariantForm(prev => ({
          ...prev,
          galleryImages: updatedGallery
        }));
      }
      toast.success("Image removed");
    } else {
      const updatedGallery = galleryImages.filter(img => img.id !== id);

      if (coverImage?.id === id && updatedGallery.length > 0) {
        const newCover = updatedGallery[0];
        newCover.is_cover = true;
        setCoverImage({
          file: newCover.file,
          preview: newCover.preview,
          name: newCover.name,
          media_url: newCover.media_url,
          id: newCover.id
        });
        setGalleryImages(updatedGallery);
        toast.info("New cover image set");
      } else {
        setGalleryImages(updatedGallery);
      }
      toast.success("Image removed");
    }
  };

  const handleRemoveCoverImage = (type) => {
    if (type === "variant") {
      if (variantForm.coverImage?.preview) {
        URL.revokeObjectURL(variantForm.coverImage.preview);
      }
      setVariantForm(prev => ({ ...prev, coverImage: null }));
      toast.info("Cover image removed");
    } else {
      if (coverImage?.preview) {
        URL.revokeObjectURL(coverImage.preview);
      }
      setCoverImage(null);
      toast.info("Cover image removed");
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
      } else {
        setGalleryImages(newImages);
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

  // Variant Management Functions
  const handleVariantInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVariantForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const generateSKU = () => {
    const prefix = name.substring(0, 3).toUpperCase() || "PRD";
    const random = Math.floor(Math.random() * 10000);
    const timestamp = Date.now().toString().slice(-4);
    return `${prefix}-${random}${timestamp}`;
  };

  const validateVariantForm = () => {
    const newErrors = {};

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
    // if (!variantForm.hsn_code) {
    //   toast.error("HSN Number is required");
    //   return false;
    // }
    // if (!variantForm.stock) {
    //   toast.error("Quantity/stock is required");
    //   return false;
    // }
    if (!variantForm.size) {
      toast.error("Size is required");
      return false;
    }
    if (!variantForm.vendor_sku_code && !editingVariant) {
      toast.error("SKU is required");
      return false;
    }
    if (!variantForm.physical_state) {
      toast.error("Product type is required");
      return false;
    }

    if (variantForm.mrp && variantForm.selling_price && Number(variantForm.mrp) < Number(variantForm.selling_price)) {
      toast.error("MRP must be greater than or equal to selling price");
      return false;
    }

    return true;
  };

  const addVariant = async () => {
    if (!validateVariantForm()) return;

    setVarient(true);

    try {
      // Prepare media array - images are already uploaded during upload
      const mediaurls = variantForm.galleryImages.map((item) => ({
        media_url: item.media_url,
        media_type: "image",
        is_cover: item.is_cover || (variantForm.coverImage?.id === item.id)
      }));

      const mrp = Number(variantForm.mrp) || 0;

      const sellingPrice =
        priceType === "TP"
          ? Number(variantForm.selling_price) +
          (Number(variantForm.selling_price) * platformFee / 100) +
          ((Number(variantForm.selling_price) * platformFee / 100) * gst / 100)
          : Number(variantForm.selling_price) || 0;

      const discount =
        mrp > 0 && sellingPrice < mrp
          ? Math.round(((mrp - sellingPrice) / mrp) * 100)
          : 0;

      const newVariant = {
        id: editingVariant ? editingVariant.id : Date.now(),
        vendor_sku_code: variantForm.vendor_sku_code || generateSKU(),
        title: variantForm.title,
        mrp: parseFloat(variantForm.mrp),
        discount: discount || "",
        cost_per_item: variantForm.cost_per_item ? parseFloat(variantForm.cost_per_item) : "",
        stock: parseInt(variantForm.stock),
        low_stock_threshold: variantForm.low_stock_threshold || "",
        is_free_shipping: variantForm.is_free_shipping || false,
        shipping_amount: variantForm.shipping_amount || "",
        is_returnable: variantForm.is_returnable,
        returnable_days: variantForm.is_returnable ? variantForm.returnable_days : "",
        pay_on_delivery: variantForm.pay_on_delivery,
        media: mediaurls,
        galleryImages: variantForm.galleryImages, // Store full image objects for editing
        hsn_code: variantForm.hsn_code,
        calculation_mode: priceType == "TP" ? "trade_price" : "selling_price",
        taxes: [
          {
            "name": "GST",
            "rate": gst
          },
          {
            "name": "Platform Fee",
            "rate": platformFee
          }
        ],
        physical_state: variantForm.physical_state,
        weightage: variantForm.weightage,
        size: variantForm.size,
        is_default: editingVariant ? variantForm.is_default : (variants.length === 0),
        prescription_required: variantForm.prescription_required,
        coverImage: variantForm.coverImage,
        is_active: true,
        vendor_price: parseFloat(priceType == "TP" ? variantForm.selling_price : (Number(variantForm.selling_price) -
          (variantForm.selling_price * platformFee / 100) -
          ((variantForm.selling_price * platformFee / 100) * gst / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2 }))?.toFixed(2),
        selling_price: parseFloat(priceType == "TP" ? (Number(variantForm.selling_price) +
          (variantForm.selling_price * platformFee / 100) +
          ((variantForm.selling_price * platformFee / 100) * gst / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2 }) :
          variantForm.selling_price)?.toFixed(2)
      };
      if (editingVariant) {
        setVariants(variants.map(v => v.id === editingVariant.id ? newVariant : v));
        toast.success("Variant updated successfully");
      } else {
        setVariants([...variants, newVariant]);
        toast.success("Variant added successfully");
      }
      resetVariantForm();
      setShowVariantModal(false);
    } catch (error) {
      console.error("Error saving variant:", error);
      toast.error("Failed to save variant");
    } finally {
      setVarient(false);
    }
  };

  const resetVariantForm = () => {
    // Clean up preview URLs
    if (variantForm.galleryImages) {
      variantForm.galleryImages.forEach(img => {
        if (img.preview) URL.revokeObjectURL(img.preview);
      });
    }
    if (variantForm.coverImage?.preview) {
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
        {
          "name": "GST",
          "rate": gst
        },
        {
          "name": "Platform Fee",
          "rate": platformFee
        }
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

    // Restore images for editing - they already have media_url from API
    const restoredGallery = variant.galleryImages?.map(img => ({
      ...img,
      preview: img.media_url, // Use existing URL as preview
      file: null, // No file object for existing images
    })) || [];
    console.log(parseInt(variant.selling_price));


    setVariantForm({
      vendor_sku_code: variant.vendor_sku_code,
      title: variant.title,
      mrp: variant.mrp,
      selling_price: variant.selling_price ? parseInt(variant.selling_price)?.toFixed(2) : "",
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
      taxes: variant.taxes || [
        {
          "name": "GST",
          "rate": gst
        },
        {
          "name": "Platform Fee",
          "rate": platformFee
        }
      ],
    });

    setPriceType(variant.calculation_mode === "trade_price" ? "TP" : "SP");
    setShowVariantModal(true);
  };

  const deleteVariant = (id) => {
    if (window.confirm("Are you sure you want to delete this variant?")) {
      const updatedVariants = variants.filter(v => v.id !== id);

      // Clean up image previews for the deleted variant
      const deletedVariant = variants.find(v => v.id === id);
      if (deletedVariant?.galleryImages) {
        deletedVariant.galleryImages.forEach(img => {
          if (img.preview && img.preview.startsWith('blob:')) {
            URL.revokeObjectURL(img.preview);
          }
        });
      }

      if (updatedVariants.length > 0 && !updatedVariants.some(v => v.is_default)) {
        updatedVariants[0].is_default = true;
      }
      setVariants(updatedVariants);
      toast.success("Variant deleted successfully");
    }
  };

  const duplicateVariant = (variant) => {
    // Create deep copy of variant data
    const duplicatedGallery = variant.galleryImages?.map(img => ({
      ...img,
      id: Date.now() + Math.random(),
      is_cover: false, // Don't duplicate as cover
      is_new: true,
      // Keep media_url for existing images
    })) || [];

    const newVariant = {
      ...variant,
      id: Date.now(),
      vendor_sku_code: `${variant.vendor_sku_code}-COPY-${Date.now().toString().slice(-4)}`,
      is_default: false,
      prescription_required: false,
      title: `${variant.title} (Copy)`,
      coverImage: variant.coverImage ? { ...variant.coverImage, id: Date.now() } : null,
      galleryImages: duplicatedGallery,
      media: variant.media?.map(m => ({ ...m })) || [],
    };

    setVariants([...variants, newVariant]);
    toast.success("Variant duplicated successfully");
  };

  const setDefaultVariant = (id) => {
    setVariants(variants.map(v => ({ ...v, is_default: v.id === id })));
    toast.success("Default variant updated");
  };

  // Validation for Product Information
  const validateProductInfo = () => {
    const newErrors = {};

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
  const removeEmptyFields = (obj) => {
    return Object.fromEntries(
      Object.entries(obj).filter(
        ([_, value]) =>
          value !== null &&
          value !== undefined &&
          value !== "" &&
          !(Array.isArray(value) && value.length === 0)
      )
    );
  };
  const handleSubmit = async () => {
    if (activeTab === "product") {
      if (!validateProductInfo()) return;
      setActiveTab("variant");
      return;
    }

    if (variants.length === 0) {
      toast.error("At least one variant is required");
      return;
    }

    const productData = {
      product: removeEmptyFields({
        name,
        ...formData,
        health_disease_ids: healthConcerns,
      }),

      variants: variants.map((v) =>
        mapVariantToApiPayload(
          removeEmptyFields({
            ...v,
            media:
              v.media ||
              v.galleryImages?.map((img) => ({
                media_url: img.media_url,
                media_type: "image",
                is_cover: img.is_cover || v.coverImage?.id === img.id,
              })) ||
              [],
          })
        )
      ),
    };

    try {
      console.log(productData);

      const response = await vendorService.addProduct(productData);
      if (response.data.success) {
        toast.success(response.data.message);
        setTimeout(() => {
          navigate("/vendor/products");
        }, 1000);
      }
    } catch (error) {
      console.error("Error saving product:", error);
      const message = extractApiErrorMessage(error, "Failed to save product. Please try again.");
      toast.error(isUnicommerceSyncError(error) ? `Unicommerce sync: ${message}` : message);
    }
  };

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel? All unsaved data will be lost.")) {
      // Clean up all image previews
      const allImages = [...galleryImages, ...variants.flatMap(v => v.galleryImages || [])];
      allImages.forEach(img => {
        if (img.preview && img.preview.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });
      navigate("/vendor/products");
    }
  };

  // Calculate total stock
  const totalStock = variants.reduce((sum, v) => sum + (parseInt(v.stock, 10) || 0), 0);
  const selectedSubcategory = getSelectedSubcategoryMeta(
    lists.productcat,
    formData.product_subcategory_id
  );
  const priceRange = variants.length > 0 ? {
    min: Math.min(...variants.map(v => v.selling_price)),
    max: Math.max(...variants.map(v => v.selling_price))
  } : null;

  return (
    <DashboardPageShell
      title="Add New"
      accent="Product"
      subtitle="Create a new listing in your botanical collection. Ensure all ingredients and dosage types are accurately cataloged."
      breadcrumbs={[{ label: "Dashboard" }, { label: "Products" }, { label: "Add Product" }]}
      actions={
        <Button variant="secondary" onClick={handleCancel}>
          <ChevronLeft size={16} className="mr-1" aria-hidden />
          Back
        </Button>
      }
      contentClassName="p-4 sm:p-6 lg:p-8 max-w-8xl"
    >
      <UnicommerceNotice>
        {UNICOMMERCE_NOTICES.pendingVariant} {UNICOMMERCE_NOTICES.systemSku}
      </UnicommerceNotice>

      {/* Tabs */}
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

      {/* Main Form */}
      <div className="form-container">
        {activeTab === "product" ? (
          // Product Information Tab
          <>
            <div className="form-section">
              {/* Product Details Form */}
              <div className="product-details-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>PRODUCT NAME <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="Enter product name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors(prev => ({ ...prev, name: "" }));
                      }}
                      className={errors.name ? "error" : ""}
                    />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                    <span className="field-note">eg. Ginger Extract Powder</span>
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
                    {/* {selectedSubcategory && (
                      <span className="field-note">
                        HSN: {selectedSubcategory.hsn_code || "—"} · Tax: {selectedSubcategory.tax_class_code || selectedSubcategory.tax_class_name || "—"}
                      </span>
                    )} */}
                  </div>
                  <div className="form-group">
                    <label>BRAND NAME <span className="required">*</span></label>
                    <select
                      name="brand_name_id"
                      value={formData.brand_name_id}
                      onChange={handleInputChange}
                      className={errors.brand_name_id ? "error" : ""}
                    >
                      <option value="">Select Brand</option>
                      {lists?.brand?.map((data) => (
                        <option key={data?.id} value={data?.id}>{data?.name}</option>
                      ))}
                    </select>
                    {errors.brand_name_id && <span className="error-text">{errors.brand_name_id}</span>}
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
                      className={errors.manufacturer ? "error" : ""}
                    />
                    {errors.manufacturer && <span className="error-text">{errors.manufacturer}</span>}
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
                    className={errors.full_description ? "error" : ""}
                  />
                  {errors.full_description && <span className="error-text">{errors.full_description}</span>}
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

              {/* Health Concern Section */}
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
          // Variant Tab
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

            {/* Variants Summary */}
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
                    <p>₹{priceRange?.min} - ₹{priceRange?.max}</p>
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
                    <div className="col-price">Recive Amount</div>
                    <div className="col-stock">Stock</div>
                    <div className="col-sku">Vendor SKU</div>
                    <div className="col-default">Default</div>
                    <div className="col-actions">Actions</div>
                  </div>
                  {variants.map((variant) => (
                    <div key={variant.id} className="variants-table-row">
                      <div className="col-variant">
                        <img
                          src={variant.coverImage?.media_url || variant.coverImage?.preview || "https://via.placeholder.com/50"}
                          alt={variant.title}
                          onError={(e) => e.target.src = "https://via.placeholder.com/50"}
                        />
                        <div>
                          <strong>{variant.title}</strong>
                          <p>Size: {variant.size}{variant.weightage}</p>
                        </div>
                      </div>
                      <div className="col-mrp">₹{variant.mrp}</div>
                      <div className="col-price">₹{Number(variant.selling_price).toFixed(2)}</div>
                      <div className="col-price">₹{Number(variant.vendor_price).toFixed(2) || "N/A"}</div>
                      <div className="col-stock">
                        <span className={`stock-badge ${variant.stock <= (variant.low_stock_threshold || 5) ? 'low-stock' : ''}`}>
                          {variant.stock || 0} in stock
                        </span>
                      </div>
                      <div className="col-sku">{variant.vendor_sku_code}</div>
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
                        <button onClick={() => duplicateVariant(variant)} title="Duplicate">
                          <Copy size={16} />
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

        {/* Form Actions */}
        <div className="form-actions">
          <button className="btn-cancel" onClick={handleCancel}>
            Cancel
          </button>
          {activeTab === "product" ? (
            <button className="btn-next" onClick={handleNextTab}>
              Next: Add Variants →
            </button>
          ) : (
            <div className="action-buttons">
              <button className="btn-prev" onClick={handlePrevTab}>
                ← Back to Product Info
              </button>
              <button className="btn-submit" onClick={handleSubmit}>
                Submit Product
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Variant Modal */}
      {showVariantModal && (
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
                          <StarsIcon size={14} className="icons" />
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

                {/* Variant Gallery */}
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
                    className={errors.title ? 'error' : ''}
                  />
                  {errors.title && <span className="error-text">{errors.title}</span>}
                </div>
                <div className="form-group">
                  <label>SKU <span className="required">*</span></label>
                  <input
                    type="text"
                    name="vendor_sku_code"
                    placeholder="Enter SKU"
                    value={variantForm.vendor_sku_code}
                    onChange={handleVariantInputChange}
                    className={errors.vendor_sku_code ? 'error' : ''}
                  />
                  {errors.vendor_sku_code && <span className="error-text">{errors.vendor_sku_code}</span>}
                  {/* <button type="button" className="generate-sku" onClick={() => setVariantForm(prev => ({ ...prev, vendor_sku_code: generateSKU() }))}>
                    Generate SKU
                  </button> */}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Selling Price <span className="required">*</span></label>
                  <input
                    type="number"
                    name="selling_price"
                    placeholder="0.00"
                    value={variantForm.selling_price}
                    onChange={handleVariantInputChange}
                    className={errors.selling_price ? 'error' : ''}
                    step="0.01"
                  />
                  {errors.selling_price && <span className="error-text">{errors.selling_price}</span>}
                </div>
                <div className="form-group">
                  <label>Maximum Retail Price (MRP) <span className="required">*</span></label>
                  <input
                    type="number"
                    name="mrp"
                    placeholder="0.00"
                    value={variantForm.mrp}
                    onChange={handleVariantInputChange}
                    className={errors.mrp ? 'error' : ''}
                    step="0.01"
                  />
                  {errors.mrp && <span className="error-text">{errors.mrp}</span>}
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
                {/* <div className="form-group">
                  <label>HSN Number <span className="required">*</span></label>
                  <input
                    type="text"
                    name="hsn_code"
                    placeholder="HSN code"
                    value={variantForm.hsn_code}
                    onChange={handleVariantInputChange}
                    className={errors.hsn_code ? "error" : ""}
                  />
                  {errors.hsn_code && <span className="error-text">{errors.hsn_code}</span>}
                </div> */}


                <div className="form-group">
                  <label>Type <span className="required">*</span></label>
                  <select
                    name="physical_state"
                    value={variantForm.physical_state}
                    onChange={handleVariantInputChange}
                    className={errors.physical_state ? "error" : ""}
                  >
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
                  {errors.physical_state && <span className="error-text">{errors.physical_state}</span>}
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
                      className={errors.size ? 'error' : ''}
                    />
                    <select name="weightage" value={variantForm.weightage} onChange={handleVariantInputChange}>
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="L">L</option>
                      <option value="pcs">Pieces</option>
                    </select>
                  </div>
                  {errors.size && <span className="error-text">{errors.size}</span>}
                </div>


                {/* <div className="form-row">
                <div className="form-group">
                  <label>Quantity / Stock <span className="required">*</span></label>
                  <input
                    type="number"
                    name="stock"
                    placeholder="0"
                    value={variantForm.stock}
                    onChange={handleVariantInputChange}
                    className={errors.stock ? 'error' : ''}
                  />
                  {errors.stock && <span className="error-text">{errors.stock}</span>}
                </div>
                <div className="form-group">
                  <label>Low stock threshold</label>
                  <input
                    type="number"
                    name="low_stock_threshold"
                    placeholder="Alert when stock below"
                    value={variantForm.low_stock_threshold}
                    onChange={handleVariantInputChange}
                  />
                </div>
              </div> */}


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

              {/* Price Calculator */}
              {variantForm?.selling_price > 0 && (
                <div className="price-calculator">
                  <div className="calculator-header">
                    <h4>Price Calculator</h4>
                    <div className="calculator-mode">
                      <button
                        className={`mode-btn ${priceType === "TP" ? "active" : ""}`}
                        onClick={() => setPriceType("TP")}
                      >
                        Trade Price → Selling Price
                      </button>
                      <button
                        className={`mode-btn ${priceType === "SP" ? "active" : ""}`}
                        onClick={() => setPriceType("SP")}
                      >
                        Selling Price → Trade Price
                      </button>
                    </div>
                  </div>

                  <div className="calculator-content">
                    {priceType === "TP" ? (
                      <>
                        <div className="calc-row">
                          <span>💰 Vendor Price (Trade Price):</span>
                          <strong>₹{Number(variantForm.selling_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                        </div>
                        <div className="calc-row">
                          <span>🎯 Platform Fee ({platformFee}%):</span>
                          <span className="text-amber-600">+ ₹{((variantForm.selling_price * platformFee) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="calc-row">
                          <span>📊 GST on Fee ({gst}%):</span>
                          <span className="text-amber-600">+ ₹{(((variantForm.selling_price * platformFee) / 100) * gst / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="calc-row total">
                          <span>💰 Final Selling Price:</span>
                          <strong className="text-emerald-600">
                            ₹{(Number(variantForm.selling_price) +
                              (variantForm.selling_price * platformFee / 100) +
                              ((variantForm.selling_price * platformFee / 100) * gst / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="calc-row">
                          <span>💰 Selling Price:</span>
                          <strong>₹{Number(variantForm.selling_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                        </div>
                        <div className="calc-row">
                          <span>🎯 Platform Fee ({platformFee}%):</span>
                          <span className="text-red-500">- ₹{((variantForm.selling_price * platformFee) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="calc-row">
                          <span>📊 GST on Fee ({gst}%):</span>
                          <span className="text-red-500">- ₹{(((variantForm.selling_price * platformFee) / 100) * gst / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="calc-row total">
                          <span>💰 Vendor Price:</span>
                          <strong className="text-blue-600">
                            ₹{(Number(variantForm.selling_price) -
                              (variantForm.selling_price * platformFee / 100) -
                              ((variantForm.selling_price * platformFee / 100) * gst / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </strong>
                        </div>
                      </>
                    )}
                  </div>

                  {variantForm.mrp && Number(variantForm.mrp) < (priceType === "TP" ? (Number(variantForm.selling_price) +
                    (variantForm.selling_price * platformFee / 100) +
                    ((variantForm.selling_price * platformFee / 100) * gst / 100)) : Number((Number(variantForm.selling_price) -
                      (variantForm.selling_price * platformFee / 100) -
                      ((variantForm.selling_price * platformFee / 100) * gst / 100)))) && (
                      <div className="price-warning">
                        <AlertTriangle size={16} />
                        <span>MRP (₹{variantForm.mrp}) is less than selling price (₹{variantForm.selling_price}). This may violate pricing regulations.</span>
                      </div>
                    )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowVariantModal(false)}>
                Cancel
              </button>
              <button className="btn-submit" onClick={addVariant} disabled={varient}>
                {varient ? "Processing..." : editingVariant ? "Update Variant" : "Add Variant"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardPageShell>
  );
}