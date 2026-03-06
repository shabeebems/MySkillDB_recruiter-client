import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { parseJobPosting, extractSkills } from '../../../api/api';
import { getRequest, postRequest } from '../../../api/apiRequests';

const JobParserModal = ({ isOpen, onClose, onBack, organizationId, prefilledCompany = null, allowedDepartmentId = null }) => {
  const [step, setStep] = useState(0); // 0: Company, 1: Paste, 2: Review, 3: Skills Results
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [isDeptLoading, setIsDeptLoading] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [isJobCreated, setIsJobCreated] = useState(false);
  const [createdJob, setCreatedJob] = useState(null);
  
  // Step 0: Company Selection
  const [companies, setCompanies] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]); // Store all companies for filtering
  const [isCompanyLoading, setIsCompanyLoading] = useState(false);
  const [companyMode, setCompanyMode] = useState('existing'); // 'existing' or 'new'
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedCompanyName, setSelectedCompanyName] = useState(''); // Store selected company name separately
  const [newCompanyName, setNewCompanyName] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  
  // Step 1: Paste job text
  const [fullJobText, setFullJobText] = useState('');
  
  // Step 2: Parsed data
  const [parsedData, setParsedData] = useState({
    job_title: '',
    company: '',
    description: '',
    requirements: [], // Changed to array
    salary: '',
    location: '',
    job_type: 'Full-time'
  });
  
  // Step 3: Extracted skills
  const [skillsData, setSkillsData] = useState(null);
  const [jobName, setJobName] = useState('');

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      setFullJobText('');
      setParsedData({
        job_title: '',
        company: prefilledCompany || '',
        description: '',
        requirements: [],
        salary: '',
        location: '',
        job_type: 'Full-time'
      });
      setSkillsData(null);
      setJobName('');
      setDepartments([]);
      setSelectedDepartments([]);
      setIsDeptLoading(false);
      setIsJobCreated(false);
      setCreatedJob(null);
      
      // Reset company selection
      setCompanyMode('existing');
      setSelectedCompanyId('');
      setSelectedCompanyName('');
      setNewCompanyName('');
      setCompanySearch('');
      setCompanies([]);
      setAllCompanies([]);
    } else {
        // Always fetch companies when modal opens
        fetchCompanies();
        
        // Always start at step 0 (company selection)
        setStep(0);
        
        // If prefilled company is provided, pre-select it
        if (prefilledCompany) {
            setSelectedCompanyName(prefilledCompany);
            setParsedData(prev => ({ ...prev, company: prefilledCompany }));
        }
    }
  }, [isOpen, prefilledCompany]);

  const fetchCompanies = async (search = '') => {
    try {
      setIsCompanyLoading(true);
      const response = await getRequest(`/companies?search=${search}`);
      if (response.data?.success) {
        const fetchedCompanies = response.data.data;
        setAllCompanies(fetchedCompanies);
        // Filter companies based on search
        if (search.trim()) {
          const filtered = fetchedCompanies.filter(comp => 
            comp.name.toLowerCase().includes(search.toLowerCase())
          );
          setCompanies(filtered);
        } else {
          setCompanies(fetchedCompanies);
        }
        
        // If prefilled company is provided and not searching, pre-select it in the dropdown
        if (!search.trim() && prefilledCompany && fetchedCompanies.length > 0) {
          const prefilledComp = fetchedCompanies.find(c => c.name === prefilledCompany);
          if (prefilledComp) {
            setSelectedCompanyId(prefilledComp._id || prefilledComp.id);
            setSelectedCompanyName(prefilledCompany);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setIsCompanyLoading(false);
    }
  };

  const handleCompanySearch = (e) => {
    const value = e.target.value;
    setCompanySearch(value);
    // Filter locally from allCompanies
    if (value.trim()) {
      const filtered = allCompanies.filter(comp => 
        comp.name.toLowerCase().includes(value.toLowerCase())
      );
      setCompanies(filtered);
    } else {
      setCompanies(allCompanies);
    }
  };

  const handleCompanySubmit = () => {
    if (companyMode === 'existing') {
        if (!selectedCompanyId) {
            toast.error('Please select a company');
            return;
        }
        const selectedComp = companies.find(c => c._id === selectedCompanyId);
        const companyName = selectedComp?.name || '';
        setSelectedCompanyName(companyName); // Store selected company name
        setParsedData(prev => ({ ...prev, company: companyName }));
    } else {
        if (!newCompanyName.trim()) {
            toast.error('Please enter a company name');
            return;
        }
        setSelectedCompanyName(newCompanyName); // Store new company name
        setParsedData(prev => ({ ...prev, company: newCompanyName }));
    }
    setStep(1);
  };

  const shouldLoadDepartments = useMemo(
    () => Boolean(isOpen && step === 2 && organizationId),
    [isOpen, step, organizationId]
  );

  useEffect(() => {
    const fetchDepartments = async () => {
      if (!shouldLoadDepartments) return;
      try {
        setIsDeptLoading(true);
        const response = await getRequest(`/organization-setup/departments/${organizationId}`);
        let data = response.data?.data ?? [];
        
        // HOD Restriction: Filter to only allowed department
        if (allowedDepartmentId) {
          data = data.filter(dept => dept._id === allowedDepartmentId);
        }
        
        setDepartments(data);
        if (data.length === 0) {
          setSelectedDepartments([]);
        } else if (allowedDepartmentId && data.length === 1) {
          // Auto-select the only department for HOD
          setSelectedDepartments([data[0]]);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast.error('Failed to load departments');
        setDepartments([]);
        setSelectedDepartments([]);
      } finally {
        setIsDeptLoading(false);
      }
    };

    fetchDepartments();
  }, [shouldLoadDepartments, organizationId, allowedDepartmentId]);

  // Step 1: Parse job posting
  const handleParseJob = async (e) => {
    e.preventDefault();
    
    if (!fullJobText.trim()) {
      toast.error('Please paste the job posting text first');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await parseJobPosting(fullJobText);
      
      if (result.success) {
        const data = result.data;
        // Ensure requirements is always an array
        let requirementsArray = [];
        if (Array.isArray(data.requirements)) {
          requirementsArray = data.requirements;
        } else if (data.requirements && typeof data.requirements === 'string') {
          // Fallback: if API returns string, parse it into array
          requirementsArray = buildRequirementsArray(data.requirements);
        }
        
        setParsedData({
          job_title: data.job_title || '',
          company: selectedCompanyName || prefilledCompany || data.company || 'Not specified', // Keep selected company if available
          description: data.description || '',
          requirements: requirementsArray,
          salary: data.salary || 'Not specified',
          location: data.location || 'Not specified',
          job_type: data.job_type || 'Full-time'
        });
        setStep(2);
        toast.success('✨ Job details extracted successfully!');
      } else {
        toast.error(result.error || 'Failed to parse job posting');
      }
    } catch (error) {
      console.error('Error parsing job:', error);
      toast.error('An error occurred while parsing the job posting');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Extract skills
  // Helper function to convert text to array (fallback for string requirements)
  const buildRequirementsArray = (text) => {
    if (!text) return [];
    if (Array.isArray(text)) return text; // Already an array
    
    // First, split by newlines (primary separator)
    const lines = text.split(/\n/).map((line) => line.trim()).filter(Boolean);
    
    const requirements = [];
    
    for (const line of lines) {
      // Remove common list markers (bullet points, dashes, numbers, etc.)
      let cleanedLine = line.replace(/^[\s]*[•\-\*\d+\.\)]\s*/, '').trim();
      
      if (!cleanedLine) continue;
      
      // Check if this line looks like a comma-separated list of short items
      // (e.g., "React, Vue, Angular" vs "Experience with React, Vue, and Angular")
      if (cleanedLine.includes(',')) {
        const parts = cleanedLine.split(',').map((part) => part.trim()).filter(Boolean);
        
        // Calculate average length of parts
        const avgLength = parts.reduce((sum, part) => sum + part.length, 0) / parts.length;
        
        // If average length is short (< 25 chars) and we have multiple parts, treat as list
        // Otherwise, treat as one requirement (comma is part of the text)
        if (avgLength < 25 && parts.length > 1) {
          requirements.push(...parts);
        } else {
          requirements.push(cleanedLine);
        }
      } else {
        // No commas, treat as single requirement
        requirements.push(cleanedLine);
      }
    }
    
    return requirements.filter((req) => req.length > 0);
  };

  const ensureJobCreated = async () => {
    if (isJobCreated && createdJob) {
      return createdJob;
    }

    if (!organizationId) {
      toast.error('Organization not found. Please login again.');
      throw new Error('Organization missing');
    }

    if (!selectedDepartments || selectedDepartments.length === 0) {
      toast.error('Please select at least one department');
      throw new Error('Department missing');
    }

    // Ensure requirements is an array
    const requirementsArray = Array.isArray(parsedData.requirements) 
      ? parsedData.requirements.filter(req => req && req.trim().length > 0)
      : buildRequirementsArray(parsedData.requirements);

    // Use selected company from step 0, not the parsed company
    const companyName = selectedCompanyName || 
      (parsedData.company && parsedData.company !== 'Not specified'
        ? parsedData.company
        : 'Not specified');

    const placeValue =
      parsedData.location && parsedData.location !== 'Not specified'
        ? parsedData.location
        : 'Not specified';

    const salaryValue =
      parsedData.salary && parsedData.salary !== 'Not specified'
        ? parsedData.salary
        : null;

    const jobPayload = {
      name: parsedData.job_title || 'Untitled Job',
      description: parsedData.description || '',
      companyName,
      departmentIds: selectedDepartments.map(d => d._id),
      place: placeValue,
      organizationId,
      requirements: requirementsArray,
    };

    if (salaryValue) {
      jobPayload.salaryRange = salaryValue;
    }

    try {
      const response = await postRequest('/jobs', jobPayload);
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to create job');
      }
      const job = response.data.data;
      setIsJobCreated(true);
      setCreatedJob(job);
      toast.success('Job created successfully!');
      return job;
    } catch (error) {
      console.error('Error creating job:', error);
      const message =
        error.response?.data?.message || error.message || 'Failed to create job';
      toast.error(message);
      throw error;
    }
  };

  const handleExtractSkills = async (e) => {
    e.preventDefault();
    
    if (!parsedData.job_title.trim() || !parsedData.description.trim()) {
      toast.error('Job Title and Description are required to extract skills');
      return;
    }

    if (departments.length > 0 && (!selectedDepartments || selectedDepartments.length === 0)) {
      toast.error('Please select at least one department');
      return;
    }

    setIsLoading(true);
    
    try {
      await ensureJobCreated();
      const result = await extractSkills(parsedData.description);
      
      if (result.success) {
        const skills = result.data;
        setSkillsData(skills);
        setJobName(parsedData.job_title);
        setStep(3);
        toast.success('✨ Skills extracted successfully!');
      } else {
        toast.error(result.error || 'Failed to extract skills');
      }
    } catch (error) {
      console.error('Error extracting skills:', error);
      toast.error('An error occurred while extracting skills');
    } finally {
      setIsLoading(false);
    }
  };

  // Note: Job is not auto-saved to backend
  // The extracted data is displayed and user can manually create the job using "Add New Job Posting"
  // This matches the PHP functionality where jobs are saved to a separate saved_jobs table

  // Download skills as JSON
  const handleDownloadSkills = () => {
    if (!skillsData) return;
    
    const dataStr = JSON.stringify(skillsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${jobName.replace(/[^a-z0-9]/gi, '_')}_skills.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Skills data downloaded!');
  };

  // Save extracted skills as skills
  const saveSkillsAsTopics = async () => {
    const hasSkills = 
      (skillsData?.technical_skills && Array.isArray(skillsData.technical_skills) && skillsData.technical_skills.length > 0) ||
      (skillsData?.tools && Array.isArray(skillsData.tools) && skillsData.tools.length > 0) ||
      (skillsData?.soft_skills && Array.isArray(skillsData.soft_skills) && skillsData.soft_skills.length > 0);

    if (!hasSkills) {
      return; // No skills to save
    }

    if (!isJobCreated || !createdJob?._id) {
      console.warn('Job not created yet, cannot save skills');
      return;
    }

    if (!organizationId) {
      toast.error('Organization not found. Cannot save skills.');
      return;
    }

    setIsLoading(true);
    
    // Combine all skills with their types
    const skillsToCreate = [];
    
    // Add technical skills
    if (skillsData.technical_skills && Array.isArray(skillsData.technical_skills)) {
      skillsData.technical_skills.forEach((skillItem) => {
        skillsToCreate.push({
          name: skillItem.skill,
          description: skillItem.explanation || '',
          type: 'technical',
          organizationId,
          departmentId: selectedDepartments.length > 0 ? selectedDepartments[0]._id : undefined,
          jobId: createdJob._id,
        });
      });
    }

    // Add tools
    if (skillsData.tools && Array.isArray(skillsData.tools)) {
      skillsData.tools.forEach((toolItem) => {
        skillsToCreate.push({
          name: toolItem.skill,
          description: toolItem.explanation || '',
          type: 'tools',
          organizationId,
          departmentId: selectedDepartments.length > 0 ? selectedDepartments[0]._id : undefined,
          jobId: createdJob._id,
        });
      });
    }

    // Add soft skills
    if (skillsData.soft_skills && Array.isArray(skillsData.soft_skills)) {
      skillsData.soft_skills.forEach((skillItem) => {
        skillsToCreate.push({
          name: skillItem.skill,
          description: skillItem.explanation || '',
          type: 'soft',
          organizationId,
          departmentId: selectedDepartments.length > 0 ? selectedDepartments[0]._id : undefined,
          jobId: createdJob._id,
        });
      });
    }

    try {
      // Create all skills in parallel
      const skillPromises = skillsToCreate.map((skillData) =>
        postRequest('/skills', skillData)
      );

      const results = await Promise.allSettled(skillPromises);
      
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      if (successful > 0) {
        toast.success(`Successfully saved ${successful} skill${successful > 1 ? 's' : ''}`);
      }
      
      if (failed > 0) {
        console.error('Some skills failed to save:', results.filter((r) => r.status === 'rejected'));
        toast.error(`Failed to save ${failed} skill${failed > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Error saving skills:', error);
      toast.error('Failed to save skills');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const DepartmentMultiSelect = ({ departments, selectedDepartments, onChange, disabled }) => {
    const handleToggle = (dept) => {
      if (disabled) return;
      const isSelected = selectedDepartments.some(d => d._id === dept._id);
      if (isSelected) {
        onChange(selectedDepartments.filter(d => d._id !== dept._id));
      } else {
        onChange([...selectedDepartments, dept]);
      }
    };

    const handleSelectAll = () => {
      if (disabled) return;
      const allSelected = departments.length === selectedDepartments.length;
      if (allSelected) {
        onChange([]);
      } else {
        onChange([...departments]);
      }
    };

    const allSelected = departments.length > 0 && departments.length === selectedDepartments.length;
    const someSelected = selectedDepartments.length > 0 && selectedDepartments.length < departments.length;

    if (disabled || departments.length === 0) {
      return (
        <div className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg bg-slate-100">
          <span className="text-gray-400 text-sm">
            {disabled ? 'Loading departments...' : 'No departments available'}
          </span>
        </div>
      );
    }

    return (
      <div className="w-full border-2 border-slate-200 rounded-lg bg-white">
        {/* Select All Option */}
        <div
          onClick={handleSelectAll}
          className={`px-4 py-3 border-b border-slate-200 cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors ${
            allSelected ? 'bg-emerald-50' : ''
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
              allSelected 
                ? 'bg-emerald-600 border-emerald-600' 
                : someSelected 
                ? 'bg-emerald-100 border-emerald-600' 
                : 'border-slate-300'
            }`}>
              {allSelected && <i className="fas fa-check text-white text-xs"></i>}
              {someSelected && <i className="fas fa-minus text-emerald-600 text-xs"></i>}
            </div>
            <span className={`font-semibold text-sm ${
              allSelected ? 'text-emerald-700' : 'text-slate-900'
            }`}>
              Select All
            </span>
          </div>
          {allSelected && (
            <span className="text-xs text-emerald-600 font-medium">
              {selectedDepartments.length} selected
            </span>
          )}
        </div>

        {/* Department Grid */}
        <div className="p-4 max-h-60 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {departments.map(dept => {
              const isSelected = selectedDepartments.some(d => d._id === dept._id);
              return (
                <div
                  key={dept._id}
                  onClick={() => handleToggle(dept)}
                  className={`px-4 py-3 cursor-pointer flex items-center gap-3 hover:bg-slate-50 transition-colors rounded-lg border-2 ${
                    isSelected 
                      ? 'bg-emerald-50 border-emerald-300' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                    isSelected 
                      ? 'bg-emerald-600 border-emerald-600' 
                      : 'border-slate-300'
                  }`}>
                    {isSelected && <i className="fas fa-check text-white text-xs"></i>}
                  </div>
                  <span className={`text-sm flex-1 ${
                    isSelected ? 'text-emerald-700 font-medium' : 'text-slate-900'
                  }`}>
                    {dept.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/10 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-magic text-purple-600 text-2xl"></i>
              </div>
              <div className="text-left">
                <h2 className="text-2xl md:text-3xl font-bold text-white">AI Job Parser</h2>
                <p className="text-sm text-purple-100">
                  {step === 0 && 'Select or create a company to add this job to'}
                  {step === 1 && (selectedCompanyName || prefilledCompany
                    ? `Add a new job to ${selectedCompanyName || prefilledCompany}` 
                    : 'Paste job text and let AI extract the details')}
                  {step === 2 && (selectedCompanyName || prefilledCompany
                    ? `Review job details for ${selectedCompanyName || prefilledCompany}`
                    : 'Review extracted details and extract skills')}
                  {step === 3 && 'View extracted skills'}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
              }}
              className="w-10 h-10 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <i className="fas fa-times text-purple-200 hover:text-white text-xl transition-colors"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 0 && (
            <div className="p-6">
              <div className="bg-white rounded-xl p-6 border-2 border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">0</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Select Company</h3>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4 p-1 bg-slate-100 rounded-lg">
                    <button
                      onClick={() => setCompanyMode('existing')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                        companyMode === 'existing'
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-600 hover:text-indigo-600'
                      }`}
                    >
                      Existing Company
                    </button>
                    <button
                      onClick={() => setCompanyMode('new')}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                        companyMode === 'new'
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-600 hover:text-indigo-600'
                      }`}
                    >
                      New Company
                    </button>
                  </div>

                  {companyMode === 'existing' ? (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Select Company <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={selectedCompanyId}
                          onChange={(e) => {
                            const companyId = e.target.value;
                            setSelectedCompanyId(companyId);
                            const selectedComp = companies.find(c => c._id === companyId);
                            if (selectedComp) {
                              setSelectedCompanyName(selectedComp.name);
                            }
                          }}
                          className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none text-slate-900 appearance-none bg-white pr-10"
                          required
                        >
                          <option value="">-- Select a company --</option>
                          {isCompanyLoading ? (
                            <option disabled>Loading companies...</option>
                          ) : companies.length === 0 ? (
                            <option disabled>No companies found</option>
                          ) : (
                            companies.map((company) => (
                              <option key={company._id} value={company._id}>
                                {company.name}
                              </option>
                            ))
                          )}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <i className="fas fa-chevron-down text-slate-400"></i>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Company Name
                      </label>
                      <input
                        type="text"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        placeholder="Enter new company name"
                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none text-slate-900"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleCompanySubmit}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
                  >
                    Save & Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="p-6">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Paste Job Details</h3>
                </div>
                
                <p className="text-sm text-slate-600 mb-4 bg-white rounded-lg p-3 border border-purple-200">
                  <i className="fas fa-info-circle text-purple-600 mr-2"></i>
                  Go to the opened tab, press <kbd className="px-2 py-1 bg-slate-200 rounded text-xs font-mono">Ctrl+A</kbd> then <kbd className="px-2 py-1 bg-slate-200 rounded text-xs font-mono">Ctrl+C</kbd>. Paste everything here.
                </p>

                <form onSubmit={handleParseJob}>
                  <textarea
                    value={fullJobText}
                    onChange={(e) => setFullJobText(e.target.value)}
                    placeholder="Paste the entire job posting text here..."
                    rows={12}
                    className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none text-slate-900 resize-none font-mono text-sm"
                    required
                  />

                  <button
                    type="submit"
                    disabled={!fullJobText.trim() || isLoading}
                    className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin text-xl"></i>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sparkles text-xl"></i>
                        Analyze with AI
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="p-6">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Review & Extract Skills</h3>
                </div>

                <form onSubmit={handleExtractSkills} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={parsedData.job_title}
                      onChange={(e) => setParsedData({ ...parsedData, job_title: e.target.value })}
                      placeholder="Will be auto-filled..."
                      className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none text-slate-900"
                      required
                    />
                  </div>

                  {/* Company Field - Always show selected company from step 0 */}
                  {selectedCompanyName || prefilledCompany ? (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Company <span className="text-xs text-emerald-600 font-normal ml-2"><i className="fas fa-lock mr-1"></i>Selected</span>
                      </label>
                      <div className="w-full px-4 py-2.5 border-2 border-emerald-200 rounded-lg bg-emerald-50 text-slate-900 flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {(selectedCompanyName || prefilledCompany).charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{selectedCompanyName || prefilledCompany}</span>
                      </div>
                    </div>
                  ) : (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={parsedData.company}
                      onChange={(e) => setParsedData({ ...parsedData, company: e.target.value })}
                      placeholder="Will be auto-filled..."
                      className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none text-slate-900"
                    />
                  </div>
                  )}

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={parsedData.description}
                      onChange={(e) => setParsedData({ ...parsedData, description: e.target.value })}
                      placeholder="Will be auto-filled..."
                      rows={4}
                      className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none text-slate-900 resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Requirements
                    </label>
                    <div className="space-y-2 max-h-60 overflow-y-auto border-2 border-slate-200 rounded-lg p-3 bg-slate-50">
                      {Array.isArray(parsedData.requirements) && parsedData.requirements.length > 0 ? (
                        parsedData.requirements.map((req, index) => (
                          <div key={index} className="flex items-start gap-2 bg-white p-2 rounded border border-slate-200">
                            <span className="text-emerald-600 mt-0.5 flex-shrink-0">•</span>
                            <input
                              type="text"
                              value={req}
                              onChange={(e) => {
                                const newRequirements = [...parsedData.requirements];
                                newRequirements[index] = e.target.value;
                                setParsedData({ ...parsedData, requirements: newRequirements });
                              }}
                              className="flex-1 text-sm text-slate-900 bg-transparent border-none outline-none"
                              placeholder="Requirement point"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newRequirements = parsedData.requirements.filter((_, i) => i !== index);
                                setParsedData({ ...parsedData, requirements: newRequirements });
                              }}
                              className="text-red-500 hover:text-red-700 flex-shrink-0"
                              title="Remove requirement"
                            >
                              <i className="fas fa-times text-xs"></i>
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500 italic text-center py-2">No requirements parsed yet</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setParsedData({ 
                          ...parsedData, 
                          requirements: [...(parsedData.requirements || []), ''] 
                        });
                      }}
                      className="mt-2 px-3 py-1.5 text-sm bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <i className="fas fa-plus text-xs"></i>
                      Add Requirement Point
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Salary
                      </label>
                      <input
                        type="text"
                        value={parsedData.salary}
                        onChange={(e) => setParsedData({ ...parsedData, salary: e.target.value })}
                        placeholder="Auto-filled"
                        className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={parsedData.location}
                        onChange={(e) => setParsedData({ ...parsedData, location: e.target.value })}
                        placeholder="Auto-filled"
                        className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Job Type
                    </label>
                    <select
                      value={parsedData.job_type}
                      onChange={(e) => setParsedData({ ...parsedData, job_type: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none text-slate-900"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Internship">Internship</option>
                      <option value="Not specified">Not specified</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Departments {departments.length > 0 && <span className="text-red-500">*</span>}
                    </label>
                    {organizationId ? (
                      <DepartmentMultiSelect 
                        departments={departments} 
                        selectedDepartments={selectedDepartments} 
                        onChange={setSelectedDepartments}
                        disabled={isDeptLoading || departments.length === 0}
                      />
                    ) : (
                      <p className="text-sm text-slate-600">
                        Organization not available. Department selection is disabled.
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-4 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <i className="fas fa-spinner fa-spin text-xl"></i>
                        Extracting Skills...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sparkles text-xl"></i>
                        Extract Skills
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {step === 3 && skillsData && (
            <div className="p-6">
              <div className="results-header mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                  Extracted Skills for "{jobName}"
                </h2>
                <button
                  onClick={handleDownloadSkills}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-download"></i>
                  Download Results
                </button>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-slate-900 mb-2">Educational Qualifications</h4>
                  <p className="text-slate-700">{skillsData.education || 'Not specified'}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200">
                  <h4 className="font-semibold text-slate-900 mb-2">Departments</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDepartments.length > 0 ? (
                      selectedDepartments.map(dept => (
                        <span key={dept._id} className="bg-white bg-opacity-50 px-2 py-1 rounded-md text-sm text-emerald-800 border border-emerald-100">
                          {dept.name}
                        </span>
                      ))
                    ) : (
                      <p className="text-slate-700">Not selected</p>
                    )}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200 col-span-1 md:col-span-2">
                      <h4 className="font-semibold text-slate-900 mb-2">Requirements</h4>
                      {Array.isArray(parsedData.requirements) && parsedData.requirements.length > 0
                        ? parsedData.requirements
                            .filter(req => req && req.trim().length > 0)
                            .map((req, index) => (
                              <p key={index} className="text-slate-700 text-sm flex items-start gap-2">
                                <span className="text-amber-600 mt-1">•</span>
                                <span>{req}</span>
                              </p>
                            ))
                        : <p className="text-slate-600 text-sm">Not specified</p>}
                    </div>
              </div>

              {/* Technical Skills */}
              {skillsData.technical_skills && skillsData.technical_skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <i className="fas fa-code text-indigo-600"></i>
                    Technical Skills
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {skillsData.technical_skills.map((skillItem, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl p-4 hover:border-indigo-400 transition-all"
                      >
                        <h4 className="font-semibold text-slate-900 mb-2">{skillItem.skill}</h4>
                        <p className="text-sm text-slate-600">{skillItem.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tools */}
              {skillsData.tools && Array.isArray(skillsData.tools) && skillsData.tools.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <i className="fas fa-tools text-purple-600"></i>
                    Tools & Software
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {skillsData.tools.map((toolItem, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 hover:border-purple-400 transition-all"
                      >
                        <h4 className="font-semibold text-slate-900 mb-2">{toolItem.skill}</h4>
                        <p className="text-sm text-slate-600">{toolItem.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Soft Skills */}
              {skillsData.soft_skills && Array.isArray(skillsData.soft_skills) && skillsData.soft_skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <i className="fas fa-users text-emerald-600"></i>
                    Soft Skills
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {skillsData.soft_skills.map((skillItem, index) => (
                      <div
                        key={index}
                        className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-4 hover:border-emerald-400 transition-all"
                      >
                        <h4 className="font-semibold text-slate-900 mb-2">{skillItem.skill}</h4>
                        <p className="text-sm text-slate-600">{skillItem.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={async () => {
                    await saveSkillsAsTopics();
                    setStep(1);
                    setFullJobText('');
                    setSkillsData(null);
                    setIsJobCreated(false);
                    setCreatedJob(null);
                  }}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Parse Another Job
                </button>
                <button
                  onClick={async () => {
                    await saveSkillsAsTopics();
                    onClose();
                  }}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobParserModal;

