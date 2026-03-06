import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { getRequest, putRequest, postRequest, deleteRequest } from '../../api/apiRequests';
import { setUser } from '../../redux/userSlice';
import ImageCropper from '../../components/common/ImageCropper';
import OrgMenuNavigation from '../../components/org-admin/org-admin-menu_components/OrgMenuNavigation.jsx';
import JobCVProfileView from '../../components/student-user/profile-designer/JobCVProfileView.jsx';

export default function AdminProfileDesigner() {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState('profile-designer');
  const [activeMenu, setActiveMenu] = useState('profile-designer');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    linkedin: '',
    github: '',
    portfolio: '',
    aboutMe: '',
    emailIcon: 'far fa-envelope',
    phoneIcon: 'fas fa-mobile-alt',
    addressIcon: 'fas fa-map-marker-alt',
    emailIconColor: '#6b7280',
    phoneIconColor: '#6b7280',
    addressIconColor: '#6b7280',
    education: [],
    workExperience: [],
    projects: [],
    certificates: [],
    customSections: [],
  });

  const [jobs, setJobs] = useState([]);
  const [selectedJobIdForAts, setSelectedJobIdForAts] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(0); // 0 = Standard layout, 1-8 = templates

  const fetchCVData = async () => {
    try {
      const [profileResponse, educationResponse, experienceResponse, projectsResponse, certificatesResponse, styleResponse] = await Promise.all([
        getRequest('/cv/profile'),
        getRequest('/cv/education'),
        getRequest('/cv/experience'),
        getRequest('/cv/project'),
        getRequest('/cv/certificate'),
        getRequest('/cv/style-preferences').catch(() => ({ data: { data: null } })),
      ]);
      const cvProfile = profileResponse.data.data;
      const education = educationResponse.data.data || [];
      const experience = experienceResponse.data.data || [];
      const projects = projectsResponse.data.data || [];
      const certificates = certificatesResponse.data.data || [];
      const stylePrefs = styleResponse?.data?.data || {};

      setProfile((prev) => ({
        ...prev,
        ...stylePrefs,
        fullName: cvProfile?.name || '',
        email: cvProfile?.email || '',
        phone: cvProfile?.mobile || '',
        address: cvProfile?.address || '',
        linkedin: cvProfile?.linkedIn || '',
        github: cvProfile?.github || '',
        portfolio: cvProfile?.portfolio || '',
        aboutMe: cvProfile?.aboutMe || '',
        emailIcon: cvProfile?.emailIcon || 'far fa-envelope',
        phoneIcon: cvProfile?.phoneIcon || 'fas fa-mobile-alt',
        addressIcon: cvProfile?.addressIcon || 'fas fa-map-marker-alt',
        emailIconColor: cvProfile?.emailIconColor || '#6b7280',
        phoneIconColor: cvProfile?.phoneIconColor || '#6b7280',
        addressIconColor: cvProfile?.addressIconColor || '#6b7280',
        linkedinIconColor: cvProfile?.linkedinIconColor || '#6b7280',
        githubIconColor: cvProfile?.githubIconColor || '#6b7280',
        portfolioIconColor: cvProfile?.portfolioIconColor || '#6b7280',
        sectionOrder: cvProfile?.sectionOrder || [],
        skills: cvProfile?.skills || [],
        customSections: cvProfile?.customSections || [],
        education: education.map((edu) => ({
          id: edu._id,
          degree: edu.title,
          institution: edu.institution,
          location: edu.location,
          startYear: edu.startYear,
          endYear: edu.endYear,
          gpa: edu.gpa || '',
        })),
        workExperience: experience.map((exp) => ({
          id: exp._id,
          title: exp.jobTitle,
          company: exp.company,
          location: exp.location,
          startDate: exp.startDate,
          endDate: exp.endDate || '',
          current: exp.isCurrent,
          description: exp.description,
        })),
        projects: projects.map((proj) => ({
          id: proj._id,
          title: proj.title,
          type: proj.type,
          startDate: proj.startDate,
          endDate: proj.endDate,
          description: proj.description,
        })),
        certificates: certificates.map((cert) => ({
          id: cert._id,
          title: cert.title,
          issuer: cert.issuer,
          year: cert.year,
        })),
      }));
    } catch (error) {
      console.error('[AdminProfileDesigner] Error fetching CV data:', error);
    }
  };

  const fetchJobsList = async () => {
    try {
      if (!user?._id) return;
      const response = await getRequest('/interview-planner');
      if (!response.data?.success || !response.data?.data) {
        setJobs([]);
        return;
      }
      const plannerEntries = response.data.data || [];
      const transformedJobs = plannerEntries.map((plannerEntry) => {
        const jobId = plannerEntry.jobId?._id || plannerEntry.jobId;
        const jobData = plannerEntry.jobId || {};
        return {
          id: jobId,
          _id: jobId,
          title: jobData.name || jobData.title || 'Job Title',
          company: jobData.companyName || jobData.company || 'Company',
          location: jobData.place || jobData.location || 'Location',
          jobType: jobData.jobType || 'Full-time',
          skills: [],
        };
      });
      setJobs(transformedJobs);
    } catch (error) {
      console.error('[AdminProfileDesigner] Error fetching jobs:', error);
      toast.error('Failed to load jobs');
      setJobs([]);
    }
  };

  useEffect(() => {
    if (user?._id) {
      Promise.all([fetchJobsList(), fetchCVData()]).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user?._id]);

  const handlePageChange = (page) => setCurrentPage(page);

  const handleUpdateProfile = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const addEducation = async () => {
    setProfile((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          id: `temp-${Date.now()}`,
          degree: '',
          institution: '',
          location: '',
          startYear: '',
          endYear: '',
          gpa: '',
        },
      ],
    }));
  };

  const removeEducation = async (id) => {
    if (id.startsWith('temp-')) {
      setProfile((prev) => ({ ...prev, education: prev.education.filter((e) => e.id !== id) }));
      return;
    }
    try {
      await deleteRequest(`/cv/education/${id}`);
      setProfile((prev) => ({ ...prev, education: prev.education.filter((e) => e.id !== id) }));
      toast.success('Education removed successfully');
    } catch (error) {
      toast.error('Failed to remove education');
    }
  };

  const updateEducation = async (id, field, value) => {
    const updated = profile.education.map((e) => (e.id === id ? { ...e, [field]: value } : e));
    setProfile((prev) => ({ ...prev, education: updated }));
    if (!id.startsWith('temp-')) {
      const edu = updated.find((e) => e.id === id);
      if (edu) {
        try {
          await putRequest(`/cv/education/${id}`, {
            title: edu.degree,
            institution: edu.institution,
            location: edu.location,
            startYear: edu.startYear,
            endYear: edu.endYear,
            gpa: edu.gpa,
          });
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const addWorkExperience = async () => {
    setProfile((prev) => ({
      ...prev,
      workExperience: [
        ...prev.workExperience,
        {
          id: `temp-${Date.now()}`,
          title: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          current: false,
          description: '',
        },
      ],
    }));
  };

  const removeWorkExperience = async (id) => {
    if (id.startsWith('temp-')) {
      setProfile((prev) => ({ ...prev, workExperience: prev.workExperience.filter((e) => e.id !== id) }));
      return;
    }
    try {
      await deleteRequest(`/cv/experience/${id}`);
      setProfile((prev) => ({ ...prev, workExperience: prev.workExperience.filter((e) => e.id !== id) }));
      toast.success('Experience removed successfully');
    } catch (error) {
      toast.error('Failed to remove experience');
    }
  };

  const updateWorkExperience = async (id, field, value) => {
    const updated = profile.workExperience.map((e) => (e.id === id ? { ...e, [field]: value } : e));
    setProfile((prev) => ({ ...prev, workExperience: updated }));
    if (!id.startsWith('temp-')) {
      const exp = updated.find((e) => e.id === id);
      if (exp) {
        try {
          await putRequest(`/cv/experience/${id}`, {
            jobTitle: exp.title,
            company: exp.company,
            location: exp.location,
            startDate: exp.startDate,
            endDate: exp.endDate,
            isCurrent: exp.current,
            description: exp.description,
          });
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const addProject = async () => {
    setProfile((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          id: `temp-${Date.now()}`,
          title: '',
          type: '',
          startDate: '',
          endDate: '',
          description: '',
        },
      ],
    }));
  };

  const removeProject = async (id) => {
    if (id.startsWith('temp-')) {
      setProfile((prev) => ({ ...prev, projects: prev.projects.filter((p) => p.id !== id) }));
      return;
    }
    try {
      await deleteRequest(`/cv/project/${id}`);
      setProfile((prev) => ({ ...prev, projects: prev.projects.filter((p) => p.id !== id) }));
      toast.success('Project removed successfully');
    } catch (error) {
      toast.error('Failed to remove project');
    }
  };

  const updateProject = async (id, field, value) => {
    const updated = profile.projects.map((p) => (p.id === id ? { ...p, [field]: value } : p));
    setProfile((prev) => ({ ...prev, projects: updated }));
    if (!id.startsWith('temp-')) {
      const proj = updated.find((p) => p.id === id);
      if (proj) {
        try {
          await putRequest(`/cv/project/${id}`, {
            title: proj.title,
            type: proj.type,
            startDate: proj.startDate,
            endDate: proj.endDate,
            description: proj.description,
          });
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const addCertificate = async () => {
    setProfile((prev) => ({
      ...prev,
      certificates: [
        ...prev.certificates,
        { id: `temp-${Date.now()}`, title: '', issuer: '', year: '' },
      ],
    }));
  };

  const removeCertificate = async (id) => {
    if (id.startsWith('temp-')) {
      setProfile((prev) => ({ ...prev, certificates: prev.certificates.filter((c) => c.id !== id) }));
      return;
    }
    try {
      await deleteRequest(`/cv/certificate/${id}`);
      setProfile((prev) => ({ ...prev, certificates: prev.certificates.filter((c) => c.id !== id) }));
      toast.success('Certificate removed successfully');
    } catch (error) {
      toast.error('Failed to remove certificate');
    }
  };

  const updateCertificate = async (id, field, value) => {
    const updated = profile.certificates.map((c) => (c.id === id ? { ...c, [field]: value } : c));
    setProfile((prev) => ({ ...prev, certificates: updated }));
    if (!id.startsWith('temp-')) {
      const cert = updated.find((c) => c.id === id);
      if (cert) {
        try {
          await putRequest(`/cv/certificate/${id}`, {
            title: cert.title,
            issuer: cert.issuer,
            year: cert.year,
          });
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  const defaultSectionOrder = [
    'Your Details', 'Professional Summary', 'Education', 'Work Experience',
    'Projects', 'Certificates', 'Skills', 'Contacts'
  ];

  const addCustomSection = (name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) return;
    const id = 'cs-' + Date.now();
    const newSection = { id, name: trimmed, entries: [] };
    setProfile((prev) => {
      const order = [...(prev.sectionOrder?.length ? prev.sectionOrder : defaultSectionOrder)];
      const contactsIdx = order.indexOf('Contacts');
      const insertAt = contactsIdx >= 0 ? contactsIdx : order.length;
      order.splice(insertAt, 0, 'Custom:' + id);
      return {
        ...prev,
        customSections: [...(prev.customSections || []), newSection],
        sectionOrder: order,
      };
    });
    toast.success(`Section "${trimmed}" added. Save profile to keep it.`);
  };

  const removeCustomSection = (id) => {
    setProfile((prev) => ({
      ...prev,
      customSections: (prev.customSections || []).filter((s) => s.id !== id),
      sectionOrder: (prev.sectionOrder || []).filter((s) => s !== 'Custom:' + id),
    }));
    toast.success('Section removed.');
  };

  const updateCustomSection = (id, patch) => {
    setProfile((prev) => ({
      ...prev,
      customSections: (prev.customSections || []).map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    }));
  };

  const addCustomSectionEntry = (sectionId) => {
    const entryId = 'ce-' + Date.now();
    setProfile((prev) => ({
      ...prev,
      customSections: (prev.customSections || []).map((s) =>
        s.id === sectionId
          ? { ...s, entries: [...(s.entries || []), { id: entryId, title: '', subtitle: '', description: '' }] }
          : s
      ),
    }));
  };

  const removeCustomSectionEntry = (sectionId, entryId) => {
    setProfile((prev) => ({
      ...prev,
      customSections: (prev.customSections || []).map((s) =>
        s.id === sectionId
          ? { ...s, entries: (s.entries || []).filter((e) => e.id !== entryId) }
          : s
      ),
    }));
  };

  const updateCustomSectionEntry = (sectionId, entryId, field, value) => {
    setProfile((prev) => ({
      ...prev,
      customSections: (prev.customSections || []).map((s) =>
        s.id === sectionId
          ? { ...s, entries: (s.entries || []).map((e) => (e.id === entryId ? { ...e, [field]: value } : e)) }
          : s
      ),
    }));
  };

  const saveProfile = async (aboutOverride, detailsOverride = null) => {
    try {
      setIsSaving(true);
      setIsLoading(true);
      const nameToSave = detailsOverride?.name ?? profile.fullName;
      const emailToSave = detailsOverride?.email ?? profile.email;
      const phoneToSave = detailsOverride?.phone ?? profile.phone;
      const addressToSave = detailsOverride?.address ?? profile.address;
      const emailIconToSave = detailsOverride?.emailIcon ?? profile.emailIcon;
      const phoneIconToSave = detailsOverride?.phoneIcon ?? profile.phoneIcon;
      const addressIconToSave = detailsOverride?.addressIcon ?? profile.addressIcon;
      const emailIconColorToSave = detailsOverride?.emailIconColor ?? profile.emailIconColor;
      const phoneIconColorToSave = detailsOverride?.phoneIconColor ?? profile.phoneIconColor;
      const addressIconColorToSave = detailsOverride?.addressIconColor ?? profile.addressIconColor;
      const aboutToSave = typeof aboutOverride === 'string' ? aboutOverride : profile.aboutMe;
      const linkedinToSave = detailsOverride?.linkedin ?? profile.linkedin;
      const githubToSave = detailsOverride?.github ?? profile.github;
      const portfolioToSave = detailsOverride?.portfolio ?? profile.portfolio;
      const linkedinIconColorToSave = detailsOverride?.linkedinIconColor ?? profile.linkedinIconColor;
      const githubIconColorToSave = detailsOverride?.githubIconColor ?? profile.githubIconColor;
      const portfolioIconColorToSave = detailsOverride?.portfolioIconColor ?? profile.portfolioIconColor;
      const sectionOrderToSave = detailsOverride?.sectionOrder ?? profile.sectionOrder;
      const skillsToSave = detailsOverride?.skills ?? profile.skills;
      const customSectionsToSave = detailsOverride?.customSections ?? profile.customSections;

      if (detailsOverride) {
        setProfile((prev) => ({
          ...prev,
          ...(detailsOverride.name !== undefined && { fullName: detailsOverride.name }),
          ...(detailsOverride.email !== undefined && { email: detailsOverride.email }),
          ...(detailsOverride.phone !== undefined && { phone: detailsOverride.phone }),
          ...(detailsOverride.address !== undefined && { address: detailsOverride.address }),
          ...(detailsOverride.emailIcon !== undefined && { emailIcon: detailsOverride.emailIcon }),
          ...(detailsOverride.phoneIcon !== undefined && { phoneIcon: detailsOverride.phoneIcon }),
          ...(detailsOverride.addressIcon !== undefined && { addressIcon: detailsOverride.addressIcon }),
          ...(detailsOverride.emailIconColor !== undefined && { emailIconColor: detailsOverride.emailIconColor }),
          ...(detailsOverride.phoneIconColor !== undefined && { phoneIconColor: detailsOverride.phoneIconColor }),
          ...(detailsOverride.addressIconColor !== undefined && { addressIconColor: detailsOverride.addressIconColor }),
          ...(detailsOverride.linkedin !== undefined && { linkedin: detailsOverride.linkedin }),
          ...(detailsOverride.github !== undefined && { github: detailsOverride.github }),
          ...(detailsOverride.portfolio !== undefined && { portfolio: detailsOverride.portfolio }),
          ...(detailsOverride.linkedinIconColor !== undefined && { linkedinIconColor: detailsOverride.linkedinIconColor }),
          ...(detailsOverride.githubIconColor !== undefined && { githubIconColor: detailsOverride.githubIconColor }),
          ...(detailsOverride.portfolioIconColor !== undefined && { portfolioIconColor: detailsOverride.portfolioIconColor }),
          ...(detailsOverride.education !== undefined && { education: detailsOverride.education }),
          ...(detailsOverride.workExperience !== undefined && { workExperience: detailsOverride.workExperience }),
          ...(detailsOverride.projects !== undefined && { projects: detailsOverride.projects }),
          ...(detailsOverride.certificates !== undefined && { certificates: detailsOverride.certificates }),
          ...(detailsOverride.sectionOrder !== undefined && { sectionOrder: detailsOverride.sectionOrder }),
          ...(detailsOverride.skills !== undefined && { skills: detailsOverride.skills }),
          ...(detailsOverride.customSections !== undefined && { customSections: detailsOverride.customSections }),
          ...(detailsOverride.elementStyles !== undefined && { elementStyles: detailsOverride.elementStyles }),
        }));
      }
      if (typeof aboutOverride === 'string') setProfile((prev) => ({ ...prev, aboutMe: aboutOverride }));

      await putRequest('/cv/profile', {
        name: nameToSave,
        email: emailToSave,
        mobile: phoneToSave,
        address: addressToSave,
        linkedIn: linkedinToSave,
        github: githubToSave,
        portfolio: portfolioToSave,
        aboutMe: aboutToSave,
        emailIcon: emailIconToSave,
        phoneIcon: phoneIconToSave,
        addressIcon: addressIconToSave,
        emailIconColor: emailIconColorToSave,
        phoneIconColor: phoneIconColorToSave,
        addressIconColor: addressIconColorToSave,
        linkedinIconColor: linkedinIconColorToSave,
        githubIconColor: githubIconColorToSave,
        portfolioIconColor: portfolioIconColorToSave,
        sectionOrder: sectionOrderToSave,
        skills: skillsToSave,
        customSections: customSectionsToSave ?? [],
      });

      const currentEducation = detailsOverride?.education ?? profile.education;
      const currentWorkExperience = detailsOverride?.workExperience ?? profile.workExperience;
      const currentProjects = detailsOverride?.projects ?? profile.projects;
      const currentCertificates = detailsOverride?.certificates ?? profile.certificates;

      for (const edu of currentEducation.filter((e) => e.id.startsWith('temp-'))) {
        await postRequest('/cv/education', {
          title: edu.degree,
          institution: edu.institution,
          location: edu.location,
          startYear: edu.startYear,
          endYear: edu.endYear,
          gpa: edu.gpa || '',
        });
      }
      for (const exp of currentWorkExperience.filter((e) => e.id.startsWith('temp-'))) {
        await postRequest('/cv/experience', {
          jobTitle: exp.title,
          company: exp.company,
          location: exp.location,
          startDate: exp.startDate,
          endDate: exp.endDate || '',
          isCurrent: exp.current,
          description: exp.description,
        });
      }
      for (const proj of currentProjects.filter((p) => p.id.startsWith('temp-'))) {
        await postRequest('/cv/project', {
          title: proj.title,
          type: proj.type,
          startDate: proj.startDate,
          endDate: proj.endDate,
          description: proj.description,
        });
      }
      for (const cert of currentCertificates.filter((c) => c.id.startsWith('temp-'))) {
        await postRequest('/cv/certificate', { title: cert.title, issuer: cert.issuer, year: cert.year });
      }

      if (detailsOverride?.elementStyles != null) {
        await putRequest('/cv/style-preferences', { elementStyles: detailsOverride.elementStyles });
      }

      const hasNewEntries =
        currentEducation.some((e) => e.id.startsWith('temp-')) ||
        currentWorkExperience.some((e) => e.id.startsWith('temp-')) ||
        currentProjects.some((p) => p.id.startsWith('temp-')) ||
        currentCertificates.some((c) => c.id.startsWith('temp-'));
      if (hasNewEntries) await fetchCVData();

      toast.success('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
      setIsLoading(false);
    }
  };

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handleFileSelect = (e) => {
    if (e.target.files?.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result);
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob) => {
    setShowCropper(false);
    if (!croppedBlob) return;
    if (croppedBlob.size > 2 * 1024 * 1024) {
      toast.error('Cropped image is too large.');
      return;
    }
    try {
      setIsUploadingPhoto(true);
      const reader = new FileReader();
      reader.readAsDataURL(croppedBlob);
      reader.onloadend = async () => {
        try {
          const response = await putRequest('/users/me', { profilePicture: reader.result });
          if (response.data.success) {
            dispatch(setUser(response.data.data));
            toast.success('Profile photo updated successfully!');
          } else {
            toast.error(response.data.message || 'Failed to update profile photo');
          }
        } catch (err) {
          toast.error(err.response?.data?.message || 'Failed to update profile photo');
        } finally {
          setIsUploadingPhoto(false);
        }
      };
    } catch (err) {
      toast.error('Failed to process image');
      setIsUploadingPhoto(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageSrc(null);
  };

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <OrgMenuNavigation currentPage={activeMenu} onPageChange={setActiveMenu} />
      <div className="lg:ml-72 pt-14 lg:pt-0">
        <main className="flex-1 p-0">
          <JobCVProfileView
            currentPage={currentPage}
            onPageChange={handlePageChange}
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            addEducation={addEducation}
            removeEducation={removeEducation}
            updateEducation={updateEducation}
            addWorkExperience={addWorkExperience}
            removeWorkExperience={removeWorkExperience}
            updateWorkExperience={updateWorkExperience}
            addProject={addProject}
            removeProject={removeProject}
            updateProject={updateProject}
            addCertificate={addCertificate}
            removeCertificate={removeCertificate}
            updateCertificate={updateCertificate}
            addCustomSection={addCustomSection}
            removeCustomSection={removeCustomSection}
            updateCustomSection={updateCustomSection}
            addCustomSectionEntry={addCustomSectionEntry}
            removeCustomSectionEntry={removeCustomSectionEntry}
            updateCustomSectionEntry={updateCustomSectionEntry}
            saveProfile={saveProfile}
            isSaving={isSaving}
            setView={() => {}}
            user={user}
            onPhotoClick={handlePhotoClick}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            isUploadingPhoto={isUploadingPhoto}
            jobs={jobs}
            selectedJobIdForAts={selectedJobIdForAts}
            onSelectJobIdForAts={setSelectedJobIdForAts}
            selectedTemplate={selectedTemplate}
            onSelectTemplate={setSelectedTemplate}
            hideStudentNavigation
          />
          {showCropper && imageSrc && (
            <ImageCropper
              imageSrc={imageSrc}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
            />
          )}
        </main>
      </div>
    </div>
  );
}

