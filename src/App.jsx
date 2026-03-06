import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login/login.jsx';
import MasterLayout from './master/MasterLayout.jsx';
import MasterDashboard from './master/dashboard/master_dashboard.jsx';
import LocationManager from './master/location-manager/location_manager.jsx';
import OrgDashboard from './org_admin/org_admin-dashboard/org-dashboard.jsx';
import AdminClassManage from './org_admin/class_management/admin_class_manage.jsx';
import AdminSubjectAssign from './org_admin/subject_assign/admin_subject_assign.jsx';
import AdminAccessManage from './org_admin/access_management/admin_access_manage.jsx';
import TopicManagement from './org_admin/skills_and_academics/topics/topic_management.jsx';
import AdminClassroomRecordings from './org_admin/skills_and_academics/classroom_recordings/classroom_recordings.jsx';
import Jobs from './org_admin/jobs/jobs.jsx';
import TestManagement from './org_admin/skills_and_academics/tests/test_management.jsx';
import StudyPlanMaker from './org_admin/skills_and_academics/study_plan_maker/study_plan_maker.jsx';
import MasterOrganizationSetup from './master/organization-setup/organization-setup.jsx';
import OrganizationLoginManager from './master/login-create/organization_login.jsx';
import AuthWrapper from './wrappers/AuthWrapper.jsx';
import ProtectedWrapper from './wrappers/ProtectedWrapper.jsx';
import StudentDashboard from './student_user/dashboard/student_dashboard.jsx';
import MyCourses from './student_user/courses/my_courses.jsx';
import JobBoard from './student_user/job_board/job_board.jsx';
import InterviewPlanner from './student_user/interview_planner/interview_planner.jsx';
import Contacts from './student_user/contacts/contacts.jsx';
import StudentWorkspace from './student_user/workspace/student_workspace.jsx';
import StudentProfile from './student_user/profile/student_profile.jsx';
import Sprint from './student_user/sprint/sprint.jsx';
import OrgAdminProfile from './org_admin/org_admin_profile/org_admin_profile.jsx';
import AdminProfileDesigner from './org_admin/profile_designer/ProfileDesigner.jsx';
import JobSprintManager from './org_admin/job_sprint/JobSprintManager.jsx';
import EmailHR from './org_admin/email_hr/email_hr.jsx';
import EmailHrView from './email_hr/EmailHrView.jsx';
import VirtualSessions from './org_admin/virtual_sessions/virtual_sessions.jsx';
import TotalJobsReport from './org_admin/reports/TotalJobsReport.jsx';
import JobSprintReport from './org_admin/reports/JobSprintReport.jsx';
import StudentMetricsReport from './org_admin/reports/StudentMetricsReport.jsx';
import ProductCenter from './org_admin/product_center/product_center.jsx';
import JobApplicantList from './org_admin/job_applicant_list/job_applicant_list.jsx';
import Studio from './org_admin/studio/Studio.jsx';
import ModuleGenerationNotifier from './components/app-global/ModuleGenerationNotifier.jsx';
import ModuleGenerationProgressTracker from './components/app-global/ModuleGenerationProgressTracker.jsx';
import PWAInstallPrompt from './components/app-global/PWAInstallPrompt.jsx';
import ForgotPassword from './forgot_password/ForgotPassword.jsx';
import ResetPassword from './forgot_password/ResetPassword.jsx';

function App() {
  return (
    <BrowserRouter>
      <ModuleGenerationNotifier />
      <ModuleGenerationProgressTracker />
      <PWAInstallPrompt />
      <Routes>
        {/* Public routes (login/register) */}
        <Route element={<AuthWrapper />}>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/email_hr/:id" element={<EmailHrView />} />
        </Route>

        {/* Master admin protected routes */}
        <Route element={<ProtectedWrapper allowedRoles={["master_admin"]} />}>
          <Route path="/master" element={<MasterLayout />}>
            <Route index element={<Navigate to="/master/dashboard" replace />} />
            <Route path="dashboard" element={<MasterDashboard />} />
            <Route path="organization-setup" element={<MasterOrganizationSetup />} />
            <Route path="organization-logins" element={<OrganizationLoginManager />} />
            <Route path="location-manager" element={<LocationManager />} />
          </Route>
        </Route>

        {/* Organization admin protected routes */}
        <Route element={<ProtectedWrapper allowedRoles={["org_admin"]} />}>
          <Route path="/admin/dashboard" element={<OrgDashboard />} />
          <Route path="/admin/classrooms/view" element={<AdminClassManage />} />
          <Route path="/admin/classrooms/subjects" element={<AdminSubjectAssign />} />
          <Route path="/admin/access/manage" element={<AdminAccessManage />} />
          <Route path="/admin/skills/topics" element={<TopicManagement />} />
          <Route path="/admin/skills/classroom-recordings" element={<AdminClassroomRecordings />} />
          <Route path="/admin/skills/study-plan-maker" element={<StudyPlanMaker />} />
          <Route path="/admin/jobs" element={<Jobs />} />
          <Route path="/admin/job-sprint" element={<JobSprintManager />} />
          <Route path="/admin/tests/manage" element={<TestManagement />} />
          <Route path="/admin/reports/total-jobs" element={<TotalJobsReport />} />
          <Route path="/admin/reports/job-sprint" element={<JobSprintReport />} />
          <Route path="/admin/reports/student-metrics" element={<StudentMetricsReport />} />
          <Route path="/admin/product-center" element={<ProductCenter />} />
          <Route path="/admin/job-applicant-list" element={<JobApplicantList />} />
          <Route path="/admin/email-hr" element={<EmailHR />} />
          <Route path="/admin/virtual-sessions" element={<VirtualSessions />} />
          <Route path="/admin/studio" element={<Studio />} />
          <Route path="/admin/profile-designer" element={<AdminProfileDesigner />} />
          <Route path="/admin/profile" element={<OrgAdminProfile />} />
        </Route>

        <Route element={<ProtectedWrapper allowedRoles={["student"]} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/courses" element={<MyCourses />} />
          <Route path="/student/jobs" element={<JobBoard />} />
          <Route path="/student/interview-planner" element={<InterviewPlanner />} />
          <Route path="/student/contacts" element={<Contacts />} />
          <Route path="/student/workspace" element={<StudentWorkspace />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/sprint" element={<Sprint />} />
          <Route path="/student/settings" element={<StudentDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
