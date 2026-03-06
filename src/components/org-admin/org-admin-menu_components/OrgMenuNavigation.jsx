import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { logoutRequest } from "../../../api/apiRequests";
import { useSelector, useDispatch } from "react-redux";
import { clearUser } from "../../../redux/userSlice";
import "../../../styles/design-system.css";

const OrgMenuNavigation = ({ currentPage, onPageChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const org = useSelector((state) => state.organization);
  
  // Menu structure
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: "fas fa-tachometer-alt",
      color: "blue",
    },
    { 
      id: "jobs",
      label: "Jobs",
      icon: "fas fa-briefcase",
      color: "orange",
    },
    {
      id: 'studio',
      label: 'Job Studio',
      icon: 'fas fa-film',
      color: 'indigo',
    },
    {
      id: "job-sprint-manager",
      label: "Job Sprint",
      icon: "fas fa-tasks",
      color: "purple",
    },
    {
      id: 'skills-academics',
      label: 'Skills & Academics',
      icon: 'fas fa-graduation-cap',
      color: 'teal',
      subItems: [
        {
          id: "topic-management",
          label: "Topic Management",
          icon: "fas fa-tags",
        },
        {
          id: "classroom-sessions",
          label: "Classroom Recordings",
          icon: "fas fa-video",
        },
        {
          id: "test-management",
          label: "Test Management",
          icon: "fas fa-clipboard-check",
        },
        {
          id: "study-plan-maker",
          label: "Study Plan Maker",
          icon: "fas fa-book-reader",
        }
      ],
    },
    {
      id: 'classrooms',
      label: 'Classroom Setup',
      icon: 'fas fa-school',
      color: 'green',
      subItems: [
        { id: 'view-classrooms', label: 'Class Setup', icon: 'fas fa-list' },
        { id: 'define-subjects', label: 'Subjects & Teachers', icon: 'fas fa-book' }
      ]
    },
    {
      id: 'access-management',
      label: 'Access Management',
      icon: 'fas fa-key',
      color: 'indigo',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: 'fas fa-chart-bar',
      color: 'red',
      subItems: [
        {
          id: 'total-jobs-report',
          label: 'Total Jobs Report',
          icon: 'fas fa-briefcase',
        },
        {
          id: 'job-sprint-report',
          label: 'Job Sprint Reports',
          icon: 'fas fa-tasks',
        },
        {
          id: 'student-metrics-report',
          label: 'Student Metrics Report',
          icon: 'fas fa-user-graduate',
        },
      ],
    },
    {
      id: 'email-hr',
      label: 'Email HR',
      icon: 'fas fa-envelope',
      color: 'blue',
    },
    {
      id: 'virtual-sessions',
      label: 'Virtual Sessions',
      icon: 'fas fa-video',
      color: 'purple',
    },
    {
      id: 'profile-designer',
      label: 'Profile Designer',
      icon: 'fas fa-pen-to-square',
      color: 'blue',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: 'fas fa-user-circle',
      color: 'teal',
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

  // Navigation handler
  const handlePageChange = (pageId, parentId = null) => {
    onPageChange(pageId);

    // Route mapping
    const routes = {
      dashboard: "/admin/dashboard",
      "view-classrooms": "/admin/classrooms/view",
      "define-subjects": "/admin/classrooms/subjects",
      "topic-management": "/admin/skills/topics",
      "classroom-sessions": "/admin/skills/classroom-recordings",
      "test-management": "/admin/tests/manage",
      "study-plan-maker": "/admin/skills/study-plan-maker",
      "jobs": "/admin/jobs",
      "job-sprint-manager": "/admin/job-sprint",
      "access-management": "/admin/access/manage",
      "user-creation": "/admin/access/create-user",
      "total-jobs-report": "/admin/reports/total-jobs",
      "job-sprint-report": "/admin/reports/job-sprint",
      "student-metrics-report": "/admin/reports/student-metrics",
      "email-hr": "/admin/email-hr",
      "virtual-sessions": "/admin/virtual-sessions",
      "studio": "/admin/studio",
      "profile-designer": "/admin/profile-designer",
      "profile": "/admin/profile",
    };

    // If it's a submenu item, navigate directly and close mobile menu
    if (parentId) {
      if (routes[pageId]) {
        try {
          navigate(routes[pageId]);
          setIsMobileMenuOpen(false);
        } catch (error) {
          console.error('Navigation error:', error);
          toast.error('Failed to navigate');
        }
      }
      // Ensure parent menu stays expanded
      setExpandedMenus((prev) => ({
        ...prev,
        [parentId]: true,
      }));
    } else {
      // This is a main menu item
      const menuItem = menuItems.find((item) => item.id === pageId);
      if (menuItem && menuItem.subItems) {
        // Just toggle the accordion - don't navigate and don't close menu
        setExpandedMenus((prev) => ({
          ...prev,
          [pageId]: !prev[pageId],
        }));

        // Update the current page to the main menu item for visual feedback
        onPageChange(pageId);
      } else {
        // Regular menu item without submenus - navigate directly and close menu
        if (routes[pageId]) {
          try {
            navigate(routes[pageId]);
            setIsMobileMenuOpen(false);
          } catch (error) {
            console.error('Navigation error:', error);
            toast.error('Failed to navigate');
          }
        }
      }
    }
  };

  const handleReportIssue = () => {
    const phoneNumber = '8618344784';
    const predefinedMessage = encodeURIComponent(
      `Hello, I would like to report an issue with MySkillDB Organization Admin Portal.\n\n` +
      `User: ${user?.name || 'Organization Admin'}\n` +
      `Email: ${user?.email || 'N/A'}\n` +
      `Organization: ${org?.name || 'N/A'}\n\n` +
      `Issue Description:\n[Please describe your issue here]`
    );
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${predefinedMessage}`;
    window.open(whatsappUrl, '_blank');
    toast.success('Opening WhatsApp to report issue...');
    setIsMobileMenuOpen(false);
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
    };
    return colors[color] || 'text-slate-600';
  };

  // Get current page display name
  const currentPageName = useMemo(() => {
    if (!currentPage) return 'MySkillDB';
    
    // First check if it's a submenu item
    for (const menuItem of menuItems) {
      if (menuItem.subItems) {
        const foundSubItem = menuItem.subItems.find(sub => sub.id === currentPage);
        if (foundSubItem) {
          return foundSubItem.label;
        }
      }
    }
    
    // If not a submenu, check main menu items
    const foundMainItem = menuItems.find(menuItem => menuItem.id === currentPage);
    if (foundMainItem) {
      return foundMainItem.label;
    }
    
    // Fallback to MySkillDB if page not found
    return 'MySkillDB';
  }, [currentPage]);

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
            {/* <i className="fas fa-graduation-cap text-blue-600 text-sm"></i> */}
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
              <p className="text-[9px] text-gray-500 font-medium mt-0.5">{org?.name || 'Admin'} Panel</p>
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
                  {item.id === 'studio' && (
                    <span className="bg-purple-100 text-purple-700 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <i className="fas fa-robot text-[8px]"></i>
                      <span>AI</span>
                    </span>
                  )}
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
                          {(subItem.id === 'test-management' || subItem.id === 'topic-management' || subItem.id === 'study-plan-maker') && (
                            <span className="ml-auto bg-purple-100 text-purple-700 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                              <i className="fas fa-robot text-[8px]"></i>
                              <span>AI</span>
                            </span>
                          )}
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
              src={user?.profilePicture || "https://api.dicebear.com/8.x/initials/svg?seed=Org+Admin"}
              alt="Admin Profile"
              className="w-10 h-10 rounded-xl border border-gray-200 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {user?.name || "Organization Admin"}
              </p>
              <p className="text-[10px] text-gray-500 font-medium">Admin User</p>
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

export default OrgMenuNavigation;