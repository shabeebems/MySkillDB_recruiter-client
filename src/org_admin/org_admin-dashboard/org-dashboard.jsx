import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

// Components
import OrgMenuNavigation from '../../components/org-admin/org-admin-menu_components/OrgMenuNavigation';
import { JobParserModal, JobHunterModal } from '../../components/org-admin/jobs-components';
import DashboardHeader from '../../components/org-admin/dashboard/DashboardHeader';
import QuickActions from '../../components/org-admin/dashboard/QuickActions';
import JobSprints from '../../components/org-admin/dashboard/JobSprints';
import JobBoard from '../../components/org-admin/dashboard/JobBoard';

// API
import { getRequest } from '../../api/apiRequests';

const OrgDashboard = () => {
  const navigate = useNavigate();
  
  // State management
  const organization = useSelector((state) => state.organization);
  const user = useSelector((state) => state.user);
  const organizationId = organization?._id;
  
  const [stats, setStats] = useState({
    departments: 0,
    teachers: organization?.totalTeachers || 0,
    students: organization?.totalStudents || 0,
    coordinators: 0,
    totalJobs: 0
  });
  const [activeMenu, setActiveMenu] = useState('dashboard');
  
  // Job Hunter Modal states
  const [isJobHunterOpen, setIsJobHunterOpen] = useState(false);
  const [isJobParserOpen, setIsJobParserOpen] = useState(false);
  
  // Data states
  const [recentJobs, setRecentJobs] = useState([]);
  const [jobSprints, setJobSprints] = useState([]);
  
  // Notifications dropdown state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Navigation handler
  const handlePageChange = (pageId) => {
    setActiveMenu(pageId);
  };

  // Job Hunter handlers
  const handleOpenJobHunter = () => {
    setIsJobHunterOpen(true);
  };

  const handleOpenParser = () => {
    setIsJobParserOpen(true);
  };

  // Fetch recent jobs
  const fetchRecentJobs = async () => {
    try {
      if (!organizationId) return;

      const response = await getRequest(`/jobs/organization/${organizationId}/latest`);
      if (response.data?.success && response.data?.data) {
        const jobs = response.data.data || [];
        const mappedJobs = jobs.map((job) => ({
          id: job._id,
          title: job.name || job.title || 'Untitled Job',
          company: job.companyName || job.company || 'Company',
          location: job.place || job.location || 'Location',
          date: job.createdAt || job.updatedAt || new Date().toISOString(),
          activeApplicants: job.activeApplicants || job.applicantsCount || 0,
          activeInterviewPlanners: job.activeInterviewPlanners || job.activeSkillPlanners || job.interviewPlannersCount || job.skillPlannersCount || 0
        }));
        setRecentJobs(mappedJobs);
      } else {
        setRecentJobs([]);
      }
    } catch (error) {
      console.error('Error fetching recent jobs:', error);
      setRecentJobs([]);
    }
  };

  // Fetch latest job sprints (limit 3) from API
  const fetchJobSprints = async () => {
    try {
      if (!organizationId) return;

      const response = await getRequest(`/job-sprints/organization/${organizationId}?page=1&limit=3`);

      if (response.data?.success && response.data?.data?.sprints) {
        const apiSprints = response.data.data.sprints || [];

        const mappedSprints = apiSprints.map((sprint) => ({
          _id: sprint._id,
          sprintName: sprint.name || 'Untitled Sprint',
          endDate: sprint.endDate,
          totalStudents: sprint.totalStudents || 0,
          overallCompletionPercent: sprint.completionPercentage ?? 0,
        }));

        setJobSprints(mappedSprints);
      } else {
        setJobSprints([]);
      }
    } catch (error) {
      console.error('Error fetching job sprints:', error);
      setJobSprints([]);
    }
  };

  // Fetch organization data
  const fetchOrganizationData = async () => {
    try {
      if (!organizationId) return;

      const departmentResponse = await getRequest(`/organization-setup/departments/${organizationId}/count`);
      const departmentCount = departmentResponse.data?.success ? departmentResponse.data.data?.count || 0 : 0;

      const jobResponse = await getRequest(`/jobs/organization/${organizationId}/count`);
      const jobCount = jobResponse.data?.success ? jobResponse.data.data?.count || 0 : 0;

      let coordinatorsCount = 0;
      try {
        const coordinatorsResponse = await getRequest(`/users?organizationId=${organizationId}&role=hod`);
        coordinatorsCount = coordinatorsResponse.data?.success && coordinatorsResponse.data?.data?.users 
          ? coordinatorsResponse.data.data.users.length 
          : (coordinatorsResponse.data?.data?.length || 0);
      } catch (coordError) {
        console.error('Error fetching coordinators:', coordError);
      }

      setStats(prevStats => ({
        ...prevStats,
        departments: departmentCount,
        totalJobs: jobCount,
        coordinators: coordinatorsCount
      }));
    } catch (error) {
      console.error('Error fetching organization data:', error);
    }
  };

  useEffect(() => {
    fetchOrganizationData();
    fetchRecentJobs();
    fetchJobSprints();
  }, [organizationId]);

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <Toaster position="top-right" />
      
      {/* Navigation - Hidden when modals are open to reduce visual noise */}
      {!isJobHunterOpen && !isJobParserOpen && (
      <OrgMenuNavigation currentPage={activeMenu} onPageChange={handlePageChange} />
      )}

      {/* Main Content Area */}
      <div className={isJobHunterOpen || isJobParserOpen ? "" : "lg:ml-72"}>
        <div className="min-h-screen flex flex-col pt-14 lg:pt-0">
          
          <DashboardHeader 
            user={user} 
            stats={stats} 
            isNotificationsOpen={isNotificationsOpen}
            setIsNotificationsOpen={setIsNotificationsOpen}
          />

          <main className="flex-1 px-4 md:px-8 py-6 space-y-8 max-w-7xl mx-auto w-full">
            
            <QuickActions onOpenJobHunter={handleOpenJobHunter} />
            
            {jobSprints.length > 0 && (
              <JobSprints sprints={jobSprints} />
            )}

            <JobBoard recentJobs={recentJobs} />

            {/* Reports section */}
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Reports</h2>
                </div>
              <div className="px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button 
                    type="button"
                    onClick={() => navigate('/admin/reports/total-jobs')}
                    className="w-full text-left bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/70 px-5 py-4 transition-colors flex flex-col gap-2 cursor-pointer"
                  >
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Jobs
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      Total Jobs Report
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/admin/reports/job-sprint')}
                    className="w-full text-left bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/70 px-5 py-4 transition-colors flex flex-col gap-2 cursor-pointer"
                  >
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Sprints
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      Sprint Performance Report
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/admin/reports/student-metrics')}
                    className="w-full text-left bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/70 px-5 py-4 transition-colors flex flex-col gap-2 cursor-pointer"
                  >
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Students
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      Student Metrics Report
                    </p>
                  </button>
                </div>
              </div>
            </section>
        </main>

          {/* Simple Footer */}
          <footer className="py-6 border-t border-slate-200 mt-auto bg-white">
            <div className="px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <p>© {new Date().getFullYear()} {organization?.name || 'MySkillDB'}. All rights reserved.</p>
              <div className="flex items-center gap-6">
                <a href="#" className="hover:text-slate-800 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-slate-800 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-slate-800 transition-colors">Support</a>
              </div>
            </div>
          </footer>

          </div>
      </div>

      {/* Modals */}
      <JobHunterModal
        isOpen={isJobHunterOpen}
        onClose={() => setIsJobHunterOpen(false)}
        onOpenParser={handleOpenParser}
      />

      <JobParserModal
        isOpen={isJobParserOpen}
        onClose={() => setIsJobParserOpen(false)}
        onBack={() => setIsJobHunterOpen(true)}
        organizationId={organizationId}
      />
    </div>
  );
};

export default OrgDashboard;
