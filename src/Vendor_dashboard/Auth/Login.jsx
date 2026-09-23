// pages/Auth/AuthPage.jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import banner from "../../Assests/banner/login_banner.png";
import logo from "../../Assests/logo/short_logo.svg";
import { authService } from "../../services/authService";
import "./login.css";
import { AlertTriangle } from "lucide-react";

// ==============================
// SVG Components
// ==============================
const LeafDecor = ({ className }) => (
  <svg
    className={`leaf-decor ${className}`}
    width="80"
    height="80"
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M10 70 Q20 20 70 10 Q60 50 10 70Z" fill="#2d7a4f" opacity="0.15" />
    <path d="M10 70 Q40 40 70 10" stroke="#2d7a4f" strokeWidth="1" opacity="0.3" fill="none" />
  </svg>
);

// ==============================
// Custom Hooks
// ==============================
const useAuthAnimation = () => {
  const [animationState, setAnimationState] = useState("enter");
  const [direction, setDirection] = useState("right");

  const triggerAnimation = useCallback((newDirection) => {
    setDirection(newDirection);
    setAnimationState("exit");
    setTimeout(() => setAnimationState("enter"), 350);
  }, []);

  return { animationState, direction, triggerAnimation };
};

// ==============================
// OTP Input Component
// ==============================
// const OtpInput = ({ onVerify, onBack, mobile, loading, onResendOtp, resendLoading, otpData, setselectrole }) => {
//   const [otp, setOtp] = useState(["", "", "", ""]);
//   const [error, setError] = useState("");
//   const inputRefs = useRef([]);


//   const handleChange = (index, value) => {
//     if (value.length > 1) return;

//     const newOtp = [...otp];
//     newOtp[index] = value;
//     setOtp(newOtp);
//     setError("");

//     if (value && index < 3) {
//       inputRefs.current[index + 1]?.focus();
//     }
//   };

//   const handleKeyDown = (index, e) => {
//     if (e.key === "Backspace" && !otp[index] && index > 0) {
//       inputRefs.current[index - 1]?.focus();
//     }
//   };

//   const handleSubmit = () => {
//     const otpValue = otp.join("");
//     if (otpValue.length !== 4) {
//       setError("Please enter complete 4-digit OTP");
//       return;
//     }
//     onVerify(otpValue);
//   };

//   const handleResend = () => {
//     if (onResendOtp) {
//       setOtp(["", "", "", ""]);
//       inputRefs.current[0]?.focus();
//       onResendOtp();
//     }
//   };

//   return (
//     <div className="auth-form">
//       <div className="otp-header">
//         <button onClick={onBack} className="otp-back-btn" type="button">
//           ← Back
//         </button>
//       </div>

//       <div className="otp-input-container">
//         {otp.map((digit, index) => (
//           <input
//             key={index}
//             ref={(el) => (inputRefs.current[index] = el)}
//             type="text"
//             inputMode="numeric"
//             pattern="[0-9]*"
//             maxLength="1"
//             value={digit}
//             onChange={(e) => handleChange(index, e.target.value)}
//             onKeyDown={(e) => handleKeyDown(index, e)}
//             className={`otp-input ${error ? "otp-input--error" : ""}`}
//             autoFocus={index === 0}
//             aria-label={`OTP digit ${index + 1}`}
//           />
//         ))}
//       </div>

//       {error && <span className="card__error otp-error" role="alert">{error}</span>}
//       {otpData?.data?.user_roles?.length > 0 && (
//         <div className="role-select-wrap">
//           <label className="auth-card__label">
//             Are you a doctor or a vendor?
//           </label>

//           <div className="auth-card__input-wrap">
//             <select
//               onChange={(e) =>
//                 setselectrole(e.target.value)
//               }
//               defaultValue={otpData?.data?.user_roles[0]}
//               className={`auth-card__input`}
//               disabled={loading}
//               aria-label="Select role"
//             >
//               <option value="">Select Role</option>

//               {otpData?.data?.user_roles?.map((role, index) =>
//                 role != "customer" && (
//                   <option key={index} value={role}>
//                     {role.charAt(0).toUpperCase() + role.slice(1)}
//                   </option>
//                 ))}
//             </select>

//             {/* {errors?.role && (
//               <span className="card__error" role="alert">
//                 {errors.role}
//               </span>
//             )} */}
//           </div>
//         </div>
//       )}
//       <button
//         onClick={handleSubmit}
//         disabled={loading}
//         className="auth-card__btn"
//         type="button"
//       >
//         {loading ? (
//           <><span className="auth-card__spinner" aria-hidden="true" /> Verifying...</>
//         ) : (
//           "Verify OTP"
//         )}
//       </button>

//       <p className="otp-resend">
//         Didn't receive OTP?{" "}
//         <button
//           onClick={handleResend}
//           className="otp-resend-link"
//           disabled={resendLoading}
//           type="button"
//         >
//           {resendLoading ? "Sending..." : "Resend"}
//         </button>
//       </p>
//     </div>
//   );
// };

const OtpInput = ({ onVerify, onBack, mobile, loading, onResendOtp, resendLoading, otpData, setselectrole, activeTab }) => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);

  // Auto-fill OTP from response for development
  useEffect(() => {
    console.log(otpData);

    if (otpData?.data?.otp) {
      const otpString = String(otpData.data.otp);
      if (otpString.length === 4) {
        const otpArray = otpString.split('');
        setOtp(otpArray);

        // Optional: Auto-verify after a short delay
        // This helps speed up development testing
        // setTimeout(() => {
        //   onVerify(otpString);
        // }, 500);
      }
    }
  }, [otpData]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 4) {
      setError("Please enter complete 4-digit OTP");
      return;
    }
    onVerify(otpValue);
  };

  const handleResend = () => {
    if (onResendOtp) {
      setOtp(["", "", "", ""]);
      inputRefs.current[0]?.focus();
      onResendOtp();
    }
  };

  return (
    <div className="auth-form">
      <div className="otp-header">
        <button onClick={onBack} className="otp-back-btn" type="button">
          ← Back
        </button>
      </div>

      <div className="otp-input-container">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength="1"
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`otp-input ${error ? "otp-input--error" : ""}`}
            autoFocus={index === 0}
            aria-label={`OTP digit ${index + 1}`}
          />
        ))}
      </div>

      {error && <span className="card__error otp-error" role="alert">{error}</span>}
      {otpData?.data?.user_roles?.length > 0 && activeTab === "login" && (
        <div className="role-select-wrap">
          <label className="auth-card__label">
            Are you a doctor or a vendor?
          </label>

          <div className="auth-card__input-wrap">
            <select
              onChange={(e) =>
                setselectrole(e.target.value)
              }
              defaultValue={otpData?.data?.user_roles[0]}
              className={`auth-card__input`}
              disabled={loading}
              aria-label="Select role"
            >
              <option value="">Select Role</option>

              {otpData?.data?.user_roles?.map((role, index) =>
                role != "customer" && (
                  <option key={index} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="auth-card__btn"
        type="button"
      >
        {loading ? (
          <><span className="auth-card__spinner" aria-hidden="true" /> Verifying...</>
        ) : (
          "Verify OTP"
        )}
      </button>

      <p className="otp-resend">
        Didn't receive OTP?{" "}
        <button
          onClick={handleResend}
          className="otp-resend-link"
          disabled={resendLoading}
          type="button"
        >
          {resendLoading ? "Sending..." : "Resend"}
        </button>
      </p>
    </div>
  );
};

// ==============================
// Login Form Component
// ==============================
const LoginForm = ({ onSubmit }) => {
  const [mobile, setMobile] = useState("");
  const [keepSigned, setKeepSigned] = useState(false);
  const [error, setError] = useState("");
  const [loading, setloading] = useState(false)

  const validateMobile = (value) => {
    if (!value.trim()) return "Please enter your mobile number";
    if (!/^[0-9]{10}$/.test(value)) return "Please enter a valid 10-digit mobile number";
    return null;
  };

  const handleSubmit = () => {
    setloading(true)
    const validationError = validateMobile(mobile);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    onSubmit(mobile, keepSigned);
    setTimeout(() => {
      setloading(false)
    }, 2000);
  };

  return (
    <div className="auth-form">
      <label className="auth-card__label">Mobile Number</label>
      <div className="auth-card__input-wrap">
        <input
          type="tel"
          inputMode="numeric"
          value={mobile}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, "").slice(0, 10);
            setMobile(value);
            setError("");
          }}
          placeholder="9876543210"
          className={`auth-card__input ${error ? "auth-card__input--error" : ""}`}
          disabled={loading}
          aria-label="Mobile number"
        />
        {error && <span className="card__error" role="alert">{error}</span>}
      </div>

      <label className="auth-card__keep">
        <div
          onClick={() => !loading && setKeepSigned(v => !v)}
          className={`auth-card__checkbox ${keepSigned ? "auth-card__checkbox--checked" : ""}`}
          role="checkbox"
          aria-checked={keepSigned}
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && !loading && setKeepSigned(v => !v)}
        >
          {keepSigned && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span className="auth-card__keep-text">Keep me signed in</span>
      </label>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="auth-card__btn"
        type="button"
      >
        {loading ? (
          <><span className="auth-card__spinner" aria-hidden="true" /> Sending OTP...</>
        ) : (
          "Get OTP"
        )}
      </button>
    </div>
  );
};

// ==============================
// Register Form Component
// ==============================
const RegisterForm = ({ onSubmit, loading }) => {
  const [form, setForm] = useState({ mobile: "", role: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!form.mobile.trim()) newErrors.mobile = "Please enter your mobile number";
    else if (!/^[0-9]{10}$/.test(form.mobile)) newErrors.mobile = "Mobile must be 10 digits";
    if (!form.role) newErrors.role = "Please select a role";
    return newErrors;
  };

  const handleSubmit = () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    onSubmit(form.mobile, form.role);
  };

  const handleFieldChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="auth-form">
      <div>
        <label className="auth-card__label">Mobile Number</label>
        <div className="auth-card__input-wrap">
          <input
            type="tel"
            inputMode="numeric"
            value={form.mobile}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 10);
              handleFieldChange("mobile", value);
            }}
            placeholder="9876543210"
            className={`auth-card__input ${errors.mobile ? "auth-card__input--error" : ""}`}
            disabled={loading}
            aria-label="Mobile number"
          />
          {errors.mobile && <span className="card__error" role="alert">{errors.mobile}</span>}
        </div>
      </div>

      <div>
        <label className="auth-card__label">Are you a doctor or a vendor?</label>
        <div className="auth-card__input-wrap">
          <select
            onChange={(e) => handleFieldChange("role", e.target.value)}
            value={form.role}
            className={`auth-card__input ${errors.role ? "auth-card__input--error" : ""}`}
            disabled={loading}
            aria-label="Select role"
          >
            <option value="">Select Role</option>
            <option value="doctor">Doctor</option>
            <option value="vendor">Vendor</option>
          </select>
          {errors.role && <span className="card__error" role="alert">{errors.role}</span>}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="auth-card__btn"
        type="button"
      >
        {loading ? (
          <><span className="auth-card__spinner" aria-hidden="true" /> Sending OTP...</>
        ) : (
          "Get Started"
        )}
      </button>
    </div>
  );
};

// ==============================
// Banner Component
// ==============================
const Banner = ({ activeTab, showBannerHint, animationState, direction, switchTab }) => (
  <div className={`auth-banner ${animationState === "exit" ? `auth-banner--exit-${direction}` : "auth-banner--enter"}`}>
    <img
      src={banner}
      alt="Natural cosmetics banner"
      className="auth-banner__img"
      onError={(e) => { e.target.style.display = "none"; }}
      loading="lazy"
    />
    <div className="auth-banner__overlay" aria-hidden="true" />

    <div
      className={`auth-banner__tab-hint ${showBannerHint ? "auth-banner__tab-hint--show" : "auth-banner__tab-hint--hide"}`}
      role="tablist"
      aria-label="Authentication options"
    >
      <span
        role="tab"
        aria-selected={activeTab === "login"}
        className={activeTab === "login" ? "active" : ""}
        onClick={() => switchTab("login")}
        onKeyDown={(e) => e.key === "Enter" && switchTab("login")}
        tabIndex={0}
      >
        Sign In
      </span>
      <span
        role="tab"
        aria-selected={activeTab === "register"}
        className={activeTab === "register" ? "active" : ""}
        onClick={() => switchTab("register")}
        onKeyDown={(e) => e.key === "Enter" && switchTab("register")}
        tabIndex={0}
      >
        Register
      </span>
    </div>

    <div className="auth-banner__watermark" aria-hidden="true">Pure Nature · Est. 2019</div>
  </div>
);

// ==============================
// Form Card Component
// ==============================
const FormCard = ({
  activeTab, animationState, direction, switchTab,
  showOtp, mobile, onVerifyOtp, onBack, otpLoading,
  onSendOtp, onRegister, resendLoading, onResendOtp, otpData, setselectrole
}) => (
  <div className="auth-form-panel">
    <LeafDecor className="leaf-decor--top-right" />
    <LeafDecor className="leaf-decor--bottom-left" />

    <div className="auth-card">
      <div className={`auth-card__logo-wrap ${animationState === "exit" ? `auth-card__logo-wrap--exit-${direction}` : "auth-card__logo-wrap--enter"}`}>
        <img src={logo} alt="Ayurmuni Logo" className="auth-card__logo" loading="lazy" />
      </div>

      <div className={`auth-card__header ${animationState === "exit" ? `auth-card__header--exit-${direction}` : "auth-card__header--enter"}`}>
        <h1 className="auth-card__title">
          {showOtp ? "Verify OTP" : (activeTab === "login" ? "Welcome Back" : "Create Account")}
        </h1>
        <p className="auth-card__subtitle">
          {showOtp
            ? `Enter the 4-digit code sent to +91 ${mobile}`
            : (activeTab === "login"
              ? "Enter your mobile number to get OTP"
              : "Join us and start your natural wellness journey.")}
        </p>
      </div>

      <div className={`auth-card__form-wrap ${animationState === "exit" ? `auth-card__form-wrap--exit-${direction}` : "auth-card__form-wrap--enter"}`}>
        {showOtp ? (
          <OtpInput
            onVerify={onVerifyOtp}
            onBack={onBack}
            mobile={mobile}
            loading={otpLoading}
            onResendOtp={onResendOtp}
            resendLoading={resendLoading}
            otpData={otpData}
            setselectrole={setselectrole}
            activeTab={activeTab}
          />
        ) : activeTab === "login" ? (
          <LoginForm onSubmit={onSendOtp} loading={false} />
        ) : (
          <RegisterForm onSubmit={onRegister} loading={false} />
        )}
      </div>

      <div className={`auth-card__footer ${animationState === "exit" ? `auth-card__footer--exit-${direction}` : "auth-card__footer--enter"}`}>
        {activeTab === "login" ? (
          <>Don't have an account?{" "}
            <button
              className="auth-card__footer-link"
              onClick={() => switchTab("register")}
              type="button"
            >
              Get Started
            </button>
          </>
        ) : (
          <>Already have an account?{" "}
            <button
              className="auth-card__footer-link"
              onClick={() => switchTab("login")}
              type="button"
            >
              Sign In
            </button>
          </>
        )}
      </div>
    </div>
  </div>
);

// ==============================
// Main Auth Page Component
// ==============================
export default function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");
  const [showBannerHint, setShowBannerHint] = useState(true);
  const [showOtp, setShowOtp] = useState(false);
  const [mobile, setMobile] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [otpData, setOtpData] = useState(null);
  const [selectrole, setselectrole] = useState("");

  // Loading states
  const [sendOtpLoading, setSendOtpLoading] = useState(false);
  const [verifyOtpLoading, setVerifyOtpLoading] = useState(false);
  const [resendOtpLoading, setResendOtpLoading] = useState(false);
  const [deleteAccountActive, setdeleteAccountActive] = useState(false)
  const { animationState, direction, triggerAnimation } = useAuthAnimation();

  const switchTab = useCallback((tab) => {
    if (tab === activeTab || animationState === "exit") return;
    triggerAnimation(tab === "register" ? "right" : "left");
    setShowOtp(false);
    setMobile("");
    setSelectedRole("");
    setselectrole("")
    setOtpData(null);
    setTimeout(() => setActiveTab(tab), 350);
  }, [activeTab, animationState, triggerAnimation]);

  const handleSendOtp = async (userMobile, keepSigned = false) => {
    setSendOtpLoading(true);
    try {
      const response = await authService.SendOtp({
        phone_number: `+91${userMobile}`,
        login: true
      });

      if (response?.data?.success) {
        const userRoles = response?.data?.data?.user_roles || [];
        const hasValidRole = userRoles.some(r => r === "doctor" || r === "vendor");

        if (activeTab === "register") {
          if (hasValidRole) {
            toast.error("User already exists. Please login instead.");
            return;
          }
        } else if (activeTab === "login") {
          if (!hasValidRole) {
            toast.error("User does not exist. Please register first.");
            return;
          }
        }

        toast.success("OTP sent successfully");
        setOtpData(response.data);
        setselectrole(response.data?.data?.user_roles[0])
        setMobile(userMobile);
        setShowOtp(true);
        if (keepSigned) {
          sessionStorage.setItem("keepSignedIn", "true");
        }
      } else {
        toast.error(response?.data?.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      const errorMessage = error?.response?.data?.message || "Failed to send OTP. Please try again.";
      toast.error(errorMessage);
    } finally {
      setSendOtpLoading(false);
    }
  };

  const handleRegister = async (userMobile, role) => {
    setSendOtpLoading(true);
    try {
      const response = await authService.SendOtp({ phone_number: `+91${userMobile}` });

      if (response?.data?.success) {
        const userRoles = response?.data?.data?.user_roles || [];
        if (userRoles.some(r => r === role)) {
          toast.error("User already exists. Please login instead.");
          return;
        }

        setOtpData(response.data);
        setSelectedRole(role);
        setMobile(userMobile);
        setShowOtp(true);
        toast.success("OTP sent successfully");
      } else {
        toast.error(response?.data?.message || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Register error:", error);
      toast.error(error?.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setSendOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (otp) => {
    setVerifyOtpLoading(true);

    try {
      let response;
      const userRole = selectrole || selectedRole;
      if (activeTab === "register") {
        response = await authService.register({
          phone_number: `+91${mobile}`,
          otp,
          role: userRole,
        });
      } else {


        response = await authService.login({
          phone_number: `+91${mobile}`,
          otp,
          role: userRole,
        });
      }

      if (response?.data?.success) {
        const data = response?.data?.data;
        if (data?.access && !data?.is_deleted) {
          sessionStorage.setItem("accessToken", data.access);
        }
        if (data?.refresh) {
          sessionStorage.setItem("refreshToken", data.refresh);
        }
        // Role
        const userRole =
          activeTab === "register"
            ? selectedRole
            : selectrole;

        sessionStorage.setItem("role", userRole);
        sessionStorage.setItem("user_mobile", mobile);
        sessionStorage.setItem(
          "profile",
          JSON.stringify({
            ...data?.profile,
            email: data?.profile?.business_email || data?.profile?.email || "",
            first_name: data?.profile?.business_name || data?.profile?.first_name || "",
            verify: data?.is_verified,
            is_dietitian: data?.is_dietitian || false,
            policies_accepted: data?.policies_accepted || false,
          })
        );

        if (data?.is_deleted) {
          setdeleteAccountActive(true);
          if (data?.access) {
            sessionStorage.setItem("restoreToken", data.access);
          }
          return
        }
        toast.success(
          activeTab === "register"
            ? "Registration successful!"
            : "Login successful!"
        );

        // Check onboarding
        const hasCompletedProfile =
          (data?.profile?.email &&
            data?.profile?.email.trim() !== "") || (data?.profile?.business_email &&
              data?.profile?.business_email.trim() !== "");

        const redirectPath = hasCompletedProfile
          ? userRole === "doctor"
            ? "/doctor/dashboard"
            : "/vendor/dashboard"
          : userRole === "doctor"
            ? "/doctor/onboarding"
            : "/vendor/onboarding";

        // Wait for storage update
        setTimeout(() => {
          if (activeTab === "register") {
            window.location.replace((userRole === "doctor"
              ? "/doctor/onboarding"
              : "/vendor/onboarding"))
          } else {
            window.location.replace(redirectPath)
          }
        }, 1000);

      } else {
        toast.error(
          response?.data?.message ||
          "Invalid OTP. Please try again."
        );
      }
    } catch (error) {
      console.error("Verify OTP error:", error);

      const errorMessage =
        error?.response?.data?.message ||
        "Verification failed. Please try again.";

      // toast.error(errorMessage);
    } finally {
      setVerifyOtpLoading(false);
    }
  };

  const handleRestoreAccount = async () => {
    try {
      const response = await authService.restoreAccount({
        "role": selectrole
      });
      sessionStorage.setItem("accessToken", sessionStorage.getItem("restoreToken"));
      sessionStorage.removeItem("restoreToken")
      window.location.reload()
      setdeleteAccountActive(false)
    } catch (error) {
      console.error("Restore error:", error);
      const errorMessage = error?.response?.data?.message || "Restore failed. Please try again.";
      toast.error(errorMessage);
    }
  }

  const handleResendOtp = async () => {
    if (!mobile) return;

    setResendOtpLoading(true);
    try {
      const response = await authService.SendOtp({ phone_number: `+91${mobile}` });
      if (response?.data?.success) {
        toast.success("OTP resent successfully");
        setOtpData(response.data);
      } else {
        toast.error(response?.data?.message || "Failed to resend OTP");
      }
    } catch (error) {
      toast.error("Failed to resend OTP. Please try again.");
    } finally {
      setResendOtpLoading(false);
    }
  };

  const handleBack = () => {
    setShowOtp(false);
    setMobile("");
    setSelectedRole("");
    setOtpData(null);
  };

  useEffect(() => {
    setShowBannerHint(false);
    const timer = setTimeout(() => setShowBannerHint(true), 150);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Check for existing session
  useEffect(() => {
    const token = sessionStorage.getItem("accessToken");
    const role = sessionStorage.getItem("role");
    if (token && role) {
      const path = role === "doctor" ? "/doctor/dashboard" : "/vendor/dashboard";
      navigate(path);
    }
  }, [navigate]);

  const isLoginActive = activeTab === "login";
  const isLoading = sendOtpLoading || verifyOtpLoading || resendOtpLoading;

  return (
    <div className="auth-wrapper">
      {isLoginActive ? (
        <>
          <Banner
            activeTab={activeTab}
            showBannerHint={showBannerHint}
            animationState={animationState}
            direction={direction}
            switchTab={switchTab}
          />
          <FormCard
            activeTab={activeTab}
            animationState={animationState}
            direction={direction}
            switchTab={switchTab}
            showOtp={showOtp}
            mobile={mobile}
            onVerifyOtp={handleVerifyOtp}
            onBack={handleBack}
            otpLoading={verifyOtpLoading}
            onSendOtp={handleSendOtp}
            onRegister={handleRegister}
            resendLoading={resendOtpLoading}
            onResendOtp={handleResendOtp}
            otpData={otpData}
            setselectrole={setselectrole}
          />
        </>
      ) : (
        <>
          <FormCard
            activeTab={activeTab}
            animationState={animationState}
            direction={direction}
            switchTab={switchTab}
            showOtp={showOtp}
            mobile={mobile}
            onVerifyOtp={handleVerifyOtp}
            onBack={handleBack}
            otpLoading={verifyOtpLoading}
            onSendOtp={handleSendOtp}
            onRegister={handleRegister}
            resendLoading={resendOtpLoading}
            onResendOtp={handleResendOtp}
            otpData={otpData}
          />
          <Banner
            activeTab={activeTab}
            showBannerHint={showBannerHint}
            animationState={animationState}
            direction={direction}
            switchTab={switchTab}
          />
        </>
      )}
      {deleteAccountActive && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 w-full max-w-xl z-50">

          <div className="flex items-center gap-4 bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-300 rounded-2xl shadow-lg p-4">

            {/* Icon */}
            <div className="w-12 h-12 flex items-center justify-center bg-yellow-200 rounded-full">
              <AlertTriangle className="text-yellow-700" size={22} />
            </div>

            {/* Content */}
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-800">
                Account Deactivated
              </h4>
              <p className="text-xs text-gray-600">
                Your account is currently inactive. You can restore it anytime to continue using services.
              </p>
            </div>

            {/* Action */}
            <button
              onClick={handleRestoreAccount}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg shadow transition"
            >
              Restore
            </button>
            <button
              onClick={() => {
                sessionStorage.clear()
                setdeleteAccountActive(false)
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg shadow transition"
            >
              Cancel
            </button>

          </div>
        </div>
      )}
    </div>
  );
}