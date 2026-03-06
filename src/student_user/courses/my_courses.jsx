import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import StudentMenuNavigation from '../../components/student-user/student-menu-components/StudentMenuNavigation';
import LoaderOverlay from '../../components/common/loader/LoaderOverlay';
import { getRequest, postRequest } from '../../api/apiRequests';
import { StudentInfoCard, VideoPlayerModal } from '../../components/student-user/student-courses-components';
import { RecordingsSection } from '../../components/student-user/interview-planner-components';
import VideoCard from '../../components/student-user/workspace-components/VideoCard';
import toast from 'react-hot-toast';

const MyCourses = () => {
  const user = useSelector((state) => state.user);
  const assignment = useSelector((state) => state.assignment);
  const [currentPage, setCurrentPage] = useState('my-courses');
  const [viewingSubjectId, setViewingSubjectId] = useState(null); // Track which subject detail page is being viewed
  const [isLoading, setIsLoading] = useState(true);
  const [currentSubjectTopics, setCurrentSubjectTopics] = useState([]);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [subjectMetrics, setSubjectMetrics] = useState({}); // { subjectId: { topicsCount, recordingsCount, assessmentsCount, hours } }
  const [departmentInfo, setDepartmentInfo] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
  const [sectionInfo, setSectionInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  // Recordings data
  const [recordings, setRecordings] = useState([]);
  const [isLoadingRecordings, setIsLoadingRecordings] = useState(false);
  
  // Tests/Assessments data
  const [subjectLevelTests, setSubjectLevelTests] = useState([]);
  const [topicLevelTests, setTopicLevelTests] = useState([]);
  const [isLoadingTests, setIsLoadingTests] = useState(false);
  // Test taking state
  const [selectedTest, setSelectedTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [isTestActive, setIsTestActive] = useState(false);
  const [showTestResult, setShowTestResult] = useState(false);
  const [testResultData, setTestResultData] = useState(null);
  const [isSubmittingTest, setIsSubmittingTest] = useState(false);
  const [viewingCompletedTest, setViewingCompletedTest] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef(null);
  // Study plan state
  const [studyPlanModal, setStudyPlanModal] = useState(null);
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [playingVideo, setPlayingVideo] = useState(null);
  // Completed topic detail view
  const [viewingCompletedTopic, setViewingCompletedTopic] = useState(null);
  // Track the subject that is currently being viewed/assessed
  const [currentSubjectId, setCurrentSubjectId] = useState(null);
  // Subject detail tab: 'resume' | 'completed'
  const [subjectViewTab, setSubjectViewTab] = useState('resume');
  // Virtual meet state (wired to backend)
  const [searchParams] = useSearchParams();
  const virtualMeetCardRef = useRef(null);
  const [nextVirtualSession, setNextVirtualSession] = useState(null);
  const [isLoadingNextVirtualSession, setIsLoadingNextVirtualSession] = useState(false);
  const hasVirtualMeetLink = !!nextVirtualSession?.meetLink;
  const [hasMarkedVirtualAttendance, setHasMarkedVirtualAttendance] = useState(false);

  const formatVirtualSessionDateTime = (session) => {
    if (!session) return '';
    const startsAt = session.startsAt ? new Date(session.startsAt) : new Date(`${session.date}T${session.time}`);
    if (Number.isNaN(startsAt.getTime())) return `${session.date} ${session.time}`;
    return startsAt.toLocaleString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const fetchNextVirtualSession = async () => {
    try {
      setIsLoadingNextVirtualSession(true);
      const res = await getRequest('/virtual-sessions/my/next');
      if (res.data?.success) {
        setNextVirtualSession(res.data.data || null);
      } else {
        setNextVirtualSession(null);
      }
    } catch (err) {
      console.error('Error fetching next virtual session:', err);
      setNextVirtualSession(null);
    } finally {
      setIsLoadingNextVirtualSession(false);
    }
  };

  // Load upcoming session for the student
  useEffect(() => {
    if (user?._id) fetchNextVirtualSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  // Deep-link from notification (virtualSessionId)
  useEffect(() => {
    const virtualSessionId = searchParams.get('virtualSessionId');
    if (!virtualSessionId) return;
    (async () => {
      try {
        setIsLoadingNextVirtualSession(true);
        const res = await getRequest(`/virtual-sessions/${virtualSessionId}`);
        if (res.data?.success && res.data?.data) {
          setNextVirtualSession(res.data.data);
          setTimeout(() => {
            virtualMeetCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 200);
        }
      } catch (err) {
        console.error('Error fetching virtual session from deep link:', err);
      } finally {
        setIsLoadingNextVirtualSession(false);
      }
    })();
  }, [searchParams]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle viewing subject detail page
  const handleViewSubjectDetail = async (subject) => {
    const subjectId = subject._id;
    setViewingSubjectId(subjectId);
    setCurrentSubjectId(subjectId);
    setSubjectViewTab('resume');
    
    try {
      setIsLoadingTopics(true);
      // Fetch topics, recordings, and tests for the selected subject
      const [topicsResponse] = await Promise.all([
        getRequest(`/topics/subject/${subjectId}`),
        fetchRecordingsForSubject(subjectId)
      ]);
      
      // Set topics and fetch tests
      const topics = topicsResponse.data?.success && topicsResponse.data?.data ? topicsResponse.data.data : [];
      setCurrentSubjectTopics(topics);
      await fetchSubjectTests(subjectId, topics);
    } catch (error) {
      console.error('Error fetching subject details:', error);
      setCurrentSubjectTopics([]);
    } finally {
      setIsLoadingTopics(false);
    }
  };

  // Handle going back to subjects list
  const handleBackToSubjects = () => {
    setViewingSubjectId(null);
    setCurrentSubjectTopics([]);
    setRecordings([]);
    setSubjectLevelTests([]);
    setTopicLevelTests([]);
  };

  // Fetch recordings for a subject
  const fetchRecordingsForSubject = async (subjectId) => {
    if (!subjectId) {
      setRecordings([]);
      return;
    }

    try {
      setIsLoadingRecordings(true);
      const response = await getRequest(`/recordings/subject/${subjectId}`);
      
      if (response.data?.success && response.data?.data) {
        setRecordings(response.data.data || []);
      } else {
        setRecordings([]);
      }
    } catch (error) {
      console.error('Error fetching recordings:', error);
      setRecordings([]);
    } finally {
      setIsLoadingRecordings(false);
    }
  };

  // Fetch tests for a subject
  const fetchSubjectTests = async (subjectId, topics = []) => {
    if (!subjectId || !user?._id || !user?.organizationId) {
      setSubjectLevelTests([]);
      setTopicLevelTests([]);
      return;
    }

    try {
      setIsLoadingTests(true);

      // Fetch all available subject-level tests from /tests/subject/:subjectId
      const subjectTestsResponse = await getRequest(`/tests/subject/${subjectId}`);
      
      // Fetch student test history to match with tests
      const historyResponse = await getRequest(
        `/student-test-history/tests/${subjectId}?userId=${user._id}&organizationId=${user.organizationId}`
      );

      // Create a map of test history by testId for quick lookup
      const historyMap = new Map();
      if (historyResponse.data?.success && historyResponse.data?.data) {
        const historyData = historyResponse.data.data || [];
        historyData.forEach((item) => {
          const test = item.testId || item.test;
          const testId = test?._id || item.testId;
          if (testId) {
            // Normalize status: "Completed" -> "completed", "Pending" -> "pending"
            const normalizedStatus = item.status === 'Completed' ? 'completed' : 
                                     item.status === 'Pending' ? 'pending' : 
                                     item.status?.toLowerCase() || 'pending';
            
            historyMap.set(String(testId), {
              id: item._id,
              status: normalizedStatus,
              score: item.score,
              completedDate: item.completedAt || item.completedDate,
            });
          }
        });
      }

      // Transform subject-level tests (tests without topicId)
      let transformedSubjectLevel = [];
      if (subjectTestsResponse.data?.success && subjectTestsResponse.data?.data) {
        const allTests = subjectTestsResponse.data.data || [];
        
        // Check completion status for tests that don't have history
        const testsToCheck = allTests.filter((test) => {
          const testId = test._id || test.id;
          return test.subjectId && !test.topicId && !historyMap.has(String(testId));
        });

        // Check completion status for tests not in history
        await Promise.all(
          testsToCheck.map(async (test) => {
            const testId = test._id || test.id;
            try {
              const completionResponse = await getRequest(
                `/student-test-history/check-completion/${testId}?userId=${user._id}&organizationId=${user.organizationId}`
              );
              if (completionResponse.data?.success && completionResponse.data?.data) {
                const completionData = completionResponse.data.data;
                if (completionData.isCompleted) {
                  historyMap.set(String(testId), {
                    id: completionData.studentTestHistoryId || testId,
                    status: 'completed',
                    score: completionData.score,
                    completedDate: completionData.completedAt,
                  });
                }
              }
            } catch (error) {
              console.error(`Error checking completion for test ${testId}:`, error);
            }
            return null;
          })
        );

        transformedSubjectLevel = allTests
          .filter((test) => {
            // Subject-level tests should have subjectId but no topicId
            return test.subjectId && !test.topicId;
          })
          .map((test) => {
            const testId = test._id || test.id;
            const history = historyMap.get(String(testId));
            
            // Get title from name field (API uses 'name' not 'title')
            const testTitle = (test.name && test.name.trim()) || (test.title && test.title.trim()) || 'Untitled Test';
            
            return {
              id: history?.id || testId, // Use history ID if exists, otherwise test ID
              testId: testId,
              title: testTitle,
              description: test.description || '',
              questionCount: test.questionCount || 0,
              status: history?.status || 'pending',
              score: history?.score,
              completedDate: history?.completedDate,
            };
          });
      }

      // Fetch topic-level tests for each topic
      let allTopicLevelTests = [];
      const topicsToFetch = topics.length > 0 ? topics : currentSubjectTopics;
      
      for (const topic of topicsToFetch) {
        const topicId = topic._id || topic.id;
        if (topicId) {
          // Fetch tests for this topic
          const topicTestsResponse = await getRequest(`/tests/topic/${topicId}`);
          
          // Fetch student test history for this topic
          const topicHistoryResponse = await getRequest(
            `/student-test-history/tests/${subjectId}?topicId=${topicId}&userId=${user._id}&organizationId=${user.organizationId}`
          );

          // Create a map of topic test history
          const topicHistoryMap = new Map();
          if (topicHistoryResponse.data?.success && topicHistoryResponse.data?.data) {
            const topicHistoryData = topicHistoryResponse.data.data || [];
            topicHistoryData.forEach((item) => {
              const test = item.testId || item.test;
              const testId = test?._id || item.testId;
              if (testId) {
                // Normalize status: "Completed" -> "completed", "Pending" -> "pending"
                const normalizedStatus = item.status === 'Completed' ? 'completed' : 
                                         item.status === 'Pending' ? 'pending' : 
                                         item.status?.toLowerCase() || 'pending';
                
                topicHistoryMap.set(String(testId), {
                  id: item._id,
                  status: normalizedStatus,
                  score: item.score,
                  completedDate: item.completedAt || item.completedDate,
                });
              }
            });
          }

          if (topicTestsResponse.data?.success && topicTestsResponse.data?.data) {
            const topicTests = topicTestsResponse.data.data || [];
            
            // Check completion status for tests that don't have history
            const topicTestsToCheck = topicTests.filter((test) => {
              const testId = test._id || test.id;
              return !topicHistoryMap.has(String(testId));
            });

            // Check completion status for tests not in history
            await Promise.all(
              topicTestsToCheck.map(async (test) => {
                const testId = test._id || test.id;
                try {
                  const completionResponse = await getRequest(
                    `/student-test-history/check-completion/${testId}?userId=${user._id}&organizationId=${user.organizationId}`
                  );
                  if (completionResponse.data?.success && completionResponse.data?.data) {
                    const completionData = completionResponse.data.data;
                    if (completionData.isCompleted) {
                      topicHistoryMap.set(String(testId), {
                        id: completionData.studentTestHistoryId || testId,
                        status: 'completed',
                        score: completionData.score,
                        completedDate: completionData.completedAt,
                      });
                    }
                  }
                } catch (error) {
                  console.error(`Error checking completion for test ${testId}:`, error);
                }
                return null;
              })
            );
            
            const transformedTopicTests = topicTests.map((test) => {
              const testId = test._id || test.id;
              const history = topicHistoryMap.get(String(testId));
              
              // Get title from name field (API uses 'name' not 'title')
              const testTitle = (test.name && test.name.trim()) || (test.title && test.title.trim()) || 'Untitled Test';
              
              return {
                id: history?.id || testId,
                testId: testId,
                topicId: topicId,
                topicName: topic.name || topic.title || 'Unknown Topic',
                title: testTitle,
                description: test.description || '',
                questionCount: test.questionCount || 0,
                status: history?.status || 'pending',
                score: history?.score,
                completedDate: history?.completedDate,
              };
            });
            allTopicLevelTests = [...allTopicLevelTests, ...transformedTopicTests];
          }
        }
      }

      setSubjectLevelTests(transformedSubjectLevel);
      setTopicLevelTests(allTopicLevelTests);
    } catch (error) {
      console.error('Error fetching tests:', error);
      setSubjectLevelTests([]);
      setTopicLevelTests([]);
    } finally {
      setIsLoadingTests(false);
    }
  };

  // Handle starting a test
  const handleStartTest = async (test) => {
    try {
      setIsLoadingTests(true);
      
      // Get test ID from test
      const testId = test.testId;
      if (!testId) {
        toast.error('Test ID not found');
        return;
      }
      
      // Fetch test details including questions
      const response = await getRequest(`/tests/${testId}`);
      if (response.data?.success && response.data?.data) {
        const testData = response.data.data;
        const testDetails = testData.test || testData;
        const testQuestions = testData.questions || [];
        
        // Transform questions to match component's expected format
        const transformedQuestions = testQuestions.map((q, index) => {
          const correctAnswerText = q.correctAnswer || '';
          const correctAnswerIndex = q.options?.findIndex(opt => opt === correctAnswerText) ?? -1;
          
          return {
            id: q._id || `q${index + 1}`,
            question: q.questionText || '',
            options: q.options || [],
            correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
            topic: q.topicId?.name || 'General',
            topicId: q.topicId?._id || q.topicId || null,
          };
        });
        
        // Merge test data with test data
        const fullTest = {
          ...test,
          _id: testId,
          testId: testId,
          title: (testDetails.name && testDetails.name.trim()) || (testDetails.title && testDetails.title.trim()) || test.title || 'Untitled Test',
          questions: transformedQuestions,
          duration: testDetails.duration || 30,
          passingScore: testDetails.passingScore || 70,
          questionCount: transformedQuestions.length,
          studentTestHistoryId: test.id, // Use the test ID from the list
        };
        
        setSelectedTest(fullTest);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setTimeRemaining((fullTest.duration || 30) * 60); // Convert minutes to seconds
        setIsTestActive(true);
        setShowTestResult(false);
        setTestResultData(null);
        toast.success('Test started!');
      } else {
        toast.error('Failed to load test details');
      }
    } catch (error) {
      console.error('Error fetching test details:', error);
      toast.error('Failed to load test details');
    } finally {
      setIsLoadingTests(false);
    }
  };

  // Handle answer select
  const handleAnswerSelect = (questionId, answerIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  // Handle next question
  const handleNextQuestion = () => {
    if (selectedTest && currentQuestionIndex < selectedTest.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Handle previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Handle submit test
  const handleSubmitTest = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (!selectedTest) return;

    setIsSubmittingTest(true);

    // Calculate results
    let correctAnswers = 0;
    const answerRecords = selectedTest.questions.map(question => {
      const userAnswerIndex = userAnswers[question.id];
      const isCorrect = userAnswerIndex === question.correctAnswer;
      if (isCorrect) {
        correctAnswers++;
      }
      
      return {
        questionId: question.id,
        selectedAnswer: userAnswerIndex !== undefined ? question.options[userAnswerIndex] : '',
        isCorrect: isCorrect
      };
    });

    const score = Math.round((correctAnswers / selectedTest.questions.length) * 100);
    const passed = score >= (selectedTest.passingScore || 70);

    // Save to backend
    if (selectedTest.studentTestHistoryId) {
      try {
        await postRequest(
          `/student-test-history/${selectedTest.studentTestHistoryId}/complete`,
          {
            answers: answerRecords,
            score,
            correctAnswers,
            totalQuestions: selectedTest.questions.length
          }
        );
        toast.success('Test results saved successfully!');
      } catch (error) {
        console.error('Error saving test results:', error);
        toast.error('Failed to save test results');
      }
    }

    setTestResultData({
      score,
      correctAnswers,
      totalQuestions: selectedTest.questions.length,
      passed,
      answers: userAnswers
    });

    setShowTestResult(true);
    setIsTestActive(false);

    // Refresh tests to show updated status
    if (viewingSubjectId) {
      const topicsResponse = await getRequest(`/topics/subject/${viewingSubjectId}`);
      const topics = topicsResponse.data?.success && topicsResponse.data?.data ? topicsResponse.data.data : [];
      await fetchSubjectTests(viewingSubjectId, topics);
    }

    setIsSubmittingTest(false);
  };

  // Timer countdown
  useEffect(() => {
    if (isTestActive && timeRemaining > 0 && !showTestResult) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [isTestActive, timeRemaining, showTestResult]);

  // Handle back to test list
  const handleBackToTestList = () => {
    setSelectedTest(null);
    setIsTestActive(false);
    setShowTestResult(false);
    setUserAnswers({});
    setCurrentQuestionIndex(0);
    setViewingCompletedTest(null);
    setStudyPlanModal(null);
    setRecommendedVideos([]);
    setPlayingVideo(null);
    setTimeRemaining(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Study plan functions
  const handleCreateStudyPlan = async () => {
    let testData = null;
    
    // Check if we're viewing a completed test
    if (viewingCompletedTest) {
      testData = viewingCompletedTest;
    } 
    // Check if we're in the results view
    else if (testResultData && selectedTest) {
      testData = {
        ...selectedTest,
        userAnswers: testResultData.answers,
        title: selectedTest.title,
        questions: selectedTest.questions || []
      };
    }
    
    if (!testData || !testData.questions || !testData.userAnswers) {
      toast.error('No test data available for study plan');
      return;
    }

    // Get all wrong answers and extract their topic IDs
    const wrongQuestions = testData.questions.filter(
      q => testData.userAnswers[q.id] !== undefined && testData.userAnswers[q.id] !== q.correctAnswer
    );
    
    const topicIds = [...new Set(
      wrongQuestions
        .map(q => q.topicId)
        .filter(id => id !== null && id !== undefined)
    )];
    
    // Fetch videos for these topic IDs
    if (topicIds.length > 0) {
      try {
        setIsLoadingTests(true);
        const topicIdsQuery = topicIds.map(id => `topicIds=${id}`).join('&');
        const response = await getRequest(`/recordings/topics?${topicIdsQuery}`);
        if (response.data.success && response.data.data) {
          setRecommendedVideos(response.data.data || []);
        } else {
          setRecommendedVideos([]);
        }
      } catch (error) {
        console.error('Error fetching recommended videos:', error);
        setRecommendedVideos([]);
      } finally {
        setIsLoadingTests(false);
      }
    } else {
      setRecommendedVideos([]);
    }
        
    setStudyPlanModal(testData);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseStudyPlan = () => {
    setStudyPlanModal(null);
    setRecommendedVideos([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseVideo = () => {
    setPlayingVideo(null);
  };

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Group videos by topic
  const groupVideosByTopic = (videos) => {
    const grouped = {};
    videos.forEach((video) => {
      const topicId = String(video.topicId?._id || video.topicId);
      const topicName = video.topicId?.name || 'General';
      if (!grouped[topicId]) {
        grouped[topicId] = {
          topicId,
          topicName,
          videos: []
        };
      }
      grouped[topicId].videos.push(video);
    });
    return Object.values(grouped);
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle reviewing a completed test
  const handleReviewTest = async (test) => {
    try {
      setIsLoadingTests(true);
      
      // Fetch student answers
      const answersResponse = await getRequest(`/student-test-history/${test.id}`);
      
      if (!answersResponse.data?.success || !answersResponse.data?.data) {
        toast.error('Failed to load test details');
        return;
      }

      const studentAnswers = answersResponse.data.data || [];
      
      // Fetch test details to get full question data
      const testResponse = await getRequest(`/tests/${test.testId}`);
      if (!testResponse.data?.success || !testResponse.data?.data) {
        toast.error('Failed to load test details');
        return;
      }

      const testData = testResponse.data.data;
      const testDetails = testData.test || testData;
      const testQuestions = testData.questions || [];
      
      // Create a map of student answers by questionId
      const answersMap = new Map();
      studentAnswers.forEach(answer => {
        const questionId = answer.questionId?._id || answer.questionId;
        if (questionId) {
          answersMap.set(String(questionId), answer);
        }
      });
      
      // Transform questions with user answers
      const transformedQuestions = testQuestions.map((q, index) => {
        const questionId = q._id || `q${index + 1}`;
        const studentAnswer = answersMap.get(String(q._id));
        const correctAnswerText = q.correctAnswer || '';
        const correctAnswerIndex = q.options?.findIndex(opt => opt === correctAnswerText) ?? -1;
        
        // Find user's selected answer index
        let userAnswerIndex = -1;
        if (studentAnswer?.selectedAnswer) {
          userAnswerIndex = q.options?.findIndex(opt => opt === studentAnswer.selectedAnswer) ?? -1;
        }
        
        return {
          id: questionId,
          question: q.questionText || '',
          options: q.options || [],
          correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
          userAnswer: userAnswerIndex >= 0 ? userAnswerIndex : null,
          isCorrect: studentAnswer?.isCorrect || false,
          topic: q.topicId?.name || 'General',
          topicId: q.topicId?._id || q.topicId || null,
        };
      });
      
      // Create userAnswers object from student answers
      const reviewAnswers = {};
      transformedQuestions.forEach(q => {
        if (q.userAnswer !== null && q.userAnswer !== undefined) {
          reviewAnswers[q.id] = q.userAnswer;
        }
      });
      
      // Merge test data with test data
      const fullTest = {
        ...test,
        _id: test.testId,
        testId: test.testId,
        title: (testDetails.name && testDetails.name.trim()) || (testDetails.title && testDetails.title.trim()) || test.title || 'Untitled Test',
        questions: transformedQuestions,
        userAnswers: reviewAnswers,
        score: test.score,
        totalQuestions: transformedQuestions.length,
        correctAnswers: studentAnswers.filter(a => a.isCorrect).length,
        passingScore: testDetails.passingScore || 70,
        completedDate: test.completedDate,
      };
      
      setViewingCompletedTest(fullTest);
      setSelectedTest(null);
      setIsTestActive(false);
      setShowTestResult(false);
      setTestResultData(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error fetching test review:', error);
      toast.error('Failed to load test review');
    } finally {
      setIsLoadingTests(false);
    }
  };

  // Fetch Department, Class, and Section info
  useEffect(() => {
    const fetchAssignmentDetails = async () => {
      if (!user?.organizationId || !assignment?._id) return;

      try {
        // Fetch assignment details with populated fields
        const assignmentResponse = await getRequest(
          `/organization-setup/assignments/${assignment._id}`
        );
        
        if (assignmentResponse.data?.success && assignmentResponse.data?.data) {
          const assignmentData = assignmentResponse.data.data;
          setDepartmentInfo(assignmentData.department ? { name: assignmentData.department } : null);
          setClassInfo(assignmentData.class ? { name: assignmentData.class } : null);
          setSectionInfo(assignmentData.section ? { name: assignmentData.section } : null);
        }
      } catch (error) {
        console.error('Error fetching assignment details:', error);
        // Fallback to assignment object if available
        if (assignment?.department) {
          setDepartmentInfo({ name: assignment.department });
        }
        if (assignment?.class) {
          setClassInfo({ name: assignment.class });
        }
        if (assignment?.section) {
          setSectionInfo({ name: assignment.section });
        }
      }
    };

    fetchAssignmentDetails();
  }, [user?.organizationId, assignment?._id, assignment]);

  // Fetch subject metrics (topics, recordings, assessments, hours)
  const fetchSubjectMetrics = async (subjectId) => {
    if (!subjectId) return null;

    try {
      const [topicsResponse, recordingsResponse, testsResponse] = await Promise.all([
        getRequest(`/topics/subject/${subjectId}`),
        getRequest(`/recordings/subject/${subjectId}`),
        getRequest(`/tests/subject/${subjectId}`)
      ]);

      const topics = topicsResponse.data?.success ? (topicsResponse.data.data || []) : [];
      const recordings = recordingsResponse.data?.success ? (recordingsResponse.data.data || []) : [];
      const tests = testsResponse.data?.success ? (testsResponse.data.data || []) : [];

      // Calculate total hours from recordings (assuming duration is in format "HH:MM" or minutes)
      let totalHours = 0;
      recordings.forEach(recording => {
        if (recording.duration) {
          // Try to parse duration - could be "HH:MM" or just minutes
          const durationStr = recording.duration.toString();
          if (durationStr.includes(':')) {
            const [hours, minutes] = durationStr.split(':').map(Number);
            totalHours += hours + (minutes / 60);
          } else {
            // Assume it's minutes
            totalHours += Number(durationStr) / 60;
          }
        }
      });

      return {
        topicsCount: topics.length,
        recordingsCount: recordings.length,
        assessmentsCount: tests.length,
        hours: Math.round(totalHours * 10) / 10 // Round to 1 decimal place
      };
    } catch (error) {
      console.error(`Error fetching metrics for subject ${subjectId}:`, error);
      return {
        topicsCount: 0,
        recordingsCount: 0,
        assessmentsCount: 0,
        hours: 0
      };
    }
  };

  // Fetch teaching assignments data
  useEffect(() => {
    const fetchTeachingAssignments = async () => {
      if (!user?.organizationId || !assignment?._id) {
        console.warn('Missing required data:', { 
          hasUser: !!user, 
          hasOrganizationId: !!user?.organizationId, 
          hasAssignment: !!assignment, 
          hasAssignmentId: !!assignment?._id 
        });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await getRequest(
          `/organization-setup/teachingAssignments/${user.organizationId}/${assignment._id}`
        );
        
        if (response.data.success && response.data.data) {
          // Now response.data.data is an array of teaching assignments
          const teachingAssignments = Array.isArray(response.data.data) ? response.data.data : [];

          // Transform API data to subjects format
          const transformedSubjects = await Promise.all(
            teachingAssignments.map(async (item, index) => {
            const subjectId = item.subjectId?._id || item.subjectId;
            const subjectName = item.subjectId?.name || 'Unknown Subject';
            const subjectCode = item.subjectId?.code || `SUB${String(index + 1).padStart(3, '0')}`;
            const teacherName = item.teacherId?.name || 'No teacher assigned';

            // Color array for different subjects
            const colors = ['blue', 'green', 'purple', 'orange', 'pink', 'red', 'yellow', 'indigo'];
            const color = colors[index % colors.length];

              // Fetch metrics for this subject
              const metrics = await fetchSubjectMetrics(subjectId);

            return {
              _id: subjectId,
              name: subjectName,
              code: subjectCode,
              instructor: teacherName,
              color: color
            };
            })
          );

          // Fetch all metrics in parallel
          const metricsPromises = transformedSubjects.map(subject => 
            fetchSubjectMetrics(subject._id).then(metrics => ({ subjectId: subject._id, metrics }))
          );
          const metricsResults = await Promise.all(metricsPromises);
          
          const metricsMap = {};
          metricsResults.forEach(({ subjectId, metrics }) => {
            metricsMap[subjectId] = metrics;
          });
          setSubjectMetrics(metricsMap);

          // Update subjects (even if empty array)
          setSubjects(transformedSubjects);
        } else {
          setSubjects([]);
        }
      } catch (error) {
        console.error('Error fetching teaching assignments:', error);
        toast.error('Failed to load courses. Please try again.');
        setSubjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeachingAssignments();
  }, [user?.organizationId, assignment?._id]);

  // Get the selected subject for detail view
  const selectedSubject = viewingSubjectId 
    ? subjects.find(s => s._id === viewingSubjectId)
    : null;

  // Helper function to render topic description
  const renderDescription = (description) => {
    if (!description) return null;
    
    return description.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return null;
      
      // Check for bullet points or numbering to bold them
      const bulletMatch = trimmedLine.match(/^([•○\-\*])\s+(.+)$/);
      const numberMatch = trimmedLine.match(/^(\d+[\.\)])\s+(.+)$/);

      if (bulletMatch) {
        const [, bullet, text] = bulletMatch;
        return (
           <p key={index} className="whitespace-pre-wrap flex items-start gap-2 pl-2 mb-1">
            <span className="font-bold text-slate-800 min-w-[12px]">{bullet}</span>
            <span className="font-semibold text-slate-800">{text}</span>
          </p>
        );
      }

      if (numberMatch) {
        const [, number, text] = numberMatch;
        return (
           <p key={index} className="whitespace-pre-wrap flex items-start gap-2 pl-2 mb-1">
            <span className="font-bold text-slate-800 min-w-[16px]">{number}</span>
            <span className="font-semibold text-slate-800">{text}</span>
          </p>
        );
      }
      
      return (
        <p key={index} className="whitespace-pre-wrap text-slate-600">
          {line}
        </p>
      );
    });
  };

  // Test Taking View
  if (selectedTest && isTestActive && !showTestResult) {
    const currentQuestion = selectedTest.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / selectedTest.questions.length) * 100;
    const isTimeLow = timeRemaining <= 300; // 5 minutes

    return (
      <>
        <div className="min-h-screen bg-slate-50 flex flex-col">
          {/* Header with Timer */}
          <div className="bg-white shadow-md border-b-2 border-slate-200 sticky top-0 z-50">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-slate-900">{selectedTest.title}</h2>
                  <p className="text-sm text-slate-600">
                    Question {currentQuestionIndex + 1} of {selectedTest.questions.length}
                  </p>
                </div>
                <div className={`text-right ${isTimeLow ? 'animate-pulse' : ''}`}>
                  <div className={`text-2xl font-bold ${isTimeLow ? 'text-red-600' : 'text-blue-600'}`}>
                    <i className="fas fa-clock mr-2"></i>
                    {formatTime(timeRemaining)}
                  </div>
                  <p className="text-xs text-slate-600">Time Remaining</p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-3 bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 lg:p-8">
              {/* Question */}
              <h3 className="text-xl lg:text-2xl font-bold text-slate-900 mb-6">
                {currentQuestion.question}
              </h3>

              {/* Options */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => {
                  const isSelected = userAnswers[currentQuestion.id] === index;
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-slate-300'
                        }`}>
                          {isSelected && <i className="fas fa-check text-white text-xs"></i>}
                        </div>
                        <span className={`text-sm lg:text-base ${isSelected ? 'text-blue-900 font-medium' : 'text-slate-700'}`}>
                          {option}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6 gap-4">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  currentQuestionIndex === 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:shadow-md'
                }`}
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Previous
              </button>

              {currentQuestionIndex === selectedTest.questions.length - 1 ? (
                <button
                  onClick={handleSubmitTest}
                  disabled={isSubmittingTest}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmittingTest ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Test
                      <i className="fas fa-check ml-2"></i>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
                >
                  Next
                  <i className="fas fa-arrow-right ml-2"></i>
                </button>
              )}
            </div>

            {/* Question Navigator */}
            <div className="mt-8 bg-white rounded-xl shadow-lg border border-slate-200 p-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Question Navigator</h4>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {selectedTest.questions.map((q, index) => {
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isCurrent = index === currentQuestionIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`aspect-square rounded-lg font-semibold text-sm transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-md scale-110'
                          : isAnswered
                          ? 'bg-green-100 text-green-700 border-2 border-green-300 hover:bg-green-200'
                          : 'bg-slate-100 text-slate-600 border-2 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-slate-100 border-2 border-slate-200 rounded"></div>
                  <span>Not Answered</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  <span>Current</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Study Plan View - Check this FIRST so it takes priority
  if (studyPlanModal) {
    const wrongQuestions = studyPlanModal.questions.filter(
      q => studyPlanModal.userAnswers[q.id] !== q.correctAnswer
    );

    return (
      <>
        {!playingVideo && (
          <StudentMenuNavigation currentPage={currentPage} onPageChange={handlePageChange} />
        )}
        <div className={`min-h-screen bg-slate-50 ${!playingVideo ? 'lg:ml-72' : ''}`}>
          <div className="max-w-6xl mx-auto px-4 py-8 pt-20 lg:pt-8">
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={handleCloseStudyPlan}
                className="mb-4 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <i className="fas fa-arrow-left"></i>
                Back to Review
              </button>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Study Plan</h1>
              <p className="text-slate-600">{studyPlanModal.title}</p>
            </div>

            {/* Questions You Got Wrong */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <i className="fas fa-times-circle text-red-600"></i>
                Questions You Got Wrong
              </h3>
              {wrongQuestions.length > 0 ? (
                <div className="space-y-3">
                  {wrongQuestions.map((question, index) => (
                    <div key={question.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="font-medium text-slate-900 mb-2">Q. {question.question}</p>
                      <div className="text-sm space-y-1">
                        <p className="text-red-700">
                          <strong>Your Answer:</strong> {studyPlanModal.userAnswers[question.id] !== undefined ? question.options[studyPlanModal.userAnswers[question.id]] : 'Not answered'}
                        </p>
                        <p className="text-green-700">
                          <strong>Correct Answer:</strong> {question.options[question.correctAnswer]}
                        </p>
                        <p className="text-purple-700">
                          <strong>Topic:</strong> {question.topic}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-600 py-4">You answered all questions correctly! 🎉</p>
              )}
            </div>

            {/* Related Videos Section */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <i className="fas fa-video text-blue-600"></i>
                Recommended Videos to Review
              </h3>
              {recommendedVideos.length > 0 ? (
                <div className="space-y-6">
                  {groupVideosByTopic(recommendedVideos).map((topicGroup) => (
                    <div key={topicGroup.topicId}>
                      <h4 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <i className="fas fa-tag text-purple-600"></i>
                        {topicGroup.topicName}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {topicGroup.videos.map((video) => {
                          const videoId = getYouTubeVideoId(video.link);
                          return (
                            <div
                              key={video._id}
                              onClick={() => setPlayingVideo({
                                videoId: videoId,
                                title: video.name,
                                duration: video.duration,
                                topic: topicGroup.topicName,
                                description: video.description
                              })}
                              className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <i className="fab fa-youtube text-white text-xl"></i>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-slate-900 text-sm mb-1">{video.name}</p>
                                  {video.description && (
                                    <p className="text-xs text-slate-600 mb-2 line-clamp-2">{video.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 text-xs text-slate-600">
                                    <span className="flex items-center gap-1">
                                      <i className="fas fa-clock"></i>
                                      {video.duration}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <i className="fas fa-play-circle"></i>
                                      Watch Now
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-600 py-4">No videos available for these topics.</p>
              )}
            </div>
          </div>
        </div>

        {/* Video Player Modal */}
        <VideoPlayerModal
          video={playingVideo}
          onClose={handleCloseVideo}
        />
      </>
    );
  }

  // Results View
  if (showTestResult && testResultData) {
    return (
      <>
        <StudentMenuNavigation currentPage={currentPage} onPageChange={handlePageChange} />
        <div className="min-h-screen bg-slate-50 lg:ml-72">
          <div className="max-w-4xl mx-auto px-4 py-8 pt-20 lg:pt-8">
            <div className="text-center mb-8">
              {/* Score Circle */}
              <div className="inline-block relative">
                <svg className="w-48 h-48">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="12"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke={testResultData.passed ? '#10b981' : '#ef4444'}
                    strokeWidth="12"
                    strokeDasharray={`${(testResultData.score / 100) * 553} 553`}
                    strokeLinecap="round"
                    transform="rotate(-90 96 96)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-5xl font-bold ${testResultData.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {testResultData.score}%
                  </span>
                  <span className="text-sm text-slate-600 mt-1">Your Score</span>
                </div>
              </div>

              {/* Result Message */}
              <div className="mt-6">
                {testResultData.passed ? (
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 text-green-800 rounded-full font-semibold">
                    <i className="fas fa-check-circle text-xl"></i>
                    Congratulations! You Passed
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-red-100 text-red-800 rounded-full font-semibold">
                    <i className="fas fa-times-circle text-xl"></i>
                    You Did Not Pass
                  </div>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
                <i className="fas fa-check-circle text-green-600 text-3xl mb-2"></i>
                <p className="text-3xl font-bold text-slate-900">{testResultData.correctAnswers}</p>
                <p className="text-sm text-slate-600">Correct Answers</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
                <i className="fas fa-times-circle text-red-600 text-3xl mb-2"></i>
                <p className="text-3xl font-bold text-slate-900">
                  {testResultData.totalQuestions - testResultData.correctAnswers}
                </p>
                <p className="text-sm text-slate-600">Incorrect Answers</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
                <i className="fas fa-clipboard-check text-blue-600 text-3xl mb-2"></i>
                <p className="text-3xl font-bold text-slate-900">{testResultData.totalQuestions}</p>
                <p className="text-sm text-slate-600">Total Questions</p>
              </div>
            </div>

            {/* Detailed Review */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <i className="fas fa-list-check text-blue-600"></i>
                Detailed Review
              </h3>
              <div className="space-y-4">
                {selectedTest.questions.map((question, index) => {
                  const userAnswer = testResultData.answers[question.id];
                  const isCorrect = userAnswer === question.correctAnswer;
                  
                  return (
                    <div key={question.id} className={`p-4 rounded-lg border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCorrect ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          <i className={`fas ${isCorrect ? 'fa-check' : 'fa-times'} text-white`}></i>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 mb-2">Q{index + 1}. {question.question}</p>
                          <div className="space-y-1 text-sm">
                            <p className={userAnswer !== undefined ? (isCorrect ? 'text-green-700' : 'text-red-700') : 'text-slate-600'}>
                              <strong>Your Answer:</strong> {userAnswer !== undefined ? question.options[userAnswer] : 'Not answered'}
                            </p>
                            {!isCorrect && (
                              <p className="text-green-700">
                                <strong>Correct Answer:</strong> {question.options[question.correctAnswer]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleBackToTestList}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Tests
              </button>
              <button
                onClick={handleCreateStudyPlan}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
              >
                <i className="fas fa-book-reader mr-2"></i>
                Create Study Plan
              </button>
            </div>
          </div>
        </div>

        {/* Video Player Modal */}
        <VideoPlayerModal
          video={playingVideo}
          onClose={handleCloseVideo}
        />
      </>
    );
  }

  // Completed Test Review View
  if (viewingCompletedTest) {
    const correctAnswers = viewingCompletedTest.questions.filter(
      q => viewingCompletedTest.userAnswers[q.id] === q.correctAnswer
    ).length;

    return (
      <>
        <StudentMenuNavigation currentPage={currentPage} onPageChange={handlePageChange} />
        <div className="min-h-screen bg-slate-50 lg:ml-72">
          <div className="max-w-4xl mx-auto px-4 py-8 pt-20 lg:pt-8">
            {/* Header with Close Button */}
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Review Results</h1>
              <button
                onClick={handleBackToTestList}
                className="w-10 h-10 flex items-center justify-center bg-white hover:bg-slate-100 border border-slate-200 rounded-full text-slate-600 hover:text-slate-900 transition-all"
                title="Close"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="text-center mb-8">
              {/* Score Circle */}
              <div className="inline-block relative">
                <svg className="w-48 h-48">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="12"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke={viewingCompletedTest.score >= viewingCompletedTest.passingScore ? '#10b981' : '#ef4444'}
                    strokeWidth="12"
                    strokeDasharray={`${(viewingCompletedTest.score / 100) * 553} 553`}
                    strokeLinecap="round"
                    transform="rotate(-90 96 96)"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-5xl font-bold ${viewingCompletedTest.score >= viewingCompletedTest.passingScore ? 'text-green-600' : 'text-red-600'}`}>
                    {viewingCompletedTest.score}%
                  </span>
                  <span className="text-sm text-slate-600 mt-1">Your Score</span>
                </div>
              </div>

              {/* Result Message */}
              <div className="mt-6">
                {viewingCompletedTest.score >= viewingCompletedTest.passingScore ? (
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 text-green-800 rounded-full font-semibold">
                    <i className="fas fa-check-circle text-xl"></i>
                    You Passed!
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-red-100 text-red-800 rounded-full font-semibold">
                    <i className="fas fa-times-circle text-xl"></i>
                    You Did Not Pass
                  </div>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
              <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-slate-200 p-3 md:p-6 text-center">
                <i className="fas fa-check-circle text-green-600 text-xl md:text-3xl mb-1 md:mb-2"></i>
                <p className="text-xl md:text-3xl font-bold text-slate-900">{correctAnswers}</p>
                <p className="text-xs md:text-sm text-slate-600">Correct</p>
              </div>
              <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-slate-200 p-3 md:p-6 text-center">
                <i className="fas fa-times-circle text-red-600 text-xl md:text-3xl mb-1 md:mb-2"></i>
                <p className="text-xl md:text-3xl font-bold text-slate-900">
                  {viewingCompletedTest.totalQuestions - correctAnswers}
                </p>
                <p className="text-xs md:text-sm text-slate-600">Incorrect</p>
              </div>
              <div className="bg-white rounded-lg md:rounded-xl shadow-sm border border-slate-200 p-3 md:p-6 text-center">
                <i className="fas fa-clipboard-check text-blue-600 text-xl md:text-3xl mb-1 md:mb-2"></i>
                <p className="text-xl md:text-3xl font-bold text-slate-900">{viewingCompletedTest.totalQuestions}</p>
                <p className="text-xs md:text-sm text-slate-600">Total</p>
              </div>
            </div>

            {/* Detailed Review */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <i className="fas fa-list-check text-blue-600"></i>
                Detailed Review
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {viewingCompletedTest.questions.map((question, index) => {
                  const userAnswer = viewingCompletedTest.userAnswers[question.id];
                  const isCorrect = userAnswer === question.correctAnswer;
                  
                  return (
                    <div key={question.id} className={`p-4 rounded-lg border-2 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCorrect ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          <i className={`fas ${isCorrect ? 'fa-check' : 'fa-times'} text-white`}></i>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 mb-2">Q{index + 1}. {question.question}</p>
                          <div className="space-y-1 text-sm">
                            <p className={userAnswer !== undefined ? (isCorrect ? 'text-green-700' : 'text-red-700') : 'text-slate-600'}>
                              <strong>Your Answer:</strong> {userAnswer !== undefined ? question.options[userAnswer] : 'Not answered'}
                            </p>
                            {!isCorrect && (
                              <p className="text-green-700">
                                <strong>Correct Answer:</strong> {question.options[question.correctAnswer]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <button
                onClick={handleBackToTestList}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back
              </button>
              <button
                onClick={handleCreateStudyPlan}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all"
              >
                <i className="fas fa-book-reader mr-2"></i>
                Study Plan
              </button>
            </div>
          </div>
        </div>

        {/* Video Player Modal */}
        <VideoPlayerModal
          video={playingVideo}
          onClose={handleCloseVideo}
        />
      </>
    );
  }


  return (
    <>
      <LoaderOverlay isVisible={isLoading} title="My Courses" subtitle="Loading your courses..." />
      
      <StudentMenuNavigation currentPage={currentPage} onPageChange={handlePageChange} />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 lg:ml-72 pt-16 sm:pt-16 lg:pt-6">
        {viewingSubjectId && selectedSubject ? (
          /* Subject Detail View */
          <div className="p-4 sm:p-6">
            {/* Back Button and Header */}
            <div className="mb-4 sm:mb-6">
              <button
                onClick={handleBackToSubjects}
                className="mb-3 sm:mb-4 px-3 sm:px-4 py-2 bg-white/90 backdrop-blur-sm border border-slate-200 hover:bg-white text-slate-700 rounded-xl font-medium text-sm sm:text-base transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <i className="fas fa-arrow-left text-xs sm:text-sm"></i>
                <span>Back to Subjects</span>
              </button>
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-sm ring-1 ring-black/5 p-5 sm:p-6 lg:p-8">
                <div className="flex items-start gap-4 sm:gap-6">
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-${selectedSubject.color}-500 to-${selectedSubject.color}-600 rounded-2xl items-center justify-center text-white flex-shrink-0 font-bold text-xs sm:text-sm flex items-center justify-center shadow-lg ring-1 ring-black/10`}>
                    {selectedSubject.code}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-neutral-900 mb-2 sm:mb-3 tracking-tight">{selectedSubject.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                      <span className="text-neutral-600 font-medium">
                        <i className="fas fa-code text-neutral-400 mr-1.5 text-[10px] sm:text-xs"></i>
                        {selectedSubject.code}
                      </span>
                      <span className={`${!selectedSubject.instructor || selectedSubject.instructor === 'No teacher assigned' ? 'text-neutral-400' : 'text-neutral-600'} font-medium`}>
                        <i className="fas fa-user-tie text-neutral-400 mr-1.5 text-[10px] sm:text-xs"></i>
                        {selectedSubject.instructor || 'No teacher assigned'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Topic Flow: Tabs + Content */}
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-sm ring-1 ring-black/5 p-5 sm:p-6 lg:p-8 mb-4 sm:mb-6">
              {/* Tab Switcher */}
              <div className="mb-4 sm:mb-5 flex w-full bg-neutral-100 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => {
                    setSubjectViewTab('resume');
                    setViewingCompletedTopic(null);
                  }}
                  className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                    subjectViewTab === 'resume'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Resume Learning
                </button>
                <button
                  type="button"
                  onClick={() => setSubjectViewTab('completed')}
                  className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                    subjectViewTab === 'completed'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Completed Topics
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubjectViewTab('subject-tests');
                    setViewingCompletedTopic(null);
                  }}
                  className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                    subjectViewTab === 'subject-tests'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  Subject Tests
                </button>
                </div>
              {isLoadingRecordings || isLoadingTopics ? (
                <div className="space-y-4 py-8">
                  {/* Skeleton for Topic headers and items */}
                  {[1, 2, 3].map((sectionIndex) => (
                    <div key={sectionIndex} className="bg-white rounded-2xl p-6 border border-neutral-200/60 shadow-sm animate-pulse">
                      <div className="h-6 bg-neutral-200 rounded w-1/3 mb-6"></div>
                      <div className="space-y-4 pl-4 border-l-2 border-neutral-100">
                        <div className="h-20 bg-neutral-100 rounded-xl w-full"></div>
                        <div className="h-20 bg-neutral-100 rounded-xl w-5/6"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {(() => {
                    // Group recordings by topic
                    const recordingsByTopic = new Map();
                    const recordingsWithoutTopic = [];
                    
                    recordings.forEach((recording) => {
                      const topicId = recording.topicId?._id || recording.topicId;
                      const topicName = recording.topicId?.name || 'Unknown Topic';
                      
                      if (topicId) {
                        if (!recordingsByTopic.has(topicId)) {
                          recordingsByTopic.set(topicId, {
                            topicId: topicId,
                            topicName: topicName,
                            recordings: []
                          });
                        }
                        recordingsByTopic.get(topicId).recordings.push(recording);
                      } else {
                        recordingsWithoutTopic.push(recording);
                      }
                    });
                    
                    // Create a map of all topics for ordering
                    const topicMap = new Map();
                    currentSubjectTopics.forEach((topic, index) => {
                      topicMap.set(topic._id, { ...topic, order: index });
                    });
                    
                    // Sort topics by their order in currentSubjectTopics
                    const sortedTopics = Array.from(recordingsByTopic.entries())
                      .map(([topicId, data]) => ({
                        ...data,
                        order: topicMap.get(topicId)?.order ?? 999
                      }))
                      .sort((a, b) => a.order - b.order);
                    
                    // Also show topics that have no recordings
                    const topicsWithNoRecordings = currentSubjectTopics
                      .filter(topic => !recordingsByTopic.has(topic._id))
                      .map((topic, index) => ({
                        topicId: topic._id,
                        topicName: topic.name,
                        recordings: [],
                        order: index
                      }));
                    
                    const allTopicSections = [...sortedTopics, ...topicsWithNoRecordings]
                      .sort((a, b) => a.order - b.order);
                    
                    if (allTopicSections.length === 0 && recordingsWithoutTopic.length === 0) {
                      return (
                    <div className="bg-neutral-50/60 border border-neutral-200/60 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center ring-1 ring-black/5">
                      <div className="w-16 h-16 sm:w-20 sm:h-24 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-3xl flex items-center justify-center mx-auto mb-4 ring-1 ring-black/5">
                            <i className="fas fa-video text-neutral-400 text-3xl sm:text-4xl"></i>
                            </div>
                          <p className="text-sm sm:text-base text-neutral-600 font-medium">No classroom sessions available for this subject</p>
                    </div>
                      );
                    }
                    
                    // Group topic-level tests by topicId
                    const testsByTopic = new Map();
                    topicLevelTests.forEach((test) => {
                      const testTopicId = String(test.topicId);
                      if (!testsByTopic.has(testTopicId)) {
                        testsByTopic.set(testTopicId, []);
                      }
                      testsByTopic.get(testTopicId).push(test);
                    });
                    
                    // Separate topics into "Next Up" and "Completed"
                    const nextUpTopics = [];
                    const completedTopics = [];
                    
                    allTopicSections.forEach((section, sectionIndex) => {
                      const sectionTopicId = String(section.topicId || '');
                      const topicTests = testsByTopic.get(sectionTopicId) || [];
                      
                      // Check if all tests for this topic are completed
                      const allTestsCompleted = topicTests.length > 0 && topicTests.every(test => test.status === 'completed');
                      const hasTests = topicTests.length > 0;
                      
                      // Check if previous topics are completed (to unlock this topic)
                      const previousTopicsCompleted = sectionIndex === 0 || allTopicSections.slice(0, sectionIndex).every(prevSection => {
                        const prevTopicId = String(prevSection.topicId || '');
                        const prevTests = testsByTopic.get(prevTopicId) || [];
                        return prevTests.length === 0 || prevTests.every(test => test.status === 'completed');
                      });
                      
                      // Topic is locked if previous topics are not completed
                      const isTopicLocked = !previousTopicsCompleted;
                      
                      // Topic is completed if unlocked and all tests are completed
                      const isTopicCompleted = !isTopicLocked && hasTests && allTestsCompleted;
                      
                      const topicData = {
                        section,
                        sectionIndex,
                        topicTests,
                        allTestsCompleted,
                        hasTests,
                        isTopicLocked,
                        isTopicCompleted
                      };
                      
                      if (isTopicCompleted) {
                        completedTopics.push(topicData);
                      } else {
                        nextUpTopics.push(topicData);
                      }
                    });
                    
                    return (
                      <div className="space-y-8 sm:space-y-10">
                        {/* Next Up Section - Show First Unlocked/Incomplete Topic (Resume tab) */}
                        {subjectViewTab === 'resume' && nextUpTopics.length > 0 && (
                          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl border-2 border-blue-200/60 shadow-lg ring-1 ring-blue-100/50 overflow-hidden">
                            <div className="p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="relative w-12 h-12 sm:w-14 sm:h-14">
                                <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-md"></div>
                                <div className="relative w-full h-full bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg ring-2 ring-blue-200/60">
                                  <i className="fas fa-play text-white text-sm sm:text-base"></i>
                                </div>
                            </div>
                                <div>
                                  <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 tracking-tight">Continue Learning</h2>
                                  <p className="text-xs sm:text-sm text-neutral-600 mt-1">Your next topic to complete</p>
                          </div>
                        </div>
                              
                              {nextUpTopics.map(({ section, sectionIndex, topicTests, allTestsCompleted, hasTests, isTopicLocked }) => {
                                if (isTopicLocked) {
                                  // Show locked topic message (with upcoming topic name)
                                  return (
                                    <div key={section.topicId || `section-${sectionIndex}`} className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-amber-200 p-6 sm:p-8 text-center">
                                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-2 ring-amber-200/50">
                                        <i className="fas fa-lock text-amber-600 text-2xl sm:text-3xl"></i>
                    </div>
                                      <h3 className="text-lg sm:text-xl font-bold text-amber-900 mb-1">Next Topic Locked</h3>
                                      <p className="text-sm sm:text-base font-semibold text-amber-900 mb-2">
                                        {section.topicName}
                                      </p>
                                      <p className="text-sm sm:text-base text-amber-700 mb-4 max-w-md mx-auto">
                                        Complete the assessment for the previous topic to unlock this level.
                                      </p>
                                      {sectionIndex > 0 && (() => {
                                        const prevSection = allTopicSections[sectionIndex - 1];
                                        const prevTopicId = String(prevSection.topicId || '');
                                        const prevTests = testsByTopic.get(prevTopicId) || [];
                                        const incompletePrevTests = prevTests.filter(t => t.status !== 'completed');
                                        return (
                                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg text-sm font-semibold ring-1 ring-amber-300">
                                            <span>Complete {incompletePrevTests.length} {incompletePrevTests.length === 1 ? 'test' : 'tests'} in "{prevSection.topicName}"</span>
                      </div>
                                        );
                                      })()}
                    </div>
                                  );
                                }
                                
                                return (
                                  <div key={section.topicId || `section-${sectionIndex}`} className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-blue-200/60 p-6 sm:p-8 space-y-6">
                                    {/* Topic Header */}
                                    <div className="flex items-center gap-4 pb-4 border-b border-neutral-200/60">
                                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg ring-2 ring-blue-200/50">
                                        {section.order + 1}
                    </div>
                                      <div className="flex-1">
                                        <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight mb-2">
                                          {section.topicName}
                                        </h3>
                                        <div className="flex items-center gap-3">
                                          {section.recordings.length > 0 && (
                                            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full ring-1 ring-blue-200">
                                              {section.recordings.length} {section.recordings.length === 1 ? 'session' : 'sessions'}
                                            </span>
              )}
                                          {topicTests.length > 0 && (
                                            <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ring-1 ${
                                              allTestsCompleted 
                                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' 
                                                : 'bg-amber-50 text-amber-700 ring-amber-200'
                                            }`}>
                                              {topicTests.length} {topicTests.length === 1 ? 'test' : 'tests'}
                                            </span>
              )}
                                        </div>
                                      </div>
            </div>

                                    {/* Recordings */}
                                    {section.recordings.length > 0 && (
                                      <div>
                                        <div className="mb-4 flex items-center justify-between">
                                          <div>
                                            <h4 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">Classroom Sessions</h4>
                                            <p className="text-xs sm:text-sm text-neutral-500 mt-1">Watch all sessions before taking the assessment</p>
                </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                                          {section.recordings.map((recording) => {
                                            return (
                                              <div key={recording._id || recording.id}>
                                                <VideoCard
                                                  video={{
                                                    ...recording,
                                                    title: recording.name || recording.title || 'Untitled Recording',
                                                    link: recording.link,
                                                    description: recording.description,
                                                    duration: recording.duration,
                                                    createdAt: recording.createdAt,
                                                  }}
                onPlay={(link) => {
                  if (!link) {
                    toast.error('No video link available');
                    return;
                  }
                                                    const extractedVideoId = getYouTubeVideoId(link);
                                                    if (extractedVideoId) {
                    setPlayingVideo({
                                                        videoId: extractedVideoId,
                      title: recording?.name || recording?.title || 'Video',
                      duration: recording?.duration,
                                                        topic: section.topicName,
                                                        description: recording?.description,
                    });
                  } else {
                    window.open(link, '_blank', 'noopener,noreferrer');
                  }
                }}
                                                  showMetadata={true}
                                                  showTags={false}
                                                  priority={true}
              />
            </div>
                                            );
                                          })}
                </div>
                  </div>
                                    )}
                                    
                                    {/* Tests */}
                                    {topicTests.length > 0 && (
                                      <div className="pt-4 border-t border-neutral-200/60">
                                        <div className="mb-4 flex items-center justify-between">
                                          <div>
                                            <h4 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">Assessment Tests</h4>
                                            <p className="text-xs sm:text-sm text-neutral-500 mt-1">Complete the assessment to proceed to the next topic</p>
                </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl">
                                          {topicTests.map((test) => (
                                            <div 
                                              key={test.id} 
                                              className="group bg-white rounded-2xl border border-neutral-200/80 ring-1 ring-black/5 overflow-hidden hover:shadow-lg hover:ring-emerald-200/50 transition-all duration-300"
                                            >
                                              <div className="relative bg-gradient-to-br from-neutral-50 to-white p-4 sm:p-5 border-b border-neutral-200/60">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                                                    <h5 className="font-bold text-neutral-900 text-sm sm:text-base mb-2 tracking-tight line-clamp-2">{test.title}</h5>
                                                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                                                      <span className="font-medium">
                                                        {test.questionCount} Questions
                                                      </span>
                                                      {test.score !== undefined && (
                                                        <span className="font-semibold text-emerald-700">
                                                          {test.score}%
                                                        </span>
                              )}
                            </div>
                                                  </div>
                                                  <div className="flex-shrink-0">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${
                                                      test.status === 'completed' ? 'bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200/60' :
                                                      test.status === 'in-progress' ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-200/60' :
                                                      'bg-neutral-100 text-neutral-600 ring-2 ring-neutral-200/60'
                            }`}>
                              {test.status === 'completed' ? 'Completed' :
                               test.status === 'in-progress' ? 'In Progress' :
                               'Pending'}
                            </span>
                          </div>
                                                </div>
                                                {test.description && (
                                                  <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                                                    {test.description}
                                                  </p>
                            )}
                          </div>
                                              
                                              <div className="p-4 sm:p-5 bg-neutral-50/40">
                          {test.status === 'completed' ? (
                            <button
                              onClick={() => handleReviewTest(test)}
                                                    className="w-full px-4 py-2.5 bg-white border-2 border-neutral-300 hover:border-emerald-400 hover:bg-emerald-50 text-neutral-700 hover:text-emerald-700 rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow-md ring-1 ring-black/5 hover:ring-emerald-200/50 active:scale-[0.98] touch-manipulation"
                            >
                              Review Results
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartTest(test)}
                                                    className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 ring-1 ring-emerald-200/50 hover:ring-emerald-300/50 active:scale-[0.98] touch-manipulation"
                            >
                                                    Start Assessment
                            </button>
                          )}
                                              </div>
                        </div>
                      ))}
                    </div>
                    </div>
              )}
            </div>
                                );
                              })}
                            </div>
                    </div>
                  )}
                        
                        {/* Completed Topics Section (Completed tab) */}
                        {subjectViewTab === 'completed' && !isLoadingTests && completedTopics.length > 0 && !viewingCompletedTopic && (
                          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6 sm:p-8">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-emerald-200/50">
                                <i className="fas fa-check-circle text-white text-lg sm:text-xl"></i>
                </div>
                              <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">Completed Topics</h2>
                                <p className="text-sm sm:text-base text-neutral-600 mt-1">{completedTopics.length} {completedTopics.length === 1 ? 'topic' : 'topics'} completed</p>
                  </div>
                </div>
                            
                            <div className="space-y-4">
                              {completedTopics.map(({ section, sectionIndex, topicTests }) => (
                                <button
                                  key={section.topicId || `section-${sectionIndex}`}
                                  onClick={() => setViewingCompletedTopic({ section, sectionIndex, topicTests })}
                                  className="w-full text-left bg-gradient-to-br from-emerald-50/50 to-teal-50/50 rounded-xl border border-emerald-200/60 p-5 sm:p-6 hover:shadow-md hover:border-emerald-300 transition-all group"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-md ring-2 ring-emerald-200/50 group-hover:scale-105 transition-transform">
                                      {section.order + 1}
                                    </div>
                            <div className="flex-1 min-w-0">
                                      <h3 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight mb-1">
                                        {section.topicName}
                                      </h3>
                                      <div className="flex items-center gap-3 text-xs sm:text-sm text-neutral-600">
                                        {section.recordings.length > 0 && (
                            <span className="flex items-center gap-1.5">
                                            <i className="fas fa-video text-emerald-600"></i>
                                            {section.recordings.length} {section.recordings.length === 1 ? 'session' : 'sessions'}
                                          </span>
                                        )}
                                        {topicTests.length > 0 && (
                                          <span className="flex items-center gap-1.5">
                                            <i className="fas fa-check-circle text-emerald-600"></i>
                                            {topicTests.length} {topicTests.length === 1 ? 'test' : 'tests'} completed
                                          </span>
                              )}
                            </div>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center gap-2">
                                      <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full ring-1 ring-emerald-200">
                                        Completed
                            </span>
                                      <i className="fas fa-chevron-right text-emerald-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity"></i>
                          </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Completed Topic Detail View (Completed tab) */}
                        {subjectViewTab === 'completed' && !isLoadingTests && viewingCompletedTopic && (() => {
                          const { section, sectionIndex, topicTests } = viewingCompletedTopic;
                          return (
                            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6 sm:p-8">
                              {/* Back Button and Header */}
                              <div className="mb-6">
                                <button
                                  onClick={() => setViewingCompletedTopic(null)}
                                  className="mb-4 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-medium text-sm transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                                >
                                  <i className="fas fa-arrow-left text-xs"></i>
                                  <span>Back to Completed Topics</span>
                                </button>
                                <div className="flex items-center gap-4 pb-4 border-b border-neutral-200/60">
                                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg ring-2 ring-emerald-200/50">
                                    {section.order + 1}
                                  </div>
                                  <div className="flex-1">
                                    <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight mb-2">
                                      {section.topicName}
                                    </h3>
                                    <div className="flex items-center gap-3">
                                      {section.recordings.length > 0 && (
                                        <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full ring-1 ring-blue-200">
                                          {section.recordings.length} {section.recordings.length === 1 ? 'session' : 'sessions'}
                                        </span>
                                      )}
                                      {topicTests.length > 0 && (
                                        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full ring-1 ring-emerald-200">
                                          {topicTests.length} {topicTests.length === 1 ? 'test' : 'tests'} completed
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Recordings */}
                              {section.recordings.length > 0 && (
                                <div className="mb-8">
                                  <div className="mb-4 flex items-center justify-between">
                                    <div>
                                      <h4 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">Classroom Sessions</h4>
                                      <p className="text-xs sm:text-sm text-neutral-500 mt-1">Review all sessions for this topic</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                                    {section.recordings.map((recording) => {
                                      return (
                                        <div key={recording._id || recording.id}>
                                          <VideoCard
                                            video={{
                                              ...recording,
                                              title: recording.name || recording.title || 'Untitled Recording',
                                              link: recording.link,
                                              description: recording.description,
                                              duration: recording.duration,
                                              createdAt: recording.createdAt,
                                            }}
                                            onPlay={(link) => {
                                              if (!link) {
                                                toast.error('No video link available');
                                                return;
                                              }
                                              const extractedVideoId = getYouTubeVideoId(link);
                                              if (extractedVideoId) {
                                                setPlayingVideo({
                                                  videoId: extractedVideoId,
                                                  title: recording?.name || recording?.title || 'Video',
                                                  duration: recording?.duration,
                                                  topic: section.topicName,
                                                  description: recording?.description
                                                });
                                              } else {
                                                window.open(link, '_blank', 'noopener,noreferrer');
                                              }
                                            }}
                                            showMetadata={true}
                                            showTags={false}
                                          />
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                              
                              {/* Tests */}
                              {topicTests.length > 0 && (
                                <div className="pt-4 border-t border-neutral-200/60">
                                  <div className="mb-4 flex items-center justify-between">
                                    <div>
                                      <h4 className="text-base sm:text-lg font-semibold text-neutral-900 tracking-tight">Assessment Tests</h4>
                                      <p className="text-xs sm:text-sm text-neutral-500 mt-1">Review or retake assessments for this topic</p>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-5xl">
                                    {topicTests.map((test) => (
                                      <div 
                                        key={test.id} 
                                        className="group bg-white rounded-2xl border border-neutral-200/80 ring-1 ring-black/5 overflow-hidden hover:shadow-lg hover:ring-emerald-200/50 transition-all duration-300"
                                      >
                                        <div className="relative bg-gradient-to-br from-neutral-50 to-white p-4 sm:p-5 border-b border-neutral-200/60">
                                          <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex-1 min-w-0">
                                              <h5 className="font-bold text-neutral-900 text-sm sm:text-base mb-2 tracking-tight line-clamp-2">{test.title}</h5>
                                              <div className="flex items-center gap-3 text-xs text-neutral-500">
                                                <span className="font-medium">
                              {test.questionCount} Questions
                            </span>
                            {test.score !== undefined && (
                                                  <span className="font-semibold text-emerald-700">
                                {test.score}%
                              </span>
                            )}
                          </div>
                                            </div>
                                            <div className="flex-shrink-0">
                                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200/60">
                                                Completed
                                              </span>
                                            </div>
                                          </div>
                                          {test.description && (
                                            <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                                              {test.description}
                                            </p>
                                          )}
                                        </div>
                                        
                                        <div className="p-4 sm:p-5 bg-neutral-50/40">
                                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReviewTest(test)}
                                              className="flex-1 px-4 py-2.5 bg-white border-2 border-neutral-300 hover:border-emerald-400 hover:bg-emerald-50 text-neutral-700 hover:text-emerald-700 rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm hover:shadow-md ring-1 ring-black/5 hover:ring-emerald-200/50 active:scale-[0.98] touch-manipulation"
                            >
                                              Review
                            </button>
                            <button
                              onClick={() => handleStartTest(test)}
                                              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg font-semibold text-sm shadow-lg hover:shadow-xl transition-all duration-200 ring-1 ring-emerald-200/50 hover:ring-emerald-300/50 active:scale-[0.98] touch-manipulation"
                            >
                                              Retake
                            </button>
                                          </div>
                                        </div>
                        </div>
                      ))}
                    </div>
                      </div>
                              )}
                            </div>
                          );
                        })()}
                        
                        {/* Recordings without topic (only in Resume tab) */}
                        {subjectViewTab === 'resume' && !isLoadingTests && recordingsWithoutTopic.length > 0 && (
                          <div className="space-y-3 sm:space-y-4 pt-4 border-t border-neutral-200/60">
                            <div className="flex items-center gap-3 sm:gap-4 pb-2 border-b border-neutral-200/60">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-neutral-400 to-neutral-500 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0 shadow-md ring-1 ring-black/10">
                                <i className="fas fa-folder text-xs sm:text-sm"></i>
                </div>
                              <h3 className="font-semibold text-neutral-900 text-base sm:text-lg md:text-xl tracking-tight">
                                Other Classroom Sessions
                              </h3>
                              <span className="ml-auto px-2.5 py-1 bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-full ring-1 ring-neutral-200">
                                {recordingsWithoutTopic.length} {recordingsWithoutTopic.length === 1 ? 'session' : 'sessions'}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 pl-0 sm:pl-2 md:pl-4">
                              {recordingsWithoutTopic.map((recording) => {
                                const videoId = getYouTubeVideoId(recording.link);
                                return (
                                  <div key={recording._id || recording.id}>
                                    <VideoCard
                                      video={{
                                        ...recording,
                                        title: recording.name || recording.title || 'Untitled Recording',
                                        link: recording.link,
                                        description: recording.description,
                                        duration: recording.duration,
                                        createdAt: recording.createdAt,
                                      }}
                onPlay={(link) => {
                  if (!link) {
                    toast.error('No video link available');
                    return;
                  }
                                        const extractedVideoId = getYouTubeVideoId(link);
                                        if (extractedVideoId) {
                    setPlayingVideo({
                                            videoId: extractedVideoId,
                      title: recording?.name || recording?.title || 'Video',
                      duration: recording?.duration,
                                            topic: 'General',
                      description: recording?.description
                    });
                  } else {
                    window.open(link, '_blank', 'noopener,noreferrer');
                  }
                }}
                                      showMetadata={true}
                                      showTags={false}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                    </div>
                  )}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            {/* Subject-Level Tests (shown only in Subject Tests tab) */}
            {subjectViewTab === 'subject-tests' && (
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-sm ring-1 ring-black/5 p-5 sm:p-6 lg:p-8 mt-4 sm:mt-6">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-neutral-900 mb-4 sm:mb-6 flex items-center gap-3 tracking-tight">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-black/5">
                    <i className="fas fa-clipboard-check text-white text-sm sm:text-base"></i>
                </div>
                  <span>Subject-Level Tests</span>
              </h2>
              {isLoadingTests ? (
                <div className="flex items-center justify-center py-12 sm:py-16">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-neutral-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm sm:text-base text-neutral-600 font-medium">Loading tests...</p>
                  </div>
                </div>
              ) : (
                <>
                    {subjectLevelTests.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                        {subjectLevelTests.map((test) => (
                          <div
                            key={test.id}
                            className="bg-neutral-50/60 rounded-xl sm:rounded-2xl border border-neutral-200/60 ring-1 ring-black/5 p-4 sm:p-5 hover:shadow-md hover:ring-black/10 transition-all"
                          >
                          <div className="flex items-start justify-between mb-3 sm:mb-4">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-neutral-900 text-base sm:text-lg mb-1.5 sm:mb-2 tracking-tight">
                                  {test.title}
                                </h3>
                              {test.description && (
                                  <p className="text-sm sm:text-base text-neutral-600 mb-2 sm:mb-3 line-clamp-2 leading-relaxed">
                                    {test.description}
                                  </p>
                              )}
                            </div>
                              <span
                                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold flex-shrink-0 ml-2 ${
                                  test.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                    : test.status === 'in-progress'
                                    ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                                    : 'bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200'
                                }`}
                              >
                                {test.status === 'completed'
                                  ? 'Completed'
                                  : test.status === 'in-progress'
                                  ? 'In Progress'
                                  : 'Pending'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-neutral-600 mb-3 sm:mb-4 font-medium">
                            <span className="flex items-center gap-1.5">
                              <i className="fas fa-question-circle text-[10px] sm:text-xs"></i>
                              {test.questionCount} Questions
                            </span>
                            {test.score !== undefined && (
                              <span className="flex items-center gap-1.5 font-semibold text-neutral-900">
                                <i className="fas fa-star text-[10px] sm:text-xs"></i>
                                {test.score}%
                              </span>
                            )}
                          </div>
                          {test.status === 'completed' ? (
                            <button
                              onClick={() => handleReviewTest(test)}
                              className="w-full px-4 py-2.5 sm:py-3 border border-neutral-300 hover:bg-neutral-50 text-neutral-700 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-sm hover:shadow-md ring-1 ring-black/5 active:scale-[0.98] touch-manipulation"
                            >
                              Review Results
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStartTest(test)}
                                className="w-full px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 ring-1 ring-black/10 active:scale-[0.98] touch-manipulation"
                            >
                              <i className="fas fa-play-circle text-xs sm:text-sm"></i>
                              <span>Attend Test</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-neutral-50/60 border border-neutral-200/60 rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center ring-1 ring-black/5">
                      <div className="w-16 h-16 sm:w-20 sm:h-24 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-3xl flex items-center justify-center mx-auto mb-4 ring-1 ring-black/5">
                          <i className="fas fa-clipboard-check text-neutral-400 text-3xl sm:text-4xl"></i>
                      </div>
                        <p className="text-sm sm:text-base text-neutral-600 font-medium">
                          No subject-level tests available
                        </p>
                    </div>
                  )}
                </>
              )}
            </div>
            )}
          </div>
        ) : (
          /* Subjects List View - Professional Course Catalog Design */
          <>
            {/* Main Content Container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
              {/* Virtual Meet Card - Desktop/Tablet (shown before header) */}
              <div ref={virtualMeetCardRef} className="mb-6 md:mb-8 hidden sm:block">
                <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-lg ring-1 ring-blue-500/40 px-5 py-4 sm:px-7 sm:py-5 lg:px-8 lg:py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/10 flex items-center justify-center shadow-md">
                      <i className="fas fa-video text-white text-base sm:text-lg"></i>
                  </div>
                  <div>
                      <p className="text-[11px] sm:text-xs font-semibold text-blue-100/90 uppercase tracking-wide mb-1">
                        Next Virtual Classroom Meet
                      </p>
                      <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-white leading-tight">
                        {isLoadingNextVirtualSession
                          ? "Loading..."
                          : nextVirtualSession
                            ? (nextVirtualSession.name || "Upcoming Session")
                            : "No upcoming meet scheduled"}
                      </p>
                      <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
                        {nextVirtualSession
                          ? formatVirtualSessionDateTime(nextVirtualSession)
                          : "You’ll see your next invite here once it’s scheduled."}
                      </p>
                  </div>
                </div>
                  <div className="flex flex-col sm:items-end gap-2 min-w-[200px]">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!nextVirtualSession?.meetLink) {
                          toast.error("Meeting link not updated yet.");
                          return;
                        }
                        if (hasMarkedVirtualAttendance) {
                          setHasMarkedVirtualAttendance(false);
                          toast.success("Copied state cleared.");
                          return;
                        }
                        try {
                          if (navigator?.clipboard?.writeText) {
                            await navigator.clipboard.writeText(nextVirtualSession.meetLink);
                            toast.success("Meeting link copied.");
                          } else {
                            toast.success("Meeting link ready.");
                          }
                        } catch (err) {
                          console.error("Failed to copy meeting link:", err);
                          toast.error("Failed to copy link.");
                          return;
                        }
                        setHasMarkedVirtualAttendance(true);
                      }}
                      className={`inline-flex items-center justify-center px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg active:scale-[0.97] transition-all ${
                        hasMarkedVirtualAttendance
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                          : "bg-white text-blue-700 hover:bg-blue-50"
                      }`}
                    >
                      <i
                        className={`mr-2 text-xs sm:text-sm ${
                          hasMarkedVirtualAttendance ? "fas fa-check text-emerald-600" : "fas fa-copy text-blue-600"
                        }`}
                      ></i>
                      {hasMarkedVirtualAttendance ? "Link Copied" : "Copy Link"}
                    </button>
                    <p className="text-[11px] sm:text-xs text-blue-100/80">
                      {hasMarkedVirtualAttendance
                        ? "Share this link if you need it later."
                        : "Copy the link when it’s available."}
                    </p>
                </div>
              </div>
            </div>

              {/* Header Section - Matching Image Design */}
              <div className="text-center mb-8 md:mb-12">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-3 md:mb-4">
                  Browse Our Popular{' '}
                  <span className="inline-block bg-red-500 text-white px-3 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl">
                    Course
                  </span>
                </h1>
                <p className="text-sm md:text-base lg:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
                  Education is the process of acquiring knowledge, developing the power of judgement, and prepare to live a standard life.
                </p>
              </div>

              {/* Virtual Meet Card - Mobile (shown after header text) */}
              <div className="mb-6 md:mb-8 sm:hidden">
                <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-lg ring-1 ring-blue-500/40 px-5 py-4 flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shadow-md">
                      <i className="fas fa-video text-white text-base"></i>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-blue-100/90 uppercase tracking-wide mb-1">
                        Next Virtual Classroom Meet
                      </p>
                      <p className="text-lg font-semibold text-white leading-tight">
                        {isLoadingNextVirtualSession
                          ? "Loading..."
                          : nextVirtualSession
                            ? (nextVirtualSession.name || "Upcoming Session")
                            : "No upcoming meet scheduled"}
                      </p>
                      <p className="text-xs text-blue-100/90 mt-1">
                        {nextVirtualSession
                          ? formatVirtualSessionDateTime(nextVirtualSession)
                          : "You’ll see your next invite here once it’s scheduled."}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 min-w-[180px]">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!nextVirtualSession?.meetLink) {
                          toast.error("Meeting link not updated yet.");
                          return;
                        }
                        if (hasMarkedVirtualAttendance) {
                          setHasMarkedVirtualAttendance(false);
                          toast.success("Copied state cleared.");
                          return;
                        }
                        try {
                          if (navigator?.clipboard?.writeText) {
                            await navigator.clipboard.writeText(nextVirtualSession.meetLink);
                            toast.success("Meeting link copied.");
                          } else {
                            toast.success("Meeting link ready.");
                          }
                        } catch (err) {
                          console.error("Failed to copy meeting link:", err);
                          toast.error("Failed to copy link.");
                          return;
                        }
                        setHasMarkedVirtualAttendance(true);
                      }}
                      className={`inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md hover:shadow-lg active:scale-[0.97] transition-all ${
                        hasMarkedVirtualAttendance
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                          : "bg-white text-blue-700 hover:bg-blue-50"
                      }`}
                    >
                      <i
                        className={`mr-2 text-xs ${
                          hasMarkedVirtualAttendance ? "fas fa-check text-emerald-600" : "fas fa-copy text-blue-600"
                        }`}
                      ></i>
                      {hasMarkedVirtualAttendance ? "Link Copied" : "Copy Link"}
                    </button>
                    <p className="text-[11px] text-blue-100/80">
                      {hasMarkedVirtualAttendance
                        ? "Share this link if you need it later."
                        : "Copy the link when it’s available."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Department, Class, Section Info - Compact Bar */}
              {(departmentInfo || classInfo || sectionInfo) && (
                <div className="mb-6 md:mb-8">
                  <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 md:p-5 max-w-4xl mx-auto">
                    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                      {departmentInfo && (
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-sm ring-1 ring-black/5 flex-shrink-0">
                            <i className="fas fa-university text-white text-xs md:text-sm"></i>
                  </div>
                  <div>
                            <p className="text-[10px] md:text-xs font-medium text-neutral-500 uppercase tracking-wide">
                              Department
                            </p>
                            <p className="text-sm md:text-base font-semibold text-neutral-900">
                              {departmentInfo.name || 'N/A'}
                            </p>
                  </div>
                </div>
                      )}
                      {classInfo && (
                        <>
                          <div className="hidden md:block w-px h-8 bg-neutral-200"></div>
                          <div>
                            <p className="text-[10px] md:text-xs font-medium text-neutral-500 uppercase tracking-wide">
                              Class
                            </p>
                            <p className="text-sm md:text-base font-semibold text-neutral-900">
                              {classInfo.name || 'N/A'}
                            </p>
              </div>
                        </>
                      )}
                      {sectionInfo && (
                        <>
                          <div className="hidden md:block w-px h-8 bg-neutral-200"></div>
                          <div>
                            <p className="text-[10px] md:text-xs font-medium text-neutral-500 uppercase tracking-wide">
                              Section
                            </p>
                            <p className="text-sm md:text-base font-semibold text-neutral-900">
                              {sectionInfo.name || 'N/A'}
                            </p>
            </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Filter and Search Bar - Matching Image Design */}
              <div className="mb-6 md:mb-8">
                <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-4 md:mb-6">
                  <button
                    onClick={() => setSelectedFilter('all')}
                    className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-sm md:text-base transition-all ${
                      selectedFilter === 'all'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300 hover:shadow-sm'
                    }`}
                  >
                    All Course
                  </button>
                  <button
                    onClick={() => setSelectedFilter('active')}
                    className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-sm md:text-base transition-all flex items-center gap-2 ${
                      selectedFilter === 'active'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300 hover:shadow-sm'
                    }`}
                  >
                    <i className="fas fa-briefcase text-xs"></i>
                    Active
                  </button>
                  <button
                    onClick={() => setSelectedFilter('completed')}
                    className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-sm md:text-base transition-all flex items-center gap-2 ${
                      selectedFilter === 'completed'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300 hover:shadow-sm'
                    }`}
                  >
                    <i className="fas fa-check-circle text-xs"></i>
                    Completed
                  </button>
                </div>
                <div className="max-w-md mx-auto">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 md:px-5 py-2.5 md:py-3 bg-white border border-neutral-200 rounded-full text-sm md:text-base text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all pr-10 md:pr-12"
                    />
                    <i className="fas fa-search absolute right-4 md:right-5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm md:text-base"></i>
                  </div>
                </div>
              </div>

              {/* Course Cards Grid - Matching Image Design */}
              {subjects.length > 0 ? (
                (() => {
                  // Filter subjects based on search and filter
                  let filteredSubjects = subjects;
                  
                  if (searchQuery) {
                    filteredSubjects = filteredSubjects.filter(subject =>
                      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (subject.instructor && subject.instructor.toLowerCase().includes(searchQuery.toLowerCase()))
                    );
                  }

                  if (filteredSubjects.length === 0) {
                    return (
                      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-12 text-center">
                        <i className="fas fa-search text-neutral-400 text-4xl mb-4"></i>
                        <p className="text-neutral-600 font-medium">No courses found matching your search.</p>
                      </div>
                    );
                  }

                  // Re-order so that the subject currently being viewed/assessed appears first,
                  // while preserving the original order (as set by admin) for the rest.
                  let orderedSubjects = filteredSubjects;
                  if (currentSubjectId) {
                    const idx = filteredSubjects.findIndex((s) => s._id === currentSubjectId);
                    if (idx > 0) {
                      const copy = filteredSubjects.slice();
                      const [currentFirst] = copy.splice(idx, 1);
                      orderedSubjects = [currentFirst, ...copy];
                    }
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                      {orderedSubjects.map((subject, index) => {
                        const metrics = subjectMetrics[subject._id] || {
                          topicsCount: 0,
                          recordingsCount: 0,
                          assessmentsCount: 0,
                          hours: 0
                        };

                        // Get instructor initials for avatar
                        const getInitials = (name) => {
                          if (!name || name === 'No teacher assigned') return 'NA';
                          return name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2);
                        };

                        const instructorInitials = getInitials(subject.instructor);

                        return (
                    <div
                      key={subject._id}
                            className="group relative bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-lg hover:border-neutral-300 transition-all cursor-pointer"
                      onClick={() => handleViewSubjectDetail(subject)}
                    >
                            {/* Recommended Badge (for first 2 courses) */}
                            {index < 2 && (
                              <div className="absolute top-4 left-4 z-10 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                                Recommended
                          </div>
                            )}

                            {/* Instructor Image Section - Circular Cutout Style */}
                            <div className="relative h-48 md:h-56 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 overflow-hidden">
                              {/* Background Pattern */}
                              <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-4 right-4 text-6xl font-bold text-blue-300">{subject.code}</div>
                                <div className="absolute bottom-4 left-4 text-4xl font-bold text-purple-300">{metrics.topicsCount}</div>
                              </div>
                              
                              {/* Circular Instructor Avatar */}
                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                                <div className="w-24 h-24 md:w-28 md:h-28 bg-white rounded-full p-1 shadow-xl ring-4 ring-white">
                                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl md:text-2xl">
                                    {instructorInitials}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Course Content */}
                            <div className="pt-12 md:pt-14 pb-4 md:pb-5 px-4 md:px-5">
                              {/* Course Title */}
                              <h3 className="text-base md:text-lg font-bold text-neutral-900 mb-2 line-clamp-2 min-h-[3rem]">
                                {subject.name}
                              </h3>

                              {/* Description */}
                              <p className="text-xs md:text-sm text-neutral-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                                {subject.description || 'Explore comprehensive course content designed to enhance your learning experience and skills.'}
                              </p>

                              {/* Instructor */}
                              <p className="text-xs md:text-sm text-neutral-500 mb-4">
                                By: <span className="font-semibold text-neutral-700">{subject.instructor || 'TBA'}</span>
                              </p>

                              {/* Level Badge */}
                              <div className="mb-4">
                                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
                                  Beginner
                              </span>
                            </div>

                              {/* Metrics - Compact Display */}
                              <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-neutral-50 rounded-xl border border-neutral-200/50">
                                <div className="text-center">
                                  <p className="text-base md:text-lg font-bold text-neutral-900">{metrics.topicsCount}</p>
                                  <p className="text-[9px] md:text-[10px] text-neutral-500 uppercase">Topics</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-base md:text-lg font-bold text-neutral-900">{metrics.recordingsCount}</p>
                                  <p className="text-[9px] md:text-[10px] text-neutral-500 uppercase">Sessions</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-base md:text-lg font-bold text-neutral-900">{metrics.assessmentsCount}</p>
                                  <p className="text-[9px] md:text-[10px] text-neutral-500 uppercase">Tests</p>
                                </div>
                              </div>

                              {/* Tags */}
                              <div className="flex flex-wrap gap-2 mb-4">
                                <span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded-full text-[10px] md:text-xs font-medium">
                                  Events
                                </span>
                                <span className="px-2.5 py-1 bg-neutral-100 text-neutral-600 rounded-full text-[10px] md:text-xs font-medium">
                                  Beginners
                                </span>
                              </div>

                              {/* View Course Button */}
                              <button className="w-full py-2.5 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm md:text-base transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 group-hover:bg-blue-700">
                                <span>View Course</span>
                                <i className="fas fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-12 md:p-16 text-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-3xl flex items-center justify-center mx-auto mb-4 ring-1 ring-black/5">
                    <i className="fas fa-graduation-cap text-neutral-400 text-3xl md:text-4xl"></i>
                  </div>
                  <h3 className="text-xl md:text-2xl font-semibold text-neutral-900 tracking-tight mb-2 md:mb-3">No Courses Available</h3>
                  <p className="text-sm md:text-base text-neutral-600 leading-relaxed font-normal mb-4">
                    {!user?.organizationId || !assignment?._id 
                      ? 'Please wait while we load your course information...'
                      : 'You don\'t have any courses assigned yet. Please contact your administrator.'}
                  </p>
                  {(!user?.organizationId || !assignment?._id) && (
                    <div className="text-xs md:text-sm text-neutral-500 mt-4 font-medium">
                      <p>Missing data: {!user?.organizationId && 'User organization '}{!assignment?._id && 'Assignment'}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Video Player Modal - Available in all views */}
      <VideoPlayerModal
        video={playingVideo}
        onClose={handleCloseVideo}
      />
    </>
  );
};

export default MyCourses;