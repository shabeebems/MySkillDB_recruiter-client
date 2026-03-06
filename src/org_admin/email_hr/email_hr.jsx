import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import OrgMenuNavigation from '../../components/org-admin/org-admin-menu_components/OrgMenuNavigation';
import { toast } from 'react-hot-toast';
import { getRequest, postRequest } from '../../api/apiRequests';

// Get base URL from environment variable
const BASE_URL = import.meta.env.VITE_CLIENT_URL || 'http://localhost';

const EmailHR = () => {
  const [currentPage, setCurrentPage] = useState('email-hr');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showNewEmailModal, setShowNewEmailModal] = useState(false);
  const [showGeneratedEmail, setShowGeneratedEmail] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    destination: '',
    department: '',
    job: ''
  });
  const [generatedEmailContent, setGeneratedEmailContent] = useState('');
  const [generatedEmailSubject, setGeneratedEmailSubject] = useState('');
  const [departments, setDepartments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emails, setEmails] = useState([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  
  const organization = useSelector((state) => state.organization);
  const user = useSelector((state) => state.user);
  const collegeName = organization?.name || 'ABC College';

  // Fetch departments from API
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!organization?._id) return;
      
      setIsLoadingDepartments(true);
      try {
        const response = await getRequest(`/organization-setup/departments/${organization._id}`);
        if (response.data?.success && response.data?.data) {
          setDepartments(response.data.data);
        } else {
          setDepartments([]);
          toast.error('No departments found');
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        setDepartments([]);
        toast.error('Failed to fetch departments');
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [organization?._id]);

  // Fetch jobs when department is selected
  useEffect(() => {
    const fetchJobs = async () => {
      if (!organization?._id || !formData.department) {
        setJobs([]);
        return;
      }

      setIsLoadingJobs(true);
      try {
        const response = await getRequest(
          `/jobs/departments/${organization._id}/${formData.department}`
        );
        if (response.data?.success && response.data?.data) {
          // Map API jobs to simple job names for the dropdown
          const jobNames = (response.data.data || []).map(job => ({
            _id: job._id,
            name: job.name || job.title || job.jobTitle
          }));
          setJobs(jobNames);
        } else {
          setJobs([]);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
        setJobs([]);
        toast.error('Failed to fetch jobs for this department');
      } finally {
        setIsLoadingJobs(false);
      }
    };

    fetchJobs();
  }, [organization?._id, formData.department]);

  // Get filtered jobs based on selected department
  const getFilteredJobs = () => {
    return jobs;
  };

  // Fetch email HR records from API
  const fetchEmails = async () => {
    if (!organization?._id) return;

    setIsLoadingEmails(true);
    try {
      const response = await getRequest('/email-hr');
      if (response.data?.success && response.data?.data) {
        // Transform API data to match UI structure
        const transformedEmails = response.data.data.map((email) => {
          const createdAt = new Date(email.createdAt);
          const dateStr = createdAt.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
          });
          const timeStr = createdAt.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });

          const jobName = email.jobId?.name || email.jobId?.title || 'Unknown Job';
          const orgName = organization?.name || collegeName || 'ABC College';
          const subject = `Students Applied for ${jobName} Position - View CV Details`;
          const content = `Dear ${email.name},

There are several students who have applied for the ${jobName} position from our college. You can view the students' CV details by clicking on the following link:

${BASE_URL}/email_hr/${email._id}

Please review the applications at your earliest convenience.

Best regards,
Admin Team
${orgName}`;

          return {
            id: email._id,
            _id: email._id,
            subject: subject,
            content: content,
            from: email.email,
            fromName: email.name,
            date: dateStr,
            time: timeStr,
            body: `Email sent to ${email.name} (${email.email}) regarding ${jobName} position at ${email.companyName}.\n\nDestination: ${email.destination}\n\nView details: ${BASE_URL}/email_hr/${email._id}`,
            attachments: [],
            companyName: email.companyName,
            destination: email.destination,
            jobId: email.jobId?._id || email.jobId,
            jobName: jobName
          };
        });
        setEmails(transformedEmails);
      } else {
        setEmails([]);
      }
    } catch (error) {
      console.error('Error fetching email HR records:', error);
      setEmails([]);
      toast.error('Failed to fetch email HR records');
    } finally {
      setIsLoadingEmails(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [organization?._id, collegeName]);

  const handlePageChange = (pageId) => {
    setCurrentPage(pageId);
  };

  const handleEmailClick = (email) => {
    setSelectedEmail(email);
  };

  const handleBackToList = () => {
    setSelectedEmail(null);
  };

  const handleOpenNewEmailModal = () => {
    setShowNewEmailModal(true);
    setShowGeneratedEmail(false);
    setFormData({
      name: '',
      email: '',
      company: '',
      destination: '',
      department: '',
      job: ''
    });
  };

  const handleCloseNewEmailModal = () => {
    setShowNewEmailModal(false);
    setShowGeneratedEmail(false);
    setFormData({
      name: '',
      email: '',
      company: '',
      destination: '',
      department: '',
      job: ''
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      // If department changes, reset job selection
      if (name === 'department') {
        return {
          ...prev,
          department: value,
          job: ''
        };
      }
      return {
        ...prev,
        [name]: value
      };
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.company || !formData.destination || !formData.department || !formData.job) {
      toast.error('Please fill in all fields');
      return;
    }

    // Find the selected job to get its ID and name
    const selectedJob = jobs.find(job => job.name === formData.job);
    if (!selectedJob) {
      toast.error('Selected job not found');
      return;
    }

    const jobId = selectedJob._id;
    const jobName = selectedJob.name;

    // Save to database
    setIsSubmitting(true);
    try {
      const response = await postRequest('/email-hr', {
        name: formData.name,
        email: formData.email,
        companyName: formData.company,
        destination: formData.destination,
        jobId: jobId
      });
      if (response.data?.success) {
        console.log("Email HR record created successfully", response.data.data);
        const emailHrId = response.data.data._id;
        
        // Generate email subject
        const emailSubject = `Students Applied for ${jobName} Position - View CV Details`;

        // Generate email content with the email HR record ID
        const emailContent = `Dear ${formData.name},

There are several students who have applied for the ${jobName} position from our college. You can view the students' CV details by clicking on the following link:

${BASE_URL}/email_hr/${emailHrId}

Please review the applications at your earliest convenience.

Best regards,
Admin Team
${collegeName}`;

        toast.success('Email HR record created successfully');
        setGeneratedEmailSubject(emailSubject);
        setGeneratedEmailContent(emailContent);
        setShowGeneratedEmail(true);
        // Refresh email list
        fetchEmails();
      } else {
        toast.error(response.data?.message || 'Failed to create email HR record');
      }
    } catch (error) {
      console.error('Error creating email HR record:', error);
      toast.error(error.response?.data?.message || 'Failed to create email HR record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySubject = () => {
    navigator.clipboard.writeText(generatedEmailSubject);
    toast.success('Email subject copied to clipboard!');
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(generatedEmailContent);
    toast.success('Email content copied to clipboard!');
  };

  const handleCopyEmailSubject = (subject) => {
    navigator.clipboard.writeText(subject);
    toast.success('Email subject copied to clipboard!');
  };

  const handleCopyEmailContent = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Email content copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <OrgMenuNavigation currentPage={currentPage} onPageChange={handlePageChange} />
      
      <div className="lg:ml-72 pt-14 lg:pt-0">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <header className="sticky top-14 lg:top-0 z-40 backdrop-blur-md bg-neutral-50/80 border-b border-neutral-200/50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 lg:py-5 mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-neutral-900 mb-1.5 sm:mb-2 flex items-center gap-3 tracking-tight">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
                    <i className="fas fa-envelope text-white text-base sm:text-xl"></i>
                  </div>
                  Email HR
                </h1>
                <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                  Manage and view HR-related emails from job applicants
                </p>
              </div>
              <div className="flex justify-end sm:justify-start">
                <button 
                  onClick={handleOpenNewEmailModal}
                  className="px-5 py-2.5 sm:py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] text-sm sm:text-base flex items-center gap-2"
                >
                  <i className="fas fa-plus"></i>
                  <span className="hidden sm:inline">New Email</span>
                  <span className="sm:hidden">New</span>
                </button>
              </div>
            </div>
          </header>

          {selectedEmail ? (
            /* Email Detail View */
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5">
              <div className="p-4 sm:p-6 lg:p-8">
                <button
                  onClick={handleBackToList}
                  className="mb-6 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors active:scale-95"
                >
                  <i className="fas fa-arrow-left"></i>
                  Back to Inbox
                </button>

                <div className="border-b border-neutral-200 pb-4 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm text-neutral-600">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-700">To:</span>
                      <span>{selectedEmail.fromName} &lt;{selectedEmail.from}&gt;</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-neutral-700">Date:</span>
                      <span>{selectedEmail.date} at {selectedEmail.time}</span>
                    </div>
                  </div>
                </div>

                {/* Subject Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-neutral-700">Subject</label>
                    <button
                      onClick={() => handleCopyEmailSubject(selectedEmail.subject)}
                      className="px-3 py-1.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all duration-200 text-xs shadow-sm hover:shadow-md active:scale-95 flex items-center gap-1.5"
                    >
                      <i className="fas fa-copy"></i>
                      Copy
                    </button>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                    <p className="text-sm text-neutral-900 font-sans">
                      {selectedEmail.subject}
                    </p>
                  </div>
                </div>

                {/* Content Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-neutral-700">Content</label>
                    <button
                      onClick={() => {
                        const contentToCopy = selectedEmail.content || (() => {
                          const jobName = selectedEmail.jobName || 'Unknown Job';
                          const orgName = organization?.name || collegeName || 'ABC College';
                          return `Dear ${selectedEmail.fromName},

There are several students who have applied for the ${jobName} position from our college. You can view the students' CV details by clicking on the following link:

${BASE_URL}/email_hr/${selectedEmail._id}

Please review the applications at your earliest convenience.

Best regards,
Admin Team
${orgName}`;
                        })();
                        handleCopyEmailContent(contentToCopy);
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all duration-200 text-xs shadow-sm hover:shadow-md active:scale-95 flex items-center gap-1.5"
                    >
                      <i className="fas fa-copy"></i>
                      Copy
                    </button>
                  </div>
                  <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                    <pre className="whitespace-pre-wrap text-sm text-neutral-900 font-sans leading-relaxed">
                      {selectedEmail.content || (() => {
                        const jobName = selectedEmail.jobName || 'Unknown Job';
                        const orgName = organization?.name || collegeName || 'ABC College';
                        return `Dear ${selectedEmail.fromName},

There are several students who have applied for the ${jobName} position from our college. You can view the students' CV details by clicking on the following link:

${BASE_URL}/email_hr/${selectedEmail._id}

Please review the applications at your earliest convenience.

Best regards,
Admin Team
${orgName}`;
                      })()}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Email List View */
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
              <div className="divide-y divide-neutral-200">
                {isLoadingEmails ? (
                  <div className="p-12 text-center">
                    <div className="w-8 h-8 border-2 border-neutral-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-neutral-600">Loading emails...</p>
                  </div>
                ) : emails.length > 0 ? (
                  emails.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => handleEmailClick(email)}
                      className="p-4 sm:p-5 cursor-pointer hover:bg-neutral-50/50 transition-colors active:scale-[0.998]"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm sm:text-base shadow-sm flex-shrink-0">
                          {email.fromName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1.5">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm sm:text-base font-semibold mb-1 text-neutral-900">
                                {email.fromName}
                              </h3>
                              <p className="text-sm text-neutral-600 mb-1 line-clamp-2">
                                {email.subject}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-neutral-500 whitespace-nowrap">
                                {email.date}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-neutral-500 truncate">
                            {email.from}
                          </p>
                          {email.attachments && email.attachments.length > 0 && (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-400">
                              <i className="fas fa-paperclip"></i>
                              <span>{email.attachments.length} attachment(s)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-inbox text-neutral-400 text-3xl"></i>
                    </div>
                    <p className="text-sm lg:text-base text-neutral-500">No emails available.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Email Modal */}
      {showNewEmailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 pt-16 sm:pt-4 overflow-y-auto">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-xl max-w-2xl w-full max-h-[calc(100vh-4rem)] sm:max-h-[90vh] overflow-y-auto ring-1 ring-black/5 mt-auto sm:mt-0 mb-0 sm:mb-0">
            <div className="sticky top-0 bg-white border-b border-neutral-200/50 px-5 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-3 sm:pb-4 z-10 rounded-t-3xl sm:rounded-t-2xl">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-neutral-900 flex items-center gap-2 sm:gap-3 tracking-tight">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 rounded-xl flex items-center justify-center ring-1 ring-blue-200/50 flex-shrink-0">
                    <i className="fas fa-envelope text-blue-600 text-xs sm:text-sm"></i>
                  </div>
                  <span className="truncate">Create New Email</span>
                </h2>
                <button
                  onClick={handleCloseNewEmailModal}
                  className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-all active:scale-95 flex-shrink-0"
                  aria-label="Close modal"
                >
                  <i className="fas fa-times text-base sm:text-sm"></i>
                </button>
              </div>
            </div>
            <div className="p-5 sm:p-6 lg:p-8">

              {!showGeneratedEmail ? (
                <form onSubmit={handleFormSubmit}>
                  <div className="space-y-4 sm:space-y-5">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        placeholder="Enter recipient name"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-neutral-900 placeholder-neutral-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        placeholder="Enter email address"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-neutral-900 placeholder-neutral-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
                        Company <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleFormChange}
                        placeholder="Enter company name"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-neutral-900 placeholder-neutral-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-2">
                        Destination <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="destination"
                        value={formData.destination}
                        onChange={handleFormChange}
                        placeholder="Enter destination"
                        className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-neutral-900 placeholder-neutral-400"
                        required
                      />
                    </div>

                    <div className="bg-neutral-50 rounded-xl p-4 sm:p-5 border border-neutral-200">
                      <label className="block text-xs sm:text-sm font-medium text-neutral-700 mb-3">
                        Job Selection <span className="text-red-500">*</span>
                        <span className="block text-xs font-normal text-neutral-500 mt-1.5">
                          Select department first to enable job selection
                        </span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-2">
                            Filter by Department
                          </label>
                          <select
                            name="department"
                            value={formData.department}
                            onChange={handleFormChange}
                            disabled={isLoadingDepartments}
                            className={`w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                              isLoadingDepartments ? 'bg-neutral-100 cursor-not-allowed text-neutral-400' : 'bg-white text-neutral-900'
                            }`}
                            required
                          >
                            <option value="">
                              {isLoadingDepartments ? 'Loading departments...' : 'Select a department'}
                            </option>
                            {departments.map((dept) => (
                              <option key={dept._id} value={dept._id}>
                                {dept.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-2">
                            Select Job <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="job"
                            value={formData.job}
                            onChange={handleFormChange}
                            disabled={!formData.department || isLoadingJobs}
                            className={`w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ${
                              !formData.department || isLoadingJobs ? 'bg-neutral-100 cursor-not-allowed text-neutral-400' : 'bg-white text-neutral-900'
                            }`}
                            required
                          >
                            <option value="">
                              {isLoadingJobs 
                                ? 'Loading jobs...' 
                                : formData.department 
                                  ? 'Select a job position' 
                                  : 'Select department first'}
                            </option>
                            {getFilteredJobs().map((job) => (
                              <option key={job._id} value={job.name}>
                                {job.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`flex-1 px-5 py-3 bg-blue-600 text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] ${
                        isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-700'
                      }`}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating...
                        </span>
                      ) : (
                        'Generate Email'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseNewEmailModal}
                      className="px-5 py-3 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200 transition-all duration-200 active:scale-[0.98]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-6 tracking-tight">Generated Email</h3>
                  
                  {/* Subject Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-neutral-700">Subject</label>
                      <button
                        onClick={handleCopySubject}
                        className="px-3 py-1.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all duration-200 text-xs shadow-sm hover:shadow-md active:scale-95 flex items-center gap-1.5"
                      >
                        <i className="fas fa-copy"></i>
                        Copy
                      </button>
                    </div>
                    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                      <p className="text-sm text-neutral-900 font-sans">
                        {generatedEmailSubject}
                      </p>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-neutral-700">Content</label>
                      <button
                        onClick={handleCopyContent}
                        className="px-3 py-1.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all duration-200 text-xs shadow-sm hover:shadow-md active:scale-95 flex items-center gap-1.5"
                      >
                        <i className="fas fa-copy"></i>
                        Copy
                      </button>
                    </div>
                    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                      <pre className="whitespace-pre-wrap text-sm text-neutral-900 font-sans leading-relaxed">
                        {generatedEmailContent}
                      </pre>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setShowGeneratedEmail(false);
                        setFormData({
                          name: '',
                          email: '',
                          company: '',
                          destination: '',
                          department: '',
                          job: ''
                        });
                      }}
                      className="flex-1 px-5 py-3 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200 transition-all duration-200 active:scale-[0.98]"
                    >
                      Create Another
                    </button>
                    <button
                      onClick={handleCloseNewEmailModal}
                      className="flex-1 px-5 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailHR;

