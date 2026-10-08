// // src/services/doctorService.js
// import API from "./api";

// export const doctorService = {

//     dashboardget: () => {
//         return API.get("/doctors/dashboard/");
//     },
//     dashboardfolloupadata: () => {
//         return API.get("/doctors/followup-patients/");
//     },
//     financedashboard: () => {
//         return API.get("/doctors/dashboard/financial-metrics/");
//     },

//     // 🔹 Create onboarding
//     createOnboarding: (data) => {
//         const formData = new FormData();
//         for (const key in data) {
//             if (data[key] instanceof File) {
//                 formData.append(key, data[key]);
//             } else if (key == "health_diseases") {
//                 data[key]?.filter((disdata) => formData.append("health_diseases", disdata))
//             }
//             else if (typeof data[key] === "object") {
//                 formData.append(key, JSON.stringify(data[key]));
//             }
//             else {
//                 formData.append(key, data[key]);
//             }
//         }
//         return API.post("/doctors/profile/", formData, {
//             headers: {
//                 "Content-Type": "multipart/form-data",
//             },
//         });
//     },

//     getPrakritiAndDiseases: async () => {
//         try {
//             const [prakriti, diseases] = await Promise.all([
//                 API.get("/doctors/prakriti/analysis-contents/"),
//                 API.get("/doctors/health-disease/")
//             ]);

//             return {
//                 prakriti: prakriti.data,
//                 diseases: diseases.data
//             };
//         } catch (error) {
//             console.error("Error fetching data:", error);
//             throw error;
//         }
//     },

//     // 🔹 Upload documents
//     uploadDocuments: (data) => {
//         const formData = new FormData();
//         for (const key in data) {
//             let file = data[key];
//             if (file == null || file == undefined) continue; // Skip if no file provided
//             formData.append(key, file);
//         }
//         return API.post("/doctors/documents/", formData, {
//             headers: {
//                 "Content-Type": "multipart/form-data",
//             },
//         });
//     },

//     // 🔹 Update documents
//     updateDocuments: (selectedDocument, file) => {
//         const formData = new FormData();
//         formData.append(selectedDocument, file);
//         return API.put("/doctors/documents/", formData, {
//             headers: {
//                 "Content-Type": "multipart/form-data",
//             },
//         });
//     },

//     // 🔹 Submit bank details
//     submitBankDetails: (data) => {
//         const formData = new FormData();
//         for (const key in data) {
//             if (data[key] instanceof File) {
//                 formData.append(key, data[key]);
//             } else {
//                 formData.append(key, data[key]);
//             }
//         }

//         return API.post("/doctors/bankdetails/", formData, {
//             headers: {
//                 "Content-Type": "multipart/form-data",
//             },
//         });
//     },

//     // 🔹 Get profile
//     getProfile: () => {
//         return API.get("/doctors/fullprofile/");
//     },

//     // 🔹 Update profile
//     updateProfile: (data) => {
//         const formData = new FormData();
//         for (const key in data) {
//             if (data[key] == null) continue;
//             if (data[key] instanceof File) {
//                 formData.append(key, data[key]);
//             } else if (key == "health_diseases") {
//                 data[key]?.forEach((disdata) => formData.append("health_diseases", disdata))
//             }
//             else if (typeof data[key] === "object") {
//                 formData.append(key, JSON.stringify(data[key]));
//             }
//             else {
//                 formData.append(key, data[key]);
//             }
//         }
//         return API.put("/doctors/profile/", formData, {
//             headers: {
//                 "Content-Type": "multipart/form-data",
//             },
//         });
//     },

//     updatebankDetails: (id, data) => {
//         const formData = new FormData();
//         for (const key in data) {
//             if (data[key] == null) continue; // Skip null values
//             formData.append(key, data[key]);
//         }
//         return API.put(`/doctors/bankdetails/${id}/`, formData, {
//             headers: {
//                 "Content-Type": "multipart/form-data",
//             },
//         });
//     },

//     deleteBankDetails: (id) => {
//         return API.delete(`/doctors/bankdetails/${id}/`);
//     },

//     deleteprofile: () => {
//         return API.delete("/doctors/profile/", {
//             headers: {
//                 "Content-Type": "multipart/form-data",
//             },
//         });
//     },

//     // 🔹 Get Slot
//     getMonthlyAvailability: (year, month) => {
//         return API.get(`/doctors/availabilities/?month=${month}&year=${year}`);
//     },

//     // 🔹 Post Slot
//     createSlot: (data) => {
//         return API.post("/doctors/availabilities/", data);
//     },
//     // 🔹 Update Slot
//     updateTimeSlot: (slotId, slotData) => {
//         return API.put("/doctors/availabilities/" + slotId + "/", slotData);
//     },

//     // 🔹 Delete Slot
//     deleteTimeSlot: (slotId) => {
//         return API.delete(`/doctors/availabilities/${slotId}/`);
//     },

//     // 🔹 Change password
//     changePassword: (data) => {
//         return API.post("/auth/change-password/", {
//             old_password: data.currentPassword,
//             new_password: data.newPassword,
//         });
//     },

//     // 🔹 Get appointments List
//     getAppointment: (type) => {
//         return API.get(`/doctors/?type=${type}`);
//     },

//     updateAppointmentstatus: (appointment_id, data) => {
//         return API.post(`/doctors/appointments/action/?id=${appointment_id}`, data);
//     },
//     getAppointmentDetails: (type, id) => {
//         return API.get(`/doctors/?type=${type}&id=${id}`);
//     },
//     getAppointmentprec: (pid, id) => {
//         return API.get(`/doctors/prescription/?patient_id=${pid || ''}&appointment_id=${id || ''}`);
//     },
//     getAppointmentDoc: (type, id) => {
//         return API.get(
//             `/doctors/appointments/documents/?${type !== "patient"
//                 ? `appointment_id=${id}`
//                 : `patient_id=${id}`
//             }`
//         );
//     },
//     getUpcomingAppointment: () => {
//         return API.get(`/doctors/appointments/upcoming/`);
//     },


//     // 🔹 Get Patient List (supports pagination & filters)
//     getPatient: (type, page = 1, pageSize = 10, search = "", prakriti = "", gender = "") => {
//         const params = new URLSearchParams({ type });
//         if (page) params.append("page", String(page));
//         if (pageSize) params.append("page_size", String(pageSize));
//         if (search?.trim()) params.append("search", search.trim());
//         if (prakriti && prakriti !== "all") params.append("prakriti", prakriti);
//         if (gender && gender !== "all") params.append("gender", gender);
//         return API.get(`/doctors/?${params.toString()}`);
//     },

//     // 🔹 Get single patient details
//     getPatientDetails: (patientId) => {
//         return API.get(`/doctors/?type=patient&id=${patientId}`);
//     },

//     // 🔹 Get search product List
//     getProductList: (type) => {
//         return API.get(`/doctors/medicines/search/?search=` + type);
//     },

//     // 🔹 Add prescription List
//     postprescription: (type, prescriptionData) => {
//         return API.post(`/doctors/prescription/?patient_id=` + type, prescriptionData);
//     },

//     // 🔹 Add prescription List
//     questionforpatient: (id) => {
//         return API.get(`/doctors/patient-onboarding/?patient_id=` + id);
//     },

//     // 🔹 Add prescription List
//     questionfillforpatient: (data) => {
//         return API.post(`/doctors/patient-onboarding/`, data);
//     }
// };




// src/services/doctorService.js
import API from "./api";

// Custom error handler for service methods
const handleServiceError = (error, customMessage = "") => {
    // Log error for debugging
    console.error(`Doctor Service Error${customMessage ? `: ${customMessage}` : ''}:`, error);

    // Extract error message
    const message =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.message ||
        "An unexpected error occurred";

    // Create a standardized error object
    const serviceError = {
        message,
        status: error?.response?.status || 500,
        originalError: error,
        data: error?.response?.data || null,
    };

    return Promise.reject(serviceError);
};

// Helper to handle API calls with error handling
const handleApiCall = async (apiCall, customMessage = "") => {
    try {
        const response = await apiCall();
        return response;
    } catch (error) {
        return handleServiceError(error, customMessage);
    }
};

export const doctorService = {
    // 🔹 Dashboard
    dashboardget: () => {
        return handleApiCall(
            () => API.get("/doctors/dashboard/"),
            "Failed to fetch dashboard data"
        );
    },

    dashboardfolloupadata: () => {
        return handleApiCall(
            () => API.get("/doctors/followup-patients/"),
            "Failed to fetch follow-up patients"
        );
    },

    financedashboard: () => {
        return handleApiCall(
            () => API.get("/doctors/dashboard/financial-metrics/"),
            "Failed to fetch financial metrics"
        );
    },

    // 🔹 Create onboarding
    createOnboarding: (data) => {
        try {
            const formData = new FormData();
            for (const key in data) {
                if (data[key]?.file instanceof File) {
                    console.log(data[key]?.file);
                    formData.append(key, data[key]?.file);
                } else if (key == "health_diseases") {
                    data[key]?.filter((disdata) => formData.append("health_diseases", disdata));
                } else if (typeof data[key] === "object") {
                    formData.append(key, JSON.stringify(data[key]));
                } else {
                    formData.append(key, data[key]);
                }
            }
            return handleApiCall(
                () => API.post("/doctors/profile/", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }),
                "Failed to create onboarding"
            );
        } catch (error) {
            return handleServiceError(error, "Error preparing onboarding data");
        }
    },

    getPrakritiAndDiseases: async () => {
        try {
            const [diseases] = await Promise.all([
                // API.get("/doctors/prakriti/analysis-contents/"),
                API.get("/doctors/health-disease/")
            ]);

            return {
                // prakriti: prakriti.data,
                diseases: diseases.data
            };
        } catch (error) {
            throw await handleServiceError(error, "Failed to fetch prakriti and diseases");
        }
    },

    // 🔹 Upload documents
    uploadDocuments: (data) => {
        try {
            const formData = new FormData();
            for (const key in data) {
                let file = data[key];
                if (file == null || file == undefined) continue;
                formData.append(key, file);
            }
            return handleApiCall(
                () => API.post("/doctors/documents/", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }),
                "Failed to upload documents"
            );
        } catch (error) {
            return handleServiceError(error, "Error preparing documents for upload");
        }
    },

    // 🔹 Update documents
    updateDocuments: (selectedDocument, file) => {
        try {
            const formData = new FormData();
            formData.append(selectedDocument, file);
            return handleApiCall(
                () => API.put("/doctors/documents/", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }),
                "Failed to update document"
            );
        } catch (error) {
            return handleServiceError(error, "Error preparing document update");
        }
    },

    // 🔹 Submit bank details
    submitBankDetails: (data) => {
        try {
            const formData = new FormData();
            for (const key in data) {
                if (data[key] instanceof File) {
                    formData.append(key, data[key]);
                } else {
                    formData.append(key, data[key]);
                }
            }
            return handleApiCall(
                () => API.post("/doctors/bankdetails/", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }),
                "Failed to submit bank details"
            );
        } catch (error) {
            return handleServiceError(error, "Error preparing bank details");
        }
    },

    // 🔹 Get profile
    getProfile: () => {
        return handleApiCall(
            () => API.get("/doctors/fullprofile/"),
            "Failed to fetch profile"
        );
    },

    // 🔹 Update profile
    updateProfile: (data) => {
        try {
            const formData = new FormData();
            for (const key in data) {
                if (data[key] == null) continue;
                if (data[key] instanceof File) {
                    formData.append(key, data[key]);
                } else if (key == "health_diseases") {
                    data[key]?.forEach((disdata) => formData.append("health_diseases", disdata));
                } else if (typeof data[key] === "object") {
                    formData.append(key, JSON.stringify(data[key]));
                } else {
                    formData.append(key, data[key]);
                }
            }
            return handleApiCall(
                () => API.put("/doctors/profile/", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }),
                "Failed to update profile"
            );
        } catch (error) {
            return handleServiceError(error, "Error preparing profile update");
        }
    },

    updatebankDetails: (id, data) => {
        try {
            const formData = new FormData();
            for (const key in data) {
                if (data[key] == null) continue;
                formData.append(key, data[key]);
            }
            return handleApiCall(
                () => API.put(`/doctors/bankdetails/${id}/`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }),
                "Failed to update bank details"
            );
        } catch (error) {
            return handleServiceError(error, "Error preparing bank details update");
        }
    },

    deleteBankDetails: (id) => {
        return handleApiCall(
            () => API.delete(`/doctors/bankdetails/${id}/`),
            "Failed to delete bank details"
        );
    },

    deleteprofile: () => {
        return handleApiCall(
            () => API.delete("/doctors/profile/", {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }),
            "Failed to delete profile"
        );
    },

    // 🔹 Get Slot
    getMonthlyAvailability: (year, month) => {
        if (!year || !month) {
            return Promise.reject({
                message: "Year and month are required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.get(`/doctors/availabilities/?month=${month}&year=${year}`),
            "Failed to fetch availability"
        );
    },

    // 🔹 Post Slot
    createSlot: (data) => {
        if (!data) {
            return Promise.reject({
                message: "Slot data is required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.post("/doctors/availabilities/", data),
            "Failed to create slot"
        );
    },

    // 🔹 Update Slot
    updateTimeSlot: (slotId, slotData) => {
        if (!slotId) {
            return Promise.reject({
                message: "Slot ID is required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.put("/doctors/availabilities/" + slotId + "/", slotData),
            "Failed to update slot"
        );
    },

    // 🔹 Delete Slot
    deleteTimeSlot: (slotId) => {
        if (!slotId) {
            return Promise.reject({
                message: "Slot ID is required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.delete(`/doctors/availabilities/${slotId}/`),
            "Failed to delete slot"
        );
    },

    // 🔹 Change password
    changePassword: (data) => {
        if (!data?.currentPassword || !data?.newPassword) {
            return Promise.reject({
                message: "Current password and new password are required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.post("/auth/change-password/", {
                old_password: data.currentPassword,
                new_password: data.newPassword,
            }),
            "Failed to change password"
        );
    },

    // 🔹 Get appointments List
    getAppointment: (type, page = 1, pageSize = 10, filters = {}) => {
        if (!type) {
            return Promise.reject({
                message: "Appointment type is required",
                status: 400,
                data: null
            });
        }

        const params = new URLSearchParams({
            type,
            page: String(page),
            page_size: String(pageSize),
        });

        if (filters.search?.trim()) {
            params.append("search", filters.search.trim());
        }
        if (filters.status && filters.status !== "all") {
            params.append("status", filters.status);
        }
        if (filters.appointment_date) {
            params.append("appointment_date", filters.appointment_date);
        }

        return handleApiCall(
            () => API.get(`/doctors/?${params.toString()}`),
            "Failed to fetch appointments"
        );
    },

    updateAppointmentstatus: (appointment_id, data) => {
        if (!appointment_id) {
            return Promise.reject({
                message: "Appointment ID is required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.post(`/doctors/appointments/action/?id=${appointment_id}`, data),
            "Failed to update appointment status"
        );
    },

    getAppointmentDetails: (type, id) => {
        if (!type || !id) {
            return Promise.reject({
                message: "Type and ID are required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.get(`/doctors/?type=${type}&id=${id}`),
            "Failed to fetch appointment details"
        );
    },

    getPatientPackages: (patientId) => {
        if (!patientId) {
            return Promise.reject({
                message: "Patient ID is required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.get(`/packages/doctor/?view=purchases&status=active&patient_id=${patientId}`),
            "Failed to fetch patient packages"
        );
    },

    getAppointmentprec: (pid, id) => {
        return handleApiCall(
            () => API.get(`/doctors/prescription/?patient_id=${pid || ''}&appointment_id=${id || ''}`),
            "Failed to fetch prescription"
        );
    },

    getAppointmentDoc: (type, id) => {
        if (!type || !id) {
            return Promise.reject({
                message: "Type and ID are required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.get(
                `/doctors/appointments/documents/?${type !== "patient"
                    ? `appointment_id=${id}`
                    : `patient_id=${id}`
                }`
            ),
            "Failed to fetch appointment documents"
        );
    },

    uploadAppointmentDocument: (appointmentId, payload) => {
        if (!appointmentId) {
            return Promise.reject({
                message: "Appointment ID is required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.post(
                `/doctors/appointments/documents/?appointment_id=${appointmentId}`,
                payload
            ),
            "Failed to upload appointment document"
        );
    },

    deleteAppointmentDocument: (documentId) => {
        if (!documentId) {
            return Promise.reject({
                message: "Document ID is required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.delete(
                `/doctors/appointments/documents/?document_id=${documentId}`
            ),
            "Failed to Delete appointment document"
        );
    },

    getUpcomingAppointment: () => {
        return handleApiCall(
            () => API.get(`/doctors/appointments/upcoming/`),
            "Failed to fetch upcoming appointments"
        );
    },

    // 🔹 Get Patient List (supports pagination & filters)
    getPatient: (type, page = 1, pageSize = 10, search = "", prakriti = "", gender = "") => {
        if (!type) {
            return Promise.reject({
                message: "Patient type is required",
                status: 400,
                data: null
            });
        }

        try {
            const params = new URLSearchParams({ type });
            if (page) params.append("page", String(page));
            if (pageSize) params.append("page_size", String(pageSize));
            if (search?.trim()) params.append("search", search.trim());
            if (prakriti && prakriti !== "all") params.append("prakriti", prakriti);
            if (gender && gender !== "all") params.append("gender", gender);

            return handleApiCall(
                () => API.get(`/doctors/?${params.toString()}`),
                "Failed to fetch patients"
            );
        } catch (error) {
            return handleServiceError(error, "Error preparing patient request");
        }
    },

    // 🔹 Get single patient details
    getPatientDetails: (patientId) => {
        if (!patientId) {
            return Promise.reject({
                message: "Patient ID is required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.get(`/doctors/?type=patient&id=${patientId}`),
            "Failed to fetch patient details"
        );
    },

    // 🔹 Get search product List
    getProductList: (type) => {
        if (!type) {
            return Promise.reject({
                message: "Search term is required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.get(`/doctors/medicines/search/?search=` + type),
            "Failed to fetch products"
        );
    },

    // 🔹 Add prescription
    postprescription: (type, prescriptionData) => {
        if (!type || !prescriptionData) {
            return Promise.reject({
                message: "Patient ID and prescription data are required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.post(`/doctors/prescription/?patient_id=` + type, prescriptionData),
            "Failed to save prescription"
        );
    },

    editPrescription: (patient_id, prescription_id, prescriptionData) => {
        if (!patient_id || !prescription_id) {
            return Promise.reject({
                message: "Patient ID and prescription ID are required",
                status: 400,
                data: null
            });
        }
        if (!prescriptionData) {
            return Promise.reject({
                message: "Prescription data is required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.put(`/doctors/prescription/?patient_id=${patient_id}&prescription_id=${prescription_id}`, prescriptionData),
            "Failed to edit prescription"
        );
    },

    updatePrescriptionItem: (item_id, itemData) => {
        if (!item_id || !itemData) {
            return Promise.reject({
                message: "Item ID and medicine data are required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.patch(`/doctors/prescription/?item_id=${item_id}`, itemData),
            "Failed to update prescription item"
        );
    },

    getprescribedietplan: (patient_id, patient_diet_plan_id, day) => {
        if (!patient_id) {
            return Promise.reject({
                message: "Patient ID is required",
                status: 400,
                data: null
            });
        }
        const query = new URLSearchParams();
        query.append("patient_id", patient_id);
        if (patient_diet_plan_id) query.append("id", patient_diet_plan_id);
        if (day !== undefined && day !== null && day !== "") query.append("day", day);
        return handleApiCall(
            () => API.get(`/doctors/patient-plans/progress/?${query.toString()}`),
            "Failed to fetch prescribed diet plan"
        );
    },

    postdietplan: (dietPlanData) => {
        if (!dietPlanData) {
            return Promise.reject({
                message: "Diet plan data is required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.post(`/doctors/patient-plans/suggest/`, dietPlanData),
            "Failed to save diet plan"
        );
    },

    replacedietplan: (dietPlanData) => {
        if (!dietPlanData) {
            return Promise.reject({
                message: "Diet plan data is required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.put(`/doctors/patient-plans/replace/`, dietPlanData),
            "Failed to replace diet plan"
        );
    },

    getDosDonts: (prakriti) => {
        const query = new URLSearchParams();
        if (prakriti) query.append("prakriti", prakriti);
        const qs = query.toString();
        return handleApiCall(
            () => API.get(`/doctors/do-donts-templates/${qs ? `?${qs}` : ""}`),
            "Failed to fetch do's and don'ts"
        );
    },

    getDoDontsTemplates: (filters = {}) => {
        const query = new URLSearchParams();
        if (filters.id) query.append("id", filters.id);
        if (filters.prakriti && filters.prakriti !== "all") {
            query.append("prakriti", filters.prakriti);
        }
        if (filters.health_disease_id && filters.health_disease_id !== "all") {
            query.append("health_disease_id", filters.health_disease_id);
        }
        if (filters.page) query.append("page", filters.page);
        const qs = query.toString();
        return handleApiCall(
            () => API.get(`/doctors/do-donts-templates/${qs ? `?${qs}` : ""}`),
            "Failed to fetch do's and don'ts templates"
        );
    },

    createDoDontsTemplate: (payload) => {
        if (!payload) {
            return Promise.reject({
                message: "Template data is required",
                status: 400,
                data: null,
            });
        }
        return handleApiCall(
            () => API.post(`/doctors/do-donts-templates/`, payload),
            "Failed to create do's and don'ts template"
        );
    },

    updateDoDontsTemplate: (id, payload) => {
        if (!id) {
            return Promise.reject({
                message: "Template ID is required",
                status: 400,
                data: null,
            });
        }
        return handleApiCall(
            () => API.patch(`/doctors/do-donts-templates/?id=${id}`, payload),
            "Failed to update do's and don'ts template"
        );
    },

    getDietPlans: (search) => {
        if (!search) {
            return Promise.reject({
                message: "Search term is required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.get(`/diet/plans/?search=${search}`),
            "Failed to fetch diet plan by ID"
        );
    },


    // 🔹 Get patient questions
    questionforpatient: (id) => {
        if (!id) {
            return Promise.reject({
                message: "Patient ID is required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.get(`/doctors/patient-onboarding/?patient_id=` + id),
            "Failed to fetch patient questions"
        );
    },

    // 🔹 Submit patient questions
    questionfillforpatient: (data) => {
        if (!data) {
            return Promise.reject({
                message: "Question data is required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.post(`/doctors/patient-onboarding/`, data),
            "Failed to submit patient questions"
        );
    },


    notificationget: (data) => {
        return handleApiCall(
            () => API.get(`/notifications/?${data.toString()}`),
            "Failed to submit notification"
        );
    },
    // 🔹 Submit Notification
    notificationpost: (notificationId) => {
        if (!notificationId) {
            return Promise.reject({
                message: "Notification data is required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.post(`/notifications/?action=read&notification_id=${notificationId}`),
            "Failed to submit notification"
        );
    },

    // 🔹 Submit Notification all
    notificationpostall: (data) => {
        return handleApiCall(
            () => API.post(`/notifications/?action=${data}&all=true`),
            "Failed to submit notification"
        );
    },

    notificationpostdelete: (notificationId) => {
        if (!notificationId) {
            return Promise.reject({
                message: "Notification data is required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.post(`/notifications/?action=delete&notification_id=${notificationId}`),
            "Failed to submit notification delete"
        );
    },

    adddiet: (payload) => {
        return handleApiCall(
            () => API.post(`/diet/plans/`, payload),
            "Failed to submit diet plan"
        );
    },
    // getdiet: (url) => {
    //     return handleApiCall(
    //         () => API.get(`/diet/plans/?page=` + url),
    //         "Failed to submit diet plan"
    //     );
    // },
    getdietbysearch: (filters = {}) => {
        const query = new URLSearchParams();

        if (typeof filters === "string" || typeof filters === "number") {
            query.append("page", filters);
        } else if (filters && typeof filters === "object") {
            if (filters.page !== undefined && filters.page !== null) {
                query.append("page", filters.page);
            }
            if (filters.search !== undefined && filters.search !== null) {
                if (Array.isArray(filters.search)) {
                    filters.search.forEach((value) => {
                        if (value !== undefined && value !== null && value !== "") {
                            query.append("search", value);
                        }
                    });
                } else if (filters.search !== "") {
                    query.append("search", filters.search);
                }
            }
            if (filters.is_paid !== undefined && filters.is_paid !== null) {
                query.append("is_paid", filters.is_paid);
            }
            if (filters.is_common !== undefined && filters.is_common !== null) {
                query.append("is_common", filters.is_common);
            }
            if (filters.season !== undefined && filters.season !== null && filters.season !== "") {
                query.append("season", filters.season);
            }
        }

        const queryString = query.toString();
        const path = queryString ? `/diet/plans/?${queryString}` : `/diet/plans/`;

        return handleApiCall(
            () => API.get(path),
            "Failed to submit diet plan"
        );
    },
    getdietbyid: (id) => {
        return handleApiCall(
            () => API.get(`/diet/plans/?id=${id}`),
            "Failed to submit diet plan"
        );
    },
    updatediet: (id, payload) => {
        if (!id) {
            return Promise.reject({
                message: "Diet plan ID is required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.patch(`/diet/plans/?id=${id}`, payload),
            "Failed to update diet plan"
        );
    },
    bulkupload: (file) => {
        if (!file) {
            return Promise.reject({
                message: "Excel file is required",
                status: 400,
                data: null,
            });
        }
        try {
            const formData = new FormData();
            formData.append("file", file);
            return handleApiCall(
                () =>
                    API.post(`/diet/plans/bulk-upload/`, formData, {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }),
                "Failed to submit bulk upload"
            );
        } catch (error) {
            return handleServiceError(error, "Failed to prepare bulk upload");
        }
    },
    deletediet: (id) => {
        if (!id) {
            return Promise.reject({
                message: "Diet plan ID is required",
                status: 400,
                data: null
            });
        }
        return handleApiCall(
            () => API.delete(`/diet/plans/?id=${id}`),
            "Failed to delete diet plan"
        );
    }
};