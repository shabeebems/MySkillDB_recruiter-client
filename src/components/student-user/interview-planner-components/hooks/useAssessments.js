import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { getRequest, postRequest } from '../../../../api/apiRequests';

export const useAssessments = (user) => {
  const [jobLevelAssessments, setJobLevelAssessments] = useState([]);
  const [skillLevelTests, setSkillLevelTests] = useState([]);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [isAssessmentActive, setIsAssessmentActive] = useState(false);
  const [showAssessmentResult, setShowAssessmentResult] = useState(false);
  const [assessmentResultData, setAssessmentResultData] = useState(null);
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false);
  const [viewingCompletedAssessment, setViewingCompletedAssessment] = useState(null);

  const fetchJobAssessments = async (jobId, skills = []) => {
    if (!jobId || !user?._id || !user?.organizationId) {
      setJobLevelAssessments([]);
      setSkillLevelTests([]);
      return;
    }

    try {
      setIsLoadingAssessments(true);
      
      const jobResponse = await getRequest(
        `/student-test-history/tests/job/${jobId}?userId=${user._id}&organizationId=${user.organizationId}`
      );
      
      let transformedJobLevel = [];
      if (jobResponse.data?.success && jobResponse.data?.data) {
        const assessmentsData = jobResponse.data.data || [];
        
        const jobLevel = assessmentsData.filter((item) => {
          const test = item.testId || item.test;
          const hasSkillId = test?.skillId || test?.skillId?._id || item.skillId;
          return !hasSkillId;
        });
        
        transformedJobLevel = jobLevel.map((item) => {
          const test = item.testId || item.test;
          let status = 'pending';
          if (item.status === 'Completed') {
            status = 'completed';
          } else if (item.status === 'Pending' && item.startedAt) {
            status = 'in-progress';
          }
          
          return {
            id: item._id,
            testId: test?._id || item.testId,
            title: test?.title || item.testName || 'Assessment',
            description: test?.description || '',
            difficulty: test?.difficulty || 'intermediate',
            questionCount: item.questionCount || test?.questionCount || 0,
            duration: test?.duration || 30,
            status: status,
            score: item.score,
            completedDate: item.completedDate,
          };
        });
      }
      
      const allSkillLevelTests = [];
      if (skills && skills.length > 0) {
        const skillTestPromises = skills.map(async (skill) => {
          const skillId = skill._id || skill.id;
          if (!skillId) return [];
          
          try {
            const skillResponse = await getRequest(
              `/student-test-history/tests/job/${jobId}?skillId=${skillId}&userId=${user._id}&organizationId=${user.organizationId}`
            );
            
            if (skillResponse.data?.success && skillResponse.data?.data) {
              const skillAssessments = skillResponse.data.data || [];
              
              return skillAssessments.map((item) => {
                const test = item.testId || item.test;
                let status = 'pending';
                if (item.status === 'Completed') {
                  status = 'completed';
                } else if (item.status === 'Pending' && item.startedAt) {
                  status = 'in-progress';
                }
                
                return {
                  id: item._id,
                  testId: test?._id || item.testId,
                  skillId: skillId,
                  skillName: skill.name || skill.title || 'Unknown Skill',
                  title: test?.title || item.testName || 'Test',
                  description: test?.description || '',
                  difficulty: test?.difficulty || 'intermediate',
                  questionCount: item.questionCount || test?.questionCount || 0,
                  duration: test?.duration || 30,
                  status: status,
                  score: item.score,
                  completedDate: item.completedDate,
                };
              });
            }
            return [];
          } catch (error) {
            console.error(`Error fetching tests for skill ${skillId}:`, error);
            return [];
          }
        });
        
        const skillTestResults = await Promise.all(skillTestPromises);
        skillTestResults.forEach(tests => {
          allSkillLevelTests.push(...tests);
        });
      }
      
      setJobLevelAssessments(transformedJobLevel);
      setSkillLevelTests(allSkillLevelTests);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      setJobLevelAssessments([]);
      setSkillLevelTests([]);
    } finally {
      setIsLoadingAssessments(false);
    }
  };

  const handleStartAssessment = async (assessment) => {
    try {
      setIsLoadingAssessments(true);
      
      const testId = assessment.testId;
      if (!testId) {
        toast.error('Test ID not found');
        return;
      }
      
      const response = await getRequest(`/tests/${testId}`);
      if (response.data?.success && response.data?.data) {
        const testData = response.data.data;
        const testDetails = testData.test || testData;
        const testQuestions = testData.questions || [];
        
        const transformedQuestions = testQuestions.map((q, index) => {
          const correctAnswerText = q.correctAnswer || '';
          const correctAnswerIndex = q.options?.findIndex(opt => opt === correctAnswerText) ?? -1;
          
          return {
            id: q._id || `q${index + 1}`,
            question: q.questionText || '',
            options: q.options || [],
            correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
          };
        });
        
        const fullAssessment = {
          ...assessment,
          _id: testId,
          testId: testId,
          title: testDetails.title || assessment.title || 'Assessment',
          questions: transformedQuestions,
          duration: testDetails.duration || 30,
          passingScore: testDetails.passingScore || 70,
          questionCount: transformedQuestions.length,
          studentTestHistoryId: assessment.id,
        };
        
        setSelectedAssessment(fullAssessment);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setIsAssessmentActive(true);
        setShowAssessmentResult(false);
        setAssessmentResultData(null);
        toast.success('Assessment started!');
      } else {
        toast.error('Failed to load test details');
      }
    } catch (error) {
      console.error('Error fetching test details:', error);
      toast.error('Failed to load test details');
    } finally {
      setIsLoadingAssessments(false);
    }
  };

  const handleAnswerSelect = (questionId, answerIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNextQuestion = () => {
    if (selectedAssessment && currentQuestionIndex < selectedAssessment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitAssessment = async (viewingJobId, onRefresh) => {
    if (!selectedAssessment || isSubmittingAssessment) return;
    
    setIsSubmittingAssessment(true);
    
    try {
      let correctCount = 0;
      const answerRecords = selectedAssessment.questions.map(question => {
        const userAnswerIndex = userAnswers[question.id];
        const isCorrect = userAnswerIndex === question.correctAnswer;
        if (isCorrect) {
          correctCount++;
        }
        
        return {
          questionId: question.id,
          selectedAnswer: userAnswerIndex !== undefined ? question.options[userAnswerIndex] : '',
          isCorrect: isCorrect
        };
      });

      const score = Math.round((correctCount / selectedAssessment.questions.length) * 100);
      const passed = score >= (selectedAssessment.passingScore || 70);

      if (selectedAssessment.studentTestHistoryId) {
        try {
          await postRequest(
            `/student-test-history/${selectedAssessment.studentTestHistoryId}/complete`,
            {
              answers: answerRecords,
              score,
              correctAnswers: correctCount,
              totalQuestions: selectedAssessment.questions.length
            }
          );
        } catch (error) {
          console.error('Error saving test results:', error);
          toast.error('Failed to save test results');
        }
      }

      setAssessmentResultData({
        score,
        correctAnswers: correctCount,
        totalQuestions: selectedAssessment.questions.length,
        passed
      });
      
      setShowAssessmentResult(true);
      setIsAssessmentActive(false);
      
      if (viewingJobId && onRefresh) {
        await onRefresh(viewingJobId);
      }
      
      toast.success(`Assessment completed! Score: ${score}%`);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Failed to submit assessment');
    } finally {
      setIsSubmittingAssessment(false);
    }
  };

  const handleReviewAssessment = async (assessment, viewingJobId) => {
    try {
      setIsLoadingAssessments(true);
      
      const answersResponse = await getRequest(`/student-test-history/${assessment.id}`);
      
      if (!answersResponse.data?.success || !answersResponse.data?.data) {
        toast.error('Failed to load assessment details');
        return;
      }

      const studentAnswers = answersResponse.data.data || [];
      
      const testResponse = await getRequest(`/tests/${assessment.testId}`);
      if (!testResponse.data?.success || !testResponse.data?.data) {
        toast.error('Failed to load test details');
        return;
      }

      const testData = testResponse.data.data;
      const testDetails = testData.test || testData;
      const testQuestions = testData.questions || [];
      
      const skillMap = new Map();
      if (viewingJobId) {
        try {
          const skillIds = [...new Set(
            testQuestions
              .map(q => q.skillId?._id || q.skillId)
              .filter(id => id !== null && id !== undefined)
          )];
          
          if (skillIds.length > 0) {
            const skillsResponse = await getRequest(`/skills/job/${viewingJobId}`);
            if (skillsResponse.data?.success && skillsResponse.data?.data) {
              const skills = skillsResponse.data.data || [];
              skills.forEach(skill => {
                skillMap.set(String(skill._id), skill.name || skill.title);
              });
            }
          }
        } catch (error) {
          console.error('Error fetching skills:', error);
        }
      }
      
      const answersMap = new Map();
      studentAnswers.forEach(answer => {
        const questionId = answer.questionId?._id || answer.questionId;
        if (questionId) {
          answersMap.set(String(questionId), answer);
        }
      });
      
      const transformedQuestions = testQuestions.map((q, index) => {
        const questionId = q._id || `q${index + 1}`;
        const studentAnswer = answersMap.get(String(q._id));
        const correctAnswerText = q.correctAnswer || '';
        const correctAnswerIndex = q.options?.findIndex(opt => opt === correctAnswerText) ?? -1;
        
        let userAnswerIndex = -1;
        if (studentAnswer?.selectedAnswer) {
          userAnswerIndex = q.options?.findIndex(opt => opt === studentAnswer.selectedAnswer) ?? -1;
        }
        
        const skillId = q.skillId?._id || q.skillId || null;
        const topicId = q.topicId?._id || q.topicId || null;
        
        const skillName = skillId 
          ? (skillMap.get(String(skillId)) || q.skillId?.name || 'General')
          : (q.topicId?.name || 'General');
        
        return {
          id: questionId,
          question: q.questionText || '',
          options: q.options || [],
          correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
          userAnswer: userAnswerIndex >= 0 ? userAnswerIndex : null,
          isCorrect: studentAnswer?.isCorrect || false,
          skillId: skillId || topicId,
          topicId: topicId,
          skill: skillName,
          topic: skillName,
        };
      });
      
      const reviewAnswers = {};
      transformedQuestions.forEach(q => {
        if (q.userAnswer !== null && q.userAnswer !== undefined) {
          reviewAnswers[q.id] = q.userAnswer;
        }
      });
      
      const fullAssessment = {
        ...assessment,
        _id: assessment.testId,
        testId: assessment.testId,
        title: testDetails.title || assessment.title || 'Assessment',
        questions: transformedQuestions,
        userAnswers: reviewAnswers,
        score: assessment.score,
        totalQuestions: transformedQuestions.length,
        correctAnswers: studentAnswers.filter(a => a.isCorrect).length,
        passingScore: testDetails.passingScore || 70,
        completedDate: assessment.completedDate,
      };
      
      setViewingCompletedAssessment(fullAssessment);
      setSelectedAssessment(null);
      setIsAssessmentActive(false);
      setShowAssessmentResult(false);
      setAssessmentResultData(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error fetching assessment review:', error);
      toast.error('Failed to load assessment review');
    } finally {
      setIsLoadingAssessments(false);
    }
  };

  const handleCloseAssessment = () => {
    setSelectedAssessment(null);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setIsAssessmentActive(false);
    setShowAssessmentResult(false);
    setAssessmentResultData(null);
    setViewingCompletedAssessment(null);
  };

  return {
    jobLevelAssessments,
    skillLevelTests,
    isLoadingAssessments,
    selectedAssessment,
    currentQuestionIndex,
    userAnswers,
    isAssessmentActive,
    showAssessmentResult,
    assessmentResultData,
    isSubmittingAssessment,
    viewingCompletedAssessment,
    fetchJobAssessments,
    handleStartAssessment,
    handleAnswerSelect,
    handleNextQuestion,
    handlePreviousQuestion,
    handleSubmitAssessment,
    handleReviewAssessment,
    handleCloseAssessment,
    setSelectedAssessment,
    setCurrentQuestionIndex,
    setUserAnswers,
    setIsAssessmentActive,
    setShowAssessmentResult,
    setAssessmentResultData,
    setViewingCompletedAssessment
  };
};

