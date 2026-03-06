import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import { postRequest, putRequest } from '../../../api/apiRequests';
import StudentMenuNavigation from '../student-menu-components/StudentMenuNavigation';
import JobCVTemplate1 from './JobCVTemplate1';
import JobCVTemplate2 from './JobCVTemplate2';
import JobCVTemplate3 from './JobCVTemplate3';
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
  onSelectJobIdForAts = () => {},
  selectedTemplate = 0,
  onSelectTemplate = () => {},
  hideStudentNavigation = false,
}) => {
  const [uploadedCvText, setUploadedCvText] = useState('');
  const [isParsingCv, setIsParsingCv] = useState(false);
  const [isRewritingSection, setIsRewritingSection] = useState(false);
  const [isSuggestingSkills, setIsSuggestingSkills] = useState(false);
  const uploadCvInputRef = useRef(null);
  const previewContainerRef = useRef(null);
  const downloadPreviewRef = useRef(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [previewPageCount, setPreviewPageCount] = useState(1);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('builder'); // 'builder' | 'templates'
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
  
  // Education form state
  const [educationForm, setEducationForm] = useState({
    degree: '',
    institution: '',
    location: '',
    startYear: '',
    endYear: '',
    gpa: ''
  });
  const [editingEducationId, setEditingEducationId] = useState(null);

  // Work Experience form state
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

  // Projects form state
  const [projectForm, setProjectForm] = useState({
    title: '',
    type: '',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [editingProjectId, setEditingProjectId] = useState(null);

  // Certificates form state
  const [certificateForm, setCertificateForm] = useState({
    title: '',
    issuer: '',
    year: ''
  });
  const [editingCertificateId, setEditingCertificateId] = useState(null);

  // Text formatting state
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedElements, setSelectedElements] = useState([]); // For multi-select mode
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedTextStyle, setSelectedTextStyle] = useState({
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: '14px',
    color: '#1B1B1B',
    lineHeight: 'auto',
    letterSpacing: '-1.5%'
  });

  // Rewrite a CV section with AI for ATS alignment (uses selected job context)
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
      toast.error(err?.response?.data?.error || 'Failed to rewrite section');
    } finally {
      setIsRewritingSection(false);
    }
  };

  // Suggest and add skills from job using AI (uses assessment scores for this job)
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
      // No assessment taken for this job – show clear notification
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

  // Reset forms when editing IDs change
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

  // Highlight selected element for editing
  useEffect(() => {
    const previousElement = document.querySelector('.text-editing-highlight');
    if (previousElement) {
      previousElement.classList.remove('text-editing-highlight');
    }

    if (selectedElement && selectedElement.element) {
      const element = selectedElement.element;
      element.classList.add('text-editing-highlight');
      
      // Scroll element into view if needed (with a small delay to ensure element is rendered)
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }, 100);
    }

    // Cleanup function
    return () => {
      const highlightedElement = document.querySelector('.text-editing-highlight');
      if (highlightedElement) {
        highlightedElement.classList.remove('text-editing-highlight');
      }
    };
  }, [selectedElement, isMultiSelectMode]);


  // Skills form state
  const [skillInput, setSkillInput] = useState('');
  
  // Icon and color preferences
  const [emailIcon, setEmailIcon] = useState(profile.emailIcon || 'far fa-envelope');
  const [phoneIcon, setPhoneIcon] = useState(profile.phoneIcon || 'fas fa-mobile-alt');
  const [addressIcon, setAddressIcon] = useState(profile.addressIcon || 'fas fa-map-marker-alt');
  const [emailIconColor, setEmailIconColor] = useState(profile.emailIconColor || '#6b7280');
  const [phoneIconColor, setPhoneIconColor] = useState(profile.phoneIconColor || '#6b7280');
  const [addressIconColor, setAddressIconColor] = useState(profile.addressIconColor || '#6b7280');
  const [linkedinIconColor, setLinkedinIconColor] = useState(profile.linkedinIconColor || '#6b7280');
  const [githubIconColor, setGithubIconColor] = useState(profile.githubIconColor || '#6b7280');
  const [portfolioIconColor, setPortfolioIconColor] = useState(profile.portfolioIconColor || '#6b7280');

  // Color palette options
  const colorPalette = [
    '#6b7280', // neutral-500
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#6366f1', // indigo-500
    '#14b8a6', // teal-500
  ];

  // Icon options for each field
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

  // Keep sidebar summary text in sync with main profile data
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

  // Default section order
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

  // Section order state - use profile order if available, otherwise default
  const [sectionOrder, setSectionOrder] = useState(() => {
    return (profile.sectionOrder && profile.sectionOrder.length > 0) ? profile.sectionOrder : defaultSections;
  });

  // Update section order when profile changes
  useEffect(() => {
    if (profile.sectionOrder && profile.sectionOrder.length > 0) {
      // Validate that all default sections are present
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
      
      // Ensure Contacts is always at the bottom
      const contactsIndex = finalOrder.indexOf('Contacts');
      if (contactsIndex !== -1 && contactsIndex !== finalOrder.length - 1) {
        finalOrder.splice(contactsIndex, 1);
        finalOrder.push('Contacts');
      }
      
      setSectionOrder(finalOrder);
    }
  }, [profile.sectionOrder]);

  // Drag and drop handlers for sections
  const [draggedSection, setDraggedSection] = useState(null);
  const [dragOverSection, setDragOverSection] = useState(null);

  // Drag and drop handlers for items within sections
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

    // Prevent moving Contacts away from bottom
    if (draggedSection === 'Contacts' && targetSection !== 'Contacts') {
      setDragOverSection(null);
      toast.error('Contacts section must remain at the bottom');
      return;
    }
    
    // Prevent other sections from being placed after Contacts
    if (targetSection === 'Contacts' && draggedSection !== 'Contacts') {
      setDragOverSection(null);
      toast.error('Cannot place sections after Contacts');
      return;
    }

    const newOrder = [...sectionOrder];
    const draggedIndex = newOrder.indexOf(draggedSection);
    const targetIndex = newOrder.indexOf(targetSection);

    // Remove dragged section from its current position
    newOrder.splice(draggedIndex, 1);
    // Insert at target position
    newOrder.splice(targetIndex, 0, draggedSection);

    // Ensure Contacts is always at the bottom
    const contactsIndex = newOrder.indexOf('Contacts');
    if (contactsIndex !== -1 && contactsIndex !== newOrder.length - 1) {
      newOrder.splice(contactsIndex, 1);
      newOrder.push('Contacts');
    }

    setSectionOrder(newOrder);
    setDraggedSection(null);
    setDragOverSection(null);

    // Save order to database
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

  // Drag and drop handlers for items within sections
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
    
    // Only update dragOverItem if it's a different item
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
    // Don't clear dragOverItem here - let drop handle it
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
    
    // Validate dragged item
    if (!draggedItem.id && draggedItem.index === null) {
      setDragOverItem({ type: null, id: null, index: null });
      return;
    }

    // Must be same type
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
      // For skills, use index-based comparison
      draggedIndex = draggedItem.index;
      targetIdx = targetIndex;
    } else {
      // For other items, use ID-based comparison
      draggedIndex = updatedArray.findIndex(item => item.id === draggedItem.id);
      targetIdx = updatedArray.findIndex(item => item.id === targetItemId);
    }

    // Validate indices
    if (draggedIndex === -1 || targetIdx === -1) {
      console.error('Invalid drag indices:', { draggedIndex, targetIdx, draggedItem, targetItemId });
      setDragOverItem({ type: null, id: null, index: null });
      return;
    }

    // If same position, do nothing
    if (draggedIndex === targetIdx) {
      setDragOverItem({ type: null, id: null, index: null });
      return;
    }

    // Reorder items - insert dragged item below target item
    const [movedItem] = updatedArray.splice(draggedIndex, 1);
    // Insert after target (below it)
    const insertIndex = draggedIndex < targetIdx ? targetIdx : targetIdx + 1;
    updatedArray.splice(insertIndex, 0, movedItem);

    console.log('Reordering:', { 
      itemType, 
      draggedIndex, 
      targetIdx, 
      insertIndex,
      originalLength: profile[profileKey]?.length,
      newLength: updatedArray.length 
    });

    // Update profile state immediately for UI feedback
    onUpdateProfile(profileKey, updatedArray);
    
    // Save to database
    try {
      if (itemType === 'skill') {
        // Skills are saved in profile
        if (typeof saveProfile === 'function') {
          await saveProfile(null, { skills: updatedArray });
        }
      } else {
        // For education, experience, projects, certificates - save the reordered array
        if (typeof saveProfile === 'function') {
          await saveProfile(null, { [profileKey]: updatedArray });
        }
      }
      toast.success('Order updated successfully');
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save order');
      // Revert on error
      const originalArray = profile[profileKey] || [];
      onUpdateProfile(profileKey, originalArray);
    }

    setDraggedItem({ type: null, id: null, index: null });
    setDragOverItem({ type: null, id: null, index: null });
  };

  // Helper function to handle text element selection
  const handleTextElementClick = (e, elementType = 'body') => {
    e.stopPropagation();
    const element = e.currentTarget;
    const computedStyle = window.getComputedStyle(element);
    
    // Determine field prefix based on element type
    let fieldPrefix = elementType;
    if (elementType === 'heading' && element.tagName.toLowerCase() === 'h3') {
      fieldPrefix = 'heading';
    } else if (elementType === 'summary' || element.classList.contains('summary')) {
      fieldPrefix = 'summary';
    } else if (elementType === 'body' || element.tagName.toLowerCase() === 'p') {
      fieldPrefix = 'body';
    }
    
    // Multi-select mode
    if (isMultiSelectMode) {
      const elementId = element.getAttribute('data-element-id') || `${Date.now()}-${Math.random()}`;
      if (!element.getAttribute('data-element-id')) {
        element.setAttribute('data-element-id', elementId);
      }
      
      const isAlreadySelected = selectedElements.some(el => el.element === element || el.id === elementId);
      
      if (isAlreadySelected) {
        // Deselect if already selected
        const updated = selectedElements.filter(el => el.element !== element && el.id !== elementId);
        setSelectedElements(updated);
        element.classList.remove('text-editing-highlight');
      } else {
        // Add to selection
        const newSelection = {
          id: elementId,
          element: element,
          text: element.textContent || element.innerText || '',
          type: fieldPrefix
        };
        setSelectedElements([...selectedElements, newSelection]);
        element.classList.add('text-editing-highlight');
      }
      
      // Update style based on first selected element or current element
      if (selectedElements.length === 0 || (selectedElements.length > 0 && !isAlreadySelected)) {
        let computedFontFamily = computedStyle.fontFamily || '';
        if (computedFontFamily) {
          computedFontFamily = computedFontFamily.replace(/['"]/g, '').split(',')[0].trim();
        }
        
        const savedStyle = {
          fontFamily: profile[`${fieldPrefix}FontFamily`] || computedFontFamily || 'Inter',
          fontWeight: profile[`${fieldPrefix}FontWeight`] || computedStyle.fontWeight || '400',
          fontSize: profile[`${fieldPrefix}FontSize`] || computedStyle.fontSize || '14px',
          color: profile[`${fieldPrefix}Color`] || computedStyle.color || '#1B1B1B',
          lineHeight: profile[`${fieldPrefix}LineHeight`] || computedStyle.lineHeight || 'auto',
          letterSpacing: profile[`${fieldPrefix}LetterSpacing`] || computedStyle.letterSpacing || 'normal'
        };
        setSelectedTextStyle(savedStyle);
      }
      return;
    }
    
    // Single select mode (existing behavior)
    setSelectedElement({
      element: element,
      text: element.textContent || element.innerText || '',
      range: null,
      type: fieldPrefix
    });
    
    // Get saved styles or computed styles
    // Extract font family from computed style (remove quotes and fallback fonts)
    let computedFontFamily = computedStyle.fontFamily || '';
    if (computedFontFamily) {
      // Remove quotes and get first font (before comma)
      computedFontFamily = computedFontFamily.replace(/['"]/g, '').split(',')[0].trim();
    }
    
    const savedStyle = {
      fontFamily: profile[`${fieldPrefix}FontFamily`] || computedFontFamily || 'Inter',
      fontWeight: profile[`${fieldPrefix}FontWeight`] || computedStyle.fontWeight || '400',
      fontSize: profile[`${fieldPrefix}FontSize`] || computedStyle.fontSize || '14px',
      color: profile[`${fieldPrefix}Color`] || computedStyle.color || '#1B1B1B',
      lineHeight: profile[`${fieldPrefix}LineHeight`] || computedStyle.lineHeight || 'auto',
      letterSpacing: profile[`${fieldPrefix}LetterSpacing`] || computedStyle.letterSpacing || 'normal'
    };
    
    setSelectedTextStyle(savedStyle);
  };

  // Function to select all text elements
  const handleSelectAll = () => {
    if (!isMultiSelectMode) {
      toast.error('Please enable Multi-Select Mode first');
      return;
    }

    // Find the resume preview container - look for the middle panel
    let resumePreview = document.querySelector('[data-resume-preview="true"]');
    
    // If not found, try alternative selectors
    if (!resumePreview) {
      const possibleSelectors = [
        'div[class*="flex-1"][class*="overflow-y-auto"]', // Editor content
        'div[class*="max-w-3xl"]', // Resume content wrapper
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
      // Fallback: search from the component's root
      resumePreview = document.body;
      console.warn('Resume preview container not found, searching entire body');
    }
    
    // Find all elements with selectable-text class, editable-text class, or that have onClick handlers
    // Use a more flexible selector
    const allElements = resumePreview.querySelectorAll('*');
    const selectableElements = [];
    
    allElements.forEach((element) => {
      const className = element.className || '';
      const tagName = element.tagName.toLowerCase();
      
      // Check if element has selectable-text or editable-text class
      const hasSelectableClass = className.includes('selectable-text') || className.includes('editable-text');
      
      // Check if element has onClick handler (indicates it's clickable)
      const hasOnClick = element.onclick !== null || element.getAttribute('onclick') !== null;
      
      // Check if element is a text element that should be selectable
      const isTextElement = (tagName === 'h3' || tagName === 'p' || tagName === 'span' || tagName === 'input') &&
                           (hasSelectableClass || hasOnClick || className.includes('cursor-pointer'));
      
      if (isTextElement || hasSelectableClass) {
        // Skip if already selected
        if (element.classList.contains('text-editing-highlight')) {
          return;
        }

        // Skip if element is hidden or not visible
        if (element.offsetParent === null || element.offsetWidth === 0 || element.offsetHeight === 0) {
          return;
        }

        // Skip if element has no text content (empty elements)
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
      // Determine element type
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

      // Generate unique ID if not exists
      let elementId = element.getAttribute('data-element-id');
      if (!elementId) {
        elementId = `${Date.now()}-${Math.random()}`;
        element.setAttribute('data-element-id', elementId);
      }

      // Add to selection
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

  // Function to apply text formatting to selected element(s)
  const applyTextFormatting = async (style) => {
    // Multi-select mode: apply to all selected elements
    if (isMultiSelectMode && selectedElements.length > 0) {
      const elementsToFormat = selectedElements;
      const formattingPromises = [];
      
      for (const selected of elementsToFormat) {
        const element = selected.element;
        if (!element) continue;
        
        // Clean font family name (remove any existing quotes)
        const cleanFontFamily = style.fontFamily ? style.fontFamily.replace(/^["']|["']$/g, '').trim() : '';
        
        // Apply styles directly to the element for immediate visual feedback
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
        
        // Determine field prefix for saving
        let fieldPrefix = selected.type || '';
        if (!fieldPrefix) {
          const tagName = element.tagName.toLowerCase();
          const className = element.className || '';
          if (tagName === 'input' && className.includes('editable-text')) {
            fieldPrefix = 'name';
          } else if (tagName === 'h3' || className.includes('heading')) {
            fieldPrefix = 'heading';
          } else if (tagName === 'p' && className.includes('summary')) {
            fieldPrefix = 'summary';
          } else if (tagName === 'p' || className.includes('body')) {
            fieldPrefix = 'body';
          }
        }
        
        // Save formatting for each element type
        if (fieldPrefix) {
          const cleanFontFamily = style.fontFamily ? style.fontFamily.replace(/^["']|["']$/g, '').trim() : '';
          const formattingData = {
            [`${fieldPrefix}FontFamily`]: cleanFontFamily,
            [`${fieldPrefix}FontWeight`]: style.fontWeight,
            [`${fieldPrefix}FontSize`]: style.fontSize,
            [`${fieldPrefix}Color`]: style.color,
            [`${fieldPrefix}LineHeight`]: style.lineHeight,
            [`${fieldPrefix}LetterSpacing`]: style.letterSpacing
          };
          
          // Update profile state
          Object.keys(formattingData).forEach(key => {
            onUpdateProfile(key, formattingData[key]);
          });
        }
      }
      
      // Save to database once for all changes
      if (typeof saveProfile === 'function') {
        try {
          // Collect all unique field prefixes and their values
          const allFormattingData = {};
          elementsToFormat.forEach(selected => {
            const element = selected.element;
            if (!element) return;
            
            let fieldPrefix = selected.type || '';
            if (!fieldPrefix) {
              const tagName = element.tagName.toLowerCase();
              const className = element.className || '';
              if (tagName === 'input' && className.includes('editable-text')) {
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
              const cleanFontFamily = style.fontFamily ? style.fontFamily.replace(/^["']|["']$/g, '').trim() : '';
              allFormattingData[`${fieldPrefix}FontFamily`] = cleanFontFamily;
              allFormattingData[`${fieldPrefix}FontWeight`] = style.fontWeight;
              allFormattingData[`${fieldPrefix}FontSize`] = style.fontSize;
              allFormattingData[`${fieldPrefix}Color`] = style.color;
              allFormattingData[`${fieldPrefix}LineHeight`] = style.lineHeight;
              allFormattingData[`${fieldPrefix}LetterSpacing`] = style.letterSpacing;
            }
          });
          
          await saveProfile(null, allFormattingData);
        } catch (error) {
          console.error('Error saving text formatting:', error);
          toast.error('Failed to save formatting');
        }
      }
      return;
    }
    
    // Single select mode (existing behavior)
    if (!selectedElement || !selectedElement.element) return;

    const element = selectedElement.element;
    
    // Clean font family name (remove any existing quotes)
    const cleanFontFamily = style.fontFamily ? style.fontFamily.replace(/^["']|["']$/g, '').trim() : '';
    
    // Apply styles directly to the element for immediate visual feedback
    // Font names with spaces need to be wrapped in quotes for direct DOM manipulation
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

    // Use the stored type from selectedElement, or determine from element
    let fieldPrefix = selectedElement.type || '';
    
    if (!fieldPrefix) {
      // Fallback: Determine which field to save based on element class, tag, or position
      const tagName = element.tagName.toLowerCase();
      const className = element.className || '';
      
      // Check if it's the name input (has editable-text class and is in header)
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

    // Save formatting to profile
    if (fieldPrefix) {
      // Ensure font name is saved without quotes (React will handle quotes in inline styles)
      const cleanFontFamily = style.fontFamily ? style.fontFamily.replace(/^["']|["']$/g, '').trim() : '';
      
      const formattingData = {
        [`${fieldPrefix}FontFamily`]: cleanFontFamily,
        [`${fieldPrefix}FontWeight`]: style.fontWeight,
        [`${fieldPrefix}FontSize`]: style.fontSize,
        [`${fieldPrefix}Color`]: style.color,
        [`${fieldPrefix}LineHeight`]: style.lineHeight,
        [`${fieldPrefix}LetterSpacing`]: style.letterSpacing
      };

      // Update profile state
      Object.keys(formattingData).forEach(key => {
        onUpdateProfile(key, formattingData[key]);
      });

      // Save to database
      if (typeof saveProfile === 'function') {
        try {
          await saveProfile(null, formattingData);
          // Don't show toast on every change - only on explicit saves
          // toast.success('Text formatting saved');
        } catch (error) {
          console.error('Error saving text formatting:', error);
          toast.error('Failed to save formatting');
        }
      }
    }
  };

  // Use ordered sections
  const sections = sectionOrder;

  // Build CV data for template 1-8 (profile designer has no selected job; use placeholder job)
  // Templates expect cv.skills as array of { id, name, type }; profile.skills is array of strings
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
    if (templateNum === 3) return <JobCVTemplate3 cv={liveCV} />;
    if (templateNum === 4) return <JobCVTemplate4 cv={liveCV} />;
    if (templateNum === 5) return <JobCVTemplate5 cv={liveCV} />;
    if (templateNum === 6) return <JobCVTemplate6 cv={liveCV} />;
    if (templateNum === 7) return <JobCVTemplate7 cv={liveCV} />;
    if (templateNum === 8) return <JobCVTemplate8 cv={liveCV} />;
    return null;
  };

  // Helper function to render resume sections in order
  const renderResumeSection = (sectionName) => {
    switch (sectionName) {
      case 'Professional Summary':
        if (!profile.aboutMe) return null;
  return (
          <div key="professional-summary" className="space-y-2 pt-4 border-t border-neutral-200">
            <h3 
              className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text heading"
              onClick={(e) => handleTextElementClick(e, 'heading')}
              style={{
                fontFamily: profile.headingFontFamily,
                fontWeight: profile.headingFontWeight,
                fontSize: profile.headingFontSize,
                color: profile.headingColor,
                lineHeight: profile.headingLineHeight,
                letterSpacing: profile.headingLetterSpacing
              }}
            >
              Professional Summary
            </h3>
            <p 
              className="text-[11px] text-neutral-700 leading-relaxed whitespace-pre-wrap cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text summary"
              onClick={(e) => handleTextElementClick(e, 'summary')}
              style={{
                fontFamily: profile.summaryFontFamily,
                fontWeight: profile.summaryFontWeight,
                fontSize: profile.summaryFontSize,
                color: profile.summaryColor,
                lineHeight: profile.summaryLineHeight,
                letterSpacing: profile.summaryLetterSpacing
              }}
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
              onClick={(e) => handleTextElementClick(e, 'heading')}
              style={{
                fontFamily: profile.headingFontFamily,
                fontWeight: profile.headingFontWeight,
                fontSize: profile.headingFontSize,
                color: profile.headingColor,
                lineHeight: profile.headingLineHeight,
                letterSpacing: profile.headingLetterSpacing
              }}
            >
              Education
            </h3>
            {profile.education.map((edu) => (
              <div key={edu.id} className="space-y-1">
                <p 
                  className="text-xs font-semibold text-neutral-900 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
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
                  {edu.degree || edu.title || 'Degree'} @ {edu.institution || 'Institution'}
                </p>
                <p 
                  className="text-[10px] text-neutral-500 uppercase cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
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
                  {edu.startYear || 'Start'} - {edu.endYear || 'End'}
                </p>
                {edu.location && (
                  <p 
                    className="text-[10px] text-neutral-600 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
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
                    {edu.location}
                  </p>
                )}
                {edu.gpa && (
                  <p 
                    className="text-[10px] text-neutral-600 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
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
              onClick={(e) => handleTextElementClick(e, 'heading')}
              style={{
                fontFamily: profile.headingFontFamily,
                fontWeight: profile.headingFontWeight,
                fontSize: profile.headingFontSize,
                color: profile.headingColor,
                lineHeight: profile.headingLineHeight,
                letterSpacing: profile.headingLetterSpacing
              }}
            >
              Experience
            </h3>
            {profile.workExperience.map((exp) => (
              <div key={exp.id} className="space-y-1">
                <p 
                  className="text-[10px] text-neutral-500 uppercase cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
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
                  {exp.startDate || 'Start'} - {exp.current ? 'Present' : exp.endDate || 'End'}
                </p>
                <p 
                  className="text-xs font-semibold text-neutral-900 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
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
                  {exp.title || 'Job Title'} @ {exp.company || 'Company'}
                </p>
                {exp.location && (
                  <p 
                    className="text-[10px] text-neutral-600 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
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
                    {exp.location}
                  </p>
                )}
                {exp.description && (
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-neutral-700 ml-2 mt-1">
                    {exp.description.split('\n').filter(line => line.trim()).map((line, idx) => (
                      <li 
                        key={idx}
                        className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
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
              onClick={(e) => handleTextElementClick(e, 'heading')}
              style={{
                fontFamily: profile.headingFontFamily,
                fontWeight: profile.headingFontWeight,
                fontSize: profile.headingFontSize,
                color: profile.headingColor,
                lineHeight: profile.headingLineHeight,
                letterSpacing: profile.headingLetterSpacing
              }}
            >
              Projects
            </h3>
            {profile.projects.map((proj) => (
              <div key={proj.id} className="space-y-1">
                <p 
                  className="text-[10px] text-neutral-500 uppercase cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
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
                  {proj.startDate || 'Start'} - {proj.endDate || 'End'}
                </p>
                <p 
                  className="text-xs font-semibold text-neutral-900 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
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
                  {proj.title || 'Project Title'}
                </p>
                {proj.type && (
                  <p 
                    className="text-[10px] text-neutral-600 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
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
                    {proj.type}
                  </p>
                )}
                {proj.description && (
                  <p 
                    className="text-[11px] text-neutral-700 mt-1 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
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
              onClick={(e) => handleTextElementClick(e, 'heading')}
              style={{
                fontFamily: profile.headingFontFamily,
                fontWeight: profile.headingFontWeight,
                fontSize: profile.headingFontSize,
                color: profile.headingColor,
                lineHeight: profile.headingLineHeight,
                letterSpacing: profile.headingLetterSpacing
              }}
            >
              Certificates
            </h3>
            {profile.certificates.map((cert) => (
              <div key={cert.id} className="space-y-1">
                <p 
                  className="text-xs font-semibold text-neutral-900 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
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
                  {cert.title || 'Certificate Title'}
                </p>
                <p 
                  className="text-[10px] text-neutral-600 cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 transition-colors selectable-text body"
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
              onClick={(e) => handleTextElementClick(e, 'heading')}
              style={{
                fontFamily: profile.headingFontFamily,
                fontWeight: profile.headingFontWeight,
                fontSize: profile.headingFontSize,
                color: profile.headingColor,
                lineHeight: profile.headingLineHeight,
                letterSpacing: profile.headingLetterSpacing
              }}
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
              onClick={(e) => handleTextElementClick(e, 'heading')}
              style={{
                fontFamily: profile.headingFontFamily,
                fontWeight: profile.headingFontWeight,
                fontSize: profile.headingFontSize,
                color: profile.headingColor,
                lineHeight: profile.headingLineHeight,
                letterSpacing: profile.headingLetterSpacing
              }}
            >
              Skills
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((skill, index) => (
                <span 
                  key={index}
                  className="text-[11px] text-neutral-700 cursor-pointer hover:bg-blue-50 rounded px-2 py-0.5 transition-colors selectable-text body inline-block"
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
    const originalTitle = document.title;
    document.title = ''; // Blank title so browser print header shows nothing (user can uncheck "Headers and footers" to remove date/URL too)
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 500);
  };

  const handleDownloadClick = () => {
    setShowDownloadModal(true);
  };

  // When download modal opens, show A4 preview and compute page count
  useEffect(() => {
    if (!showDownloadModal) return;
    const t = setTimeout(() => {
      const el = document.getElementById('cv-download-source');
      const container = downloadPreviewRef.current;
      if (!el || !container) return;
      const clone = el.cloneNode(true);
      clone.id = '';
      clone.setAttribute('aria-hidden', 'true');
      clone.style.width = '210mm';
      clone.style.minWidth = '210mm';
      clone.style.maxWidth = '210mm';
      clone.style.pointerEvents = 'none';
      clone.style.boxSizing = 'border-box';
      container.innerHTML = '';
      container.appendChild(clone);
      // A4 height in px (297mm at ~3.78px/mm)
      const a4HeightPx = 297 * (96 / 25.4);
      const contentHeight = clone.scrollHeight || clone.offsetHeight;
      const pages = Math.max(1, Math.ceil(contentHeight / a4HeightPx));
      setPreviewPageCount(pages);
    }, 0);
    return () => {
      clearTimeout(t);
      if (downloadPreviewRef.current) downloadPreviewRef.current.innerHTML = '';
    };
  }, [showDownloadModal]);

  /** Clone element and copy computed styles to inline so html2pdf doesn't see oklch (Tailwind v4). */
  const cloneWithResolvedStyles = (source) => {
    const clone = source.cloneNode(true);
    const walk = (orig, cl) => {
      if (!orig || !cl || orig.nodeType !== 1 || cl.nodeType !== 1) return;
      const cs = window.getComputedStyle(orig);
      for (let i = 0; i < cs.length; i++) {
        const prop = cs[i];
        const val = cs.getPropertyValue(prop);
        if (val && !val.includes('oklch')) cl.style.setProperty(prop, val);
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

  const handleSaveToDevice = async () => {
    const el = document.getElementById('cv-download-source');
    if (!el) {
      toast.error('Could not find CV content to download.');
      return;
    }
    setIsGeneratingPdf(true);
    let iframe = null;
    try {
      const clone = cloneWithResolvedStyles(el);
      clone.id = 'cv-pdf-clone';
      clone.style.background = '#fff';
      clone.style.width = '210mm';
      clone.style.minHeight = '297mm';
      clone.style.boxSizing = 'border-box';

      iframe = document.createElement('iframe');
      iframe.setAttribute('style', 'position:absolute;left:-9999px;top:0;width:210mm;height:297mm;border:0;');
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument;
      doc.open();
      doc.write('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#fff;"></body></html>');
      doc.close();
      doc.body.appendChild(clone);

      const filename = `${(profile?.fullName || 'CV').replace(/[^a-zA-Z0-9-_]/g, '_')}-CV.pdf`;
      await html2pdf()
        .set({
          margin: 10,
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, letterRendering: true },
          jsPDF: { unit: 'mm', format: 'a4', hotfixes: ['px_scaling'] },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        })
        .from(clone)
        .save();
      toast.success('PDF downloaded.');
      setShowDownloadModal(false);
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast.error('Download failed. Try again or use Print and save as PDF.');
    } finally {
      if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadCancel = () => {
    setShowDownloadModal(false);
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
        /* Multi-page: subtle page break line every A4 height (297mm) */
        .cv-print-area {
          background-image: repeating-linear-gradient(
            to bottom,
            transparent 0,
            transparent calc(297mm - 1px),
            rgba(0, 0, 0, 0.06) calc(297mm - 1px),
            rgba(0, 0, 0, 0.06) 297mm
          );
        }
      `}</style>
      {!hideStudentNavigation && (
        <StudentMenuNavigation currentPage={currentPage} onPageChange={onPageChange} />
      )}
      
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar: Builder Sections */}
        <aside className="w-64 bg-white border-r border-neutral-200 flex-col hidden lg:flex">
          <div className="px-4 py-3 border-b border-neutral-200 flex gap-2">
            <button
              type="button"
              onClick={() => setSidebarTab('builder')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                sidebarTab === 'builder'
                  ? 'font-semibold text-neutral-900 bg-neutral-100'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Builder
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab('templates')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                sidebarTab === 'templates'
                  ? 'font-semibold text-neutral-900 bg-neutral-100'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Templates
            </button>
          </div>
          {sidebarTab === 'templates' ? (
            <div className="flex-1 overflow-y-auto py-3 px-3">
              <div className="text-[10px] font-medium text-neutral-500 uppercase tracking-wide mb-2 px-1">Choose layout</div>
              {[
                { num: 0, label: 'Standard Layout' },
                { num: 1, label: 'Template 1' },
                { num: 2, label: 'Template 2' },
                { num: 3, label: 'Template 3' },
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
                  className={`w-full text-left px-3 py-2.5 text-xs rounded-lg mb-1 transition-colors ${
                    selectedTemplate === num
                      ? 'bg-blue-100 text-blue-800 font-medium'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <>
          {jobs.length > 0 && (
            <div className="px-4 py-3 border-b border-neutral-200">
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
          <nav className="flex-1 overflow-y-auto py-2">
            {sections.map((section) => (
              <div 
                key={section} 
                className={`border-b border-neutral-100 last:border-b-0 transition-colors ${
                  dragOverSection === section ? 'bg-blue-100' : ''
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
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-xs ${
                    activeSection === section
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  } transition-colors`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <i className="fas fa-grip-vertical text-[10px] text-neutral-400 flex-shrink-0"></i>
                    <span className="truncate">{section}</span>
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
                                className={`p-2 border rounded text-[10px] transition-colors ${
                                  emailIcon === icon.value
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
                                  className={`w-5 h-5 rounded border-2 transition-all ${
                                    emailIconColor === color
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
                                className={`p-2 border rounded text-[10px] transition-colors ${
                                  phoneIcon === icon.value
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
                                  className={`w-5 h-5 rounded border-2 transition-all ${
                                    phoneIconColor === color
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
                                className={`p-2 border rounded text-[10px] transition-colors ${
                                  addressIcon === icon.value
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
                                  className={`w-5 h-5 rounded border-2 transition-all ${
                                    addressIconColor === color
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
                <div className="mt-3 flex gap-2">
                  {jobs.length > 0 && (
                    <button
                      type="button"
                      disabled={!selectedJobIdForAts || isRewritingSection}
                      onClick={() => handleRewriteWithAi('about_me', summaryDraft)}
                      className="flex-1 rounded-full border border-purple-300 bg-purple-50 text-purple-700 text-[11px] font-medium py-2.5 transition-colors hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {isRewritingSection ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
                      Rewrite with AI
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof saveProfile === 'function') {
                        saveProfile(summaryDraft);
                      }
                      toast.success('Professional summary saved to your resume');
                    }}
                    className="flex-1 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium py-2.5 transition-colors"
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
                                  // Load education into form for editing
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
                                className={`p-3 rounded-lg border cursor-move transition-colors ${
                                  editingEducationId === edu.id
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
                        let response;
                        let savedEducation;
                        
                        if (editingEducationId) {
                          // Update existing education
                          response = await putRequest(`/cv/education/${editingEducationId}`, {
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
                            
                            // Update in profile state
                            const updatedEducation = (profile.education || []).map(edu =>
                              edu.id === editingEducationId ? savedEducation : edu
                            );
                            onUpdateProfile('education', updatedEducation);
                            
                            // Reset form
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
                          // Create new education
                          response = await postRequest('/cv/education', {
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
                            
                            // Add to profile state with real ID
                            onUpdateProfile('education', [...(profile.education || []), savedEducation]);
                            
                            // Reset form (form stays available for adding more)
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
                                className={`w-5 h-5 rounded border-2 transition-all ${
                                  linkedinIconColor === color
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
                                className={`w-5 h-5 rounded border-2 transition-all ${
                                  githubIconColor === color
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
                                className={`w-5 h-5 rounded border-2 transition-all ${
                                  portfolioIconColor === color
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
                                className={`p-3 rounded-lg border cursor-move transition-colors ${
                                  editingExperienceId === exp.id
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
                          if (!experienceForm.jobTitle || !experienceForm.company || !experienceForm.description) {
                            toast.error('Please fill in Job Title, Company, and Description');
                            return;
                          }
                          
                          try {
                            let response;
                            
                            if (editingExperienceId) {
                              response = await putRequest(`/cv/experience/${editingExperienceId}`, {
                                jobTitle: experienceForm.jobTitle,
                                company: experienceForm.company,
                                location: experienceForm.location || '',
                                startDate: experienceForm.startDate || '',
                                endDate: experienceForm.isCurrent ? '' : experienceForm.endDate || '',
                                isCurrent: experienceForm.isCurrent,
                                description: experienceForm.description
                              });
                              
                              if (response && response.data && response.data.success) {
                                const savedExperience = {
                                  id: editingExperienceId,
                                  title: experienceForm.jobTitle,
                                  company: experienceForm.company,
                                  location: experienceForm.location || '',
                                  startDate: experienceForm.startDate || '',
                                  endDate: experienceForm.isCurrent ? '' : experienceForm.endDate || '',
                                  current: experienceForm.isCurrent,
                                  description: experienceForm.description
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
                              response = await postRequest('/cv/experience', {
                                jobTitle: experienceForm.jobTitle,
                                company: experienceForm.company,
                                location: experienceForm.location || '',
                                startDate: experienceForm.startDate || '',
                                endDate: experienceForm.isCurrent ? '' : experienceForm.endDate || '',
                                isCurrent: experienceForm.isCurrent,
                                description: experienceForm.description
                              });
                              
                              if (response && response.data && response.data.success) {
                                const savedData = response.data.data;
                                const savedExperience = {
                                  id: savedData._id || savedData.id,
                                  title: experienceForm.jobTitle,
                                  company: experienceForm.company,
                                  location: experienceForm.location || '',
                                  startDate: experienceForm.startDate || '',
                                  endDate: experienceForm.isCurrent ? '' : experienceForm.endDate || '',
                                  current: experienceForm.isCurrent,
                                  description: experienceForm.description
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
                              className={`p-3 rounded-lg border cursor-move transition-colors ${
                                editingProjectId === proj.id
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
                            let response;
                            
                            if (editingProjectId) {
                              response = await putRequest(`/cv/project/${editingProjectId}`, {
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
                              response = await postRequest('/cv/project', {
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
                              className={`p-3 rounded-lg border cursor-move transition-colors ${
                                editingCertificateId === cert.id
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
                            let response;
                            
                            if (editingCertificateId) {
                              response = await putRequest(`/cv/certificate/${editingCertificateId}`, {
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
                              response = await postRequest('/cv/certificate', {
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
                              className={`flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 rounded-lg border border-neutral-200 cursor-move transition-colors ${
                                dragOverItem.type === 'skill' && dragOverItem.index === index
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
          </nav>
            </>
          )}
        </aside>

        {/* Middle Panel: Resume Editor */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {/* Header - hidden when printing */}
          <div className="no-print px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
            <div>
              <h1 className="text-sm font-semibold text-neutral-900">
                {profile.fullName || 'Your Name'} Resume
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadClick}
                className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded hover:bg-neutral-50 flex items-center gap-1.5"
              >
                <i className="fas fa-download"></i>
                Download
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded hover:bg-neutral-50 flex items-center gap-1.5"
              >
                <i className="fas fa-print"></i>
                Print
              </button>
              <button
                onClick={() => setView('jobs')}
                className="px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 rounded hover:bg-neutral-50"
              >
                <i className="fas fa-arrow-left mr-1.5"></i>
                Back
              </button>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4" data-resume-preview="true">
            {/* Hidden file input for photo upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileSelect}
              accept="image/*"
              className="hidden"
            />
            <div
              id="cv-download-source"
              ref={previewContainerRef}
              className="cv-print-area relative w-[210mm] mx-auto bg-white rounded-xl shadow-lg border border-slate-200 print:shadow-none print:rounded-none"
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
                    onClick={(e) => {
                      setSelectedElement({
                        element: e.target,
                        text: e.target.value || '',
                        range: null,
                        type: 'name'
                      });
                      const computedStyle = window.getComputedStyle(e.target);
                      // Extract font family from computed style (remove quotes and fallback fonts)
                      let computedFontFamily = computedStyle.fontFamily || '';
                      if (computedFontFamily) {
                        computedFontFamily = computedFontFamily.replace(/['"]/g, '').split(',')[0].trim();
                      }
                      setSelectedTextStyle({
                        fontFamily: profile.nameFontFamily || computedFontFamily || 'Geist',
                        fontWeight: profile.nameFontWeight || computedStyle.fontWeight || '700',
                        fontSize: profile.nameFontSize || computedStyle.fontSize || '24px',
                        color: profile.nameColor || computedStyle.color || '#1B1B1B',
                        lineHeight: profile.nameLineHeight || computedStyle.lineHeight || 'auto',
                        letterSpacing: profile.nameLetterSpacing || computedStyle.letterSpacing || 'normal'
                      });
                    }}
                    className="text-2xl font-bold text-neutral-900 w-full border-none outline-none bg-transparent p-0 tracking-tight editable-text cursor-text"
                    style={{
                      fontFamily: profile.nameFontFamily,
                      fontWeight: profile.nameFontWeight,
                      fontSize: profile.nameFontSize,
                      color: profile.nameColor,
                      lineHeight: profile.nameLineHeight,
                      letterSpacing: profile.nameLetterSpacing
                    }}
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
                          // Hide image and show placeholder if load fails
                          e.target.style.display = 'none';
                          const placeholder = e.target.parentElement.querySelector('.photo-placeholder');
                          if (placeholder) placeholder.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-28 h-32 bg-gradient-to-br from-neutral-50 to-neutral-100 border border-neutral-300 rounded flex items-center justify-center shadow-sm photo-placeholder ${
                        (user?.profilePicture || profile?.profilePicture) ? 'hidden' : ''
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
                // Separate Contacts from other sections to always render it at the bottom
                const otherSections = sections.filter(s => s !== 'Contacts');
                const contactsSection = sections.includes('Contacts') ? ['Contacts'] : [];
                
                return (
                  <>
                    {otherSections.map((sectionName) => renderResumeSection(sectionName))}
                    {contactsSection.map((sectionName) => renderResumeSection(sectionName))}
    </>
  );
              })()}
              {/* MySkillDB at bottom right (print: fixed so appears on every page) */}
              <div className="cv-myskilldb-footer absolute bottom-0 right-0 text-xs text-neutral-500 mt-8 pr-1">
                MySkillDB
              </div>
              </div>
            ) : (
              renderTemplateByNumber(selectedTemplate)
            )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Tools */}
        <aside className="w-80 bg-white border-l border-neutral-200 flex-col hidden xl:flex">
          <div className="px-4 py-3 border-b border-neutral-200 flex gap-2">
            <button className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded flex items-center gap-1.5">
              <i className="fas fa-sparkles text-[10px]"></i>
              Analyze
            </button>
            <button className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700">
              Share
              </button>
          </div>
          
          {/* Multi-Select Toggle */}
          <div className="px-4 py-3 border-b border-neutral-200">
            <button
              onClick={() => {
                setIsMultiSelectMode(!isMultiSelectMode);
                if (!isMultiSelectMode) {
                  // Clear single selection when entering multi-select mode
                  setSelectedElement(null);
                } else {
                  // Clear multi-selection when exiting multi-select mode
                  selectedElements.forEach(el => {
                    if (el.element) el.element.classList.remove('text-editing-highlight');
                  });
                  setSelectedElements([]);
                }
              }}
              className={`w-full px-3 py-2 text-xs font-medium rounded flex items-center justify-center gap-2 transition-colors ${
                isMultiSelectMode
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
            {/* Skill Alignment Card */}
            <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-semibold text-neutral-900">Skill Alignment</h4>
                <span className="text-[10px] text-neutral-500">&lt; 1/4 &gt;</span>
          </div>
              <p className="text-[10px] text-neutral-600 mb-2">
                3 skills found in your profile that are not listed here.
              </p>
              <div className="flex gap-2">
                <button className="px-2 py-1 text-[10px] font-medium text-neutral-600 bg-white border border-neutral-200 rounded hover:bg-neutral-50">
                  Ignore
                </button>
                <button className="px-2 py-1 text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100">
                  Add skills
              </button>
            </div>
          </div>

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
                      value={selectedTextStyle.color}
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
                        className={`w-8 h-8 rounded border-2 ${
                          selectedTextStyle.color === color ? 'border-blue-500' : 'border-neutral-300'
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
          </div>
        </aside>
      </div>

      {/* Download CV modal: print-preview style — left A4 preview, right panel */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-neutral-200" aria-modal="true" role="dialog" aria-labelledby="download-modal-title">
          {/* Header with close */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-white border-b border-neutral-200 gap-4">
            <h2 id="download-modal-title" className="text-base font-semibold text-neutral-900">
              Print
            </h2>
            <span className="text-sm text-neutral-600 ml-auto">{previewPageCount} {previewPageCount === 1 ? 'page' : 'pages'}</span>
            <button
              type="button"
              onClick={handleDownloadCancel}
              className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded flex-shrink-0"
              aria-label="Close"
            >
              <span className="text-xl leading-none">×</span>
            </button>
          </div>
          <div className="flex-1 min-h-0 flex overflow-hidden">
            {/* Left: A4 page(s) preview — strict 210mm width, scrollable */}
            <div className="flex-1 min-w-0 overflow-auto flex justify-center p-4 bg-neutral-300">
              <div
                className="cv-download-preview-pages bg-white shadow-lg"
                style={{ width: '210mm', minHeight: '297mm' }}
              >
                <div
                  ref={downloadPreviewRef}
                  className="min-h-full"
                  style={{ width: '210mm', minHeight: '297mm' }}
                />
              </div>
            </div>
            {/* Right: options panel (like system print dialog) */}
            <div className="flex-shrink-0 w-72 bg-white border-l border-neutral-200 flex flex-col p-4">
              <div className="text-sm font-medium text-neutral-700 mb-2">Destination</div>
              <div className="text-sm text-neutral-600 mb-4 py-2 px-3 bg-neutral-50 rounded border border-neutral-200">
                Save as PDF
              </div>
              <div className="text-xs text-neutral-500 mb-4">
                Content is formatted for A4. Long CVs flow to multiple pages automatically.
              </div>
              <div className="flex-1" />
              <div className="flex gap-2 justify-end pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={handleDownloadCancel}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveToDevice}
                  disabled={isGeneratingPdf}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:pointer-events-none rounded-lg transition-colors flex items-center gap-2"
                >
                  {isGeneratingPdf ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <i className="fas fa-download" aria-hidden="true" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobCVProfileView;
