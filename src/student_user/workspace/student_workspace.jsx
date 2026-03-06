import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StudentMenuNavigation from '../../components/student-user/student-menu-components/StudentMenuNavigation';
import {
  ScriptsList,
  VideosSection,
  CertificatesList,
  TestimonialsList,
  LinkedInPostsList,
  VideoCvsList
} from '../../components/student-user/workspace-components';

const VALID_TABS = ['videoCvs', 'scripts', 'videos', 'certificates', 'testimonials', 'linkedin'];

const StudentWorkspace = () => {
  const [currentPage, setCurrentPage] = useState('workspace');
  const location = useLocation();
  const navigate = useNavigate();

  // Get tab from URL query parameter, default to 'videoCvs'
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    return VALID_TABS.includes(tab) ? tab : 'videoCvs';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Update active tab when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    const newTab = VALID_TABS.includes(tab) ? tab : 'videoCvs';
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.search, activeTab]);

  // Handle tab change - update both state and URL
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/student/workspace?tab=${tabId}`, { replace: true });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const tabs = [
    { id: 'videoCvs', label: 'Video CVs', icon: 'fas fa-video', color: 'rose' },
    { id: 'scripts', label: 'Scripts', icon: 'fas fa-file-alt', color: 'purple' },
    { id: 'videos', label: 'Videos', icon: 'fas fa-video', color: 'red' },
    { id: 'certificates', label: 'Certificates', icon: 'fas fa-certificate', color: 'green' },
    { id: 'testimonials', label: 'Testimonials', icon: 'fas fa-quote-left', color: 'cyan' },
    { id: 'linkedin', label: 'LinkedIn Posts', icon: 'fab fa-linkedin', color: 'blue' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <StudentMenuNavigation currentPage={currentPage} onPageChange={handlePageChange} />

      <div className="lg:ml-72 p-4 sm:p-6 lg:p-8 pt-16 sm:pt-16 lg:pt-8">
        {/* Header (hidden on mobile) */}
        <div className="mb-6 hidden lg:block">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-black/5">
              <i className="fas fa-briefcase text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight mb-1">Workspace</h1>
              <p className="text-sm text-neutral-500 font-medium">
                Your productivity hub for scripts, tests, and videos
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 bg-white/90 backdrop-blur-xl rounded-2xl shadow-sm ring-1 ring-black/5 p-2 overflow-x-auto">
          <div className="flex flex-nowrap gap-2 min-w-max">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const gradients = {
                purple: 'from-purple-500 to-indigo-600',
                blue: 'from-blue-500 to-cyan-600',
                red: 'from-rose-500 to-red-600',
                cyan: 'from-cyan-500 to-teal-600',
                green: 'from-emerald-500 to-green-600',
                rose: 'from-rose-500 to-pink-600',
              };
              const textColors = {
                purple: 'text-purple-600',
                blue: 'text-blue-600',
                red: 'text-rose-600',
                cyan: 'text-cyan-600',
                green: 'text-emerald-600',
                rose: 'text-rose-600',
              };
              const activeGradient = gradients[tab.color] || 'from-indigo-500 to-purple-600';
              const iconClass = isActive ? 'text-white' : textColors[tab.color] || 'text-indigo-600';
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    min-w-[120px] px-4 py-3 rounded-xl font-semibold transition-all
                    flex items-center justify-center gap-2 text-sm sm:text-base
                    ${isActive 
                      ? `bg-gradient-to-r ${activeGradient} text-white shadow-md ring-1 ring-black/10` 
                      : `bg-white text-neutral-600 hover:bg-neutral-50 ring-1 ring-neutral-200`}
                  `}
                >
                  <i className={`${tab.icon} ${iconClass} text-sm`}></i>
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          {activeTab === 'scripts' && <ScriptsList />}
          {activeTab === 'videos' && <VideosSection />}
          {activeTab === 'certificates' && <CertificatesList />}
          {activeTab === 'testimonials' && <TestimonialsList />}
          {activeTab === 'linkedin' && <LinkedInPostsList />}
          {activeTab === 'videoCvs' && <VideoCvsList />}
        </div>
      </div>
    </div>
  );
};

export default StudentWorkspace;

