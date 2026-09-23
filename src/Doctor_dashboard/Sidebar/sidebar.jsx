import React, { useEffect, useState } from "react";
import "./sidebar.css";
import logo from "../../Assests/logo/logo.svg";
import { useNavigate, useLocation } from "react-router-dom";

import {
  DashboardIcon,
  Appointment,
  Patients,
  FinanceIcon,
  HelpIcons,
  SettingIcon,
  Message,
  Bowlrice,
} from "./Icons";
import { Clock3, ListChecks } from "lucide-react";

const AVAILABILITY_ICON = Appointment;

const DoctorSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [itsverify, setitsverify] = useState(false);
  const [collapsed] = useState(false);
  const isdietitian = sessionStorage.getItem("profile") ? JSON.parse(sessionStorage.getItem("profile")).is_dietitian : false;

  const menuItems = [
    { name: "Dashboard", icon: <DashboardIcon />, path: "/doctor/dashboard" },
    { name: "Availability", icon: <AVAILABILITY_ICON />, path: "/doctor/availability" },
    { name: "Appointment", icon: <Appointment />, path: "/doctor/appointments" },
    { name: "Patients", icon: <Patients />, path: "/doctor/patients" },
    { name: "Messanger", icon: <Message />, path: "/doctor/messenger" },
    // { name: "Earnings", icon: <FinanceIcon />, path: "/doctor/earnings" },
    isdietitian && {
      name: "Diets",
      icon: <Bowlrice />,
      path: "/doctor/diets",
    },
    isdietitian &&  {
      name: "Do's & Don'ts",
      icon: <ListChecks size={18} />,
      path: "/doctor/do-donts",
    },
    {
      name: "Reviews & Feedback",
      icon: <FinanceIcon />,
      path: "/doctor/reviews",
    },
  ].filter(Boolean);

  const generalItems = [
    // { name: "Help & Support", icon: <HelpIcons />, path: "/doctor/help-support" },
    { name: "Settings", icon: <SettingIcon />, path: "/doctor/profile?tab=settings" },
  ];

  const syncVerifyStatus = () => {
    try {
      const profile = JSON.parse(sessionStorage.getItem("profile") || "null");
      setitsverify(Boolean(profile?.verify));
    } catch {
      setitsverify(false);
    }
  };

  useEffect(() => {
    syncVerifyStatus();
    const onStorage = (e) => {
      if (e.key === "profile") syncVerifyStatus();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [location.pathname]);

  const isPathActive = (path) => {
    const basePath = path.split("?")[0];
    if (basePath === "/doctor/dashboard") return location.pathname === basePath;
    if (basePath === "/doctor/do-donts") {
      return location.pathname.includes("do-donts");
    }
    return location.pathname === basePath || location.pathname.startsWith(`${basePath}/`);
  };

  const renderMenu = (items) =>
    items.map((item) => {
      const isActive = isPathActive(item.path);
      return (
        <div
          key={item.name}
          className={`menu-item ${isActive ? "active" : ""}`}
          onClick={() => navigate(item.path)}
        >
          <span className="icon">{item.icon}</span>
          {!collapsed && <span className="label">{item.name}</span>}
        </div>
      );
    });

  return (
    <>
      <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="logo">
          <img src={logo} alt="Ayurmuni-logo" />
        </div>

        {itsverify ? (
          <div className="menu">
            <p className="menu-title">MENU</p>
            {renderMenu(menuItems)}
            <p className="menu-title">GENERAL</p>
            {renderMenu(generalItems)}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-amber-200 m-2 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-2 shadow-sm">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-inner">
              <Clock3 size={38} />
            </div>

            {!collapsed && (
              <>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-800">Verification Pending</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Your profile is currently under review by the AyurMuni verification team.
                  </p>
                </div>

                <div className="mt-5 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                  <span className="text-sm font-medium text-gray-500">Estimated Approval Time</span>
                  <br />
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    12 - 24 Hours
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                    <p className="text-sm text-gray-600">Verification process in progress</p>
                  </div>
                </div>

                <button
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0D614E] px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#094c3d] hover:shadow-lg"
                  onClick={() => navigate("/doctor/help-support")}
                >
                  Contact Support
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default DoctorSidebar;
