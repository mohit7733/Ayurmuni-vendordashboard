import React, { useEffect, useState } from "react";
import "./sidebar.css";
import "../components/shared/vendor-shared.css";
import logo from "../../Assests/logo/logo.svg";
import shortLogo from "../../Assests/logo/short_logo.svg";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Layers,
  Image,
  BookOpen,
  Package,
  LayoutDashboard,
  ShoppingCart,
  Wallet,
  Star,
  LifeBuoy,
  Settings,
  BarChart3,
  Tag,
} from "lucide-react";

const MENU_ITEMS = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/vendor/dashboard" },
  {
    name: "Products",
    icon: Package,
    path: "/vendor/products",
    match: ["/vendor/products", "/vendor/new-product", "/vendor/edit-product"],
  },
  { name: "Stock Management", icon: Layers, path: "/vendor/stock" },
  { name: "Banners", icon: Image, path: "/vendor/banners" }, 
  { name: "Catalog", icon: BookOpen, path: "/vendor/catalog" },
  { name: "Orders", icon: ShoppingCart, path: "/vendor/orders", match: ["/vendor/orders", "/vendor/customers"] },
  { name: "Finance", icon: Wallet, path: "/vendor/finance", match: ["/vendor/finance"], soon: true },
  { name: "Ratings", icon: Star, path: "/vendor/ratings" },
  { name: "Analytics", icon: BarChart3, path: "/vendor/analytics", soon: true },
  { name: "Coupons", icon: Tag, path: "/vendor/coupons", soon: true },
];

const GENERAL_ITEMS = [
  { name: "Help & Support", icon: LifeBuoy, path: "/vendor/help-support" },
  { name: "Settings", icon: Settings, path: "/vendor/settings" },
];

function isItemActive(location, item) {
  if (item.match) {
    return item.match.some((prefix) => location.pathname.startsWith(prefix));
  }
  return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
}

function getInitialSidebarCollapsed() {
  try {
    return localStorage.getItem("vendor:sidebar:collapsed") === "1";
  } catch {
    return false;
  }
}

if (typeof document !== "undefined") {
  document.documentElement.style.setProperty(
    "--sidebar-width",
    getInitialSidebarCollapsed() ? "72px" : "260px"
  );
}

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [itsverify, setitsverify] = useState(false);
  const [collapsed, setCollapsed] = useState(getInitialSidebarCollapsed);

  useEffect(() => {
    setitsverify(JSON.parse(sessionStorage.getItem("profile"))?.verify);
  }, []);

  useEffect(() => {
    // Size from commit 800a03c (HEAD~1): 260px / 72px
    const width = collapsed ? "72px" : "260px";
    document.documentElement.style.setProperty("--sidebar-width", width);
    try {
      localStorage.setItem("vendor:sidebar:collapsed", collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  const renderMenu = (items) =>
    items.map((item) => {
      const isActive = isItemActive(location, item);
      const Icon = item.icon;

      return (
        <button
          key={item.name}
          type="button"
          className={`sidebar-item ${isActive ? "sidebar-item--active" : ""}`}
          onClick={() => item.path && navigate(item.path)}
          title={collapsed ? item.name : undefined}
          aria-current={isActive ? "page" : undefined}
        >
          <span className="sidebar-item__icon">
            <Icon size={18} strokeWidth={isActive ? 2.25 : 2} />
          </span>
          {!collapsed && (
            <span className="sidebar-item__label">
              {item.name}
              {item.soon && <span className="sidebar-item__soon">Soon</span>}
            </span>
          )}
        </button>
      );
    });

  return (
    <aside className={`vendor-sidebar ${collapsed ? "vendor-sidebar--collapsed" : ""}`} aria-label="Vendor navigation">
      <div className="vendor-sidebar__logo">
        <img src={collapsed ? shortLogo : logo} alt="Ayurmuni" className="vendor-sidebar__logo-img" />
        <button
          type="button"
          className="vendor-sidebar__toggle ds-focus"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {itsverify ? (
        <nav className="vendor-sidebar__nav">
          <p className="vendor-sidebar__section">{!collapsed && "Menu"}</p>
          <div className="vendor-sidebar__group">{renderMenu(MENU_ITEMS)}</div>

          <p className="vendor-sidebar__section">{!collapsed && "General"}</p>
          <div className="vendor-sidebar__group">{renderMenu(GENERAL_ITEMS)}</div>
        </nav>
      ) : (
        <div className="vendor-sidebar__pending">
          <div className="vendor-sidebar__pending-icon">
            <Clock3 size={collapsed ? 24 : 32} />
          </div>
          {!collapsed && (
            <>
              <h3>Verification Pending</h3>
              <p>Your profile is under review.</p>
              <button type="button" onClick={() => navigate("/vendor/help-support")}>
                Contact Support
              </button>
            </>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
