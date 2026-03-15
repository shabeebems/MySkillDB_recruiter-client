import { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { getRequest, putRequest, postRequest, deleteRequest } from '../../api/apiRequests';
import ImageCropper from '../../components/common/ImageCropper';
import OrgMenuNavigation from '../../components/org-admin/org-admin-menu_components/OrgMenuNavigation.jsx';
import JobCVProfileView from '../../components/student-user/profile-designer/JobCVProfileView.jsx';

export default function AdminProfileDesigner() {
  const user = useSelector((state) => state.user);
  const [currentPage, setCurrentPage] = useState('profile-designer');
  const [activeMenu, setActiveMenu] = useState('profile-designer');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  const buildInitialProfileState = (student = null) => ({
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
    sectionOrder: [],
    skills: [],
    ...(student?._id
      ? {
          fullName: student?.name || '',
          email: student?.email || '',
          phone: student?.mobile || '',
          address: student?.address || '',
        }
      : {}),
  });

  const [profile, setProfile] = useState(buildInitialProfileState());

  const [jobs, setJobs] = useState([]);
  const [selectedJobIdForAts, setSelectedJobIdForAts] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(0); // 0 = Standard layout, 1-8 = templates

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const selectedStudentIdRef = useRef(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);
  const studentPickerRef = useRef(null);

  const filteredStudents = useMemo(() => {
    const q = (studentSearchQuery || '').trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q)
    );
  }, [students, studentSearchQuery]);

  const userIdQuery = selectedStudent?._id ? `?userId=${selectedStudent._id}` : '';

  const fetchStudents = async () => {
    try {
      if (!user?._id) return;
      const orgId = user?.organizationId || '';
      const query = orgId
        ? `/users?role=student&organizationId=${orgId}&limit=1000`
        : '/users?role=student&limit=1000';
      const response = await getRequest(query);
      if (response.data?.success && response.data?.data?.users) {
        const list = response.data.data.users;
        setStudents(list);
        if (list.length > 0 && !selectedStudent) {
          setSelectedStudent(list[0]);
        }
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error('[AdminProfileDesigner] Error fetching students:', error);
      toast.error('Failed to load students');
      setStudents([]);
    }
  };

  const fetchCVData = async (studentId) => {
    if (!studentId) return;
    try {
      const q = `?userId=${studentId}`;
      const [profileResponse, educationResponse, experienceResponse, projectsResponse, certificatesResponse, styleResponse] = await Promise.all([
        getRequest(`/cv/profile${q}`),
        getRequest(`/cv/education${q}`),
        getRequest(`/cv/experience${q}`),
        getRequest(`/cv/project${q}`),
        getRequest(`/cv/certificate${q}`),
        getRequest(`/cv/style-preferences${q}`).catch(() => ({ data: { data: null } })),
      ]);
      if (selectedStudentIdRef.current !== studentId) return;
      const cvProfile = profileResponse.data.data;
      const education = educationResponse.data.data || [];
      const experience = experienceResponse.data.data || [];
      const projects = projectsResponse.data.data || [];
      const certificates = certificatesResponse.data.data || [];
      const stylePrefs = styleResponse?.data?.data || {};
      const studentForFallback = students.find((s) => s._id === studentId) || selectedStudent;

      setProfile((prev) => {
        if (selectedStudentIdRef.current !== studentId) return prev;
        return {
          ...prev,
          ...stylePrefs,
          fullName: cvProfile?.name ?? studentForFallback?.name ?? prev.fullName ?? '',
          email: cvProfile?.email ?? studentForFallback?.email ?? prev.email ?? '',
          phone: cvProfile?.mobile ?? studentForFallback?.mobile ?? prev.phone ?? '',
          address: cvProfile?.address ?? studentForFallback?.address ?? prev.address ?? '',
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
        };
      });
    } catch (error) {
      console.error('[AdminProfileDesigner] Error fetching CV data:', error);
    }
  };

  const fetchJobsList = async (studentId) => {
    try {
      if (!studentId) return;
      const response = await getRequest(`/interview-planner?userId=${studentId}`);
      if (selectedStudentIdRef.current !== studentId) return;
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
      fetchStudents();
    }
  }, [user?._id]);

  useEffect(() => {
    if (selectedStudent?._id) {
      selectedStudentIdRef.current = selectedStudent._id;
      setIsLoading(true);
      setProfile(buildInitialProfileState(selectedStudent));
      setJobs([]);
      Promise.all([
        fetchCVData(selectedStudent._id),
        fetchJobsList(selectedStudent._id),
      ]).finally(() => setIsLoading(false));
    } else {
      setProfile(buildInitialProfileState());
      setJobs([]);
      setIsLoading(false);
    }
  }, [selectedStudent?._id]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (studentPickerRef.current && !studentPickerRef.current.contains(e.target)) {
        setIsStudentPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      await deleteRequest(`/cv/education/${id}${userIdQuery}`);
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
          await putRequest(`/cv/education/${id}${userIdQuery}`, {
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
      await deleteRequest(`/cv/experience/${id}${userIdQuery}`);
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
          await putRequest(`/cv/experience/${id}${userIdQuery}`, {
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
      await deleteRequest(`/cv/project/${id}${userIdQuery}`);
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
          await putRequest(`/cv/project/${id}${userIdQuery}`, {
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
      await deleteRequest(`/cv/certificate/${id}${userIdQuery}`);
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
          await putRequest(`/cv/certificate/${id}${userIdQuery}`, {
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
    if (!selectedStudent?._id) {
      toast.error('Select a student first.');
      return;
    }
    try {
      setIsSaving(true);
      const nameToSaveRaw = detailsOverride?.name ?? profile.fullName;
      const emailToSaveRaw = detailsOverride?.email ?? profile.email;
      const phoneToSaveRaw = detailsOverride?.phone ?? profile.phone;
      const addressToSaveRaw = detailsOverride?.address ?? profile.address;
      const emailIconToSave = detailsOverride?.emailIcon ?? profile.emailIcon;
      const phoneIconToSave = detailsOverride?.phoneIcon ?? profile.phoneIcon;
      const addressIconToSave = detailsOverride?.addressIcon ?? profile.addressIcon;
      const emailIconColorToSave = detailsOverride?.emailIconColor ?? profile.emailIconColor;
      const phoneIconColorToSave = detailsOverride?.phoneIconColor ?? profile.phoneIconColor;
      const addressIconColorToSave = detailsOverride?.addressIconColor ?? profile.addressIconColor;
      const aboutToSaveRaw = typeof aboutOverride === 'string' ? aboutOverride : profile.aboutMe;
      const linkedinToSave = detailsOverride?.linkedin ?? profile.linkedin;
      const githubToSave = detailsOverride?.github ?? profile.github;
      const portfolioToSave = detailsOverride?.portfolio ?? profile.portfolio;
      const linkedinIconColorToSave = detailsOverride?.linkedinIconColor ?? profile.linkedinIconColor;
      const githubIconColorToSave = detailsOverride?.githubIconColor ?? profile.githubIconColor;
      const portfolioIconColorToSave = detailsOverride?.portfolioIconColor ?? profile.portfolioIconColor;
      const sectionOrderToSave = detailsOverride?.sectionOrder ?? profile.sectionOrder;
      const skillsToSave = detailsOverride?.skills ?? profile.skills;
      const customSectionsToSave = detailsOverride?.customSections ?? profile.customSections;

      const nameToSave = (nameToSaveRaw || '').trim();
      const emailToSave = (emailToSaveRaw || '').trim();
      const phoneToSave = (phoneToSaveRaw || '').trim();
      const addressToSave = (addressToSaveRaw || '').trim() || 'Not specified';
      const aboutToSave = (aboutToSaveRaw || '').trim() || 'Not specified';

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

      await putRequest(`/cv/profile${userIdQuery}`, {
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

      let createdAnyNewEntries = false;

      for (const edu of currentEducation.filter((e) => e.id.startsWith('temp-'))) {
        const title = (edu.degree || '').trim();
        const institution = (edu.institution || '').trim();
        const startYear = (edu.startYear || '').trim();
        const endYear = (edu.endYear || '').trim();
        const location = (edu.location || '').trim();
        const gpa = (edu.gpa || '').trim();

        const isCompletelyEmpty = !title && !institution && !startYear && !endYear && !location && !gpa;
        if (isCompletelyEmpty) continue; // user added a row but didn't fill anything

        if (!title || !institution || !startYear || !endYear) {
          toast.error('Education not saved: please fill Degree, Institution, Start Year, and End Year.');
          continue;
        }

        await postRequest(`/cv/education${userIdQuery}`, {
          title,
          institution,
          location,
          startYear,
          endYear,
          gpa: gpa || '',
        });
        createdAnyNewEntries = true;
      }
      for (const exp of currentWorkExperience.filter((e) => e.id.startsWith('temp-'))) {
        const jobTitle = (exp.title || '').trim();
        const company = (exp.company || '').trim();
        const startDate = (exp.startDate || '').trim();
        const description = (exp.description || '').trim();
        if (!jobTitle || !company || !startDate || !description) {
          toast.error('Work experience not saved: please fill Job Title, Company, Start Date, and Description.');
          continue;
        }
        await postRequest(`/cv/experience${userIdQuery}`, {
          jobTitle,
          company,
          location: (exp.location || '').trim() || undefined,
          startDate,
          endDate: exp.isCurrent ? '' : (exp.endDate || '').trim() || '',
          isCurrent: !!exp.current,
          description,
        });
        createdAnyNewEntries = true;
      }
      for (const proj of currentProjects.filter((p) => p.id.startsWith('temp-'))) {
        const title = (proj.title || '').trim();
        const type = (proj.type || '').trim();
        const description = (proj.description || '').trim();
        if (!title || !type || !description) {
          toast.error('Project not saved: please fill Title, Type, and Description.');
          continue;
        }
        await postRequest(`/cv/project${userIdQuery}`, {
          title,
          type,
          startDate: (proj.startDate || '').trim() || '',
          endDate: (proj.endDate || '').trim() || '',
          description,
        });
        createdAnyNewEntries = true;
      }
      for (const cert of currentCertificates.filter((c) => c.id.startsWith('temp-'))) {
        const title = (cert.title || '').trim();
        const issuer = (cert.issuer || '').trim();
        const year = (cert.year || '').trim();
        if (!title || !issuer || !year) {
          toast.error('Certificate not saved: please fill Title, Issuer, and Year.');
          continue;
        }
        await postRequest(`/cv/certificate${userIdQuery}`, { title, issuer, year });
        createdAnyNewEntries = true;
      }

      if (detailsOverride?.elementStyles != null) {
        await putRequest(`/cv/style-preferences${userIdQuery}`, { elementStyles: detailsOverride.elementStyles });
      }

      if (createdAnyNewEntries) await fetchCVData(selectedStudent._id);

      toast.success('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
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
    if (!selectedStudent?._id) {
      toast.error('Select a student first to update their photo.');
      return;
    }
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
          const response = await putRequest(`/users/${selectedStudent._id}`, { profilePicture: reader.result });
          if (response.data.success) {
            const updatedUser = response.data.data;
            setSelectedStudent((prev) => (prev ? { ...prev, profilePicture: updatedUser?.profilePicture } : null));
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
        <main className="flex-1 p-0 pb-safe">
          <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-sm safe-area-pb" ref={studentPickerRef}>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Select student</label>
            <div className="relative w-full max-w-xl">
              <button
                type="button"
                onClick={() => {
                  setIsStudentPickerOpen((o) => !o);
                  if (!isStudentPickerOpen) setStudentSearchQuery('');
                }}
                className="w-full flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 py-3 sm:py-2.5 text-left shadow-sm hover:border-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[48px] touch-manipulation"
              >
                {selectedStudent ? (
                  <>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 overflow-hidden">
                      {selectedStudent.profilePicture ? (
                        <img src={selectedStudent.profilePicture} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-sm font-semibold">{(selectedStudent.name || selectedStudent.email || '?').charAt(0).toUpperCase()}</span>
                      )}
                    </span>
                    <span className="flex-1 min-w-0 truncate">
                      <span className="font-medium text-slate-800">{selectedStudent.name || 'No name'}</span>
                      {selectedStudent.email && (
                        <span className="block text-xs text-slate-500 truncate">{selectedStudent.email}</span>
                      )}
                    </span>
                    <span className="text-slate-400 shrink-0">
                      <i className={`fas fa-chevron-${isStudentPickerOpen ? 'up' : 'down'} text-sm`} />
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <i className="fas fa-user-graduate" />
                    </span>
                    <span className="flex-1 text-left text-slate-500">Select a student…</span>
                    <i className="fas fa-chevron-down text-slate-400 text-sm" />
                  </>
                )}
              </button>
              {isStudentPickerOpen && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[min(22rem,75vh)] flex flex-col rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                  <div className="p-2.5 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative">
                      <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                      <input
                        type="text"
                        value={studentSearchQuery}
                        onChange={(e) => setStudentSearchQuery(e.target.value)}
                        placeholder="Search by name or email…"
                        className="w-full rounded-lg border border-slate-200 bg-white py-2.5 sm:py-2 pl-9 pr-10 text-base sm:text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                        autoFocus
                      />
                      {studentSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setStudentSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center -my-1 text-slate-400 hover:text-slate-600 touch-manipulation"
                          aria-label="Clear search"
                        >
                          <i className="fas fa-times text-sm" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      {filteredStudents.length === students.length
                        ? `${students.length} student${students.length !== 1 ? 's' : ''}`
                        : `${filteredStudents.length} of ${students.length} students`}
                    </p>
                  </div>
                  <ul className="overflow-y-auto flex-1 overscroll-contain py-1">
                    {filteredStudents.length === 0 ? (
                      <li className="px-4 py-6 text-center text-sm text-slate-500">No students match your search.</li>
                    ) : (
                      filteredStudents.map((s) => (
                        <li key={s._id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudent(s);
                              setIsStudentPickerOpen(false);
                              setStudentSearchQuery('');
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 sm:py-2.5 text-left hover:bg-slate-50 active:bg-slate-100 focus:bg-slate-50 focus:outline-none min-h-[52px] touch-manipulation ${selectedStudent?._id === s._id ? 'bg-indigo-50' : ''}`}
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 overflow-hidden">
                              {s.profilePicture ? (
                                <img src={s.profilePicture} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-xs font-semibold">{(s.name || s.email || '?').charAt(0).toUpperCase()}</span>
                              )}
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block font-medium text-slate-800 truncate">{s.name || 'No name'}</span>
                              {s.email && <span className="block text-xs text-slate-500 truncate">{s.email}</span>}
                            </span>
                            {selectedStudent?._id === s._id && (
                              <i className="fas fa-check text-indigo-600 text-sm shrink-0" />
                            )}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
          {!selectedStudent ? (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
              <p className="text-slate-600 mb-1">Select a student above to view and edit their CV.</p>
              <p className="text-sm text-slate-500">That student&apos;s profile data will load here.</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
              <p className="text-slate-600">Loading {selectedStudent.name || selectedStudent.email}&apos;s profile…</p>
            </div>
          ) : (
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
            user={selectedStudent || user}
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
          )}
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

