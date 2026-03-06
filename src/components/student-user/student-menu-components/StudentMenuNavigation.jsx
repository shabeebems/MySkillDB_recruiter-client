import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { logoutRequest } from '../../../api/apiRequests';
import { useDispatch, useSelector } from 'react-redux';
import { clearUser } from '../../../redux/userSlice';
import '../../../styles/design-system.css';

const StudentMenuNavigation = ({ currentPage, onPageChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);

  const menuItems = [
    {
      id: 'home',
      label: 'Home',
      icon: 'fas fa-home',
      color: 'green',
      route: '/student/dashboard'
    },
    {
      id: 'job-board',
      label: 'Job Board',
      icon: 'fas fa-briefcase',
      color: 'indigo',
      route: '/student/jobs'
    },
    {
      id: 'interview-planner-main',
      label: 'Interview Planner',
      icon: 'fas fa-bullseye',
      color: 'purple',
      route: '/student/interview-planner'
    },
    {
      id: 'sprint',
      label: 'Sprint',
      icon: 'fas fa-running',
      color: 'red',
      route: '/student/sprint'
    },
    {
      id: 'my-courses-main',
      label: 'My Courses',
      icon: 'fas fa-graduation-cap',
      color: 'blue',
      route: '/student/courses'
    },
    {
      id: 'contact-main',
      label: 'Contact',
      icon: 'fas fa-address-book',
      color: 'teal',
      route: '/student/contacts'
    },
    {
      id: 'workspace',
      label: 'Workspace',
      icon: 'fas fa-briefcase',
      color: 'indigo',
      route: '/student/workspace'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: 'fas fa-user-circle',
      color: 'teal',
      route: '/student/profile'
    },
  ];

  // Auto-expand parent menu when submenu is active
  React.useEffect(() => {
    const activeSubmenuParent = menuItems.find(
      (item) =>
        item.subItems &&
        item.subItems.some((subItem) => subItem.id === currentPage)
    );

    if (activeSubmenuParent) {
      setExpandedMenus((prev) => ({
        ...prev,
        [activeSubmenuParent.id]: true,
      }));
    }
  }, [currentPage]);

  const handlePageChange = (pageId, parentId = null) => {
    onPageChange(pageId);

    // If it's a submenu item, navigate directly but keep parent menu open
    if (parentId) {
      const parentItem = menuItems.find((item) => item.id === parentId);
      const subItem = parentItem?.subItems?.find((item) => item.id === pageId);
      
      if (subItem && subItem.route) {
        navigate(subItem.route);
        setIsMobileMenuOpen(false);
      }
      // Ensure parent menu stays expanded
      setExpandedMenus((prev) => ({
        ...prev,
        [parentId]: true,
      }));
      setIsMobileMenuOpen(false);
    } else {
      // This is a main menu item
      const menuItem = menuItems.find((item) => item.id === pageId);
      if (menuItem && menuItem.subItems) {
        // Just toggle the accordion - don't navigate automatically
        setExpandedMenus((prev) => ({
          ...prev,
          [pageId]: !prev[pageId],
        }));
      } else {
        // Regular menu item without submenus - navigate directly
        if (menuItem && menuItem.route) {
          navigate(menuItem.route);
        }
        setIsMobileMenuOpen(false);
      }
    }
  };

  const handleReportIssue = () => {
    const phoneNumber = '8618344784';
    const predefinedMessage = encodeURIComponent(
      `Hello, I would like to report an issue with MySkillDB Student Portal.\n\n` +
      `User: ${user?.name || 'Student User'}\n` +
      `Email: ${user?.email || 'N/A'}\n\n` +
      `Issue Description:\n[Please describe your issue here]`
    );
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${predefinedMessage}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp to report issue...');
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logoutRequest('/auth/logout');
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch(clearUser());
      navigate('/login');
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
    };
    return colors[color] || 'text-slate-600';
  };

  // Get current page display name
  const currentPageName = useMemo(() => {
    if (!currentPage) {
      // Fallback: try to match by route pathname
      const routeMatch = menuItems.find(item => item.route === location.pathname);
      if (routeMatch) return routeMatch.label;
      return 'MySkillDB';
    }
    
    // First check if it's a submenu item
    for (const item of menuItems) {
      if (item.subItems) {
        const subItem = item.subItems.find(sub => sub.id === currentPage);
        if (subItem) {
          return subItem.label;
        }
      }
    }
    
    // If not a submenu, check main menu items
    const mainItem = menuItems.find(item => item.id === currentPage);
    if (mainItem) {
      return mainItem.label;
    }
    
    // Fallback: try to match by route pathname
    const routeMatch = menuItems.find(item => item.route === location.pathname);
    if (routeMatch) return routeMatch.label;
    
    // Final fallback to MySkillDB if page not found
    return 'MySkillDB';
  }, [currentPage, location.pathname]);

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
            <i className="fas fa-graduation-cap text-indigo-600 text-sm"></i>
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
            <i className="fas fa-graduation-cap text-indigo-600 text-base"></i>
              <div>
              <h1 className="text-sm font-semibold text-gray-900 tracking-tight">MySkillDB</h1>
              <p className="text-[9px] text-gray-500 font-medium mt-0.5">Student Portal</p>
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
            const isRouteActive = location.pathname === item.route;
            const isActive = currentPage === item.id || isRouteActive;
            const isExpanded = expandedMenus[item.id];
            const hasActiveSubmenu =
              item.subItems &&
              item.subItems.some((subItem) => currentPage === subItem.id);

            return (
              <div key={item.id} className="mb-1">
                {/* Main Menu Item */}
                <button
                  onClick={() => handlePageChange(item.id)}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200
                    ${
                      isActive || hasActiveSubmenu
                        ? 'bg-blue-50/60 text-blue-600 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50/60 font-medium'
                    }
                  `}
                >
                  <i className={`${item.icon} ${isActive || hasActiveSubmenu ? getIconColor(item.color) : getIconColor(item.color)} text-sm w-5 text-center`}></i>
                  <span className="flex-1 text-sm">{item.label}</span>
                  {item.subItems && (
                    <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-[10px] text-gray-400 transition-transform duration-200`}></i>
                  )}
                </button>

                {/* Sub Menu Items */}
                {item.subItems && isExpanded && (
                  <div className="ml-2.5 mt-1.5 space-y-0.5 animate-slide-down">
                    {item.subItems.map((subItem) => {
                      const isSubActive = currentPage === subItem.id;
                      return (
                        <button
                          key={subItem.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePageChange(subItem.id, item.id);
                          }}
                          className={`
                            w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-all duration-200
                            ${
                              isSubActive
                                ? 'bg-blue-50/60 text-blue-600 font-semibold'
                                : 'text-gray-600 hover:bg-gray-50/60 font-medium'
                            }
                          `}
                        >
                          <i className={`${subItem.icon} w-4 text-center text-[11px] text-gray-500`}></i>
                          <span>{subItem.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Report Issue Button Section */}
        <div className="px-2.5 pb-2">
          <button
            onClick={handleReportIssue}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50/60 font-medium text-xs"
          >
            <i className="fab fa-whatsapp text-sm"></i>
            <span>Report Issue</span>
          </button>
        </div>

        {/* User Profile Section */}
        <div className="p-3 border-t border-gray-200/50 bg-gray-50/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src={user?.profilePicture || "https://api.dicebear.com/8.x/initials/svg?seed=Student"}
              alt="Student Profile"
              className="w-10 h-10 rounded-xl border border-gray-200 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {user?.name || "Student User"}
              </p>
              <p className="text-[10px] text-gray-500 font-medium">Student</p>
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

export default StudentMenuNavigation;
