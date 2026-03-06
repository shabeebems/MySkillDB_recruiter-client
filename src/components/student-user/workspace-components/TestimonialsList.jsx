import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { getRequest, postRequest, deleteRequest } from '../../../api/apiRequests';

const TestimonialsList = () => {
  const user = useSelector((state) => state.user);
  const [testimonials, setTestimonials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add testimonial modal states
  const [showAddTestimonialModal, setShowAddTestimonialModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [validatorName, setValidatorName] = useState('');
  const [validatorEmail, setValidatorEmail] = useState('');
  const [validatorRole, setValidatorRole] = useState('');
  
  // Job/Skill selection states
  const [plannerJobs, setPlannerJobs] = useState([]);
  const [jobSkills, setJobSkills] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [showJobSelection, setShowJobSelection] = useState(false);
  
  // Delete confirmation state
  const [testimonialToDelete, setTestimonialToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user?._id) {
      fetchTestimonials();
    }
  }, [user?._id]);

  const fetchTestimonials = async () => {
    try {
      setIsLoading(true);
      const response = await getRequest('/testimonials/student/all');
      if (response.data?.success && response.data?.data) {
        setTestimonials(response.data.data || []);
      } else {
        setTestimonials([]);
      }
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      setTestimonials([]);
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

  // Handle opening add testimonial modal
  const handleOpenAddTestimonial = async () => {
    setShowJobSelection(true);
    setSelectedJob(null);
    setSelectedSkill(null);
    setJobSkills([]);
    setValidatorName('');
    setValidatorEmail('');
    setValidatorRole('');
    await fetchPlannerJobs();
  };

  // Handle skill selection for adding testimonial
  const handleSkillSelectForTestimonial = (job, skill) => {
    setSelectedJob(job);
    setSelectedSkill(skill);
    setShowJobSelection(false);
    setShowAddTestimonialModal(true);
  };

  // Handle save testimonial
  const handleSaveTestimonial = async () => {
    if (!validatorName.trim() || !validatorEmail.trim() || !validatorRole.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(validatorEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    const skillId = selectedSkill?._id || selectedSkill?.id;
    if (!selectedJob?._id || !skillId || !selectedJob?.interviewPlannerId) {
      toast.error('Missing job or skill information');
      return;
    }

    try {
      const response = await postRequest('/testimonials', {
        jobId: selectedJob._id,
        skillId: skillId,
        interviewPlannerId: selectedJob.interviewPlannerId,
        validatorName: validatorName.trim(),
        validatorEmail: validatorEmail.trim(),
        validatorRole: validatorRole.trim()
      });

      if (response.data?.success) {
        toast.success('Testimonial added successfully!');
        // Reset form
        setShowAddTestimonialModal(false);
        setSelectedJob(null);
        setSelectedSkill(null);
        setValidatorName('');
        setValidatorEmail('');
        setValidatorRole('');
        // Refresh testimonials list
        await fetchTestimonials();
      } else {
        toast.error(response.data?.message || 'Failed to add testimonial');
      }
    } catch (error) {
      console.error('Error adding testimonial:', error);
      toast.error(error.response?.data?.message || 'Failed to add testimonial');
    }
  };

  // Handle delete testimonial
  const handleDeleteTestimonial = async (testimonial) => {
    if (!testimonial?._id) {
      toast.error('Invalid testimonial');
      return;
    }

    try {
      setIsDeleting(true);
      const response = await deleteRequest(`/testimonials/${testimonial._id}`);
      
      if (response.data?.success) {
        toast.success('Testimonial deleted successfully!');
        setTestimonialToDelete(null);
        // Refresh testimonials list
        await fetchTestimonials();
      } else {
        toast.error(response.data?.message || 'Failed to delete testimonial');
      }
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast.error(error.response?.data?.message || 'Failed to delete testimonial');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-br from-amber-50 to-orange-50">
          <i className="fas fa-spinner fa-spin text-2xl text-amber-600"></i>
        </div>
        <p className="text-sm font-medium text-slate-700">Loading testimonials...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">My Testimonials</h2>
            <p className="text-xs sm:text-sm text-slate-600">All testimonials and validations</p>
          </div>
          <button
            onClick={handleOpenAddTestimonial}
            className="px-4 py-2.5 sm:py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
          >
            <i className="fas fa-plus"></i>
            <span className="sm:inline">Add Testimonial</span>
          </button>
        </div>
      </div>

      {/* Testimonials Grid - Responsive */}
      {testimonials.length === 0 ? (
        <div className="text-center py-12 sm:py-16 px-4">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-4 rounded-full bg-gradient-to-br from-amber-50 to-orange-50">
            <i className="fas fa-quote-left text-3xl sm:text-4xl text-amber-400"></i>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">No Testimonials Yet</h3>
          <p className="text-sm sm:text-base text-slate-600 mb-6 max-w-md mx-auto">
            Add testimonials from validators to showcase your skills and achievements
          </p>
          <button
            onClick={handleOpenAddTestimonial}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mx-auto text-sm sm:text-base"
          >
            <i className="fas fa-plus text-lg"></i>
            Add Your First Testimonial
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial._id}
              className="bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow flex flex-col h-full"
            >
              <div className="p-4 sm:p-5 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex items-start justify-between mb-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-award text-amber-600 text-lg"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base text-slate-900 truncate">
                        {testimonial.validatorName || 'Anonymous'}
                      </h3>
                      {testimonial.validatorRole && (
                        <p className="text-xs sm:text-sm text-slate-600 truncate">{testimonial.validatorRole}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTestimonialToDelete(testimonial);
                    }}
                    className="ml-2 p-1.5 sm:p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors touch-manipulation flex-shrink-0"
                    title="Delete testimonial"
                  >
                    <i className="fas fa-trash text-xs sm:text-sm"></i>
                  </button>
                </div>

                {/* Job/Skill Tags */}
                {(testimonial.jobId?.name || testimonial.skillId?.name) && (
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-3">
                    {testimonial.jobId?.name && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                        {testimonial.jobId.name}
                      </span>
                    )}
                    {testimonial.skillId?.name && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                        {testimonial.skillId.name}
                      </span>
                    )}
                  </div>
                )}

                {/* Email */}
                {testimonial.validatorEmail && (
                  <div className="mb-3 flex-shrink-0">
                    <p className="text-xs sm:text-sm text-slate-600 truncate">
                      <i className="fas fa-envelope mr-1.5 text-slate-400"></i>
                      {testimonial.validatorEmail}
                    </p>
                  </div>
                )}

                {/* Date */}
                {testimonial.createdAt && (
                  <div className="mt-auto pt-3 border-t border-slate-100 flex-shrink-0">
                    <p className="text-xs text-slate-500">
                      <i className="fas fa-calendar mr-1"></i>
                      {new Date(testimonial.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {testimonialToDelete && (
        <>
          <div 
            className="fixed inset-0 bg-white/10 backdrop-blur-md z-[9998]"
            onClick={() => setTestimonialToDelete(null)}
          ></div>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">Delete Testimonial?</h3>
                    <p className="text-sm text-slate-600 mt-1">This action cannot be undone.</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-slate-700 font-medium mb-1">Testimonial:</p>
                  <p className="text-sm text-slate-600 line-clamp-2">
                    {testimonialToDelete.validatorName || 'Anonymous'}
                  </p>
                  {testimonialToDelete.validatorRole && (
                    <p className="text-xs text-slate-500 mt-1">{testimonialToDelete.validatorRole}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTestimonialToDelete(null)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteTestimonial(testimonialToDelete)}
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
              <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 sm:px-6 py-4 sm:py-4 rounded-t-3xl sm:rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-award text-base sm:text-xl text-white"></i>
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
                            className="p-3.5 sm:p-4 border-2 border-slate-200 hover:border-amber-500 active:border-amber-600 rounded-lg text-left transition-all hover:bg-amber-50 active:bg-amber-100 touch-manipulation"
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
                        className="text-xs sm:text-sm text-amber-600 hover:text-amber-700 active:text-amber-800 flex items-center gap-1 touch-manipulation px-2 py-1"
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
                            onClick={() => handleSkillSelectForTestimonial(selectedJob, skill)}
                            className="p-3.5 sm:p-4 border-2 border-slate-200 hover:border-amber-500 active:border-amber-600 rounded-lg text-left transition-all hover:bg-amber-50 active:bg-amber-100 touch-manipulation"
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

      {/* Add Testimonial Modal */}
      {showAddTestimonialModal && selectedJob && selectedSkill && (
        <>
          <div 
            className="fixed inset-0 bg-white/10 backdrop-blur-md z-[9998]"
            onClick={() => {
              setShowAddTestimonialModal(false);
              setSelectedJob(null);
              setSelectedSkill(null);
              setValidatorName('');
              setValidatorEmail('');
              setValidatorRole('');
            }}
          ></div>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Add Testimonial</h3>
                    <p className="text-sm text-slate-600">{selectedSkill?.name || selectedSkill?.title || 'Skill'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddTestimonialModal(false);
                      setSelectedJob(null);
                      setSelectedSkill(null);
                      setValidatorName('');
                      setValidatorEmail('');
                      setValidatorRole('');
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
                    Validator's Name *
                  </label>
                  <input
                    type="text"
                    value={validatorName}
                    onChange={(e) => setValidatorName(e.target.value)}
                    placeholder="e.g., Ms. Priya Sharma"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Validator's Email *
                  </label>
                  <input
                    type="email"
                    value={validatorEmail}
                    onChange={(e) => setValidatorEmail(e.target.value)}
                    placeholder="e.g., priya.sharma@company.com"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Validator's Role/Title *
                  </label>
                  <input
                    type="text"
                    value={validatorRole}
                    onChange={(e) => setValidatorRole(e.target.value)}
                    placeholder="e.g., Project Manager, TechSolutions Inc."
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAddTestimonialModal(false);
                      setSelectedJob(null);
                      setSelectedSkill(null);
                      setValidatorName('');
                      setValidatorEmail('');
                      setValidatorRole('');
                    }}
                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTestimonial}
                    className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Add Testimonial
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

export default TestimonialsList;
