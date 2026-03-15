import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import { postRequest, putRequest } from '../../../api/apiRequests';
import StudentMenuNavigation from '../student-menu-components/StudentMenuNavigation';
import JobCVTemplate1 from './JobCVTemplate1';
import JobCVTemplate2 from './JobCVTemplate2';
import JobCVTemplate4 from './JobCVTemplate4';
import JobCVTemplate5 from './JobCVTemplate5';
import JobCVTemplate6 from './JobCVTemplate6';
import JobCVTemplate7 from './JobCVTemplate7';
import JobCVTemplate8 from './JobCVTemplate8';
import JobCVPreviewPrintStyles from './JobCVPreviewPrintStyles';

const JobCVProfileView = ({
  currentPage,
  onPageChange,
  profile,
  onUpdateProfile,
  addEducation,
  removeEducation,
  updateEducation,
  addWorkExperience,
  removeWorkExperience,
  updateWorkExperience,
  addProject,
  removeProject,
  updateProject,
  addCertificate,
  removeCertificate,
  updateCertificate,
  addCustomSection,
  removeCustomSection,
  updateCustomSection,
  addCustomSectionEntry,
  removeCustomSectionEntry,
  updateCustomSectionEntry,
  saveProfile,
  isSaving,
  setView,
  user,
  onPhotoClick,
  fileInputRef,
  onFileSelect,
  isUploadingPhoto,
  jobs = [],
  selectedJobIdForAts = null,
  onSelectJobIdForAts = () => { },
  selectedTemplate = 0,
  onSelectTemplate = () => { },
  hideStudentNavigation = false,
}) => {
  const [uploadedCvText, setUploadedCvText] = useState('');
  const [isParsingCv, setIsParsingCv] = useState(false);
  const [isRewritingSection, setIsRewritingSection] = useState(false);
  const [isSuggestingSkills, setIsSuggestingSkills] = useState(false);
  const uploadCvInputRef = useRef(null);
  const previewContainerRef = useRef(null);
  const sectionsButtonRef = useRef(null);
  const styleButtonRef = useRef(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('builder');
  const [mobilePanel, setMobilePanel] = useState(null);

  const closeMobilePanel = () => {
    if (mobilePanel === 'builder') sectionsButtonRef.current?.focus?.();
    if (mobilePanel === 'tools') styleButtonRef.current?.focus?.();
    setMobilePanel(null);
  };
  const [activeSection, setActiveSection] = useState('Your Details');
  const [expandedSections, setExpandedSections] = useState({
    'Your Details': true,
    'Professional Summary': false,
    'Education': false,
    'Work Experience': false,
    'Projects': false,
    'Certificates': false
  });
  const [summaryDraft, setSummaryDraft] = useState(profile.aboutMe || '');
  const [nameDraft, setNameDraft] = useState(profile.fullName || '');
  const [emailDraft, setEmailDraft] = useState(profile.email || '');
  const [phoneDraft, setPhoneDraft] = useState(profile.phone || '');
  const [addressDraft, setAddressDraft] = useState(profile.address || '');
  const [linkedinDraft, setLinkedinDraft] = useState(profile.linkedin || '');
  const [githubDraft, setGithubDraft] = useState(profile.github || '');
  const [portfolioDraft, setPortfolioDraft] = useState(profile.portfolio || '');

  const [educationForm, setEducationForm] = useState({
    degree: '',
    institution: '',
    location: '',
    startYear: '',
    endYear: '',
    gpa: ''
  });
  const [editingEducationId, setEditingEducationId] = useState(null);

  const [experienceForm, setExperienceForm] = useState({
    jobTitle: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: ''
  });
  const [editingExperienceId, setEditingExperienceId] = useState(null);

  const [projectForm, setProjectForm] = useState({
    title: '',
    type: '',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [editingProjectId, setEditingProjectId] = useState(null);

  const [certificateForm, setCertificateForm] = useState({
    title: '',
    issuer: '',
    year: ''
  });
  const [editingCertificateId, setEditingCertificateId] = useState(null);

  const [showAddCustomSection, setShowAddCustomSection] = useState(false);
  const [newCustomSectionName, setNewCustomSectionName] = useState('');

  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedElements, setSelectedElements] = useState([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedTextStyle, setSelectedTextStyle] = useState({
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: '14px',
    color: '#1B1B1B',
    lineHeight: 'auto',
    letterSpacing: '-1.5%'
  });
  const [isSavingStyle, setIsSavingStyle] = useState(false);

  const STYLE_PREFERENCE_KEYS = [
    'nameFontFamily', 'nameFontWeight', 'nameFontSize', 'nameColor',
    'headingFontFamily', 'headingFontWeight', 'headingFontSize', 'headingColor', 'headingLineHeight', 'headingLetterSpacing',
    'summaryFontFamily', 'summaryFontWeight', 'summaryFontSize', 'summaryColor', 'summaryLineHeight', 'summaryLetterSpacing',
    'bodyFontFamily', 'bodyFontWeight', 'bodyFontSize', 'bodyColor', 'bodyLineHeight', 'bodyLetterSpacing',
  ];

  // Per-element styles: only the selected field is updated when user changes color/font/size
  const getElementStyle = (profile, elementId, type) => {
    const defaults = type === 'name' ? {
      fontFamily: profile.nameFontFamily,
      fontWeight: profile.nameFontWeight,
      fontSize: profile.nameFontSize,
      color: profile.nameColor,
      lineHeight: profile.nameLineHeight,
      letterSpacing: profile.nameLetterSpacing
    } : type === 'heading' ? {
      fontFamily: profile.headingFontFamily,
      fontWeight: profile.headingFontWeight,
      fontSize: profile.headingFontSize,
      color: profile.headingColor,
      lineHeight: profile.headingLineHeight,
      letterSpacing: profile.headingLetterSpacing
    } : type === 'summary' ? {
      fontFamily: profile.summaryFontFamily,
      fontWeight: profile.summaryFontWeight,
      fontSize: profile.summaryFontSize,
      color: profile.summaryColor,
      lineHeight: profile.summaryLineHeight,
      letterSpacing: profile.summaryLetterSpacing
    } : {
      fontFamily: profile.bodyFontFamily,
      fontWeight: profile.bodyFontWeight,
      fontSize: profile.bodyFontSize,
      color: profile.bodyColor,
      lineHeight: profile.bodyLineHeight,
      letterSpacing: profile.bodyLetterSpacing
    };
    const overrides = profile.elementStyles && profile.elementStyles[elementId];
    if (!overrides) return defaults;
    return { ...defaults, ...overrides };
  };

  const saveStylePreferences = async () => {
    setIsSavingStyle(true);
    try {
      const payload = {};
      STYLE_PREFERENCE_KEYS.forEach((key) => {
        if (profile[key] != null && profile[key] !== '') payload[key] = profile[key];
      });
      if (profile.elementStyles && Object.keys(profile.elementStyles).length > 0) {
        payload.elementStyles = profile.elementStyles;
      }
      const styleQuery = user?._id ? `?userId=${user._id}` : '';
      await putRequest(`/cv/style-preferences${styleQuery}`, payload);
      toast.success('Font and color preferences saved');
    } catch (err) {
      console.error('Error saving style preferences:', err);
      toast.error(err?.response?.data?.message || 'Failed to save preferences');
    } finally {
      setIsSavingStyle(false);
    }
  };

  const handleRewriteWithAi = async (section, content) => {
    if (!selectedJobIdForAts) {
      toast.error('Select a job above to optimize for ATS');
      return;
    }
    setIsRewritingSection(true);
    try {
      const res = await postRequest('/ai/rewrite-cv-section', {
        jobId: selectedJobIdForAts,
        section,
        content: content || '',
      });
      if (res?.data?.success && res.data.data != null) {
        const rewritten = res.data.data;
        if (section === 'about_me') setSummaryDraft(rewritten);
        if (section === 'experience') setExperienceForm((prev) => ({ ...prev, description: rewritten }));
        if (section === 'project') setProjectForm((prev) => ({ ...prev, description: rewritten }));
        toast.success('Section rewritten for ATS. Review and save.');
      } else {
        toast.error(res?.data?.error || 'Failed to rewrite');
      }
    } catch (err) {
      const serverMessage = err?.response?.data?.error;
      const isNetworkError = err?.message === 'Network Error' || !err?.response;
      const message = serverMessage
        ? serverMessage
        : isNetworkError
          ? 'Cannot reach the server. If this happens in production, check that the API URL is set correctly.'
          : 'Failed to rewrite section';
      toast.error(message);
    } finally {
      setIsRewritingSection(false);
    }
  };

  const handleAddSkillsFromJob = async () => {
    if (!selectedJobIdForAts) {
      toast.error('Please select a job above (Optimize for job) first.');
      return;
    }
    setIsSuggestingSkills(true);
    try {
      const res = await postRequest('/ai/suggest-skills-for-profile', {
        jobId: selectedJobIdForAts,
        currentProfileSkills: profile.skills || [],
        ...(user?._id && { userId: user._id }),
      });
      const data = res?.data;
      if (!data) {
        toast.error('No response from server. Please try again.');
        return;
      }
      if (!data.success) {
        toast.error(data.error || 'Failed to get skill suggestions');
        return;
      }
      if (data.needAssessment === true) {
        const msg = data.message || 'No assessment taken for this job. Please take the assessment first to get AI-suggested skills.';
        toast(msg, {
          duration: 7000,
          icon: '📋',
          style: { maxWidth: 380 },
        });
        return;
      }
      const suggested = Array.isArray(data.suggestedSkills) ? data.suggestedSkills : [];
      if (suggested.length === 0) {
        toast.success('No new skills to add based on your assessments.');
        return;
      }
      const existing = new Set((profile.skills || []).map((s) => String(s).trim().toLowerCase()));
      const toAdd = suggested.filter((s) => s && !existing.has(String(s).trim().toLowerCase()));
      if (toAdd.length === 0) {
        toast.success('All suggested skills are already in your profile.');
        return;
      }
      const updatedSkills = [...(profile.skills || []), ...toAdd];
      onUpdateProfile('skills', updatedSkills);
      if (typeof saveProfile === 'function') {
        await saveProfile(null, { skills: updatedSkills });
      }
      toast.success(`Added ${toAdd.length} skill(s): ${toAdd.join(', ')}`);
    } catch (err) {
      console.error('[Add skills from job]', err);
      const msg = err?.response?.data?.error || err?.message || 'Failed to suggest skills. Please try again.';
      toast.error(msg);
    } finally {
      setIsSuggestingSkills(false);
    }
  };

  useEffect(() => {
    if (!editingEducationId && profile.education && profile.education.length > 0) {
      setEducationForm({
        degree: '',
        institution: '',
        location: '',
        startYear: '',
        endYear: '',
        gpa: ''
      });
    }
  }, [editingEducationId, profile.education]);

  useEffect(() => {
    if (!editingExperienceId) {
      setExperienceForm({
        jobTitle: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        description: ''
      });
    }
  }, [editingExperienceId]);

  useEffect(() => {
    if (!editingProjectId) {
      setProjectForm({
        title: '',
        type: '',
        startDate: '',
        endDate: '',
        description: ''
      });
    }
  }, [editingProjectId]);

  useEffect(() => {
    if (!editingCertificateId) {
      setCertificateForm({
        title: '',
        issuer: '',
        year: ''
      });
    }
  }, [editingCertificateId]);

  useEffect(() => {
    const previousElement = document.querySelector('.text-editing-highlight');
    if (previousElement) {
      previousElement.classList.remove('text-editing-highlight');
    }

    if (selectedElement && selectedElement.element) {
      const element = selectedElement.element;
      element.classList.add('text-editing-highlight');

      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }, 100);
    }

    return () => {
      const highlightedElement = document.querySelector('.text-editing-highlight');
      if (highlightedElement) {
        highlightedElement.classList.remove('text-editing-highlight');
      }
    };
  }, [selectedElement, isMultiSelectMode]);


  const [skillInput, setSkillInput] = useState('');

  const [emailIcon, setEmailIcon] = useState(profile.emailIcon || 'far fa-envelope');
  const [phoneIcon, setPhoneIcon] = useState(profile.phoneIcon || 'fas fa-mobile-alt');
  const [addressIcon, setAddressIcon] = useState(profile.addressIcon || 'fas fa-map-marker-alt');
  const [emailIconColor, setEmailIconColor] = useState(profile.emailIconColor || '#6b7280');
  const [phoneIconColor, setPhoneIconColor] = useState(profile.phoneIconColor || '#6b7280');
  const [addressIconColor, setAddressIconColor] = useState(profile.addressIconColor || '#6b7280');
  const [linkedinIconColor, setLinkedinIconColor] = useState(profile.linkedinIconColor || '#6b7280');
  const [githubIconColor, setGithubIconColor] = useState(profile.githubIconColor || '#6b7280');
  const [portfolioIconColor, setPortfolioIconColor] = useState(profile.portfolioIconColor || '#6b7280');

  const colorPalette = [
    '#6b7280', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1', '#14b8a6',
  ];

  const emailIcons = [
    { value: 'far fa-envelope', label: 'Envelope' },
    { value: 'fas fa-envelope', label: 'Envelope (Solid)' },
    { value: 'fas fa-at', label: 'At Symbol' },
    { value: 'far fa-envelope-open', label: 'Open Envelope' },
  ];

  const phoneIcons = [
    { value: 'fas fa-mobile-alt', label: 'Mobile' },
    { value: 'fas fa-phone', label: 'Phone' },
    { value: 'fas fa-phone-alt', label: 'Phone Alt' },
    { value: 'fas fa-phone-square', label: 'Phone Square' },
  ];

  const addressIcons = [
    { value: 'fas fa-map-marker-alt', label: 'Map Marker' },
    { value: 'fas fa-map-pin', label: 'Map Pin' },
    { value: 'fas fa-location-dot', label: 'Location Dot' },
    { value: 'fas fa-home', label: 'Home' },
    { value: 'fas fa-building', label: 'Building' },
  ];

  useEffect(() => {
    setSummaryDraft(profile.aboutMe || '');
    setNameDraft(profile.fullName || '');
    setEmailDraft(profile.email || '');
    setPhoneDraft(profile.phone || '');
    setAddressDraft(profile.address || '');
    setLinkedinDraft(profile.linkedin || '');
    setGithubDraft(profile.github || '');
    setPortfolioDraft(profile.portfolio || '');
    setEmailIcon(profile.emailIcon || 'far fa-envelope');
    setPhoneIcon(profile.phoneIcon || 'fas fa-mobile-alt');
    setAddressIcon(profile.addressIcon || 'fas fa-map-marker-alt');
    setEmailIconColor(profile.emailIconColor || '#6b7280');
    setPhoneIconColor(profile.phoneIconColor || '#6b7280');
    setAddressIconColor(profile.addressIconColor || '#6b7280');
    setLinkedinIconColor(profile.linkedinIconColor || '#6b7280');
    setGithubIconColor(profile.githubIconColor || '#6b7280');
    setPortfolioIconColor(profile.portfolioIconColor || '#6b7280');
  }, [profile.aboutMe, profile.fullName, profile.email, profile.phone, profile.address, profile.emailIcon, profile.phoneIcon, profile.addressIcon, profile.emailIconColor, profile.phoneIconColor, profile.addressIconColor, profile.linkedinIconColor, profile.githubIconColor, profile.portfolioIconColor]);

  const handleUploadCvClick = () => {
    uploadCvInputRef.current?.click();
  };

  const handleCvFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const isTextFile =
      file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt');

    if (!isTextFile) {
      toast.error('Please upload a text (.txt) version of your CV for clean parsing.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    setIsParsingCv(true);

    reader.onload = () => {
      try {
        const rawText = typeof reader.result === 'string' ? reader.result : '';
        const cleanedText = rawText
          .replace(/\r\n/g, '\n')
          .replace(/[ \t]+\n/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        setUploadedCvText(cleanedText);
      } catch (error) {
        console.error('[CV Upload] Error parsing CV text:', error);
        toast.error('Failed to parse CV text.');
      } finally {
        setIsParsingCv(false);
      }
    };

    reader.onerror = () => {
      console.error('[CV Upload] Error reading file.');
      toast.error('Failed to read the CV file.');
      setIsParsingCv(false);
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const defaultSections = [
    'Your Details',
    'Professional Summary',
    'Education',
    'Work Experience',
    'Projects',
    'Certificates',
    'Skills',
    'Contacts'
  ];

  const [sectionOrder, setSectionOrder] = useState(() => {
    return (profile.sectionOrder && profile.sectionOrder.length > 0) ? profile.sectionOrder : defaultSections;
  });

  useEffect(() => {
    if (profile.sectionOrder && profile.sectionOrder.length > 0) {
      const allSectionsPresent = defaultSections.every(section => profile.sectionOrder.includes(section));
      let finalOrder;

      if (allSectionsPresent) {
        finalOrder = [...profile.sectionOrder];
      } else {
        // Merge missing sections
        const merged = [...profile.sectionOrder];
        defaultSections.forEach(section => {
          if (!merged.includes(section)) {
            merged.push(section);
          }
        });
        finalOrder = merged;
      }

      const customIds = (profile.customSections || []).map(s => 'Custom:' + s.id);
      customIds.forEach(key => {
        if (!finalOrder.includes(key)) {
          const contactsIdx = finalOrder.indexOf('Contacts');
          const insertAt = contactsIdx >= 0 ? contactsIdx : finalOrder.length;
          finalOrder.splice(insertAt, 0, key);
        }
      });

      const contactsIndex = finalOrder.indexOf('Contacts');
      if (contactsIndex !== -1 && contactsIndex !== finalOrder.length - 1) {
        finalOrder.splice(contactsIndex, 1);
        finalOrder.push('Contacts');
      }

      setSectionOrder(finalOrder);
    }
  }, [profile.sectionOrder, profile.customSections]);

  const [draggedSection, setDraggedSection] = useState(null);
  const [dragOverSection, setDragOverSection] = useState(null);

  const [draggedItem, setDraggedItem] = useState({ type: null, id: null, index: null });
  const [dragOverItem, setDragOverItem] = useState({ type: null, id: null, index: null });

  const handleDragStart = (e, section) => {
    setDraggedSection(section);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', section);
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragOver = (e, targetSection) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (targetSection !== draggedSection) {
      setDragOverSection(targetSection);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverSection(null);
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedSection(null);
    setDragOverSection(null);
  };

  const handleDrop = (e, targetSection) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.opacity = '1';

    if (!draggedSection || draggedSection === targetSection) {
      setDragOverSection(null);
      return;
    }

    if (draggedSection === 'Contacts' && targetSection !== 'Contacts') {
      setDragOverSection(null);
      toast.error('Contacts section must remain at the bottom');
      return;
    }

    if (targetSection === 'Contacts' && draggedSection !== 'Contacts') {
      setDragOverSection(null);
      toast.error('Cannot place sections after Contacts');
      return;
    }

    const newOrder = [...sectionOrder];
    const draggedIndex = newOrder.indexOf(draggedSection);
    const targetIndex = newOrder.indexOf(targetSection);

    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedSection);

    const contactsIndex = newOrder.indexOf('Contacts');
    if (contactsIndex !== -1 && contactsIndex !== newOrder.length - 1) {
      newOrder.splice(contactsIndex, 1);
      newOrder.push('Contacts');
    }

    setSectionOrder(newOrder);
    setDraggedSection(null);
    setDragOverSection(null);
    saveSectionOrder(newOrder);
  };

  const saveSectionOrder = async (newOrder) => {
    try {
      await onUpdateProfile('sectionOrder', newOrder);
      if (typeof saveProfile === 'function') {
        await saveProfile(null, { sectionOrder: newOrder });
      }
      toast.success('Section order saved');
    } catch (error) {
      console.error('Error saving section order:', error);
      toast.error('Failed to save section order');
    }
  };

  const handleItemDragStart = (e, itemId, itemType, itemIndex = null) => {
    setDraggedItem({ type: itemType, id: itemId, index: itemIndex });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${itemType}-${itemId || itemIndex}`);
    e.currentTarget.style.opacity = '0.5';
  };

  const handleItemDragOver = (e, itemId, itemType, itemIndex = null) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    const isDifferentItem = itemType === 'skill'
      ? (itemIndex !== draggedItem.index)
      : (itemId !== draggedItem.id);

    if (isDifferentItem && itemType === draggedItem.type) {
      setDragOverItem({ type: itemType, id: itemId, index: itemIndex });
    }
  };

  const handleItemDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleItemDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedItem({ type: null, id: null, index: null });
    setDragOverItem({ type: null, id: null, index: null });
  };

  const handleItemDrop = async (e, targetItemId, itemType, targetIndex = null) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.style.opacity = '1';

    if (!draggedItem.id && draggedItem.index === null) {
      setDragOverItem({ type: null, id: null, index: null });
      return;
    }

    if (draggedItem.type !== itemType) {
      setDragOverItem({ type: null, id: null, index: null });
      return;
    }

    let updatedArray = [];
    let profileKey = '';

    switch (itemType) {
      case 'education':
        updatedArray = [...(profile.education || [])];
        profileKey = 'education';
        break;
      case 'experience':
        updatedArray = [...(profile.workExperience || [])];
        profileKey = 'workExperience';
        break;
      case 'project':
        updatedArray = [...(profile.projects || [])];
        profileKey = 'projects';
        break;
      case 'certificate':
        updatedArray = [...(profile.certificates || [])];
        profileKey = 'certificates';
        break;
      case 'skill':
        updatedArray = [...(profile.skills || [])];
        profileKey = 'skills';
        break;
      default:
        setDragOverItem({ type: null, id: null, index: null });
        return;
    }

    let draggedIndex, targetIdx;

    if (itemType === 'skill') {
      draggedIndex = draggedItem.index;
      targetIdx = targetIndex;
    } else {
      draggedIndex = updatedArray.findIndex(item => item.id === draggedItem.id);
      targetIdx = updatedArray.findIndex(item => item.id === targetItemId);
    }

    if (draggedIndex === -1 || targetIdx === -1) {
      console.error('Invalid drag indices:', { draggedIndex, targetIdx, draggedItem, targetItemId });
      setDragOverItem({ type: null, id: null, index: null });
      return;
    }

    if (draggedIndex === targetIdx) {
      setDragOverItem({ type: null, id: null, index: null });
      return;
    }

    const [movedItem] = updatedArray.splice(draggedIndex, 1);
    const insertIndex = draggedIndex < targetIdx ? targetIdx : targetIdx + 1;
    updatedArray.splice(insertIndex, 0, movedItem);
    onUpdateProfile(profileKey, updatedArray);

    try {
      if (itemType === 'skill') {
        if (typeof saveProfile === 'function') {
          await saveProfile(null, { skills: updatedArray });
        }
      } else {
        if (typeof saveProfile === 'function') {
          await saveProfile(null, { [profileKey]: updatedArray });
        }
      }
      toast.success('Order updated successfully');
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save order');
      const originalArray = profile[profileKey] || [];
      onUpdateProfile(profileKey, originalArray);
    }

    setDraggedItem({ type: null, id: null, index: null });
    setDragOverItem({ type: null, id: null, index: null });
  };

  const handleTextElementClick = (e, elementType = 'body', elementId = null) => {
    e.stopPropagation();
    const element = e.currentTarget;
    const computedStyle = window.getComputedStyle(element);
    const resolvedId = elementId || element.getAttribute('data-element-id') || `${Date.now()}-${Math.random()}`;
    if (!element.getAttribute('data-element-id')) {
      element.setAttribute('data-element-id', resolvedId);
    }

    let fieldPrefix = elementType;
    if (elementType === 'heading' && element.tagName.toLowerCase() === 'h3') {
      fieldPrefix = 'heading';
    } else if (elementType === 'summary' || element.classList.contains('summary')) {
      fieldPrefix = 'summary';
    } else if (elementType === 'body' || element.tagName.toLowerCase() === 'p') {
      fieldPrefix = 'body';
    }

    const getSavedStyle = () => {
      const overrides = profile.elementStyles && profile.elementStyles[resolvedId];
      if (overrides) {
        return {
          fontFamily: overrides.fontFamily ?? profile[`${fieldPrefix}FontFamily`] ?? 'Inter',
          fontWeight: overrides.fontWeight ?? profile[`${fieldPrefix}FontWeight`] ?? '400',
          fontSize: overrides.fontSize ?? profile[`${fieldPrefix}FontSize`] ?? '14px',
          color: overrides.color ?? profile[`${fieldPrefix}Color`] ?? '#1B1B1B',
          lineHeight: overrides.lineHeight ?? profile[`${fieldPrefix}LineHeight`] ?? 'auto',
          letterSpacing: overrides.letterSpacing ?? profile[`${fieldPrefix}LetterSpacing`] ?? 'normal'
        };
      }
      let computedFontFamily = computedStyle.fontFamily || '';
      if (computedFontFamily) {
        computedFontFamily = computedFontFamily.replace(/['"]/g, '').split(',')[0].trim();
      }
      return {
        fontFamily: profile[`${fieldPrefix}FontFamily`] || computedFontFamily || 'Inter',
        fontWeight: profile[`${fieldPrefix}FontWeight`] || computedStyle.fontWeight || '400',
        fontSize: profile[`${fieldPrefix}FontSize`] || computedStyle.fontSize || '14px',
        color: profile[`${fieldPrefix}Color`] || computedStyle.color || '#1B1B1B',
        lineHeight: profile[`${fieldPrefix}LineHeight`] || computedStyle.lineHeight || 'auto',
        letterSpacing: profile[`${fieldPrefix}LetterSpacing`] || computedStyle.letterSpacing || 'normal'
      };
    };

    if (isMultiSelectMode) {
      const isAlreadySelected = selectedElements.some(el => el.element === element || el.id === resolvedId);

      if (isAlreadySelected) {
        const updated = selectedElements.filter(el => el.element !== element && el.id !== resolvedId);
        setSelectedElements(updated);
        element.classList.remove('text-editing-highlight');
      } else {
        const newSelection = {
          id: resolvedId,
          element: element,
          text: element.textContent || element.innerText || '',
          type: fieldPrefix,
          fieldKey: resolvedId
        };
        setSelectedElements([...selectedElements, newSelection]);
        element.classList.add('text-editing-highlight');
      }

      if (selectedElements.length === 0 || (selectedElements.length > 0 && !isAlreadySelected)) {
        setSelectedTextStyle(getSavedStyle());
      }
      return;
    }

    setSelectedElement({
      element: element,
      text: element.textContent || element.innerText || '',
      range: null,
      type: fieldPrefix,
      fieldKey: resolvedId
    });

    setSelectedTextStyle(getSavedStyle());
  };

  const handleSelectAll = () => {
    if (!isMultiSelectMode) {
      toast.error('Please enable Multi-Select Mode first');
      return;
    }

    let resumePreview = document.querySelector('[data-resume-preview="true"]');
    if (!resumePreview) {
      const possibleSelectors = [
        'div[class*="flex-1"][class*="overflow-y-auto"]',
        'div[class*="max-w-3xl"]',
        'main > div[class*="flex-1"]',
        'div[class*="resume"]',
        'div[class*="Resume"]',
        'main'
      ];

      for (const selector of possibleSelectors) {
        const found = document.querySelector(selector);
        if (found) {
          resumePreview = found;
          break;
        }
      }
    }

    if (!resumePreview) {
      resumePreview = document.body;
    }

    const allElements = resumePreview.querySelectorAll('*');
    const selectableElements = [];

    allElements.forEach((element) => {
      const className = element.className || '';
      const tagName = element.tagName.toLowerCase();

      const hasSelectableClass = className.includes('selectable-text') || className.includes('editable-text');
      const hasOnClick = element.onclick !== null || element.getAttribute('onclick') !== null;
      const isTextElement = (tagName === 'h3' || tagName === 'p' || tagName === 'span' || tagName === 'input') &&
        (hasSelectableClass || hasOnClick || className.includes('cursor-pointer'));

      if (isTextElement || hasSelectableClass) {
        if (element.classList.contains('text-editing-highlight')) {
          return;
        }
        if (element.offsetParent === null || element.offsetWidth === 0 || element.offsetHeight === 0) {
          return;
        }
        const textContent = element.textContent || element.innerText || element.value || '';
        if (!textContent.trim() && tagName !== 'input') {
          return;
        }

        selectableElements.push(element);
      }
    });

    if (selectableElements.length === 0) {
      toast.info('No selectable text elements found. Make sure you have text in your resume.');
      return;
    }

    const newSelections = [];
    selectableElements.forEach((element) => {
      const tagName = element.tagName.toLowerCase();
      const className = element.className || '';
      let elementType = 'body';

      if (tagName === 'input' && className.includes('editable-text')) {
        elementType = 'name';
      } else if (tagName === 'h3' || className.includes('heading')) {
        elementType = 'heading';
      } else if (tagName === 'p' && className.includes('summary')) {
        elementType = 'summary';
      } else if (tagName === 'p' || className.includes('body')) {
        elementType = 'body';
      }

      let elementId = element.getAttribute('data-element-id');
      if (!elementId) {
        elementId = `${Date.now()}-${Math.random()}`;
        element.setAttribute('data-element-id', elementId);
      }
      const selection = {
        id: elementId,
        element: element,
        text: element.textContent || element.innerText || element.value || '',
        type: elementType
      };

      newSelections.push(selection);
      element.classList.add('text-editing-highlight');
    });

    if (newSelections.length === 0) {
      toast.info('No new elements to select');
      return;
    }

    setSelectedElements([...selectedElements, ...newSelections]);
    toast.success(`Selected ${newSelections.length} element${newSelections.length !== 1 ? 's' : ''}`);
  };

  const applyTextFormatting = async (style) => {
    if (isMultiSelectMode && selectedElements.length > 0) {
      const elementsToFormat = selectedElements;
      const cleanFontFamily = style.fontFamily ? style.fontFamily.replace(/^["']|["']$/g, '').trim() : '';
      const perElementData = {
        fontFamily: cleanFontFamily,
        fontWeight: style.fontWeight,
        fontSize: style.fontSize,
        color: style.color,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing
      };
      const nextElementStyles = { ...(profile.elementStyles || {}) };

      for (const selected of elementsToFormat) {
        const element = selected.element;
        if (!element) continue;

        if (cleanFontFamily) {
          const fontFamilyValue = cleanFontFamily.includes(' ')
            ? `"${cleanFontFamily}"`
            : cleanFontFamily;
          element.style.fontFamily = fontFamilyValue;
        }
        if (style.fontWeight) element.style.fontWeight = style.fontWeight;
        if (style.fontSize) element.style.fontSize = style.fontSize;
        if (style.color) element.style.color = style.color;
        if (style.lineHeight) element.style.lineHeight = style.lineHeight;
        if (style.letterSpacing) element.style.letterSpacing = style.letterSpacing;

        const fieldKey = selected.fieldKey || selected.id;
        if (fieldKey) {
          nextElementStyles[fieldKey] = perElementData;
        }
      }

      onUpdateProfile('elementStyles', nextElementStyles);

      if (typeof saveProfile === 'function') {
        try {
          await saveProfile(null, { elementStyles: nextElementStyles });
        } catch (error) {
          console.error('Error saving text formatting:', error);
          toast.error('Failed to save formatting');
        }
      }
      return;
    }

    if (!selectedElement || !selectedElement.element) return;

    const element = selectedElement.element;

    const cleanFontFamily = style.fontFamily ? style.fontFamily.replace(/^["']|["']$/g, '').trim() : '';
    if (cleanFontFamily) {
      const fontFamilyValue = cleanFontFamily.includes(' ')
        ? `"${cleanFontFamily}"`
        : cleanFontFamily;
      element.style.fontFamily = fontFamilyValue;
    }

    if (style.fontWeight) element.style.fontWeight = style.fontWeight;
    if (style.fontSize) element.style.fontSize = style.fontSize;
    if (style.color) element.style.color = style.color;
    if (style.lineHeight) element.style.lineHeight = style.lineHeight;
    if (style.letterSpacing) element.style.letterSpacing = style.letterSpacing;

    const fieldKey = selectedElement.fieldKey;
    const formattingData = {
      fontFamily: cleanFontFamily || (style.fontFamily ? style.fontFamily.replace(/^["']|["']$/g, '').trim() : ''),
      fontWeight: style.fontWeight,
      fontSize: style.fontSize,
      color: style.color,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing
    };

    if (fieldKey) {
      const nextElementStyles = { ...(profile.elementStyles || {}), [fieldKey]: formattingData };
      onUpdateProfile('elementStyles', nextElementStyles);
      if (typeof saveProfile === 'function') {
        try {
          await saveProfile(null, { elementStyles: nextElementStyles });
        } catch (error) {
          console.error('Error saving text formatting:', error);
          toast.error('Failed to save formatting');
        }
      }
      return;
    }

    let fieldPrefix = selectedElement.type || '';
    if (!fieldPrefix) {
      const tagName = element.tagName.toLowerCase();
      const className = element.className || '';

      if (tagName === 'input' && className.includes('editable-text')) {
        fieldPrefix = 'name';
      } else if (tagName === 'h1' || (tagName === 'input' && element.placeholder?.includes('Name'))) {
        fieldPrefix = 'name';
      } else if (tagName === 'h3' || className.includes('heading')) {
        fieldPrefix = 'heading';
      } else if (tagName === 'p' && className.includes('summary')) {
        fieldPrefix = 'summary';
      } else if (tagName === 'p' || className.includes('body')) {
        fieldPrefix = 'body';
      }
    }

    if (fieldPrefix) {
      const globalFormattingData = {
        [`${fieldPrefix}FontFamily`]: formattingData.fontFamily,
        [`${fieldPrefix}FontWeight`]: formattingData.fontWeight,
        [`${fieldPrefix}FontSize`]: formattingData.fontSize,
        [`${fieldPrefix}Color`]: formattingData.color,
        [`${fieldPrefix}LineHeight`]: formattingData.lineHeight,
        [`${fieldPrefix}LetterSpacing`]: formattingData.letterSpacing
      };

      Object.keys(globalFormattingData).forEach(key => {
        onUpdateProfile(key, globalFormattingData[key]);
      });
      if (typeof saveProfile === 'function') {
        try {
          await saveProfile(null, globalFormattingData);
        } catch (error) {
          console.error('Error saving text formatting:', error);
          toast.error('Failed to save formatting');
        }
      }
    }
  };

  // Use ordered sections
  const sections = sectionOrder;

  const getSectionDisplayName = (sectionKey) => {
    if (sectionKey.startsWith('Custom:')) {
      const id = sectionKey.replace('Custom:', '');
      const custom = (profile.customSections || []).find(s => s.id === id);
      return custom ? custom.name : sectionKey;
    }
    return sectionKey;
  };

  const cssColorToHex = (cssColor) => {
    if (!cssColor || typeof cssColor !== 'string') return '#1B1B1B';
    const trimmed = cssColor.trim();
    if (/^#[0-9A-Fa-f]{3}$/.test(trimmed)) {
      const r = trimmed[1] + trimmed[1], g = trimmed[2] + trimmed[2], b = trimmed[3] + trimmed[3];
      return `#${r}${g}${b}`;
    }
    if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) return trimmed;
    if (/^#[0-9A-Fa-f]{8}$/.test(trimmed)) return trimmed.slice(0, 7);
    if (trimmed.includes('oklch') || trimmed.includes('oklab')) {
      const numMatch = trimmed.match(/oklch?\s*\(\s*([\d.]+)/);
      if (numMatch) {
        const L = Math.min(1, Math.max(0, parseFloat(numMatch[1]) || 0));
        const v = Math.round(L * 255);
        const h = v.toString(16).padStart(2, '0');
        return `#${h}${h}${h}`;
      }
    }
    try {
      const div = document.createElement('div');
      div.setAttribute('style', 'position:absolute;left:-9999px;visibility:hidden;');
      div.style.color = trimmed;
      document.body.appendChild(div);
      const computed = window.getComputedStyle(div).color;
      document.body.removeChild(div);
      const rgb = computed.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
      if (rgb) {
        const r = Number(rgb[1]).toString(16).padStart(2, '0');
        const g = Number(rgb[2]).toString(16).padStart(2, '0');
        const b = Number(rgb[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
      }
      const rgba = computed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (rgba) {
        const r = Number(rgba[1]).toString(16).padStart(2, '0');
        const g = Number(rgba[2]).toString(16).padStart(2, '0');
        const b = Number(rgba[3]).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
      }
    } catch (_) {}
    return '#1B1B1B';
  };

  const profileSkillsRaw = profile?.skills || [];
  const liveCVSkills = profileSkillsRaw.map((s, i) =>
    typeof s === 'string'
      ? { id: `skill-${i}`, name: s, type: 'technical' }
      : { id: s?.id ?? `skill-${i}`, name: s?.name ?? String(s), type: s?.type || 'technical' }
  );

  const liveCV = {
    job: {
      title: profile?.fullName ? `${profile.fullName} - CV` : 'My CV',
      companyName: '',
      place: '',
      jobType: '',
      skills: liveCVSkills,
    },
    profile: {
      ...profile,
      profilePicture: user?.profilePicture || profile?.profilePicture || null,
    },
    skills: liveCVSkills,
    generatedDate: new Date().toISOString(),
  };

  const renderTemplateByNumber = (templateNum) => {
    if (templateNum === 1) return <JobCVTemplate1 cv={liveCV} />;
    if (templateNum === 2) return <JobCVTemplate2 cv={liveCV} />;
    if (templateNum === 3) return <JobCVTemplate1 cv={liveCV} />;
    if (templateNum === 4) return <JobCVTemplate4 cv={liveCV} />;
    if (templateNum === 5) return <JobCVTemplate5 cv={liveCV} />;
    if (templateNum === 6) return <JobCVTemplate6 cv={liveCV} />;
    if (templateNum === 7) return <JobCVTemplate7 cv={liveCV} />;
    if (templateNum === 8) return <JobCVTemplate8 cv={liveCV} />;
    return null;
  };

  const renderResumeSection = (sectionName) => {
    if (sectionName.startsWith('Custom:')) {
      const id = sectionName.replace('Custom:', '');
      const custom = (profile.customSections || []).find(s => s.id === id);
      if (!custom || !(custom.entries && custom.entries.length > 0)) return null;
      const customKey = `Custom_${id}`;
      return (
        <div key={sectionName} className="space-y-3 pt-4 border-t border-neutral-200">
          <h3
            className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text heading"
            data-element-id={`${customKey}_heading`}
            onClick={(e) => handleTextElementClick(e, 'heading', `${customKey}_heading`)}
            style={getElementStyle(profile, `${customKey}_heading`, 'heading')}
          >
            {custom.name}
          </h3>
          {custom.entries.map((entry, idx) => (
            <div key={entry.id} className="space-y-1">
              {(entry.title || entry.subtitle || entry.description) && (
                <>
                  {entry.title && (
                    <p
                      className="text-[11px] font-medium text-neutral-800 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                      data-element-id={`${customKey}_${idx}_title`}
                      onClick={(e) => handleTextElementClick(e, 'body', `${customKey}_${idx}_title`)}
                      style={getElementStyle(profile, `${customKey}_${idx}_title`, 'body')}
                    >
                      {entry.title}
                    </p>
                  )}
                  {entry.subtitle && (
                    <p
                      className="text-[10px] text-neutral-600 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                      data-element-id={`${customKey}_${idx}_subtitle`}
                      onClick={(e) => handleTextElementClick(e, 'body', `${customKey}_${idx}_subtitle`)}
                      style={getElementStyle(profile, `${customKey}_${idx}_subtitle`, 'body')}
                    >
                      {entry.subtitle}
                    </p>
                  )}
                  {entry.description && (
                    <p
                      className="text-[10px] text-neutral-700 leading-relaxed whitespace-pre-wrap cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                      data-element-id={`${customKey}_${idx}_description`}
                      onClick={(e) => handleTextElementClick(e, 'body', `${customKey}_${idx}_description`)}
                      style={getElementStyle(profile, `${customKey}_${idx}_description`, 'body')}
                    >
                      {entry.description}
                    </p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      );
    }

    switch (sectionName) {
      case 'Professional Summary':
        if (!profile.aboutMe) return null;
        return (
          <div key="professional-summary" className="space-y-2 pt-4 border-t border-neutral-200">
            <h3
              className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text heading"
              data-element-id="Professional Summary_heading"
              onClick={(e) => handleTextElementClick(e, 'heading', 'Professional Summary_heading')}
              style={getElementStyle(profile, 'Professional Summary_heading', 'heading')}
            >
              Professional Summary
            </h3>
            <p
              className="text-[11px] text-neutral-700 leading-relaxed whitespace-pre-wrap cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text summary"
              data-element-id="Professional Summary_summary"
              onClick={(e) => handleTextElementClick(e, 'summary', 'Professional Summary_summary')}
              style={getElementStyle(profile, 'Professional Summary_summary', 'summary')}
            >
              {profile.aboutMe}
            </p>
          </div>
        );

      case 'Education':
        if (!profile.education || profile.education.length === 0) return null;
        return (
          <div key="education" className="space-y-3 pt-4 border-t border-neutral-200">
            <h3
              className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text heading"
              data-element-id="Education_heading"
              onClick={(e) => handleTextElementClick(e, 'heading', 'Education_heading')}
              style={getElementStyle(profile, 'Education_heading', 'heading')}
            >
              Education
            </h3>
            {profile.education.map((edu, idx) => (
              <div key={edu.id} className="space-y-1">
                <p
                  className="text-[10px] text-neutral-500 uppercase cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                  data-element-id={`Education_${idx}_date`}
                  onClick={(e) => handleTextElementClick(e, 'body', `Education_${idx}_date`)}
                  style={getElementStyle(profile, `Education_${idx}_date`, 'body')}
                >
                  {edu.startYear || 'Start'} - {edu.endYear || 'End'}
                </p>
                <p
                  className="text-xs font-semibold text-neutral-900 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                  data-element-id={`Education_${idx}_degree`}
                  onClick={(e) => handleTextElementClick(e, 'body', `Education_${idx}_degree`)}
                  style={getElementStyle(profile, `Education_${idx}_degree`, 'body')}
                >
                  {edu.degree || edu.title || 'Degree'} @ {edu.institution || 'Institution'}
                </p>
                {edu.location && (
                  <p
                    className="text-[10px] text-neutral-600 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                    data-element-id={`Education_${idx}_location`}
                    onClick={(e) => handleTextElementClick(e, 'body', `Education_${idx}_location`)}
                    style={getElementStyle(profile, `Education_${idx}_location`, 'body')}
                  >
                    {edu.location}
                  </p>
                )}
                {edu.gpa && (
                  <p
                    className="text-[10px] text-neutral-600 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                    data-element-id={`Education_${idx}_gpa`}
                    onClick={(e) => handleTextElementClick(e, 'body', `Education_${idx}_gpa`)}
                    style={getElementStyle(profile, `Education_${idx}_gpa`, 'body')}
                  >
                    GPA: {edu.gpa}
                  </p>
                )}
              </div>
            ))}
          </div>
        );

      case 'Work Experience':
        if (!profile.workExperience || profile.workExperience.length === 0) return null;
        return (
          <div key="work-experience" className="space-y-4 pt-4 border-t border-neutral-200">
            <h3
              className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text heading"
              data-element-id="Work Experience_heading"
              onClick={(e) => handleTextElementClick(e, 'heading', 'Work Experience_heading')}
              style={getElementStyle(profile, 'Work Experience_heading', 'heading')}
            >
              Experience
            </h3>
            {profile.workExperience.map((exp, idx) => (
              <div key={exp.id} className="space-y-1">
                <p
                  className="text-xs font-semibold text-neutral-900 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                  data-element-id={`Work Experience_${idx}_title`}
                  onClick={(e) => handleTextElementClick(e, 'body', `Work Experience_${idx}_title`)}
                  style={getElementStyle(profile, `Work Experience_${idx}_title`, 'body')}
                >
                  {exp.title || 'Job Title'} @ {exp.company || 'Company'}
                </p>
                <p
                  className="text-[10px] text-neutral-500 uppercase cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                  data-element-id={`Work Experience_${idx}_date`}
                  onClick={(e) => handleTextElementClick(e, 'body', `Work Experience_${idx}_date`)}
                  style={getElementStyle(profile, `Work Experience_${idx}_date`, 'body')}
                >
                  {exp.startDate || 'Start'} - {exp.current ? 'Present' : exp.endDate || 'End'}
                </p>
                {exp.location && (
                  <p
                    className="text-[10px] text-neutral-600 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                    data-element-id={`Work Experience_${idx}_location`}
                    onClick={(e) => handleTextElementClick(e, 'body', `Work Experience_${idx}_location`)}
                    style={getElementStyle(profile, `Work Experience_${idx}_location`, 'body')}
                  >
                    {exp.location}
                  </p>
                )}
                {exp.description && (
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-neutral-700 ml-2 mt-1">
                    {exp.description.split('\n').filter(line => line.trim()).map((line, lineIdx) => (
                      <li
                        key={lineIdx}
                        className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                        data-element-id={`Work Experience_${idx}_desc_${lineIdx}`}
                        onClick={(e) => handleTextElementClick(e, 'body', `Work Experience_${idx}_desc_${lineIdx}`)}
                        style={getElementStyle(profile, `Work Experience_${idx}_desc_${lineIdx}`, 'body')}
                      >
                        {line.trim()}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        );

      case 'Projects':
        if (!profile.projects || profile.projects.length === 0) return null;
        return (
          <div key="projects" className="space-y-3 pt-4 border-t border-neutral-200">
            <h3
              className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text heading"
              data-element-id="Projects_heading"
              onClick={(e) => handleTextElementClick(e, 'heading', 'Projects_heading')}
              style={getElementStyle(profile, 'Projects_heading', 'heading')}
            >
              Projects
            </h3>
            {profile.projects.map((proj, idx) => (
              <div key={proj.id} className="space-y-1">
                <p
                  className="text-[10px] text-neutral-500 uppercase cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                  data-element-id={`Projects_${idx}_date`}
                  onClick={(e) => handleTextElementClick(e, 'body', `Projects_${idx}_date`)}
                  style={getElementStyle(profile, `Projects_${idx}_date`, 'body')}
                >
                  {proj.startDate || 'Start'} - {proj.endDate || 'End'}
                </p>
                <p
                  className="text-xs font-semibold text-neutral-900 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                  data-element-id={`Projects_${idx}_title`}
                  onClick={(e) => handleTextElementClick(e, 'body', `Projects_${idx}_title`)}
                  style={getElementStyle(profile, `Projects_${idx}_title`, 'body')}
                >
                  {proj.title || 'Project Title'}
                </p>
                {proj.type && (
                  <p
                    className="text-[10px] text-neutral-600 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                    data-element-id={`Projects_${idx}_type`}
                    onClick={(e) => handleTextElementClick(e, 'body', `Projects_${idx}_type`)}
                    style={getElementStyle(profile, `Projects_${idx}_type`, 'body')}
                  >
                    {proj.type}
                  </p>
                )}
                {proj.description && (
                  <p
                    className="text-[11px] text-neutral-700 mt-1 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                    data-element-id={`Projects_${idx}_description`}
                    onClick={(e) => handleTextElementClick(e, 'body', `Projects_${idx}_description`)}
                    style={getElementStyle(profile, `Projects_${idx}_description`, 'body')}
                  >
                    {proj.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        );

      case 'Certificates':
        if (!profile.certificates || profile.certificates.length === 0) return null;
        return (
          <div key="certificates" className="space-y-3 pt-4 border-t border-neutral-200">
            <h3
              className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text heading"
              data-element-id="Certificates_heading"
              onClick={(e) => handleTextElementClick(e, 'heading', 'Certificates_heading')}
              style={getElementStyle(profile, 'Certificates_heading', 'heading')}
            >
              Certificates
            </h3>
            {profile.certificates.map((cert, idx) => (
              <div key={cert.id} className="space-y-1">
                <p
                  className="text-xs font-semibold text-neutral-900 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                  data-element-id={`Certificates_${idx}_title`}
                  onClick={(e) => handleTextElementClick(e, 'body', `Certificates_${idx}_title`)}
                  style={getElementStyle(profile, `Certificates_${idx}_title`, 'body')}
                >
                  {cert.title || 'Certificate Title'}
                </p>
                <p
                  className="text-[10px] text-neutral-600 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                  data-element-id={`Certificates_${idx}_issuer`}
                  onClick={(e) => handleTextElementClick(e, 'body', `Certificates_${idx}_issuer`)}
                  style={getElementStyle(profile, `Certificates_${idx}_issuer`, 'body')}
                >
                  {cert.issuer || 'Issuer'}
                  {cert.year && ` • ${cert.year}`}
                </p>
              </div>
            ))}
          </div>
        );

      case 'Contacts':
        if (!profile.linkedin && !profile.github && !profile.portfolio) return null;
        return (
          <div key="contacts" className="space-y-2 pt-4 border-t border-neutral-200">
            <h3
              className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text heading"
              data-element-id="Contacts_heading"
              onClick={(e) => handleTextElementClick(e, 'heading', 'Contacts_heading')}
              style={getElementStyle(profile, 'Contacts_heading', 'heading')}
            >
              Social Links
            </h3>
            <div className="flex flex-col gap-1.5">
              {profile.linkedin && (
                <div className="flex items-center gap-2 text-[10px] text-neutral-700">
                  <i
                    className="fab fa-linkedin text-[9px] flex-shrink-0"
                    style={{ color: profile.linkedinIconColor || '#6b7280' }}
                  ></i>
                  <span
                    className="font-normal cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                    data-element-id="Contacts_linkedin"
                    onClick={(e) => handleTextElementClick(e, 'body', 'Contacts_linkedin')}
                    style={getElementStyle(profile, 'Contacts_linkedin', 'body')}
                  >
                    {profile.linkedin}
                  </span>
                </div>
              )}
              {profile.github && (
                <div className="flex items-center gap-2 text-[10px] text-neutral-700">
                  <i
                    className="fab fa-github text-[9px] flex-shrink-0"
                    style={{ color: profile.githubIconColor || '#6b7280' }}
                  ></i>
                  <span
                    className="font-normal cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                    data-element-id="Contacts_github"
                    onClick={(e) => handleTextElementClick(e, 'body', 'Contacts_github')}
                    style={getElementStyle(profile, 'Contacts_github', 'body')}
                  >
                    {profile.github}
                  </span>
                </div>
              )}
              {profile.portfolio && (
                <div className="flex items-center gap-2 text-[10px] text-neutral-700">
                  <i
                    className="fas fa-globe text-[9px] flex-shrink-0"
                    style={{ color: profile.portfolioIconColor || '#6b7280' }}
                  ></i>
                  <span
                    className="font-normal cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                    data-element-id="Contacts_portfolio"
                    onClick={(e) => handleTextElementClick(e, 'body', 'Contacts_portfolio')}
                    style={getElementStyle(profile, 'Contacts_portfolio', 'body')}
                  >
                    {profile.portfolio}
                  </span>
                </div>
              )}
            </div>
          </div>
        );

      case 'Skills':
        if (!profile.skills || profile.skills.length === 0) return null;
        return (
          <div key="skills" className="space-y-2 pt-4 border-t border-neutral-200">
            <h3
              className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text heading"
              data-element-id="Skills_heading"
              onClick={(e) => handleTextElementClick(e, 'heading', 'Skills_heading')}
              style={getElementStyle(profile, 'Skills_heading', 'heading')}
            >
              Skills
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((skill, index) => (
                <span
                  key={index}
                  className="text-[11px] text-neutral-700 cursor-pointer hover:bg-blue-50 rounded px-2 py-0.5 transition-colors selectable-text body inline-block"
                  data-element-id={`Skills_${index}`}
                  onClick={(e) => handleTextElementClick(e, 'body', `Skills_${index}`)}
                  style={getElementStyle(profile, `Skills_${index}`, 'body')}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handlePrint = () => {
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();
    const printArea = document.getElementById('cv-download-source');
    const highlighted = printArea ? printArea.querySelectorAll('.text-editing-highlight') : [];
    highlighted.forEach((node) => node.classList.remove('text-editing-highlight'));
    const originalTitle = document.title;
    document.title = '';
    window.print();
    setTimeout(() => {
      highlighted.forEach((node) => node.classList.add('text-editing-highlight'));
      document.title = originalTitle;
    }, 500);
  };

  const handleDownloadClick = () => {
    handleSaveToDevice();
  };

  /** Convert any CSS color to rgb(r,g,b) for PDF/html2canvas compatibility (e.g. oklch, oklab, color-mix). */
  const cssColorToRgb = (cssColor) => {
    if (!cssColor || typeof cssColor !== 'string') return null;
    const trimmed = cssColor.trim();
    if (!trimmed) return null;
    if (/^rgba?\(|^#[0-9A-Fa-f]{3,8}$/.test(trimmed)) return trimmed;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = trimmed;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return `rgb(${r},${g},${b})`;
    } catch (_) {
      return null;
    }
  };

  const resolveColorForPdf = (prop, val) => {
    if (!val || (!val.includes('oklch') && !val.includes('oklab') && !val.includes('color-mix'))) return val;
    try {
      const div = document.createElement('div');
      div.setAttribute('style', 'position:absolute;left:-9999px;visibility:hidden;');
      div.style.setProperty(prop, val);
      document.body.appendChild(div);
      const computed = window.getComputedStyle(div).getPropertyValue(prop);
      document.body.removeChild(div);
      if (computed && !computed.includes('oklch') && !computed.includes('oklab') && !computed.includes('color-mix')) return computed;
      const fromComputed = cssColorToRgb(computed);
      if (fromComputed) return fromComputed;
    } catch (_) {}
    const rgb = cssColorToRgb(val);
    if (rgb) return rgb;
    if (prop === 'background' || prop === 'background-color') return 'white';
    if (prop === 'color' || (prop.startsWith('border') && prop.endsWith('color')) || prop === 'outline-color') return 'rgb(0, 0, 0)';
    if (prop === 'fill' || prop === 'stroke') return 'currentColor';
    return 'transparent';
  };

  const cloneWithResolvedStyles = (source) => {
    const clone = source.cloneNode(true);
    const colorProps = new Set(['color', 'background-color', 'background', 'border-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'outline-color', 'fill', 'stroke', 'box-shadow', 'text-shadow']);
    const walk = (orig, cl) => {
      if (!orig || !cl || orig.nodeType !== 1 || cl.nodeType !== 1) return;
      const cs = window.getComputedStyle(orig);
      for (let i = 0; i < cs.length; i++) {
        const prop = cs[i];
        const val = cs.getPropertyValue(prop);
        if (!val) continue;
        if (val.includes('oklch') || val.includes('oklab') || val.includes('color-mix')) {
          if (colorProps.has(prop)) {
            const resolved = resolveColorForPdf(prop, val);
            cl.style.setProperty(prop, resolved);
          } else if (prop === 'border' || (prop.startsWith('border-') && !prop.endsWith('-color'))) {
            const width = cs.getPropertyValue(prop + '-width') || '1px';
            const style = cs.getPropertyValue(prop + '-style') || 'solid';
            const color = resolveColorForPdf(prop + '-color', cs.getPropertyValue(prop + '-color') || 'rgb(0,0,0)');
            cl.style.setProperty(prop, `${width} ${style} ${color}`);
          } else if (prop === 'box-shadow' || prop === 'text-shadow') {
            cl.style.setProperty(prop, 'none');
          }
          continue;
        }
        cl.style.setProperty(prop, val);
      }
      const colorVal = cs.getPropertyValue('color');
      const bgVal = cs.getPropertyValue('background-color');
      if (colorVal && (colorVal.includes('oklch') || colorVal.includes('oklab') || colorVal.includes('color-mix'))) {
        const resolved = resolveColorForPdf('color', colorVal);
        if (resolved) cl.style.setProperty('color', resolved);
      }
      if (bgVal && (bgVal.includes('oklch') || bgVal.includes('oklab') || bgVal.includes('color-mix'))) {
        const resolved = resolveColorForPdf('background-color', bgVal);
        if (resolved) cl.style.setProperty('background-color', resolved);
      }
      cl.removeAttribute('class');
      if (orig.childNodes && cl.childNodes) {
        for (let j = 0; j < Math.min(orig.childNodes.length, cl.childNodes.length); j++) {
          walk(orig.childNodes[j], cl.childNodes[j]);
        }
      }
    };
    walk(source, clone);
    return clone;
  };

  const stripEditingHighlightFromClone = (clone) => {
    if (!clone || clone.nodeType !== 1) return;
    const all = [clone, ...(clone.querySelectorAll ? Array.from(clone.querySelectorAll('*')) : [])];
    all.forEach((node) => {
      if (node.style) {
        node.style.outline = 'none';
        node.style.outlineOffset = '0';
        const bg = (node.style.backgroundColor || node.style.background || '').toString();
        if (bg && (bg.includes('59, 130, 246') || bg.includes('59,130,246') || (bg.includes('3b82f6') && bg.includes('0.08')))) {
          node.style.backgroundColor = 'transparent';
          node.style.background = 'transparent';
        }
      }
    });
  };

  const handleSaveToDevice = async () => {
    const el = document.getElementById('cv-download-source');
    if (!el) {
      toast.error('Could not find CV content to download.');
      return;
    }
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();
    const highlighted = el.querySelectorAll('.text-editing-highlight');
    highlighted.forEach((node) => node.classList.remove('text-editing-highlight'));
    void el.offsetHeight;
    setIsGeneratingPdf(true);
    let iframe = null;
    try {
      const clone = cloneWithResolvedStyles(el);
      stripEditingHighlightFromClone(clone);
      clone.id = 'cv-pdf-clone';
      const a4WidthPx = Math.round(210 * (96 / 25.4));
      const a4HeightPx = Math.round(297 * (96 / 25.4));
      const fullHeight = Math.max(el.scrollHeight || el.offsetHeight || a4HeightPx, a4HeightPx);

      clone.style.background = '#fff';
      clone.style.width = a4WidthPx + 'px';
      clone.style.minWidth = a4WidthPx + 'px';
      clone.style.maxWidth = a4WidthPx + 'px';
      clone.style.height = 'auto';
      clone.style.minHeight = fullHeight + 'px';
      clone.style.overflow = 'visible';
      clone.style.boxSizing = 'border-box';
      clone.style.border = 'none';
      clone.style.boxShadow = 'none';
      clone.style.borderRadius = '0';
      clone.style.outline = 'none';
      clone.style.transform = 'none';
      clone.style.transformOrigin = '';

      iframe = document.createElement('iframe');
      iframe.setAttribute('style', 'position:absolute;left:-9999px;top:0;width:' + (a4WidthPx + 40) + 'px;height:' + fullHeight + 'px;border:0;');
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument;
      doc.open();
      doc.write('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#fff;width:' + a4WidthPx + 'px;min-height:' + fullHeight + 'px;"></body></html>');
      doc.close();
      doc.body.appendChild(clone);

      const inner = clone.firstElementChild;
      if (inner) {
        inner.style.height = 'auto';
        inner.style.minHeight = 'auto';
        inner.style.overflow = 'visible';
        inner.style.maxHeight = 'none';
      }

      const filename = `${(profile?.fullName || 'CV').replace(/[^a-zA-Z0-9-_]/g, '_')}-CV.pdf`;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await html2pdf()
        .set({
          margin: [0, 0, 0, 0],
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            width: a4WidthPx,
            windowWidth: a4WidthPx,
            windowHeight: fullHeight,
            scrollX: 0,
            scrollY: 0,
          },
          jsPDF: { unit: 'mm', format: 'a4', hotfixes: ['px_scaling'] },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        })
        .from(clone)
        .save();
      toast.success('PDF downloaded.');
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('Download failed. Try again or use Print and save as PDF.');
    } finally {
      highlighted.forEach((node) => node.classList.add('text-editing-highlight'));
      if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className={`flex flex-col bg-[#f3f4f6] ${hideStudentNavigation ? '' : 'h-screen lg:ml-72 pt-16 sm:pt-16 lg:pt-0 overflow-hidden'}`}>
      <JobCVPreviewPrintStyles />
      <style>{`
        .text-editing-highlight {
          outline: 2px solid #3b82f6 !important;
          outline-offset: 2px !important;
          background-color: rgba(59, 130, 246, 0.08) !important;
          border-radius: 4px !important;
          transition: all 0.2s ease-in-out !important;
        }
        .text-editing-highlight:hover {
          background-color: rgba(59, 130, 246, 0.12) !important;
        }
        .cv-print-area {
          background-image: repeating-linear-gradient(
            to bottom,
            transparent 0,
            transparent calc(297mm - 1px),
            rgba(0, 0, 0, 0.06) calc(297mm - 1px),
            rgba(0, 0, 0, 0.06) 297mm
          );
        }
        @media (max-width: 1023px) {
          .cv-preview-mobile-fit {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            width: 100%;
            min-height: calc(100vw * 297 / 210);
            padding-bottom: 1rem;
          }
          .cv-preview-mobile-fit .cv-print-area {
            transform: scale(calc(100vw / 794px));
            transform-origin: top center;
          }
        }
        .cv-download-preview-container {
          container-type: inline-size;
          container-name: download-preview;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          width: 100%;
          min-height: 100%;
        }
        @container download-preview (max-width: 794px) {
          .cv-download-preview-container > * {
            transform: scale(calc(100cqw / 794px));
            transform-origin: top center;
          }
        }
      `}</style>
      {!hideStudentNavigation && (
        <StudentMenuNavigation currentPage={currentPage} onPageChange={onPageChange} />
      )}

      {/* Mobile overlay when a panel is open — high z-index so drawers can sit above it */}
      {mobilePanel && (
        <div
          className="fixed inset-0 bg-black/40 z-[45] lg:hidden"
          onClick={closeMobilePanel}
          aria-hidden="true"
        />
      )}

      <div className="flex flex-1 min-h-0 min-w-0">
        {/* Left Sidebar: Builder Sections — on mobile: slide-out drawer */}
        <aside
          className={`
            flex flex-col bg-white border-r border-neutral-200
            w-[85%] max-w-[280px] lg:w-64
            fixed lg:static inset-y-0 left-0 z-50 lg:z-auto top-14 lg:top-0 h-[calc(100vh-3.5rem)] lg:h-auto
            shadow-xl lg:shadow-none
            transform transition-transform duration-200 ease-out
            -translate-x-full lg:translate-x-0
            ${mobilePanel === 'builder' ? 'translate-x-0' : ''}
          `}
          aria-hidden={mobilePanel !== 'builder'}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 flex-shrink-0">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSidebarTab('builder')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${sidebarTab === 'builder'
                    ? 'font-semibold text-neutral-900 bg-neutral-100'
                    : 'text-neutral-600 hover:text-neutral-900'
                  }`}
              >
                Builder
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('templates')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${sidebarTab === 'templates'
                    ? 'font-semibold text-neutral-900 bg-neutral-100'
                    : 'text-neutral-600 hover:text-neutral-900'
                  }`}
              >
                Templates
              </button>
            </div>
            <button
              type="button"
              onClick={closeMobilePanel}
              className="lg:hidden p-2 -m-2 text-neutral-500 hover:text-neutral-700"
              aria-label="Close"
            >
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>
          {sidebarTab === 'templates' ? (
            <div className="flex-1 overflow-y-auto py-3 px-3">
              <div className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-2 px-1">Choose layout</div>
              {[
                { num: 0, label: 'Standard Layout' },
                { num: 1, label: 'Template 1' },
                { num: 2, label: 'Template 2' },
                { num: 4, label: 'Template 4' },
                { num: 5, label: 'Template 5' },
                { num: 6, label: 'Template 6' },
                { num: 7, label: 'Template 7' },
                { num: 8, label: 'Template 8' },
              ].map(({ num, label }) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => onSelectTemplate(num)}
                  className={`w-full text-left px-3 py-2.5 text-xs rounded-lg mb-1 transition-colors ${selectedTemplate === num
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col">
              {jobs.length > 0 && (
                <div className="px-4 py-3 border-b border-neutral-200 flex-shrink-0">
                  <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">Optimize for job (ATS)</label>
                  <select
                    value={selectedJobIdForAts || ''}
                    onChange={(e) => onSelectJobIdForAts(e.target.value || null)}
                    className="w-full text-[11px] border border-neutral-200 rounded-lg px-2.5 py-2 bg-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                  >
                    <option value="">Select job</option>
                    {jobs.map((job) => (
                      <option key={job._id || job.id} value={job._id || job.id}>
                        {job.title || job.name || 'Job'} · {job.company || 'Company'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <nav className="flex-1 min-h-0 overflow-y-auto py-2">
                {sections.map((section) => (
                  <div
                    key={section}
                    className={`border-b border-neutral-100 last:border-b-0 transition-colors ${dragOverSection === section ? 'bg-blue-100' : ''
                      }`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, section)}
                    onDragOver={(e) => handleDragOver(e, section)}
                    onDragLeave={handleDragLeave}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, section)}
                    style={{ cursor: draggedSection === section ? 'grabbing' : 'grab' }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSection(section);
                        toggleSection(section);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-xs ${activeSection === section
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-neutral-700 hover:bg-neutral-50'
                        } transition-colors`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <i className="fas fa-grip-vertical text-[10px] text-neutral-400 flex-shrink-0"></i>
                        <span className="truncate">{getSectionDisplayName(section)}</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 ml-2 flex-shrink-0">
                        {expandedSections[section] ? '—' : '+'}
                      </span>
                    </button>

                    {/* Inline panel for Your Details */}
                    {section === 'Your Details' && expandedSections['Your Details'] && (
                      <div className="px-4 pb-4 pt-1 bg-white">
                        <div className="text-[11px] font-semibold text-neutral-900 mb-2">
                          Your Details
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                              Name
                            </label>
                            <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                              <input
                                type="text"
                                value={nameDraft}
                                onChange={(e) => setNameDraft(e.target.value)}
                                placeholder="Enter your full name"
                                className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateProfile('fullName', nameDraft);
                            if (typeof saveProfile === 'function') {
                              saveProfile(null, { name: nameDraft });
                            }
                            toast.success('Name saved successfully');
                          }}
                          className="mt-3 w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium py-2.5 transition-colors"
                        >
                          Save name
                        </button>

                        {/* Contact Information Form */}
                        <div className="mt-4 pt-4 border-t border-neutral-200">
                          <div className="text-[11px] font-semibold text-neutral-900 mb-2">
                            Contact Information
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                                Email
                              </label>
                              <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                                <input
                                  type="email"
                                  value={emailDraft}
                                  onChange={(e) => setEmailDraft(e.target.value)}
                                  placeholder="your.email@example.com"
                                  className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                                Mobile Number
                              </label>
                              <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                                <input
                                  type="tel"
                                  value={phoneDraft}
                                  onChange={(e) => setPhoneDraft(e.target.value)}
                                  placeholder="+1 234 567 8900"
                                  className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                                Address
                              </label>
                              <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                                <textarea
                                  value={addressDraft}
                                  onChange={(e) => setAddressDraft(e.target.value)}
                                  placeholder="123 Main Street, City, State, ZIP"
                                  rows={2}
                                  className="w-full text-[11px] text-neutral-700 border-none outline-none resize-none bg-transparent"
                                />
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateProfile('email', emailDraft);
                              onUpdateProfile('phone', phoneDraft);
                              onUpdateProfile('address', addressDraft);
                              onUpdateProfile('emailIcon', emailIcon);
                              onUpdateProfile('phoneIcon', phoneIcon);
                              onUpdateProfile('addressIcon', addressIcon);
                              onUpdateProfile('emailIconColor', emailIconColor);
                              onUpdateProfile('phoneIconColor', phoneIconColor);
                              onUpdateProfile('addressIconColor', addressIconColor);
                              if (typeof saveProfile === 'function') {
                                saveProfile(null, {
                                  name: profile.fullName,
                                  email: emailDraft,
                                  phone: phoneDraft,
                                  address: addressDraft,
                                  emailIcon,
                                  phoneIcon,
                                  addressIcon,
                                  emailIconColor,
                                  phoneIconColor,
                                  addressIconColor
                                });
                              }
                              toast.success('Contact information saved successfully');
                            }}
                            className="mt-3 w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium py-2.5 transition-colors"
                          >
                            Save contact info
                          </button>

                          {/* Icon & Color Customization */}
                          <div className="mt-4 pt-4 border-t border-neutral-200">
                            <div className="text-[11px] font-semibold text-neutral-900 mb-3">
                              Icon & Color Customization
                            </div>

                            {/* Email Icon & Color */}
                            <div className="mb-4">
                              <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                                Email Icon
                              </label>
                              <div className="grid grid-cols-4 gap-1.5 mb-2">
                                {emailIcons.map((icon) => (
                                  <button
                                    key={icon.value}
                                    type="button"
                                    onClick={() => setEmailIcon(icon.value)}
                                    className={`p-2 border rounded text-[10px] transition-colors ${emailIcon === icon.value
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-neutral-200 hover:border-neutral-300'
                                      }`}
                                    title={icon.label}
                                  >
                                    <i className={icon.value} style={{ color: emailIconColor }}></i>
                                  </button>
                                ))}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-neutral-600">Color:</span>
                                <div className="flex gap-1.5">
                                  {colorPalette.map((color) => (
                                    <button
                                      key={color}
                                      type="button"
                                      onClick={() => {
                                        setEmailIconColor(color);
                                        onUpdateProfile('emailIconColor', color);
                                      }}
                                      className={`w-5 h-5 rounded border-2 transition-all ${emailIconColor === color
                                          ? 'border-neutral-900 scale-110'
                                          : 'border-neutral-300 hover:border-neutral-400'
                                        }`}
                                      style={{ backgroundColor: color }}
                                      title={color}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Phone Icon & Color */}
                            <div className="mb-4">
                              <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                                Mobile Icon
                              </label>
                              <div className="grid grid-cols-4 gap-1.5 mb-2">
                                {phoneIcons.map((icon) => (
                                  <button
                                    key={icon.value}
                                    type="button"
                                    onClick={() => setPhoneIcon(icon.value)}
                                    className={`p-2 border rounded text-[10px] transition-colors ${phoneIcon === icon.value
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-neutral-200 hover:border-neutral-300'
                                      }`}
                                    title={icon.label}
                                  >
                                    <i className={icon.value} style={{ color: phoneIconColor }}></i>
                                  </button>
                                ))}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-neutral-600">Color:</span>
                                <div className="flex gap-1.5">
                                  {colorPalette.map((color) => (
                                    <button
                                      key={color}
                                      type="button"
                                      onClick={() => {
                                        setPhoneIconColor(color);
                                        onUpdateProfile('phoneIconColor', color);
                                      }}
                                      className={`w-5 h-5 rounded border-2 transition-all ${phoneIconColor === color
                                          ? 'border-neutral-900 scale-110'
                                          : 'border-neutral-300 hover:border-neutral-400'
                                        }`}
                                      style={{ backgroundColor: color }}
                                      title={color}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Address Icon & Color */}
                            <div>
                              <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                                Address Icon
                              </label>
                              <div className="grid grid-cols-5 gap-1.5 mb-2">
                                {addressIcons.map((icon) => (
                                  <button
                                    key={icon.value}
                                    type="button"
                                    onClick={() => setAddressIcon(icon.value)}
                                    className={`p-2 border rounded text-[10px] transition-colors ${addressIcon === icon.value
                                        ? 'border-blue-600 bg-blue-50'
                                        : 'border-neutral-200 hover:border-neutral-300'
                                      }`}
                                    title={icon.label}
                                  >
                                    <i className={icon.value} style={{ color: addressIconColor }}></i>
                                  </button>
                                ))}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-neutral-600">Color:</span>
                                <div className="flex gap-1.5">
                                  {colorPalette.map((color) => (
                                    <button
                                      key={color}
                                      type="button"
                                      onClick={() => {
                                        setAddressIconColor(color);
                                        onUpdateProfile('addressIconColor', color);
                                      }}
                                      className={`w-5 h-5 rounded border-2 transition-all ${addressIconColor === color
                                          ? 'border-neutral-900 scale-110'
                                          : 'border-neutral-300 hover:border-neutral-400'
                                        }`}
                                      style={{ backgroundColor: color }}
                                      title={color}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Inline panel for Professional Summary, matching the image */}
                    {section === 'Professional Summary' && expandedSections['Professional Summary'] && (
                      <div className="px-4 pb-4 pt-1 bg-white">
                        <div className="text-[11px] font-semibold text-neutral-900 mb-2">
                          Professional Summary
                        </div>
                        <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                          <textarea
                            value={summaryDraft}
                            onChange={(e) => setSummaryDraft(e.target.value)}
                            placeholder="Write a brief summary of your professional experience here"
                            rows={4}
                            className="w-full text-[11px] text-neutral-700 border-none outline-none resize-none bg-transparent"
                          />
                        </div>
                        <div className="mt-3 flex flex-col gap-2">
                          <button
                            type="button"
                            disabled={!selectedJobIdForAts || isRewritingSection}
                            onClick={() => {
                              if (!selectedJobIdForAts) {
                                toast.error('Select a job in the dropdown above to optimize for ATS');
                                return;
                              }
                              handleRewriteWithAi('about_me', summaryDraft);
                            }}
                            title={!selectedJobIdForAts ? (jobs.length > 0 ? 'Select a job above (Optimize for job) to use Rewrite with AI' : 'Add jobs from Interview Planner to use Rewrite with AI') : ''}
                            className="w-full rounded-full border border-purple-300 bg-purple-50 text-purple-700 text-[11px] font-medium py-2.5 transition-colors hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {isRewritingSection ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
                            Rewrite with AI
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (typeof saveProfile === 'function') {
                                saveProfile(summaryDraft);
                              }
                              toast.success('Professional summary saved to your resume');
                            }}
                            className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium py-2.5 transition-colors cursor-pointer"
                          >
                            Add my summary
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline panel for Education */}
                    {section === 'Education' && expandedSections['Education'] && (
                      <div className="px-4 pb-4 pt-1 bg-white">
                        {/* Existing Education Entries */}
                        {profile.education && profile.education.length > 0 && (
                          <div className="mb-4 pb-4 border-b border-neutral-200">
                            <div className="text-[11px] font-semibold text-neutral-900 mb-3">
                              Your Education ({profile.education.length})
                            </div>
                            <div className="space-y-2">
                              {profile.education.map((edu, index) => (
                                <React.Fragment key={edu.id}>
                                  {/* Drop indicator line above item */}
                                  {dragOverItem.type === 'education' && dragOverItem.id === edu.id && draggedItem.type === 'education' && draggedItem.id !== edu.id && (
                                    <div className="h-0.5 bg-blue-500 rounded-full mx-2 my-1"></div>
                                  )}
                                  <div
                                    draggable={true}
                                    onDragStart={(e) => {
                                      e.stopPropagation();
                                      handleItemDragStart(e, edu.id, 'education', index);
                                    }}
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleItemDragOver(e, edu.id, 'education', index);
                                    }}
                                    onDragLeave={(e) => {
                                      e.preventDefault();
                                      handleItemDragLeave(e);
                                    }}
                                    onDragEnd={(e) => {
                                      e.stopPropagation();
                                      handleItemDragEnd(e);
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleItemDrop(e, edu.id, 'education', index);
                                    }}
                                    onClick={() => {
                                      setEducationForm({
                                        degree: edu.degree || edu.title || '',
                                        institution: edu.institution || '',
                                        location: edu.location || '',
                                        startYear: edu.startYear || '',
                                        endYear: edu.endYear || '',
                                        gpa: edu.gpa || ''
                                      });
                                      setEditingEducationId(edu.id);
                                    }}
                                    className={`p-3 rounded-lg border cursor-move transition-colors ${editingEducationId === edu.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : dragOverItem.type === 'education' && dragOverItem.id === edu.id
                                          ? 'border-blue-400 bg-blue-100'
                                          : draggedItem.type === 'education' && draggedItem.id === edu.id
                                            ? 'opacity-50 border-neutral-300'
                                            : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300'
                                      }`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-2 flex-1">
                                        <i className="fas fa-grip-vertical text-[10px] text-neutral-400 flex-shrink-0"></i>
                                        <div className="flex-1">
                                          <p className="text-[11px] font-semibold text-neutral-900">
                                            {edu.degree || edu.title || 'Degree'}
                                          </p>
                                          <p className="text-[10px] text-neutral-600 mt-0.5">
                                            {edu.institution || 'Institution'}
                                          </p>
                                          {(edu.startYear || edu.endYear) && (
                                            <p className="text-[10px] text-neutral-500 mt-1">
                                              {edu.startYear || 'Start'} - {edu.endYear || 'End'}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeEducation(edu.id);
                                        }}
                                        className="ml-2 text-[10px] text-red-500 hover:text-red-700 p-1"
                                      >
                                        <i className="fas fa-trash"></i>
                                      </button>
                                    </div>
                                  </div>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-[11px] font-semibold text-neutral-900 mb-2">
                          {editingEducationId ? 'Edit Education' : 'Add New Education'}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                              Degree/Certification
                            </label>
                            <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                              <input
                                type="text"
                                value={educationForm.degree}
                                onChange={(e) => setEducationForm(prev => ({ ...prev, degree: e.target.value }))}
                                placeholder="e.g., Bachelor of Science, Master's Degree"
                                className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                              Institution/College Name
                            </label>
                            <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                              <input
                                type="text"
                                value={educationForm.institution}
                                onChange={(e) => setEducationForm(prev => ({ ...prev, institution: e.target.value }))}
                                placeholder="e.g., University of California"
                                className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                              Location
                            </label>
                            <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                              <input
                                type="text"
                                value={educationForm.location}
                                onChange={(e) => setEducationForm(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="e.g., Los Angeles, CA"
                                className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                                Start Year
                              </label>
                              <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                                <input
                                  type="text"
                                  value={educationForm.startYear}
                                  onChange={(e) => setEducationForm(prev => ({ ...prev, startYear: e.target.value }))}
                                  placeholder="e.g., 2020"
                                  className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                                End Year
                              </label>
                              <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                                <input
                                  type="text"
                                  value={educationForm.endYear}
                                  onChange={(e) => setEducationForm(prev => ({ ...prev, endYear: e.target.value }))}
                                  placeholder="e.g., 2024 or Present"
                                  className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                                />
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                              GPA (Optional)
                            </label>
                            <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                              <input
                                type="text"
                                value={educationForm.gpa}
                                onChange={(e) => setEducationForm(prev => ({ ...prev, gpa: e.target.value }))}
                                placeholder="e.g., 3.8/4.0"
                                className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {editingEducationId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEducationForm({
                                  degree: '',
                                  institution: '',
                                  location: '',
                                  startYear: '',
                                  endYear: '',
                                  gpa: ''
                                });
                                setEditingEducationId(null);
                              }}
                              className="flex-1 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-[11px] font-medium py-2.5 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={async () => {
                              if (!educationForm.degree || !educationForm.institution) {
                                toast.error('Please fill in at least Degree and Institution');
                                return;
                              }

                              try {
                                const cvUserIdQuery = user?._id ? `?userId=${user._id}` : '';
                                let response;
                                let savedEducation;

                                if (editingEducationId) {
                                  response = await putRequest(`/cv/education/${editingEducationId}${cvUserIdQuery}`, {
                                    title: educationForm.degree,
                                    institution: educationForm.institution,
                                    location: educationForm.location,
                                    startYear: educationForm.startYear,
                                    endYear: educationForm.endYear,
                                    gpa: educationForm.gpa || ''
                                  });

                                  if (response && response.data && response.data.success) {
                                    savedEducation = {
                                      id: editingEducationId,
                                      degree: educationForm.degree,
                                      institution: educationForm.institution,
                                      location: educationForm.location,
                                      startYear: educationForm.startYear,
                                      endYear: educationForm.endYear,
                                      gpa: educationForm.gpa || ''
                                    };

                                    const updatedEducation = (profile.education || []).map(edu =>
                                      edu.id === editingEducationId ? savedEducation : edu
                                    );
                                    onUpdateProfile('education', updatedEducation);

                                    setEducationForm({
                                      degree: '',
                                      institution: '',
                                      location: '',
                                      startYear: '',
                                      endYear: '',
                                      gpa: ''
                                    });
                                    setEditingEducationId(null);

                                    toast.success('Education updated successfully');
                                  } else {
                                    toast.error(response?.data?.message || 'Failed to update education');
                                  }
                                } else {
                                  response = await postRequest(`/cv/education${cvUserIdQuery}`, {
                                    title: educationForm.degree,
                                    institution: educationForm.institution,
                                    location: educationForm.location || '',
                                    startYear: educationForm.startYear || '',
                                    endYear: educationForm.endYear || '',
                                    gpa: educationForm.gpa || ''
                                  });

                                  if (response && response.data && response.data.success) {
                                    // Get the saved education entry with real ID
                                    const savedData = response.data.data;
                                    savedEducation = {
                                      id: savedData._id || savedData.id,
                                      degree: educationForm.degree,
                                      institution: educationForm.institution,
                                      location: educationForm.location || '',
                                      startYear: educationForm.startYear || '',
                                      endYear: educationForm.endYear || '',
                                      gpa: educationForm.gpa || ''
                                    };

                                    onUpdateProfile('education', [...(profile.education || []), savedEducation]);
                                    setEducationForm({
                                      degree: '',
                                      institution: '',
                                      location: '',
                                      startYear: '',
                                      endYear: '',
                                      gpa: ''
                                    });

                                    toast.success('Education saved successfully');
                                  } else {
                                    toast.error(response?.data?.message || 'Failed to save education');
                                  }
                                }
                              } catch (error) {
                                console.error('Error saving education:', error);
                                const errorMessage = error.response?.data?.message || error.message || 'Failed to save education';
                                toast.error(errorMessage);
                              }
                            }}
                            className={`${editingEducationId ? 'flex-1' : 'w-full'} rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium py-2.5 transition-colors`}
                          >
                            {editingEducationId ? 'Update Education' : 'Add Education'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline panel for Contacts */}
                    {section === 'Contacts' && expandedSections['Contacts'] && (
                      <div className="px-4 pb-4 pt-1 bg-white">
                        <div className="text-[11px] font-semibold text-neutral-900 mb-2">
                          Contact Links
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                              LinkedIn
                            </label>
                            <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                              <input
                                type="text"
                                value={linkedinDraft}
                                onChange={(e) => setLinkedinDraft(e.target.value)}
                                placeholder="https://linkedin.com/in/yourprofile"
                                className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                              GitHub
                            </label>
                            <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                              <input
                                type="text"
                                value={githubDraft}
                                onChange={(e) => setGithubDraft(e.target.value)}
                                placeholder="https://github.com/yourusername"
                                className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                              Portfolio/Website
                            </label>
                            <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                              <input
                                type="text"
                                value={portfolioDraft}
                                onChange={(e) => setPortfolioDraft(e.target.value)}
                                placeholder="https://yourportfolio.com"
                                className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Icon Color Customization for Social Links */}
                        <div className="mt-4 pt-4 border-t border-neutral-200">
                          <div className="text-[10px] font-semibold text-neutral-900 mb-3">
                            Icon Colors
                          </div>

                          {/* LinkedIn Icon Color */}
                          {linkedinDraft && (
                            <div className="mb-3">
                              <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                                LinkedIn Icon Color
                              </label>
                              <div className="flex gap-1.5">
                                {colorPalette.map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => {
                                      setLinkedinIconColor(color);
                                      onUpdateProfile('linkedinIconColor', color);
                                    }}
                                    className={`w-5 h-5 rounded border-2 transition-all ${linkedinIconColor === color
                                        ? 'border-neutral-900 scale-110'
                                        : 'border-neutral-300 hover:border-neutral-400'
                                      }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* GitHub Icon Color */}
                          {githubDraft && (
                            <div className="mb-3">
                              <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                                GitHub Icon Color
                              </label>
                              <div className="flex gap-1.5">
                                {colorPalette.map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => {
                                      setGithubIconColor(color);
                                      onUpdateProfile('githubIconColor', color);
                                    }}
                                    className={`w-5 h-5 rounded border-2 transition-all ${githubIconColor === color
                                        ? 'border-neutral-900 scale-110'
                                        : 'border-neutral-300 hover:border-neutral-400'
                                      }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Portfolio Icon Color */}
                          {portfolioDraft && (
                            <div>
                              <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                                Portfolio Icon Color
                              </label>
                              <div className="flex gap-1.5">
                                {colorPalette.map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => {
                                      setPortfolioIconColor(color);
                                      onUpdateProfile('portfolioIconColor', color);
                                    }}
                                    className={`w-5 h-5 rounded border-2 transition-all ${portfolioIconColor === color
                                        ? 'border-neutral-900 scale-110'
                                        : 'border-neutral-300 hover:border-neutral-400'
                                      }`}
                                    style={{ backgroundColor: color }}
                                    title={color}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onUpdateProfile('linkedin', linkedinDraft);
                            onUpdateProfile('github', githubDraft);
                            onUpdateProfile('portfolio', portfolioDraft);
                            onUpdateProfile('linkedinIconColor', linkedinIconColor);
                            onUpdateProfile('githubIconColor', githubIconColor);
                            onUpdateProfile('portfolioIconColor', portfolioIconColor);
                            if (typeof saveProfile === 'function') {
                              saveProfile(null, {
                                name: profile.fullName,
                                email: profile.email,
                                phone: profile.phone,
                                address: profile.address,
                                linkedin: linkedinDraft,
                                github: githubDraft,
                                portfolio: portfolioDraft,
                                linkedinIconColor,
                                githubIconColor,
                                portfolioIconColor
                              });
                            }
                            toast.success('Contact links saved successfully');
                          }}
                          className="mt-3 w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium py-2.5 transition-colors"
                        >
                          Save links
                        </button>
                      </div>
                    )}

                    {/* Inline panel for Work Experience */}
                    {section === 'Work Experience' && expandedSections['Work Experience'] && (
                      <div className="px-4 pb-4 pt-1 bg-white">
                        {/* Existing Work Experience Entries */}
                        {profile.workExperience && profile.workExperience.length > 0 && (
                          <div className="mb-4 pb-4 border-b border-neutral-200">
                            <div className="text-[11px] font-semibold text-neutral-900 mb-3">
                              Your Experience ({profile.workExperience.length})
                            </div>
                            <div className="space-y-2">
                              {profile.workExperience.map((exp, index) => (
                                <React.Fragment key={exp.id}>
                                  {/* Drop indicator line above item */}
                                  {dragOverItem.type === 'experience' && dragOverItem.id === exp.id && draggedItem.type === 'experience' && draggedItem.id !== exp.id && (
                                    <div className="h-0.5 bg-blue-500 rounded-full mx-2 my-1"></div>
                                  )}
                                  <div
                                    draggable={true}
                                    onDragStart={(e) => {
                                      e.stopPropagation();
                                      handleItemDragStart(e, exp.id, 'experience', index);
                                    }}
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleItemDragOver(e, exp.id, 'experience', index);
                                    }}
                                    onDragLeave={(e) => {
                                      e.preventDefault();
                                      handleItemDragLeave(e);
                                    }}
                                    onDragEnd={(e) => {
                                      e.stopPropagation();
                                      handleItemDragEnd(e);
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleItemDrop(e, exp.id, 'experience', index);
                                    }}
                                    onClick={() => {
                                      setExperienceForm({
                                        jobTitle: exp.title || '',
                                        company: exp.company || '',
                                        location: exp.location || '',
                                        startDate: exp.startDate || '',
                                        endDate: exp.endDate || '',
                                        isCurrent: exp.current || false,
                                        description: exp.description || ''
                                      });
                                      setEditingExperienceId(exp.id);
                                    }}
                                    className={`p-3 rounded-lg border cursor-move transition-colors ${editingExperienceId === exp.id
                                        ? 'border-blue-500 bg-blue-50'
                                        : dragOverItem.type === 'experience' && dragOverItem.id === exp.id
                                          ? 'border-blue-400 bg-blue-100'
                                          : draggedItem.type === 'experience' && draggedItem.id === exp.id
                                            ? 'opacity-50 border-neutral-300'
                                            : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300'
                                      }`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center gap-2 flex-1">
                                        <i className="fas fa-grip-vertical text-[10px] text-neutral-400 flex-shrink-0"></i>
                                        <div className="flex-1">
                                          <p className="text-[11px] font-semibold text-neutral-900">
                                            {exp.title || 'Job Title'}
                                          </p>
                                          <p className="text-[10px] text-neutral-600 mt-0.5">
                                            {exp.company || 'Company'}
                                          </p>
                                          {(exp.startDate || exp.endDate) && (
                                            <p className="text-[10px] text-neutral-500 mt-1">
                                              {exp.startDate || 'Start'} - {exp.current ? 'Present' : exp.endDate || 'End'}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeWorkExperience(exp.id);
                                        }}
                                        className="ml-2 text-[10px] text-red-500 hover:text-red-700 p-1"
                                      >
                                        <i className="fas fa-trash"></i>
                                      </button>
                                    </div>
                                  </div>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-[11px] font-semibold text-neutral-900 mb-2">
                          {editingExperienceId ? 'Edit Work Experience' : 'Add New Work Experience'}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                              Job Title <span className="text-red-500">*</span>
                            </label>
                            <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                              <input
                                type="text"
                                value={experienceForm.jobTitle}
                                onChange={(e) => setExperienceForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                                placeholder="e.g., Software Engineer"
                                className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                              Company <span className="text-red-500">*</span>
                            </label>
                            <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                              <input
                                type="text"
                                value={experienceForm.company}
                                onChange={(e) => setExperienceForm(prev => ({ ...prev, company: e.target.value }))}
                                placeholder="e.g., Google Inc."
                                className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                              Location
                            </label>
                            <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                              <input
                                type="text"
                                value={experienceForm.location}
                                onChange={(e) => setExperienceForm(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="e.g., San Francisco, CA"
                                className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                                Start Date
                              </label>
                              <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                                <input
                                  type="text"
                                  value={experienceForm.startDate}
                                  onChange={(e) => setExperienceForm(prev => ({ ...prev, startDate: e.target.value }))}
                                  placeholder="e.g., Jan 2020"
                                  className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                                End Date
                              </label>
                              <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                                <input
                                  type="text"
                                  value={experienceForm.endDate}
                                  onChange={(e) => setExperienceForm(prev => ({ ...prev, endDate: e.target.value }))}
                                  placeholder="e.g., Dec 2023 or Present"
                                  className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                                  disabled={experienceForm.isCurrent}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={experienceForm.isCurrent}
                              onChange={(e) => setExperienceForm(prev => ({ ...prev, isCurrent: e.target.checked, endDate: e.target.checked ? '' : prev.endDate }))}
                              className="mr-2 h-4 w-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                            />
                            <label className="text-[10px] font-medium text-neutral-600">
                              I currently work here
                            </label>
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                              Description <span className="text-red-500">*</span>
                            </label>
                            <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                              <textarea
                                value={experienceForm.description}
                                onChange={(e) => setExperienceForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe your responsibilities and achievements..."
                                rows="4"
                                className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent resize-none"
                              />
                            </div>
                            {jobs.length > 0 && selectedJobIdForAts && (
                              <button
                                type="button"
                                disabled={isRewritingSection}
                                onClick={() => handleRewriteWithAi('experience', experienceForm.description)}
                                className="mt-2 text-[10px] text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                              >
                                {isRewritingSection ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
                                Rewrite with AI
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {editingExperienceId && (
                            <button
                              type="button"
                              onClick={() => {
                                setExperienceForm({
                                  jobTitle: '',
                                  company: '',
                                  location: '',
                                  startDate: '',
                                  endDate: '',
                                  isCurrent: false,
                                  description: ''
                                });
                                setEditingExperienceId(null);
                              }}
                              className="flex-1 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-[11px] font-medium py-2.5 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={async () => {
                              const jobTitle = (experienceForm.jobTitle || '').trim();
                              const company = (experienceForm.company || '').trim();
                              const startDate = (experienceForm.startDate || '').trim();
                              const endDate = (experienceForm.endDate || '').trim();
                              const location = (experienceForm.location || '').trim();
                              const description = (experienceForm.description || '').trim();

                              if (!jobTitle || !company || !startDate || !description) {
                                toast.error('Please fill in Job Title, Company, Start Date, and Description');
                                return;
                              }

                              try {
                                const cvUserIdQuery = user?._id ? `?userId=${user._id}` : '';
                                let response;

                                if (editingExperienceId) {
                                  response = await putRequest(`/cv/experience/${editingExperienceId}${cvUserIdQuery}`, {
                                    jobTitle,
                                    company,
                                    location,
                                    startDate,
                                    endDate: experienceForm.isCurrent ? '' : endDate,
                                    isCurrent: experienceForm.isCurrent,
                                    description
                                  });

                                  if (response && response.data && response.data.success) {
                                    const savedExperience = {
                                      id: editingExperienceId,
                                      title: jobTitle,
                                      company,
                                      location,
                                      startDate,
                                      endDate: experienceForm.isCurrent ? '' : endDate,
                                      current: experienceForm.isCurrent,
                                      description
                                    };

                                    const updatedExperience = (profile.workExperience || []).map(exp =>
                                      exp.id === editingExperienceId ? savedExperience : exp
                                    );
                                    onUpdateProfile('workExperience', updatedExperience);

                                    setExperienceForm({
                                      jobTitle: '',
                                      company: '',
                                      location: '',
                                      startDate: '',
                                      endDate: '',
                                      isCurrent: false,
                                      description: ''
                                    });
                                    setEditingExperienceId(null);

                                    toast.success('Work experience updated successfully');
                                  } else {
                                    toast.error(response?.data?.message || 'Failed to update work experience');
                                  }
                                } else {
                                  response = await postRequest(`/cv/experience${cvUserIdQuery}`, {
                                    jobTitle,
                                    company,
                                    location,
                                    startDate,
                                    endDate: experienceForm.isCurrent ? '' : endDate,
                                    isCurrent: experienceForm.isCurrent,
                                    description
                                  });

                                  if (response && response.data && response.data.success) {
                                    const savedData = response.data.data;
                                    const savedExperience = {
                                      id: savedData._id || savedData.id,
                                      title: jobTitle,
                                      company,
                                      location,
                                      startDate,
                                      endDate: experienceForm.isCurrent ? '' : endDate,
                                      current: experienceForm.isCurrent,
                                      description
                                    };

                                    onUpdateProfile('workExperience', [...(profile.workExperience || []), savedExperience]);

                                    setExperienceForm({
                                      jobTitle: '',
                                      company: '',
                                      location: '',
                                      startDate: '',
                                      endDate: '',
                                      isCurrent: false,
                                      description: ''
                                    });

                                    toast.success('Work experience saved successfully');
                                  } else {
                                    toast.error(response?.data?.message || 'Failed to save work experience');
                                  }
                                }
                              } catch (error) {
                                console.error('Error saving work experience:', error);
                                const errorMessage = error.response?.data?.message || error.message || 'Failed to save work experience';
                                toast.error(errorMessage);
                              }
                            }}
                            className={`${editingExperienceId ? 'flex-1' : 'w-full'} rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium py-2.5 transition-colors`}
                          >
                            {editingExperienceId ? 'Update Experience' : 'Add Experience'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline panel for Projects */}
                    {section === 'Projects' && expandedSections['Projects'] && (
                      <div className="px-4 pb-4 pt-1 bg-white">
                        {/* Existing Projects */}
                        {profile.projects && profile.projects.length > 0 && (
                          <div className="mb-4 pb-4 border-b border-neutral-200">
                            <div className="text-[11px] font-semibold text-neutral-900 mb-3">
                              Your Projects ({profile.projects.length})
                            </div>
                            <div className="space-y-2">
                              {profile.projects.map((proj, index) => (
                                <div
                                  key={proj.id}
                                  draggable
                                  onDragStart={(e) => handleItemDragStart(e, proj.id, 'project', index)}
                                  onDragOver={(e) => handleItemDragOver(e, proj.id, 'project', index)}
                                  onDragLeave={handleItemDragLeave}
                                  onDragEnd={handleItemDragEnd}
                                  onDrop={(e) => handleItemDrop(e, proj.id, 'project', index)}
                                  onClick={() => {
                                    setProjectForm({
                                      title: proj.title || '',
                                      type: proj.type || '',
                                      startDate: proj.startDate || '',
                                      endDate: proj.endDate || '',
                                      description: proj.description || ''
                                    });
                                    setEditingProjectId(proj.id);
                                  }}
                                  className={`p-3 rounded-lg border cursor-move transition-colors ${editingProjectId === proj.id
                                      ? 'border-blue-500 bg-blue-50'
                                      : dragOverItem.type === 'project' && dragOverItem.id === proj.id
                                        ? 'border-blue-400 bg-blue-100'
                                        : draggedItem.type === 'project' && draggedItem.id === proj.id
                                          ? 'opacity-50 border-neutral-300'
                                          : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300'
                                    }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 flex-1">
                                      <i className="fas fa-grip-vertical text-[10px] text-neutral-400 flex-shrink-0"></i>
                                      <div className="flex-1">
                                        <p className="text-[11px] font-semibold text-neutral-900">
                                          {proj.title || 'Project Title'}
                                        </p>
                                        {proj.type && (
                                          <p className="text-[10px] text-neutral-600 mt-0.5">
                                            {proj.type}
                                          </p>
                                        )}
                                        {(proj.startDate || proj.endDate) && (
                                          <p className="text-[10px] text-neutral-500 mt-1">
                                            {proj.startDate || 'Start'} - {proj.endDate || 'End'}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeProject(proj.id);
                                      }}
                                      className="ml-2 text-[10px] text-red-500 hover:text-red-700 p-1"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-[11px] font-semibold text-neutral-900 mb-2">
                          {editingProjectId ? 'Edit Project' : 'Add New Project'}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                              Project Title <span className="text-red-500">*</span>
                            </label>
                            <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                              <input
                                type="text"
                                value={projectForm.title}
                                onChange={(e) => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="e.g., E-Commerce Platform"
                                className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                              Project Type <span className="text-red-500">*</span>
                            </label>
                            <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                              <input
                                type="text"
                                value={projectForm.type}
                                onChange={(e) => setProjectForm(prev => ({ ...prev, type: e.target.value }))}
                                placeholder="e.g., Web Application, Mobile App"
                                className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                                Start Date
                              </label>
                              <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                                <input
                                  type="text"
                                  value={projectForm.startDate}
                                  onChange={(e) => setProjectForm(prev => ({ ...prev, startDate: e.target.value }))}
                                  placeholder="e.g., Jan 2022"
                                  className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                                End Date
                              </label>
                              <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                                <input
                                  type="text"
                                  value={projectForm.endDate}
                                  onChange={(e) => setProjectForm(prev => ({ ...prev, endDate: e.target.value }))}
                                  placeholder="e.g., Dec 2023"
                                  className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                                />
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                              Description <span className="text-red-500">*</span>
                            </label>
                            <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                              <textarea
                                value={projectForm.description}
                                onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe your project..."
                                rows="4"
                                className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent resize-none"
                              />
                            </div>
                            {jobs.length > 0 && selectedJobIdForAts && (
                              <button
                                type="button"
                                disabled={isRewritingSection}
                                onClick={() => handleRewriteWithAi('project', projectForm.description)}
                                className="mt-2 text-[10px] text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                              >
                                {isRewritingSection ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
                                Rewrite with AI
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {editingProjectId && (
                            <button
                              type="button"
                              onClick={() => {
                                setProjectForm({
                                  title: '',
                                  type: '',
                                  startDate: '',
                                  endDate: '',
                                  description: ''
                                });
                                setEditingProjectId(null);
                              }}
                              className="flex-1 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-[11px] font-medium py-2.5 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={async () => {
                              if (!projectForm.title || !projectForm.type || !projectForm.description) {
                                toast.error('Please fill in Title, Type, and Description');
                                return;
                              }

                              try {
                                const cvUserIdQuery = user?._id ? `?userId=${user._id}` : '';
                                let response;

                                if (editingProjectId) {
                                  response = await putRequest(`/cv/project/${editingProjectId}${cvUserIdQuery}`, {
                                    title: projectForm.title,
                                    type: projectForm.type,
                                    startDate: projectForm.startDate || '',
                                    endDate: projectForm.endDate || '',
                                    description: projectForm.description
                                  });

                                  if (response && response.data && response.data.success) {
                                    const savedProject = {
                                      id: editingProjectId,
                                      title: projectForm.title,
                                      type: projectForm.type,
                                      startDate: projectForm.startDate || '',
                                      endDate: projectForm.endDate || '',
                                      description: projectForm.description
                                    };

                                    const updatedProjects = (profile.projects || []).map(proj =>
                                      proj.id === editingProjectId ? savedProject : proj
                                    );
                                    onUpdateProfile('projects', updatedProjects);

                                    setProjectForm({
                                      title: '',
                                      type: '',
                                      startDate: '',
                                      endDate: '',
                                      description: ''
                                    });
                                    setEditingProjectId(null);

                                    toast.success('Project updated successfully');
                                  } else {
                                    toast.error(response?.data?.message || 'Failed to update project');
                                  }
                                } else {
                                  response = await postRequest(`/cv/project${cvUserIdQuery}`, {
                                    title: projectForm.title,
                                    type: projectForm.type,
                                    startDate: projectForm.startDate || '',
                                    endDate: projectForm.endDate || '',
                                    description: projectForm.description
                                  });

                                  if (response && response.data && response.data.success) {
                                    const savedData = response.data.data;
                                    const savedProject = {
                                      id: savedData._id || savedData.id,
                                      title: projectForm.title,
                                      type: projectForm.type,
                                      startDate: projectForm.startDate || '',
                                      endDate: projectForm.endDate || '',
                                      description: projectForm.description
                                    };

                                    onUpdateProfile('projects', [...(profile.projects || []), savedProject]);

                                    setProjectForm({
                                      title: '',
                                      type: '',
                                      startDate: '',
                                      endDate: '',
                                      description: ''
                                    });

                                    toast.success('Project saved successfully');
                                  } else {
                                    toast.error(response?.data?.message || 'Failed to save project');
                                  }
                                }
                              } catch (error) {
                                console.error('Error saving project:', error);
                                const errorMessage = error.response?.data?.message || error.message || 'Failed to save project';
                                toast.error(errorMessage);
                              }
                            }}
                            className={`${editingProjectId ? 'flex-1' : 'w-full'} rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium py-2.5 transition-colors`}
                          >
                            {editingProjectId ? 'Update Project' : 'Add Project'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline panel for Certificates */}
                    {section === 'Certificates' && expandedSections['Certificates'] && (
                      <div className="px-4 pb-4 pt-1 bg-white">
                        {/* Existing Certificates */}
                        {profile.certificates && profile.certificates.length > 0 && (
                          <div className="mb-4 pb-4 border-b border-neutral-200">
                            <div className="text-[11px] font-semibold text-neutral-900 mb-3">
                              Your Certificates ({profile.certificates.length})
                            </div>
                            <div className="space-y-2">
                              {profile.certificates.map((cert, index) => (
                                <div
                                  key={cert.id}
                                  draggable
                                  onDragStart={(e) => handleItemDragStart(e, cert.id, 'certificate', index)}
                                  onDragOver={(e) => handleItemDragOver(e, cert.id, 'certificate', index)}
                                  onDragLeave={handleItemDragLeave}
                                  onDragEnd={handleItemDragEnd}
                                  onDrop={(e) => handleItemDrop(e, cert.id, 'certificate', index)}
                                  onClick={() => {
                                    setCertificateForm({
                                      title: cert.title || '',
                                      issuer: cert.issuer || '',
                                      year: cert.year || ''
                                    });
                                    setEditingCertificateId(cert.id);
                                  }}
                                  className={`p-3 rounded-lg border cursor-move transition-colors ${editingCertificateId === cert.id
                                      ? 'border-blue-500 bg-blue-50'
                                      : dragOverItem.type === 'certificate' && dragOverItem.id === cert.id
                                        ? 'border-blue-400 bg-blue-100'
                                        : draggedItem.type === 'certificate' && draggedItem.id === cert.id
                                          ? 'opacity-50 border-neutral-300'
                                          : 'border-neutral-200 bg-neutral-50 hover:border-neutral-300'
                                    }`}
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2 flex-1">
                                      <i className="fas fa-grip-vertical text-[10px] text-neutral-400 flex-shrink-0"></i>
                                      <div className="flex-1">
                                        <p className="text-[11px] font-semibold text-neutral-900">
                                          {cert.title || 'Certificate Title'}
                                        </p>
                                        <p className="text-[10px] text-neutral-600 mt-0.5">
                                          {cert.issuer || 'Issuer'}
                                        </p>
                                        {cert.year && (
                                          <p className="text-[10px] text-neutral-500 mt-1">
                                            {cert.year}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeCertificate(cert.id);
                                      }}
                                      className="ml-2 text-[10px] text-red-500 hover:text-red-700 p-1"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-[11px] font-semibold text-neutral-900 mb-2">
                          {editingCertificateId ? 'Edit Certificate' : 'Add New Certificate'}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                              Certificate Title <span className="text-red-500">*</span>
                            </label>
                            <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                              <input
                                type="text"
                                value={certificateForm.title}
                                onChange={(e) => setCertificateForm(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="e.g., AWS Certified Solutions Architect"
                                className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                              Issuing Organization <span className="text-red-500">*</span>
                            </label>
                            <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                              <input
                                type="text"
                                value={certificateForm.issuer}
                                onChange={(e) => setCertificateForm(prev => ({ ...prev, issuer: e.target.value }))}
                                placeholder="e.g., Amazon Web Services"
                                className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                              Year <span className="text-red-500">*</span>
                            </label>
                            <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                              <input
                                type="text"
                                value={certificateForm.year}
                                onChange={(e) => setCertificateForm(prev => ({ ...prev, year: e.target.value }))}
                                placeholder="e.g., 2023"
                                className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          {editingCertificateId && (
                            <button
                              type="button"
                              onClick={() => {
                                setCertificateForm({
                                  title: '',
                                  issuer: '',
                                  year: ''
                                });
                                setEditingCertificateId(null);
                              }}
                              className="flex-1 rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-700 text-[11px] font-medium py-2.5 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={async () => {
                              if (!certificateForm.title || !certificateForm.issuer || !certificateForm.year) {
                                toast.error('Please fill in all fields');
                                return;
                              }

                              try {
                                const cvUserIdQuery = user?._id ? `?userId=${user._id}` : '';
                                let response;

                                if (editingCertificateId) {
                                  response = await putRequest(`/cv/certificate/${editingCertificateId}${cvUserIdQuery}`, {
                                    title: certificateForm.title,
                                    issuer: certificateForm.issuer,
                                    year: certificateForm.year
                                  });

                                  if (response && response.data && response.data.success) {
                                    const savedCertificate = {
                                      id: editingCertificateId,
                                      title: certificateForm.title,
                                      issuer: certificateForm.issuer,
                                      year: certificateForm.year
                                    };

                                    const updatedCertificates = (profile.certificates || []).map(cert =>
                                      cert.id === editingCertificateId ? savedCertificate : cert
                                    );
                                    onUpdateProfile('certificates', updatedCertificates);

                                    setCertificateForm({
                                      title: '',
                                      issuer: '',
                                      year: ''
                                    });
                                    setEditingCertificateId(null);

                                    toast.success('Certificate updated successfully');
                                  } else {
                                    toast.error(response?.data?.message || 'Failed to update certificate');
                                  }
                                } else {
                                  response = await postRequest(`/cv/certificate${cvUserIdQuery}`, {
                                    title: certificateForm.title,
                                    issuer: certificateForm.issuer,
                                    year: certificateForm.year
                                  });

                                  if (response && response.data && response.data.success) {
                                    const savedData = response.data.data;
                                    const savedCertificate = {
                                      id: savedData._id || savedData.id,
                                      title: certificateForm.title,
                                      issuer: certificateForm.issuer,
                                      year: certificateForm.year
                                    };

                                    onUpdateProfile('certificates', [...(profile.certificates || []), savedCertificate]);

                                    setCertificateForm({
                                      title: '',
                                      issuer: '',
                                      year: ''
                                    });

                                    toast.success('Certificate saved successfully');
                                  } else {
                                    toast.error(response?.data?.message || 'Failed to save certificate');
                                  }
                                }
                              } catch (error) {
                                console.error('Error saving certificate:', error);
                                const errorMessage = error.response?.data?.message || error.message || 'Failed to save certificate';
                                toast.error(errorMessage);
                              }
                            }}
                            className={`${editingCertificateId ? 'flex-1' : 'w-full'} rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium py-2.5 transition-colors`}
                          >
                            {editingCertificateId ? 'Update Certificate' : 'Add Certificate'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Inline panel for Custom section */}
                    {section.startsWith('Custom:') && expandedSections[section] && (() => {
                      const customId = section.replace('Custom:', '');
                      const custom = (profile.customSections || []).find(s => s.id === customId);
                      if (!custom) return null;
                      return (
                        <div className="px-4 pb-4 pt-1 bg-white">
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-[11px] font-semibold text-neutral-900">
                              Section name
                            </div>
                            {typeof removeCustomSection === 'function' && (
                              <button
                                type="button"
                                onClick={() => removeCustomSection(customId)}
                                className="text-[10px] text-red-500 hover:text-red-700"
                              >
                                <i className="fas fa-trash mr-1"></i>Remove section
                              </button>
                            )}
                          </div>
                          <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3 mb-4">
                            <input
                              type="text"
                              value={custom.name}
                              onChange={(e) => typeof updateCustomSection === 'function' && updateCustomSection(customId, { name: e.target.value })}
                              placeholder="e.g. Awards, Publications"
                              className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                            />
                          </div>
                          <div className="text-[11px] font-semibold text-neutral-900 mb-2">
                            Entries ({(custom.entries || []).length})
                          </div>
                          {(custom.entries || []).length > 0 && (
                            <div className="space-y-2 mb-4">
                              {(custom.entries || []).map((entry) => (
                                <div
                                  key={entry.id}
                                  className="p-3 rounded-lg border border-neutral-200 bg-neutral-50"
                                >
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1 space-y-1.5">
                                      <input
                                        type="text"
                                        value={entry.title || ''}
                                        onChange={(e) => typeof updateCustomSectionEntry === 'function' && updateCustomSectionEntry(customId, entry.id, 'title', e.target.value)}
                                        placeholder="Title"
                                        className="w-full text-[11px] text-neutral-700 border border-neutral-200 rounded px-2 py-1.5"
                                      />
                                      <input
                                        type="text"
                                        value={entry.subtitle || ''}
                                        onChange={(e) => typeof updateCustomSectionEntry === 'function' && updateCustomSectionEntry(customId, entry.id, 'subtitle', e.target.value)}
                                        placeholder="Subtitle (e.g. date, issuer)"
                                        className="w-full text-[10px] text-neutral-600 border border-neutral-200 rounded px-2 py-1.5"
                                      />
                                      <textarea
                                        value={entry.description || ''}
                                        onChange={(e) => typeof updateCustomSectionEntry === 'function' && updateCustomSectionEntry(customId, entry.id, 'description', e.target.value)}
                                        placeholder="Description"
                                        rows={2}
                                        className="w-full text-[10px] text-neutral-700 border border-neutral-200 rounded px-2 py-1.5 resize-none"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => typeof removeCustomSectionEntry === 'function' && removeCustomSectionEntry(customId, entry.id)}
                                      className="text-[10px] text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => typeof addCustomSectionEntry === 'function' && addCustomSectionEntry(customId)}
                            className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium py-2.5 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <i className="fas fa-plus text-[10px]"></i> Add entry
                          </button>
                        </div>
                      );
                    })()}

                    {/* Inline panel for Skills */}
                    {section === 'Skills' && expandedSections['Skills'] && (
                      <div className="px-4 pb-4 pt-1 bg-white">
                        {/* Existing Skills */}
                        {profile.skills && profile.skills.length > 0 && (
                          <div className="mb-4 pb-4 border-b border-neutral-200">
                            <div className="text-[11px] font-semibold text-neutral-900 mb-3">
                              Your Skills ({profile.skills.length})
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {profile.skills.map((skill, index) => (
                                <div
                                  key={index}
                                  draggable
                                  onDragStart={(e) => handleItemDragStart(e, null, 'skill', index)}
                                  onDragOver={(e) => handleItemDragOver(e, null, 'skill', index)}
                                  onDragLeave={handleItemDragLeave}
                                  onDragEnd={handleItemDragEnd}
                                  onDrop={(e) => handleItemDrop(e, null, 'skill', index)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 rounded-lg border border-neutral-200 cursor-move transition-colors ${dragOverItem.type === 'skill' && dragOverItem.index === index
                                      ? 'border-blue-400 bg-blue-100'
                                      : draggedItem.type === 'skill' && draggedItem.index === index
                                        ? 'opacity-50 border-neutral-300'
                                        : ''
                                    }`}
                                >
                                  <i className="fas fa-grip-vertical text-[9px] text-neutral-400"></i>
                                  <span className="text-[11px] text-neutral-900">{skill}</span>
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const updatedSkills = profile.skills.filter((_, i) => i !== index);
                                      onUpdateProfile('skills', updatedSkills);
                                      if (typeof saveProfile === 'function') {
                                        await saveProfile(null, { skills: updatedSkills });
                                      }
                                      toast.success('Skill removed');
                                    }}
                                    className="text-[10px] text-red-500 hover:text-red-700 ml-1"
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-[11px] font-semibold text-neutral-900 mb-2">
                          Add New Skill
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-medium text-neutral-600 mb-1.5">
                              Skill Name <span className="text-red-500">*</span>
                            </label>
                            <div className="rounded-2xl border border-neutral-200 bg-white shadow-xs p-3">
                              <input
                                type="text"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (skillInput.trim()) {
                                      const updatedSkills = [...(profile.skills || []), skillInput.trim()];
                                      onUpdateProfile('skills', updatedSkills);
                                      if (typeof saveProfile === 'function') {
                                        saveProfile(null, { skills: updatedSkills });
                                      }
                                      setSkillInput('');
                                      toast.success('Skill added');
                                    }
                                  }
                                }}
                                placeholder="e.g., JavaScript, Python, React"
                                className="w-full text-[11px] text-neutral-700 border-none outline-none bg-transparent"
                              />
                            </div>
                            <p className="text-[9px] text-neutral-500 mt-1.5">
                              Press Enter to add skill
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!skillInput.trim()) {
                              toast.error('Please enter a skill name');
                              return;
                            }

                            if (profile.skills && profile.skills.includes(skillInput.trim())) {
                              toast.error('This skill already exists');
                              return;
                            }

                            try {
                              const updatedSkills = [...(profile.skills || []), skillInput.trim()];
                              onUpdateProfile('skills', updatedSkills);
                              if (typeof saveProfile === 'function') {
                                await saveProfile(null, { skills: updatedSkills });
                              }
                              setSkillInput('');
                              toast.success('Skill added successfully');
                            } catch (error) {
                              console.error('Error adding skill:', error);
                              toast.error('Failed to add skill');
                            }
                          }}
                          className="mt-3 w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium py-2.5 transition-colors"
                        >
                          Add Skill
                        </button>
                        {jobs.length > 0 && (
                          <button
                            type="button"
                            onClick={handleAddSkillsFromJob}
                            disabled={isSuggestingSkills}
                            title={!selectedJobIdForAts ? 'Select a job above (Optimize for job) first' : 'Add skills suggested by AI based on this job and your assessment scores'}
                            className="mt-3 w-full rounded-full bg-violet-600 hover:bg-violet-700 disabled:opacity-70 disabled:cursor-wait text-white text-[11px] font-medium py-2.5 transition-colors flex items-center justify-center gap-1.5"
                          >
                            {isSuggestingSkills ? (
                              <>
                                <i className="fas fa-spinner fa-spin"></i>
                                Suggesting…
                              </>
                            ) : (
                              <>
                                <i className="fas fa-magic"></i>
                                Add skills from job (AI)
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {/* Add custom section button */}
                {typeof addCustomSection === 'function' && (
                  <div className="px-4 py-3 border-t border-neutral-200">
                    {!showAddCustomSection ? (
                      <button
                        type="button"
                        onClick={() => setShowAddCustomSection(true)}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                      >
                        <i className="fas fa-plus text-[10px]"></i>
                        Add custom section
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={newCustomSectionName}
                          onChange={(e) => setNewCustomSectionName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const name = newCustomSectionName.trim();
                              if (name) {
                                addCustomSection(name);
                                setNewCustomSectionName('');
                                setShowAddCustomSection(false);
                              }
                            }
                            if (e.key === 'Escape') {
                              setShowAddCustomSection(false);
                              setNewCustomSectionName('');
                            }
                          }}
                          placeholder="e.g. Awards, Publications"
                          className="w-full text-[11px] border border-neutral-200 rounded-lg px-3 py-2"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const name = newCustomSectionName.trim();
                              if (name) {
                                addCustomSection(name);
                                setNewCustomSectionName('');
                                setShowAddCustomSection(false);
                              } else {
                                toast.error('Enter a section name');
                              }
                            }}
                            className="flex-1 py-2 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddCustomSection(false);
                              setNewCustomSectionName('');
                            }}
                            className="py-2 text-[11px] font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </nav>
            </div>
          )}
        </aside>

        {/* Middle Panel: Resume Editor */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white min-w-0">
          {/* Header - hidden when printing */}
          <div className="no-print px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <h1 className="text-sm font-semibold text-neutral-900 truncate">
                {profile.fullName || 'Your Name'} Resume
              </h1>
              {/* Mobile: open Sections (builder) and Tools panels */}
              <div className="flex items-center gap-1.5 lg:hidden flex-shrink-0">
                <button
                  ref={sectionsButtonRef}
                  type="button"
                  onClick={() => setMobilePanel((p) => (p === 'builder' ? null : 'builder'))}
                  className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-1.5 ${mobilePanel === 'builder' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
                  aria-label="Sections"
                >
                  <i className="fas fa-list-ul"></i>
                  Sections
                </button>
                <button
                  ref={styleButtonRef}
                  type="button"
                  onClick={() => setMobilePanel((p) => (p === 'tools' ? null : 'tools'))}
                  className={`px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-1.5 ${mobilePanel === 'tools' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
                  aria-label="Text & style"
                >
                  <i className="fas fa-palette"></i>
                  Style
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleDownloadClick}
                disabled={isGeneratingPdf}
                className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded hover:bg-neutral-50 flex items-center gap-1.5 disabled:opacity-60 disabled:pointer-events-none"
              >
                {isGeneratingPdf ? (
                  <>
                    <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
                    Saving…
                  </>
                ) : (
                  <>
                    <i className="fas fa-download" aria-hidden="true"></i>
                    Download
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded hover:bg-neutral-50 flex items-center gap-1.5"
              >
                <i className="fas fa-print"></i>
                Print
              </button>
              {!hideStudentNavigation && (
                <button
                  onClick={() => setView('jobs')}
                  className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded hover:bg-neutral-50"
                >
                  <i className="fas fa-arrow-left mr-1.5"></i>
                  Back
                </button>
              )}
            </div>
          </div>

          {/* Editor Content — scrollable so mobile can pan the full CV */}
          <div className="flex-1 overflow-auto overflow-x-auto px-3 sm:px-6 py-4 min-h-0" data-resume-preview="true">
            {/* Hidden file input for photo upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileSelect}
              accept="image/*"
              className="hidden"
            />
            <div className="cv-preview-mobile-fit w-full">
            <div
              id="cv-download-source"
              ref={previewContainerRef}
              className="cv-print-area relative w-[210mm] min-w-[210mm] mx-auto bg-white rounded-xl shadow-lg border border-slate-200 print:shadow-none print:rounded-none"
              style={{ minHeight: '297mm', boxSizing: 'border-box' }}
            >
              {selectedTemplate === 0 ? (
                <div
                  className="cv-paper-page p-8 print:p-0 w-full space-y-6 text-xs"
                  style={{ minHeight: '297mm', boxSizing: 'border-box' }}
                >
                  {/* Professional CV Header - no border-b; first section below has border-t for single divider */}
                  <div className="flex items-start justify-between gap-8 pb-4">
                    {/* Left: Name and Contact Info */}
                    <div className="flex-1 space-y-2.5">
                      {/* Name */}
                      <input
                        type="text"
                        value={profile.fullName || ''}
                        onChange={(e) => onUpdateProfile('fullName', e.target.value)}
                        placeholder="Your Full Name"
                        data-element-id="name"
                        onClick={(e) => {
                          handleTextElementClick(e, 'name', 'name');
                        }}
                        className="text-2xl font-bold text-neutral-900 w-full border-none outline-none bg-transparent p-0 tracking-tight editable-text cursor-text"
                        style={getElementStyle(profile, 'name', 'name')}
                      />

                      {/* Contact Information - Professional Layout */}
                      <div className="space-y-1.5 pt-1">
                        {profile.email && (
                          <div className="flex items-center gap-2 text-[11px] text-neutral-700">
                            <i
                              className={`${profile.emailIcon || 'far fa-envelope'} text-[10px] w-4 flex-shrink-0 text-center`}
                              style={{ color: profile.emailIconColor || '#6b7280' }}
                            ></i>
                            <span
                              className="font-normal cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                              onClick={(e) => handleTextElementClick(e, 'body')}
                              style={{
                                fontFamily: profile.bodyFontFamily,
                                fontWeight: profile.bodyFontWeight,
                                fontSize: profile.bodyFontSize,
                                color: profile.bodyColor,
                                lineHeight: profile.bodyLineHeight,
                                letterSpacing: profile.bodyLetterSpacing
                              }}
                            >
                              {profile.email}
                            </span>
                          </div>
                        )}
                        {profile.phone && (
                          <div className="flex items-center gap-2 text-[11px] text-neutral-700">
                            <i
                              className={`${profile.phoneIcon || 'fas fa-mobile-alt'} text-[10px] w-4 flex-shrink-0 text-center`}
                              style={{ color: profile.phoneIconColor || '#6b7280' }}
                            ></i>
                            <span
                              className="font-normal cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                              onClick={(e) => handleTextElementClick(e, 'body')}
                              style={{
                                fontFamily: profile.bodyFontFamily,
                                fontWeight: profile.bodyFontWeight,
                                fontSize: profile.bodyFontSize,
                                color: profile.bodyColor,
                                lineHeight: profile.bodyLineHeight,
                                letterSpacing: profile.bodyLetterSpacing
                              }}
                            >
                              {profile.phone}
                            </span>
                          </div>
                        )}
                        {profile.address && (
                          <div className="flex items-start gap-2 text-[11px] text-neutral-700">
                            <i
                              className={`${profile.addressIcon || 'fas fa-map-marker-alt'} text-[10px] w-4 flex-shrink-0 text-center mt-0.5`}
                              style={{ color: profile.addressIconColor || '#6b7280' }}
                            ></i>
                            <span
                              className="font-normal leading-relaxed cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
                              onClick={(e) => handleTextElementClick(e, 'body')}
                              style={{
                                fontFamily: profile.bodyFontFamily,
                                fontWeight: profile.bodyFontWeight,
                                fontSize: profile.bodyFontSize,
                                color: profile.bodyColor,
                                lineHeight: profile.bodyLineHeight,
                                letterSpacing: profile.bodyLetterSpacing
                              }}
                            >
                              {profile.address}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Professional Passport Photo */}
                    <div className="flex-shrink-0">
                      <div
                        className="relative cursor-pointer group"
                        onClick={onPhotoClick}
                        title="Click to upload professional photo"
                      >
                        {(user?.profilePicture || profile?.profilePicture) ? (
                          <img
                            src={user?.profilePicture || profile?.profilePicture}
                            alt={profile.fullName || 'Profile'}
                            className="w-28 h-32 object-cover object-top border border-neutral-300 rounded shadow-sm"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              const placeholder = e.target.parentElement.querySelector('.photo-placeholder');
                              if (placeholder) placeholder.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-28 h-32 bg-gradient-to-br from-neutral-50 to-neutral-100 border border-neutral-300 rounded flex items-center justify-center shadow-sm photo-placeholder ${(user?.profilePicture || profile?.profilePicture) ? 'hidden' : ''
                            }`}
                        >
                          <i className="fas fa-user text-neutral-400 text-3xl"></i>
                        </div>
                        {isUploadingPhoto && (
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded z-10">
                            <i className="fas fa-spinner fa-spin text-white text-base"></i>
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10">
                          <i className="fas fa-camera text-white text-xs"></i>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resume Sections - Rendered in Order (Contacts always at bottom) */}
                  {(() => {
                    const otherSections = sections.filter(s => s !== 'Contacts');
                    const contactsSection = sections.includes('Contacts') ? ['Contacts'] : [];

                    return (
                      <>
                        {otherSections.map((sectionName) => renderResumeSection(sectionName))}
                        {contactsSection.map((sectionName) => renderResumeSection(sectionName))}
                      </>
                    );
                  })()}

                </div>
              ) : (
                renderTemplateByNumber(selectedTemplate)
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Tools — on mobile: slide-out drawer from right */}
        <aside
          className={
            'flex flex-col bg-white border-l border-neutral-200 ' +
            'w-[85%] max-w-[320px] xl:w-80 ' +
            'fixed xl:static inset-y-0 right-0 z-[60] xl:z-auto top-14 xl:top-0 h-[calc(100vh-3.5rem)] xl:h-auto ' +
            'shadow-xl xl:shadow-none ' +
            'transition-transform duration-200 ease-out ' +
            (mobilePanel === 'tools' ? 'translate-x-0' : 'translate-x-full') +
            ' xl:!translate-x-0'
          }
          style={{
            bottom: 0,
            ...(mobilePanel === 'tools' ? { transform: 'translateX(0)' } : {}),
          }}
          aria-hidden={mobilePanel !== 'tools'}
        >
          <div className="xl:hidden flex items-center justify-between px-4 py-3 border-b border-neutral-200 flex-shrink-0">
            <h3 className="text-xs font-semibold text-neutral-900">Text &amp; style</h3>
            <button
              type="button"
              onClick={closeMobilePanel}
              className="p-2 -m-2 text-neutral-500 hover:text-neutral-700"
              aria-label="Close"
            >
              <i className="fas fa-times text-sm"></i>
            </button>
          </div>
          {/* Multi-Select Toggle */}
          <div className="px-4 py-3 border-b border-neutral-200">
            <button
              onClick={() => {
                setIsMultiSelectMode(!isMultiSelectMode);
                if (!isMultiSelectMode) {
                  setSelectedElement(null);
                } else {
                  selectedElements.forEach(el => {
                    if (el.element) el.element.classList.remove('text-editing-highlight');
                  });
                  setSelectedElements([]);
                }
              }}
              className={`w-full px-3 py-2 text-xs font-medium rounded flex items-center justify-center gap-2 transition-colors ${isMultiSelectMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
            >
              <i className={`fas ${isMultiSelectMode ? 'fa-check-square' : 'fa-square'} text-[11px]`}></i>
              {isMultiSelectMode ? 'Multi-Select Mode (ON)' : 'Multi-Select Mode'}
            </button>
            {isMultiSelectMode && (
              <div className="mt-2 space-y-2">
                <button
                  onClick={handleSelectAll}
                  className="w-full px-3 py-1.5 text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <i className="fas fa-check-double text-[9px]"></i>
                  Select All Text Elements
                </button>
                {selectedElements.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-600">
                      {selectedElements.length} element{selectedElements.length !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={() => {
                        selectedElements.forEach(el => {
                          if (el.element) el.element.classList.remove('text-editing-highlight');
                        });
                        setSelectedElements([]);
                      }}
                      className="text-[10px] text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Text Formatting */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-semibold text-neutral-900 uppercase">Text Formatting</h4>
              {(selectedElement || (isMultiSelectMode && selectedElements.length > 0)) ? (
                <div className="space-y-2">
                  {isMultiSelectMode && selectedElements.length > 0 && (
                    <div className="text-[10px] text-blue-600 font-medium mb-2 flex items-center gap-1">
                      <i className="fas fa-layer-group"></i>
                      Editing {selectedElements.length} element{selectedElements.length !== 1 ? 's' : ''}
                    </div>
                  )}
                  {!isMultiSelectMode && selectedElement && (
                    <div className="text-[10px] text-neutral-500 mb-2">
                      Editing: <span className="text-neutral-700 font-medium">{selectedElement.element?.tagName || 'Text'}</span>
                    </div>
                  )}
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-1">Font Family</label>
                    <select
                      value={selectedTextStyle.fontFamily}
                      onChange={(e) => {
                        const newStyle = { ...selectedTextStyle, fontFamily: e.target.value };
                        setSelectedTextStyle(newStyle);
                        applyTextFormatting(newStyle);
                      }}
                      className="w-full px-2 py-1.5 text-[11px] border border-neutral-200 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Open Sans">Open Sans</option>
                      <option value="Lato">Lato</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Poppins">Poppins</option>
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Geist Sans">Geist Sans (System)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-1">Font Weight</label>
                    <select
                      value={selectedTextStyle.fontWeight}
                      onChange={(e) => {
                        const newStyle = { ...selectedTextStyle, fontWeight: e.target.value };
                        setSelectedTextStyle(newStyle);
                        applyTextFormatting(newStyle);
                      }}
                      className="w-full px-2 py-1.5 text-[11px] border border-neutral-200 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="300">Light (300)</option>
                      <option value="400">Regular (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">Semi Bold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="800">Extra Bold (800)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-500 block mb-1">Font Size</label>
                    <select
                      value={selectedTextStyle.fontSize}
                      onChange={(e) => {
                        const newStyle = { ...selectedTextStyle, fontSize: e.target.value };
                        setSelectedTextStyle(newStyle);
                        applyTextFormatting(newStyle);
                      }}
                      className="w-full px-2 py-1.5 text-[11px] border border-neutral-200 rounded bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="10px">10px</option>
                      <option value="11px">11px</option>
                      <option value="12px">12px</option>
                      <option value="13px">13px</option>
                      <option value="14px">14px</option>
                      <option value="16px">16px</option>
                      <option value="18px">18px</option>
                      <option value="20px">20px</option>
                      <option value="24px">24px</option>
                      <option value="28px">28px</option>
                      <option value="32px">32px</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-500">Line height:</span>
                    <input
                      type="text"
                      value={selectedTextStyle.lineHeight}
                      onChange={(e) => {
                        const newStyle = { ...selectedTextStyle, lineHeight: e.target.value };
                        setSelectedTextStyle(newStyle);
                        applyTextFormatting(newStyle);
                      }}
                      className="flex-1 px-2 py-1 text-[10px] border border-neutral-200 rounded bg-white"
                      placeholder="auto or 1.5"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-neutral-500">Letter spacing:</span>
                    <input
                      type="text"
                      value={selectedTextStyle.letterSpacing}
                      onChange={(e) => {
                        const newStyle = { ...selectedTextStyle, letterSpacing: e.target.value };
                        setSelectedTextStyle(newStyle);
                        applyTextFormatting(newStyle);
                      }}
                      className="flex-1 px-2 py-1 text-[10px] border border-neutral-200 rounded bg-white"
                      placeholder="-1.5% or 0.5px"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-neutral-500 italic">
                  Click on any text in the resume preview to format it
                </div>
              )}
            </div>

            {/* Colors */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-neutral-900 uppercase">Text Color</h4>
              {(selectedElement || (isMultiSelectMode && selectedElements.length > 0)) ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cssColorToHex(selectedTextStyle.color)}
                      onChange={(e) => {
                        const newStyle = { ...selectedTextStyle, color: e.target.value };
                        setSelectedTextStyle(newStyle);
                        applyTextFormatting(newStyle);
                      }}
                      className="w-12 h-8 rounded border border-neutral-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedTextStyle.color}
                      onChange={(e) => {
                        const newStyle = { ...selectedTextStyle, color: e.target.value };
                        setSelectedTextStyle(newStyle);
                        applyTextFormatting(newStyle);
                      }}
                      className="flex-1 px-2 py-1 text-[10px] border border-neutral-200 rounded bg-white"
                      placeholder="#1B1B1B"
                    />
                  </div>
                  {/* Preset Colors */}
                  <div className="grid grid-cols-6 gap-1.5">
                    {['#1B1B1B', '#374151', '#6B7280', '#2563EB', '#059669', '#DC2626', '#D97706', '#7C3AED', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444'].map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          const newStyle = { ...selectedTextStyle, color };
                          setSelectedTextStyle(newStyle);
                          applyTextFormatting(newStyle);
                        }}
                        className={`w-8 h-8 rounded border-2 ${selectedTextStyle.color === color ? 'border-blue-500' : 'border-neutral-300'
                          }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-neutral-500 italic">
                  Select text to change color
                </div>
              )}
            </div>

            {/* Save font & color preferences */}
            <div className="pt-3 border-t border-neutral-200">
              <button
                type="button"
                onClick={saveStylePreferences}
                disabled={isSavingStyle}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {isSavingStyle ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Saving…
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Save font & color preferences
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default JobCVProfileView;
