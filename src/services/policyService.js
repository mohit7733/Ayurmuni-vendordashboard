import API from "./api";

const BASE_URL = process.env.REACT_APP_API_BASE;

function extractPolicy(payload, policyType) {
  const data = payload?.data;
  if (Array.isArray(data)) {
    return data.find((item) => item?.policy_type === policyType) || null;
  }
  if (Array.isArray(data?.policies)) {
    const match = data.policies.find(
      (item) => item?.policy?.policy_type === policyType || item?.policy_type === policyType
    );
    return match?.policy || match || null;
  }
  if (data && typeof data === "object") return data?.policy || data;
  return null;
}

export async function getLegalPolicy(policyType) {
  try {
    const response = await API.get(`${BASE_URL}/policies/legal/required/`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
      params: { policy_type: policyType },
    });
    return extractPolicy(response.data, policyType) || response.data?.data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Unable to load this policy right now.";
    throw new Error(message);
  }
}

export async function getRequiredLegalPolicies() {
  try {
    const response = await API.get(`${BASE_URL}/policies/legal/required/`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });
    return response.data?.data || null;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Unable to load required policies right now.";
    throw new Error(message);
  }
}

export async function acceptLegalPolicies(type = "all") {
  try {
    const response = await API.post(
      `${BASE_URL}/policies/legal/accept/`,
      { type },
      {
        headers: {
          "ngrok-skip-browser-warning": "true",
        },
      }
    );
    return response.data;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Unable to accept policies right now.";
    throw new Error(message);
  }
}

export async function getRequiredconfigurationsPolicies(type) {
  try {
    const response = await API.get(`${BASE_URL}/policies/legal/configurations/?policy_type=${type}`, {
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });
    return response.data?.data || null;
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Unable to load required policies right now.";
    throw new Error(message);
  }
}



