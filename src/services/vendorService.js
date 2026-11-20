import API from "./api";

const buildQuery = (params = {}) => {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            search.append(key, value);
        }
    });
    const query = search.toString();
    return query ? `?${query}` : "";
};

export const vendorService = {
    uploadfiles: (file, dir) => {
        const formdata = new FormData();
        formdata.append("image", file);
        formdata.append("dir", dir);
        return API.post("/user/upload/", formdata, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },

    createOnboarding: (data) => API.post("/vendors/profile/", data),

    getProfile: () => API.get("/vendors/profile/"),

    updateProfile: (profileData) => API.put("/vendors/profile/", profileData),

    deleteAccount: () => API.delete("/vendors/profile/"),

    getBankDetails: (params = {}) =>
        API.get(`/vendors/bank-details/${buildQuery(params)}`),

    getBankDetail: (id) =>
        API.get(`/vendors/bank-details/?id=${id}`),

    addBankDetail: (bankData) =>
        API.post("/vendors/bank-details/", bankData),

    updateBankDetail: (bankData) =>
        API.put(`/vendors/bank-details/?id=${bankData?.id}`, bankData),

    deleteBankDetail: (bankDetailId) =>
        API.delete(`/vendors/bank-details/?id=${bankDetailId}`),

    getProducts: (params = {}) =>
        API.get(`/vendors/product/${buildQuery(params)}`),

    getProductCatalogue: (params = {}) =>
        API.get(`/vendors/product/catalogue/${buildQuery(params)}`),

    getSingleProduct: (id, variantId) => {
        const query = variantId
            ? `?id=${id}&variant_id=${variantId}`
            : `?id=${id}`;
        return API.get(`/vendors/product/${query}`);
    },

    addProduct: (productData) =>
        API.post("/vendors/product/add/", productData),

    addVariant: (productId, variantData) =>
        API.post(`/vendors/product/?id=${productId}`, variantData),

    updateProduct: (id, productData, variantId) => {
        const query = variantId
            ? `?id=${id}&variant_id=${variantId}`
            : `?id=${id}`;
        return API.patch(`/vendors/product/${query}`, productData);
    },

    deleteProduct: (id) =>
        API.delete(`/vendors/product/?id=${id}`),

    deleteVariant: (productId, variantId) =>
        API.delete(`/vendors/product/?id=${productId}&variant_id=${variantId}`),

    bulkUploadProducts: (file) => {
        if (!file) {
            return Promise.reject({
                message: "Excel file is required",
                status: 400,
                data: null,
            });
        }
        const formData = new FormData();
        formData.append("file", file);
        return API.post("/vendors/product/bulk-upload/", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
    },

    getFieldInfo: (searchKey, extraParams = {}) =>
        API.get(`/vendors/fields/info/${buildQuery({ search: searchKey, ...extraParams })}`),

    // Alias for legacy callers (AddProduct, editproduct)
    getbrandandcategory: (searchKey, extraParams = {}) =>
        API.get(`/vendors/fields/info/${buildQuery({ search: searchKey, ...extraParams })}`),

    getTaxClasses: (params = {}) =>
        API.get(`/vendors/unicommerce-tax-class/${buildQuery(params)}`),

    getBanners: (id) =>
        id
            ? API.get(`/vendors/banner/?id=${id}`)
            : API.get("/vendors/banner/"),

    createBanner: (data) =>
        API.post("/vendors/banner/", data),

    updateBanner: (id, data) =>
        API.patch(`/vendors/banner/?id=${id}`, data),

    deleteBanner: (id) =>
        API.delete(`/vendors/banner/?id=${id}`),

    getInventory: (params = {}) =>
        API.get(`/inventory/${buildQuery(params)}`),

    getInventoryById: (id) =>
        API.get(`/inventory/?id=${id}`),

    getInventoryByVariant: (variantId) =>
        API.get(`/inventory/?variant_id=${variantId}`),

    createInventory: (data) =>
        API.post("/inventory/", data),

    updateInventory: (id, data) =>
        API.patch(`/inventory/${id}/`, data),

    deleteInventory: (id) =>
        API.delete(`/inventory/${id}/`),

    getOrders: (params = {}) =>
        API.get(`/vendors/orders/${buildQuery(params)}`),

    getOrder: (id) =>
        API.get(`/vendors/orders/${buildQuery({ id })}`),

    getOrderItem: (orderItemId) =>
        API.get(`/vendors/orders/${buildQuery({ order_item_id: orderItemId })}`),

    getOrdersSummary: () =>
        API.get("/vendors/orders/summary/"),

    getFinanceMetrics: (params = {}) =>
        API.get(`/vendors/finance/metrics/${buildQuery(params)}`),

    getFinanceTransactions: (params = {}) =>
        API.get(`/vendors/finance/transactions/${buildQuery(params)}`),

    getWalletTransactions: (params = {}) =>
        API.get(`/vendors/finance/wallet/transactions/${buildQuery(params)}`),

    // delete Product list detail
    deleteVariants: async (id, vid) => {
        try {
            const response = await API.delete(`/vendors/product/?id=${id}&variant_id=${vid}`);
            return response;
        } catch (error) {
            console.error('Admin service error:', error);
            throw error;
        }
    },

    // Add Variants list detail
    addVariants: async (id, newVariant) => {
        try {
            const response = await API.post(`/vendors/product/?id=${id}`, newVariant);
            return response;
        } catch (error) {
            console.error('Admin service error:', error);
            throw error;
        }
    },

    // Update Variants 
    updateVariants: async (id, vid, updateVariant) => {
        try {
            const response = await API.patch(`/vendors/product/?id=${id}&variant_id=${vid}`, updateVariant);
            return response;
        } catch (error) {
            console.error('Admin service error:', error);
            throw error;
        }
    },


    // //Get Brand,category
    // getbrandandcategory: async (productData) => {
    //     try {
    //         const response = await API.get('/vendors/fields/info/?search=' + productData);
    //         return response;
    //     } catch (error) {
    //         console.error('Admin service error:', error);
    //         throw error;
    //     }
    // }
};
