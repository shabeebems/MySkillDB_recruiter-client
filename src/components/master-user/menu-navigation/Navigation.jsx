import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { logoutRequest } from "../../../api/apiRequests";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../../../redux/userSlice";
import "../../../styles/design-system.css";

const Navigation = ({ currentPage = "dashboard", onPageChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);

  const menuItems = [
    {
      id: "dashboard",
      label: "Master Dashboard",
      icon: "fas fa-chart-pie",
      path: "/master-dashboard",
      color: "indigo",
    },
    {
      id: "location-manager",
      label: "Location Manager",
      icon: "fas fa-globe-americas",
      path: "/location-manager",
      color: "indigo",
    },
    {
      id: "organization-setup",
      label: "Organization Class Setup",
      icon: "fas fa-graduation-cap",
      path: "/organization-setup",
      color: "emerald",
    },
    {
      id: "organization-logins",
      label: "Organization Logins",
      icon: "fas fa-user-lock",
      path: "/organization-logins",
      color: "teal",
    },
  ];

  const handleMenuClick = (itemId) => {
    if (onPageChange) {
      onPageChange(itemId);
    }

    // Navigate to the appropriate route
    const routes = {
      dashboard: "/master/dashboard",
      "location-manager": "/master/location-manager",
      "organization-setup": "/master/organization-setup",
      "organization-logins": "/master/organization-logins",
    };

    if (routes[itemId]) {
      try {
        navigate(routes[itemId]);
        setIsMobileMenuOpen(false);
      } catch (error) {
        console.error('Navigation error:', error);
        toast.error('Failed to navigate');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutRequest("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch(clearUser());
      navigate(`/login`);
    }
  };

  // Color to icon color mapping
  const getIconColor = (color) => {
    const colors = {
      green: 'text-emerald-600',
      indigo: 'text-indigo-600',
      purple: 'text-purple-600',
      red: 'text-rose-600',
      blue: 'text-blue-600',
      teal: 'text-teal-600',
      orange: 'text-orange-600',
      emerald: 'text-emerald-600',
    };
    return colors[color] || 'text-slate-600';
  };

  // Get current page display name
  const currentPageName = useMemo(() => {
    if (!currentPage) return 'MySkillDB';
    
    const foundItem = menuItems.find(item => item.id === currentPage);
    if (foundItem) {
      return foundItem.label;
    }
    
    return 'MySkillDB';
  }, [currentPage, menuItems]);

  return (
    <>
      {/* Mobile Top Navigation Bar - Fixed */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[60] h-14 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-4 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-purple-100/70 hover:bg-purple-200/80 active:scale-95 transition-all text-purple-700"
            aria-label="Open Menu"
          >
            <i className="fas fa-bars text-lg"></i>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 tracking-tight">{currentPageName}</span>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-[70] transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Navigation Sidebar - Apple Style */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-[80] w-72 bg-white/95 backdrop-blur-2xl border-r border-gray-200/50 flex flex-col shadow-2xl transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1)
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:z-40 lg:bg-white/80
        `}
        style={{
          boxShadow: isMobileMenuOpen ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : '',
        }}
      >
        {/* Header Section */}
        <div className="px-4 py-4 border-b border-gray-200/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fas fa-graduation-cap text-blue-600 text-base"></i>
            <div>
              <h1 className="text-sm font-semibold text-gray-900 tracking-tight">MySkillDB</h1>
              <p className="text-[9px] text-gray-500 font-medium mt-0.5">Master Admin Panel</p>
            </div>
          </div>
          <button
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close Menu"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-2.5 apple-scrollbar">
          {menuItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <div key={item.id} className="mb-1">
                {/* Main Menu Item */}
                <button
                  onClick={() => handleMenuClick(item.id)}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200
                    ${
                      isActive
                        ? 'bg-blue-50/60 text-blue-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50/60 font-medium'
                    }
                  `}
                >
                  <i className={`${item.icon} ${isActive ? getIconColor(item.color) : getIconColor(item.color)} text-sm w-5 text-center`}></i>
                  <span className="flex-1 text-sm">{item.label}</span>
                </button>
              </div>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-3 border-t border-gray-200/50 bg-gray-50/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src={user?.profilePicture || "https://api.dicebear.com/8.x/initials/svg?seed=Master+Admin"}
              alt="Admin Profile"
              className="w-10 h-10 rounded-xl border border-gray-200 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {user?.name || "Master Admin"}
              </p>
              <p className="text-[10px] text-gray-500 font-medium">System Administrator</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200/60 transition-colors"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt text-gray-500 text-xs"></i>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Navigation;
