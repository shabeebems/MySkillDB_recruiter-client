import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { getRequest, postRequest, deleteRequest } from '../../../api/apiRequests';

const CertificatesList = () => {
  const user = useSelector((state) => state.user);
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add certificate modal states
  const [showAddCertificateModal, setShowAddCertificateModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [certificateTitle, setCertificateTitle] = useState('');
  const [certificateLink, setCertificateLink] = useState('');
  const [certificateProvider, setCertificateProvider] = useState('drive'); // 'drive' or 'dropbox'
  
  // Job/Skill selection states
  const [plannerJobs, setPlannerJobs] = useState([]);
  const [jobSkills, setJobSkills] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [showJobSelection, setShowJobSelection] = useState(false);
  
  // Delete confirmation state
  const [certificateToDelete, setCertificateToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user?._id) {
      fetchCertificates();
    }
  }, [user?._id]);

  const fetchCertificates = async () => {
    try {
      setIsLoading(true);
      const response = await getRequest('/certificates/student/all');
      if (response.data?.success && response.data?.data) {
        setCertificates(response.data.data || []);
      } else {
        setCertificates([]);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setCertificates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch interview planner jobs
  const fetchPlannerJobs = async () => {
    try {
      setIsLoadingJobs(true);
      const response = await getRequest('/interview-planner');
      if (response.data?.success && response.data?.data) {
        const plannerEntries = response.data.data;
        const jobs = plannerEntries.map((plannerEntry) => {
          const jobId = plannerEntry.jobId?._id || plannerEntry.jobId;
          const jobData = plannerEntry.jobId || {};
          return {
            _id: jobId,
            jobId: jobId,
            interviewPlannerId: plannerEntry._id,
            title: jobData.name || 'Job Title',
            company: jobData.companyName || 'Company',
          };
        });
        setPlannerJobs(jobs);
      } else {
        setPlannerJobs([]);
      }
    } catch (error) {
      console.error('Error fetching planner jobs:', error);
      toast.error('Failed to load jobs');
      setPlannerJobs([]);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Handle job selection
  const handleJobSelect = async (job) => {
    setSelectedJob(job);
    setSelectedSkill(null);
    setJobSkills([]);
    
    if (!job._id) {
      toast.error('Invalid job selected');
      return;
    }

    try {
      setIsLoadingSkills(true);
      const response = await getRequest(`/skills/job/${job._id}`);
      if (response.data?.success && response.data?.data) {
        setJobSkills(response.data.data || []);
      } else {
        setJobSkills([]);
        toast.error('No skills found for this job');
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
      toast.error('Failed to load skills');
      setJobSkills([]);
    } finally {
      setIsLoadingSkills(false);
    }
  };

  // Handle opening add certificate modal
  const handleOpenAddCertificate = async () => {
    setShowJobSelection(true);
    setSelectedJob(null);
    setSelectedSkill(null);
    setJobSkills([]);
    setCertificateTitle('');
    setCertificateLink('');
    setCertificateProvider('drive');
    await fetchPlannerJobs();
  };

  // Handle skill selection for adding certificate
  const handleSkillSelectForCertificate = (job, skill) => {
    setSelectedJob(job);
    setSelectedSkill(skill);
    setShowJobSelection(false);
    setShowAddCertificateModal(true);
  };

  // Handle save certificate
  const handleSaveCertificate = async () => {
    if (!certificateTitle.trim() || !certificateLink.trim()) {
      toast.error('Please enter certificate title and link');
      return;
    }

    // Basic URL validation
    try {
      new URL(certificateLink);
    } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    const skillId = selectedSkill?._id || selectedSkill?.id;
    if (!selectedJob?._id || !skillId || !selectedJob?.interviewPlannerId) {
      toast.error('Missing job or skill information');
      return;
    }

    // Convert 'drive' to 'google drive' for API
    const storageProvider = certificateProvider === 'drive' ? 'google drive' : 'dropbox';

    try {
      const response = await postRequest('/certificates', {
        jobId: selectedJob._id,
        skillId: skillId,
        interviewPlannerId: selectedJob.interviewPlannerId,
        title: certificateTitle.trim(),
        link: certificateLink.trim(),
        storageProvider: storageProvider
      });

      if (response.data?.success) {
        toast.success('Certificate added successfully!');
        // Reset form
        setShowAddCertificateModal(false);
        setSelectedJob(null);
        setSelectedSkill(null);
        setCertificateTitle('');
        setCertificateLink('');
        setCertificateProvider('drive');
        // Refresh certificates list
        await fetchCertificates();
      } else {
        toast.error(response.data?.message || 'Failed to add certificate');
      }
    } catch (error) {
      console.error('Error adding certificate:', error);
      toast.error(error.response?.data?.message || 'Failed to add certificate');
    }
  };

  // Handle delete certificate
  const handleDeleteCertificate = async (certificate) => {
    if (!certificate?._id) {
      toast.error('Invalid certificate');
      return;
    }

    try {
      setIsDeleting(true);
      const response = await deleteRequest(`/certificates/${certificate._id}`);
      
      if (response.data?.success) {
        toast.success('Certificate deleted successfully!');
        setCertificateToDelete(null);
        // Refresh certificates list
        await fetchCertificates();
      } else {
        toast.error(response.data?.message || 'Failed to delete certificate');
      }
    } catch (error) {
      console.error('Error deleting certificate:', error);
      toast.error(error.response?.data?.message || 'Failed to delete certificate');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenCertificate = (link) => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-green-50 to-emerald-50">
          <i className="fas fa-spinner fa-spin text-2xl text-green-600"></i>
        </div>
        <p className="text-sm font-medium text-slate-700">Loading certificates...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">My Certificates</h2>
            <p className="text-xs sm:text-sm text-slate-600">All certificates across all jobs and skills</p>
          </div>
          <button
            onClick={handleOpenAddCertificate}
            className="px-4 py-2.5 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
          >
            <i className="fas fa-plus"></i>
            <span className="sm:inline">Add Certificate</span>
          </button>
        </div>
      </div>

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <div className="text-center py-12 sm:py-16 px-4">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-4 rounded-full bg-gradient-to-br from-green-50 to-emerald-50">
            <i className="fas fa-certificate text-3xl sm:text-4xl text-green-400"></i>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">No Certificates Yet</h3>
          <p className="text-sm sm:text-base text-slate-600 mb-6 max-w-md mx-auto">
            Add certificates to showcase your achievements and skills
          </p>
          <button
            onClick={handleOpenAddCertificate}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mx-auto text-sm sm:text-base"
          >
            <i className="fas fa-plus text-lg"></i>
            Add Your First Certificate
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificates.map((certificate) => (
            <div
              key={certificate._id}
              className="bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-semibold text-sm sm:text-base text-slate-900 mb-2 line-clamp-2">
                      {certificate.title || 'Untitled Certificate'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-slate-500 mb-2">
                      {certificate.jobId?.name && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {certificate.jobId.name}
                        </span>
                      )}
                      {certificate.skillId?.name && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {certificate.skillId.name}
                        </span>
                      )}
                    </div>
                    {certificate.storageProvider && (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <i className={`fab ${certificate.storageProvider === 'google drive' ? 'fa-google-drive' : 'fa-dropbox'}`}></i>
                        <span className="capitalize">{certificate.storageProvider}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCertificateToDelete(certificate);
                    }}
                    className="ml-2 p-1.5 sm:p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors touch-manipulation flex-shrink-0"
                    title="Delete certificate"
                  >
                    <i className="fas fa-trash text-xs sm:text-sm"></i>
                  </button>
                </div>

                {certificate.createdAt && (
                  <div className="text-xs text-slate-500 mb-3">
                    <i className="fas fa-calendar mr-1"></i>
                    {new Date(certificate.createdAt).toLocaleDateString()}
                  </div>
                )}

                {certificate.link && (
                  <button
                    onClick={() => handleOpenCertificate(certificate.link)}
                    className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-external-link-alt text-xs"></i>
                    Open Certificate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {certificateToDelete && (
        <>
          <div 
            className="fixed inset-0 bg-white/10 backdrop-blur-md z-[9998]"
            onClick={() => setCertificateToDelete(null)}
          ></div>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">Delete Certificate?</h3>
                    <p className="text-sm text-slate-600 mt-1">This action cannot be undone.</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-slate-700 font-medium mb-1">Certificate:</p>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {certificateToDelete.title || 'Untitled Certificate'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setCertificateToDelete(null)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteCertificate(certificateToDelete)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-trash"></i>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Job/Skill Selection Modal */}
      {showJobSelection && (
        <>
          <div 
            className="fixed inset-0 bg-white/10 backdrop-blur-md z-[9998]"
            onClick={() => {
              setShowJobSelection(false);
              setSelectedJob(null);
              setSelectedSkill(null);
              setJobSkills([]);
            }}
          ></div>

          <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-4xl w-full min-h-[90vh] sm:min-h-0 sm:my-8 max-h-[90vh] sm:max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 sm:px-6 py-4 sm:py-4 rounded-t-3xl sm:rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-certificate text-base sm:text-xl text-white"></i>
                  </div>
                  <h2 className="text-base sm:text-xl font-bold">Select Job & Skill</h2>
                </div>
                <button
                  onClick={() => {
                    setShowJobSelection(false);
                    setSelectedJob(null);
                    setSelectedSkill(null);
                    setJobSkills([]);
                  }}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 active:bg-opacity-40 flex items-center justify-center transition-colors touch-manipulation flex-shrink-0"
                >
                  <i className="fas fa-times text-sm sm:text-base text-white"></i>
                </button>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
                {/* Job Selection */}
                {!selectedJob && (
                  <div>
                    <label className="block text-sm sm:text-base font-semibold text-slate-700 mb-3">
                      Select a Job <span className="text-red-500">*</span>
                    </label>
                    {isLoadingJobs ? (
                      <div className="text-center py-8 sm:py-12">
                        <i className="fas fa-spinner fa-spin text-2xl sm:text-3xl text-slate-400"></i>
                        <p className="text-sm sm:text-base text-slate-600 mt-2">Loading jobs...</p>
                      </div>
                    ) : plannerJobs.length === 0 ? (
                      <div className="text-center py-8 sm:py-12 border border-slate-200 rounded-lg px-4">
                        <i className="fas fa-briefcase text-3xl sm:text-4xl text-slate-300 mb-2"></i>
                        <p className="text-sm sm:text-base text-slate-600">No jobs in your interview planner</p>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">Add jobs from Interview Planner first</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 max-h-[50vh] sm:max-h-64 overflow-y-auto -mx-1 px-1">
                        {plannerJobs.map((job) => (
                          <button
                            key={job._id}
                            onClick={() => handleJobSelect(job)}
                            className="p-3.5 sm:p-4 border-2 border-slate-200 hover:border-green-500 active:border-green-600 rounded-lg text-left transition-all hover:bg-green-50 active:bg-green-100 touch-manipulation"
                          >
                            <h3 className="font-semibold text-sm sm:text-base text-slate-900 mb-1">{job.title}</h3>
                            <p className="text-xs sm:text-sm text-slate-600">{job.company}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Skill Selection */}
                {selectedJob && !selectedSkill && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm sm:text-base font-semibold text-slate-700">
                        Select a Skill <span className="text-red-500">*</span>
                      </label>
                      <button
                        onClick={() => {
                          setSelectedJob(null);
                          setJobSkills([]);
                        }}
                        className="text-xs sm:text-sm text-green-600 hover:text-green-700 active:text-green-800 flex items-center gap-1 touch-manipulation px-2 py-1"
                      >
                        <i className="fas fa-arrow-left text-xs"></i>
                        <span className="hidden sm:inline">Change Job</span>
                        <span className="sm:hidden">Back</span>
                      </button>
                    </div>
                    {isLoadingSkills ? (
                      <div className="text-center py-8 sm:py-12">
                        <i className="fas fa-spinner fa-spin text-2xl sm:text-3xl text-slate-400"></i>
                        <p className="text-sm sm:text-base text-slate-600 mt-2">Loading skills...</p>
                      </div>
                    ) : jobSkills.length === 0 ? (
                      <div className="text-center py-8 sm:py-12 border border-slate-200 rounded-lg px-4">
                        <i className="fas fa-list-check text-3xl sm:text-4xl text-slate-300 mb-2"></i>
                        <p className="text-sm sm:text-base text-slate-600">No skills found for this job</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 max-h-[50vh] sm:max-h-64 overflow-y-auto -mx-1 px-1">
                        {jobSkills.map((skill) => (
                          <button
                            key={skill._id || skill.id}
                            onClick={() => handleSkillSelectForCertificate(selectedJob, skill)}
                            className="p-3.5 sm:p-4 border-2 border-slate-200 hover:border-green-500 active:border-green-600 rounded-lg text-left transition-all hover:bg-green-50 active:bg-green-100 touch-manipulation"
                          >
                            <h3 className="font-semibold text-sm sm:text-base text-slate-900 mb-1">{skill.name || skill.title}</h3>
                            {skill.description && (
                              <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2">{skill.description}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Certificate Modal */}
      {showAddCertificateModal && selectedJob && selectedSkill && (
        <>
          <div 
            className="fixed inset-0 bg-white/10 backdrop-blur-md z-[9998]"
            onClick={() => {
              setShowAddCertificateModal(false);
              setSelectedJob(null);
              setSelectedSkill(null);
              setCertificateTitle('');
              setCertificateLink('');
              setCertificateProvider('drive');
            }}
          ></div>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Add Certificate</h3>
                    <p className="text-sm text-slate-600">{selectedSkill?.name || selectedSkill?.title || 'Skill'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddCertificateModal(false);
                      setSelectedJob(null);
                      setSelectedSkill(null);
                      setCertificateTitle('');
                      setCertificateLink('');
                      setCertificateProvider('drive');
                    }}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Certificate Title *
                  </label>
                  <input
                    type="text"
                    value={certificateTitle}
                    onChange={(e) => setCertificateTitle(e.target.value)}
                    placeholder="e.g., React Developer Certification"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Storage Provider *
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setCertificateProvider('drive')}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        certificateProvider === 'drive'
                          ? 'border-green-600 bg-green-50 text-green-900'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <i className="fab fa-google-drive text-2xl mb-1"></i>
                      <p className="text-sm font-medium">Google Drive</p>
                    </button>
                    <button
                      onClick={() => setCertificateProvider('dropbox')}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                        certificateProvider === 'dropbox'
                          ? 'border-green-600 bg-green-50 text-green-900'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <i className="fab fa-dropbox text-2xl mb-1"></i>
                      <p className="text-sm font-medium">Dropbox</p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Certificate Link *
                  </label>
                  <input
                    type="url"
                    value={certificateLink}
                    onChange={(e) => setCertificateLink(e.target.value)}
                    placeholder={certificateProvider === 'drive' ? 'https://drive.google.com/...' : 'https://www.dropbox.com/...'}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Make sure the link is publicly accessible
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAddCertificateModal(false);
                      setSelectedJob(null);
                      setSelectedSkill(null);
                      setCertificateTitle('');
                      setCertificateLink('');
                      setCertificateProvider('drive');
                    }}
                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCertificate}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Add Certificate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default CertificatesList;
