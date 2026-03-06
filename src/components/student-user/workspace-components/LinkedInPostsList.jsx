import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { getRequest, postRequest, deleteRequest } from '../../../api/apiRequests';
import {
  CreateLinkedInPostModal
} from '../interview-planner-components';

const LinkedInPostsList = () => {
  const user = useSelector((state) => state.user);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create post modal states
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [linkedInPostTopic, setLinkedInPostTopic] = useState('');
  const [linkedInPostContext, setLinkedInPostContext] = useState('');
  const [generatedLinkedInPost, setGeneratedLinkedInPost] = useState('');
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  
  // Job/Skill selection states
  const [plannerJobs, setPlannerJobs] = useState([]);
  const [jobSkills, setJobSkills] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [showJobSelection, setShowJobSelection] = useState(false);

  useEffect(() => {
    if (user?._id) {
      fetchPosts();
    }
  }, [user?._id]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await getRequest('/linkedin-posts/student/all');
      if (response.data?.success && response.data?.data) {
        setPosts(response.data.data || []);
      } else {
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching LinkedIn posts:', error);
      setPosts([]);
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

  // Handle opening create post modal
  const handleOpenCreatePost = async () => {
    setShowJobSelection(true);
    setSelectedJob(null);
    setSelectedSkill(null);
    setJobSkills([]);
    setLinkedInPostTopic('');
    setLinkedInPostContext('');
    setGeneratedLinkedInPost('');
    await fetchPlannerJobs();
  };

  // Handle skill selection for creating post
  const handleSkillSelectForPost = (job, skill) => {
    setSelectedJob(job);
    setSelectedSkill(skill);
    setShowJobSelection(false);
    setShowCreatePostModal(true);
  };

  // Generate LinkedIn Post using AI
  const handleGenerateLinkedInPost = async () => {
    if (!linkedInPostTopic.trim()) {
      toast.error('Please enter what your post is about');
      return;
    }

    const topicId = selectedSkill?._id || selectedSkill?.id;
    if (!selectedJob?._id || !topicId || !selectedJob?.interviewPlannerId) {
      toast.error('Missing job or skill information');
      return;
    }

    setIsGeneratingPost(true);
    
    try {
      const companyName = selectedJob?.company || 'MySkillDB';
      const jobName = selectedJob?.title || 'Career Development';
      const skillName = selectedSkill?.name || selectedSkill?.title || '';

      // Call AI endpoint to generate LinkedIn post
      const aiResponse = await postRequest('/ai/generate-linkedin-post', {
        jobTitle: jobName,
        companyName: companyName,
        skillName: skillName,
        userTopic: linkedInPostTopic.trim(),
        userContext: linkedInPostContext?.trim() || undefined
      });

      if (!aiResponse.data?.success || !aiResponse.data?.data) {
        throw new Error(aiResponse.data?.error || 'Failed to generate LinkedIn post');
      }

      const aiGeneratedData = aiResponse.data.data;
      
      // Format hashtags if provided
      let formattedPostText = aiGeneratedData.postText;
      if (aiGeneratedData.hashtags && Array.isArray(aiGeneratedData.hashtags) && aiGeneratedData.hashtags.length > 0) {
        const hashtagsString = aiGeneratedData.hashtags.map(tag => `#${tag.replace(/#/g, '').replace(/\s+/g, '')}`).join(' ');
        formattedPostText = `${formattedPostText}\n\n${hashtagsString}`;
      }

      // Replace \n with actual newlines
      formattedPostText = formattedPostText.replace(/\\n/g, '\n');

      // Save to database
      const saveResponse = await postRequest('/linkedin-posts', {
        jobId: selectedJob._id,
        skillId: topicId,
        interviewPlannerId: selectedJob.interviewPlannerId,
        topic: skillName,
        postText: formattedPostText,
        userTopic: linkedInPostTopic.trim(),
        userContext: linkedInPostContext?.trim() || undefined
      });

      if (saveResponse.data?.success) {
        setGeneratedLinkedInPost(formattedPostText);
        toast.success('LinkedIn post generated and saved successfully!');
        // Refresh posts list
        await fetchPosts();
      } else {
        // Still show the generated post even if save fails
        setGeneratedLinkedInPost(formattedPostText);
        toast.error(saveResponse.data?.message || 'Post generated but failed to save');
      }
    } catch (error) {
      console.error('Error generating LinkedIn post:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to generate LinkedIn post');
    } finally {
      setIsGeneratingPost(false);
    }
  };

  // Copy LinkedIn Post to Clipboard
  const handleCopyLinkedInPost = () => {
    navigator.clipboard.writeText(generatedLinkedInPost);
    toast.success('Post copied to clipboard!');
  };

  // Handle copy post from list
  const handleCopyPost = (postText) => {
    navigator.clipboard.writeText(postText);
    toast.success('Post copied to clipboard!');
  };

  // Expanded posts state
  const [expandedPosts, setExpandedPosts] = useState(new Set());
  
  // Delete confirmation state
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const togglePostExpand = (postId) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  // Handle delete LinkedIn post
  const handleDeletePost = async (post) => {
    if (!post?._id) {
      toast.error('Invalid post');
      return;
    }

    try {
      setIsDeleting(true);
      const response = await deleteRequest(`/linkedin-posts/${post._id}`);
      
      if (response.data?.success) {
        toast.success('LinkedIn post deleted successfully!');
        setPostToDelete(null);
        // Refresh posts list
        await fetchPosts();
      } else {
        toast.error(response.data?.message || 'Failed to delete LinkedIn post');
      }
    } catch (error) {
      console.error('Error deleting LinkedIn post:', error);
      toast.error(error.response?.data?.message || 'Failed to delete LinkedIn post');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <>
      {/* Header - Mobile Optimized */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">LinkedIn Posts</h2>
            <p className="text-xs sm:text-sm text-slate-600">AI-generated professional posts to showcase your journey</p>
          </div>
          <button
            onClick={handleOpenCreatePost}
            className="px-4 py-2.5 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
          >
            <i className="fab fa-linkedin"></i>
            <span className="sm:inline">Create Post</span>
          </button>
        </div>
      </div>

      {/* Posts Grid - Modern Premium Design */}
      {isLoading ? (
        <div className="text-center py-12 sm:py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 mb-4 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50">
            <i className="fas fa-spinner fa-spin text-2xl sm:text-3xl text-blue-600"></i>
          </div>
          <p className="text-sm sm:text-base font-medium text-slate-700">Loading your LinkedIn posts...</p>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">This may take a moment</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 sm:py-16 px-4">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mb-4 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50">
            <i className="fab fa-linkedin text-3xl sm:text-4xl text-blue-400"></i>
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">No LinkedIn Posts Yet</h3>
          <p className="text-sm sm:text-base text-slate-600 mb-6 max-w-md mx-auto">
            Create AI-generated LinkedIn posts to share your learning journey and build your professional presence
          </p>
          <button
            onClick={handleOpenCreatePost}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2 mx-auto text-sm sm:text-base"
          >
            <i className="fab fa-linkedin text-lg"></i>
            Create Your First Post
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {posts.map((post) => (
            <div
              key={post._id}
              className="bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow flex flex-col h-full"
            >
              {/* Simple Header */}
              <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <i className="fab fa-linkedin text-blue-600 text-base sm:text-lg"></i>
                    <span className="text-sm sm:text-base font-medium text-slate-700">LinkedIn Post</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {post.createdAt && (
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(post.createdAt) || 'Recently'}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPostToDelete(post);
                      }}
                      className="ml-2 p-1.5 sm:p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors touch-manipulation flex-shrink-0"
                      title="Delete post"
                    >
                      <i className="fas fa-trash text-xs sm:text-sm"></i>
                    </button>
                  </div>
                </div>
                {(post.jobId?.name || post.skillId?.name) && (
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    {post.jobId?.name && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                        {post.jobId.name}
                      </span>
                    )}
                    {post.skillId?.name && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                        {post.skillId.name}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Post Content */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col">
                {/* Post Text */}
                {post.postText && (
                  <div className="mb-4 flex-1">
                    <p className={`text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-wrap ${
                      expandedPosts.has(post._id) ? '' : 'line-clamp-6'
                    }`}>
                      {post.postText}
                    </p>
                    {post.postText.length > 300 && (
                      <button
                        onClick={() => togglePostExpand(post._id)}
                        className="mt-2 text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        {expandedPosts.has(post._id) ? 'Show Less' : 'Show More'}
                      </button>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 sm:gap-3 pt-3 mt-auto border-t border-slate-100">
                  <button
                    onClick={() => handleCopyPost(post.postText)}
                    className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 sm:gap-2 touch-manipulation"
                  >
                    <i className="fas fa-copy text-xs sm:text-sm"></i>
                    <span>Copy</span>
                  </button>
                  <button
                    onClick={() => {
                      if (post.postText) {
                        const linkedInUrl = `https://www.linkedin.com/feed/`;
                        window.open(linkedInUrl, '_blank', 'noopener,noreferrer');
                        navigator.clipboard.writeText(post.postText);
                        toast.success('Post copied! Opening LinkedIn...');
                      }
                    }}
                    className="px-3 sm:px-4 py-2 border border-blue-600 hover:bg-blue-50 active:bg-blue-100 text-blue-600 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5 sm:gap-2 touch-manipulation"
                  >
                    <i className="fab fa-linkedin text-xs sm:text-sm"></i>
                    <span className="hidden sm:inline">Share</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
              {/* Header - Mobile Optimized */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-4 sm:py-4 rounded-t-3xl sm:rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fab fa-linkedin text-base sm:text-xl text-white"></i>
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

              {/* Content - Mobile Optimized */}
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
                            className="p-3.5 sm:p-4 border-2 border-slate-200 hover:border-blue-500 active:border-blue-600 rounded-lg text-left transition-all hover:bg-blue-50 active:bg-blue-100 touch-manipulation"
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
                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 active:text-blue-800 flex items-center gap-1 touch-manipulation px-2 py-1"
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
                            onClick={() => handleSkillSelectForPost(selectedJob, skill)}
                            className="p-3.5 sm:p-4 border-2 border-slate-200 hover:border-blue-500 active:border-blue-600 rounded-lg text-left transition-all hover:bg-blue-50 active:bg-blue-100 touch-manipulation"
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

      {/* Create LinkedIn Post Modal */}
      {showCreatePostModal && selectedJob && selectedSkill && (
        <CreateLinkedInPostModal
          isOpen={showCreatePostModal}
          onClose={() => {
            setShowCreatePostModal(false);
            setSelectedJob(null);
            setSelectedSkill(null);
            setLinkedInPostTopic('');
            setLinkedInPostContext('');
            setGeneratedLinkedInPost('');
          }}
          selectedSkill={selectedSkill}
          selectedJob={selectedJob}
          linkedInPostTopic={linkedInPostTopic}
          setLinkedInPostTopic={setLinkedInPostTopic}
          linkedInPostContext={linkedInPostContext}
          setLinkedInPostContext={setLinkedInPostContext}
          generatedLinkedInPost={generatedLinkedInPost}
          setGeneratedLinkedInPost={setGeneratedLinkedInPost}
          isGeneratingPost={isGeneratingPost}
          onGenerate={handleGenerateLinkedInPost}
          onCopy={handleCopyLinkedInPost}
        />
      )}

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <>
          <div 
            className="fixed inset-0 bg-white/10 backdrop-blur-md z-[9998]"
            onClick={() => setPostToDelete(null)}
          ></div>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900">Delete LinkedIn Post?</h3>
                    <p className="text-sm text-slate-600 mt-1">This action cannot be undone.</p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-slate-700 font-medium mb-1">Post Preview:</p>
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {postToDelete.postText?.substring(0, 150) || 'LinkedIn Post'}
                    {postToDelete.postText?.length > 150 ? '...' : ''}
                  </p>
                  {(postToDelete.jobId?.name || postToDelete.skillId?.name) && (
                    <div className="flex items-center gap-2 mt-2">
                      {postToDelete.jobId?.name && (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs">
                          {postToDelete.jobId.name}
                        </span>
                      )}
                      {postToDelete.skillId?.name && (
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-xs">
                          {postToDelete.skillId.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPostToDelete(null)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeletePost(postToDelete)}
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
    </>
  );
};

export default LinkedInPostsList;
