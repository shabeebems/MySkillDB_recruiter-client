import { useState, useEffect, useCallback } from 'react';
import { getRequest } from '../api/apiRequests';
import toast from 'react-hot-toast';

const mapDifficulty = (d) => {
  if (!d) return "Medium";
  const v = String(d).toLowerCase();
  if (v === "easy") return "Easy";
  if (v === "hard") return "Hard";
  return "Medium";
};

const mapTest = (t, type) => ({
  _id: t._id,
  title: t.name,
  description: t.description,
  subjectId: t.subjectId,
  jobId: t.jobId,
  topicIds: t.topicId ? [t.topicId] : (Array.isArray(t.topicIds) ? t.topicIds : []),
  skillIds: t.skillId ? [t.skillId] : (Array.isArray(t.skillIds) ? t.skillIds : []),
  difficulty: String(t.difficultyLevel || "").toLowerCase(),
  questionCount: Array.isArray(t.questions) ? t.questions.length : (t.questionCount || 0),
  createdAt: t.createdAt,
  type,
});

export const useTestData = (organizationId) => {
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [subjectTopics, setSubjectTopics] = useState([]);
  const [jobSkills, setJobSkills] = useState([]);
  const [subjectTests, setSubjectTests] = useState([]);
  const [subjectTopicTests, setSubjectTopicTests] = useState([]);
  const [jobTests, setJobTests] = useState([]);
  const [jobSkillTests, setJobSkillTests] = useState([]);
  const [allJobTestsForStats, setAllJobTestsForStats] = useState([]);
  const [allSkillTestsForStats, setAllSkillTestsForStats] = useState([]);

  const fetchDepartments = useCallback(async () => {
    try {
      if (!organizationId) return;
      const response = await getRequest(`/organization-setup/departments/${organizationId}`);
      setDepartments(response?.data?.data || []);
    } catch (error) {
      toast.error("Failed to load departments");
      setDepartments([]);
    }
  }, [organizationId]);

  const fetchSubjects = useCallback(async (departmentId) => {
    try {
      if (!organizationId || !departmentId || departmentId === 'all') {
        setSubjects([]);
        return;
      }
      const response = await getRequest(
        `/organization-setup/subjects/${organizationId}/${departmentId}`
      );
      setSubjects(response?.data?.data || []);
    } catch (error) {
      toast.error("Failed to load subjects");
      setSubjects([]);
    }
  }, [organizationId]);

  const fetchAllSubjects = useCallback(async (deptList) => {
    try {
      if (!organizationId || !deptList || deptList.length === 0) {
        setSubjects([]);
        return;
      }
      const subjectMap = new Map();
      for (const dept of deptList) {
        try {
          const response = await getRequest(
            `/organization-setup/subjects/${organizationId}/${dept._id}`
          );
          (response?.data?.data || []).forEach((subject) => {
            if (!subjectMap.has(subject._id)) {
              subjectMap.set(subject._id, subject);
            }
          });
        } catch (error) {
          // Silently fail for individual departments
        }
      }
      setSubjects(Array.from(subjectMap.values()));
    } catch (error) {
      toast.error("Failed to load subjects");
      setSubjects([]);
    }
  }, [organizationId]);

  const fetchJobs = useCallback(async (departmentId) => {
    try {
      if (!organizationId || !departmentId || departmentId === 'all') {
        setJobs([]);
        return;
      }
      const response = await getRequest(
        `/jobs/organization/${organizationId}?departmentId=${departmentId}`
      );
      const apiJobs = response?.data?.data?.jobs || response?.data?.data || [];

      // Only include active jobs for job-level tests
      const activeJobs = apiJobs.filter(
        (job) => job.isActive !== false && job.isActive !== 'false'
      );

      const mappedJobs = activeJobs.map((job) => ({
        _id: job._id,
        jobTitle: job.name || job.jobTitle,
        company: job.companyName || job.company,
        departmentIds: Array.isArray(job.departmentIds) 
          ? job.departmentIds 
          : (job.departmentId ? [job.departmentId] : []),
        departmentId: job.departmentId || departmentId,
        classId: job.classId,
        sectionId: job.sectionId,
      }));
      setJobs(mappedJobs);
    } catch (error) {
      toast.error("Failed to load jobs");
      setJobs([]);
    }
  }, [organizationId]);

  const fetchAllJobs = useCallback(async () => {
    try {
      if (!organizationId) {
        setJobs([]);
        return;
      }
      const response = await getRequest(`/jobs/organization/${organizationId}`);
      const apiJobs = response?.data?.data?.jobs || response?.data?.data || [];

      // Only include active jobs for job-level tests
      const activeJobs = apiJobs.filter(
        (job) => job.isActive !== false && job.isActive !== 'false'
      );
      const jobMap = new Map();
      activeJobs.forEach((job) => {
        if (!jobMap.has(job._id)) {
          jobMap.set(job._id, {
            _id: job._id,
            jobTitle: job.name || job.jobTitle,
            company: job.companyName || job.company,
            departmentIds: Array.isArray(job.departmentIds) 
              ? job.departmentIds 
              : (job.departmentId ? [job.departmentId] : []),
            departmentId: job.departmentId,
            classId: job.classId,
            sectionId: job.sectionId,
          });
        }
      });
      setJobs(Array.from(jobMap.values()));
    } catch (error) {
      toast.error("Failed to load jobs");
      setJobs([]);
    }
  }, [organizationId]);

  const fetchSubjectTopics = useCallback(async (subjectId) => {
    try {
      if (!subjectId) {
        setSubjectTopics([]);
        return;
      }
      const response = await getRequest(`/topics/subject/${subjectId}`);
      const apiTopics = response?.data?.data || [];
      const mappedTopics = apiTopics.map((topic) => ({
        ...topic,
        title: topic.name || topic.title,
        _id: topic._id,
      }));
      setSubjectTopics(mappedTopics);
      return mappedTopics;
    } catch (error) {
      toast.error("Failed to load subject topics");
      setSubjectTopics([]);
      return [];
    }
  }, []);

  const fetchJobSkills = useCallback(async (jobId) => {
    try {
      if (!jobId) {
        setJobSkills([]);
        return;
      }
      const response = await getRequest(`/skills/job/${jobId}`);
      const apiSkills = response?.data?.data || [];
      const mappedSkills = apiSkills.map((skill) => ({
        ...skill,
        title: skill.name || skill.title,
        _id: skill._id,
        type: skill.type || 'technical',
      }));
      setJobSkills(mappedSkills);
      return mappedSkills;
    } catch (error) {
      toast.error("Failed to load job skills");
      setJobSkills([]);
      return [];
    }
  }, []);

  const fetchSubjectTests = useCallback(async (subjectId) => {
    try {
      if (!subjectId) {
        setSubjectTests([]);
        return;
      }
      const response = await getRequest(`/tests/subject/${subjectId}`);
      const apiTests = response?.data?.data || [];
      setSubjectTests(apiTests.map(t => mapTest(t, 'subject')));
    } catch (error) {
      toast.error("Failed to load subject tests");
      setSubjectTests([]);
    }
  }, []);

  const fetchSubjectTopicTests = useCallback(async (topicId) => {
    try {
      if (!topicId) {
        setSubjectTopicTests([]);
        return;
      }
      const response = await getRequest(`/tests/topic/${topicId}`);
      const apiTests = response?.data?.data || [];
      setSubjectTopicTests(apiTests.map(t => mapTest(t, 'topic')));
    } catch (error) {
      toast.error("Failed to load topic tests");
      setSubjectTopicTests([]);
    }
  }, []);

  const fetchJobTests = useCallback(async (jobId) => {
    try {
      if (!jobId) {
        setJobTests([]);
        return;
      }
      const response = await getRequest(`/tests/job/${jobId}`);
      const apiTests = response?.data?.data || [];
      setJobTests(apiTests.map(t => mapTest(t, 'job')));
    } catch (error) {
      toast.error("Failed to load job tests");
      setJobTests([]);
    }
  }, []);

  const fetchJobSkillTests = useCallback(async (skillId) => {
    try {
      if (!skillId) {
        setJobSkillTests([]);
        return;
      }
      const response = await getRequest(`/tests/skill/${skillId}`);
      const apiTests = response?.data?.data || [];
      setJobSkillTests(apiTests.map(t => mapTest(t, 'skill')));
    } catch (error) {
      toast.error("Failed to load skill tests");
      setJobSkillTests([]);
    }
  }, []);

  const fetchAllSkillTestsForJob = useCallback(async (jobId) => {
    try {
      if (!jobId) {
        setJobSkillTests([]);
        return;
      }
      
      // Fetch all skills for the job
      const skillsResponse = await getRequest(`/skills/job/${jobId}`);
      const skillsData = skillsResponse?.data?.data || [];
      const technicalSkills = skillsData.filter(
        (skill) => skill.type === 'technical' || skill.type === 'tools'
      );

      // Fetch all skill tests for all technical/tools skills
      const allSkillTests = [];
      for (const skill of technicalSkills) {
        try {
          const skillTestsResponse = await getRequest(`/tests/skill/${skill._id}`);
          const skillTestsData = skillTestsResponse?.data?.data || [];
          allSkillTests.push(...skillTestsData.map(t => mapTest(t, 'skill')));
        } catch (error) {
          // Silently fail for individual skills
        }
      }

      setJobSkillTests(allSkillTests);
    } catch (error) {
      toast.error("Failed to load skill tests");
      setJobSkillTests([]);
    }
  }, []);

  const fetchAllJobTestsForOverview = useCallback(async () => {
    try {
      if (!organizationId) return;
      
      const jobsResponse = await getRequest(`/jobs/organization/${organizationId}`);
      const allJobs = jobsResponse?.data?.data?.jobs || jobsResponse?.data?.data || [];

      // Only include active jobs for overview stats
      const activeJobs = allJobs.filter(
        (job) => job.isActive !== false && job.isActive !== 'false'
      );

      if (!activeJobs || activeJobs.length === 0) return;

      const allJobTests = [];
      const allSkillTests = [];

      for (const job of activeJobs) {
        try {
          const jobTestsResponse = await getRequest(`/tests/job/${job._id}`);
          const jobTestsData = jobTestsResponse?.data?.data || [];
          allJobTests.push(...jobTestsData.map(t => mapTest(t, 'job')));

          const skillsResponse = await getRequest(`/skills/job/${job._id}`);
          const skillsData = skillsResponse?.data?.data || [];
          const technicalSkills = skillsData.filter(
            (skill) => skill.type === 'technical' || skill.type === 'tools'
          );

          for (const skill of technicalSkills) {
            try {
              const skillTestsResponse = await getRequest(`/tests/skill/${skill._id}`);
              const skillTestsData = skillTestsResponse?.data?.data || [];
              allSkillTests.push(...skillTestsData.map(t => mapTest(t, 'skill')));
            } catch (error) {
              // Silently fail for individual skills
            }
          }
        } catch (error) {
          // Silently fail for individual jobs
        }
      }

      setAllJobTestsForStats(allJobTests);
      setAllSkillTestsForStats(allSkillTests);
    } catch (error) {
      // Silently fail - overview stats are not critical
    }
  }, [organizationId]);

  useEffect(() => {
    if (organizationId) {
      fetchDepartments();
      fetchAllJobTestsForOverview();
    }
  }, [organizationId, fetchDepartments, fetchAllJobTestsForOverview]);

  return {
    departments,
    subjects,
    jobs,
    subjectTopics,
    jobSkills,
    subjectTests,
    subjectTopicTests,
    jobTests,
    jobSkillTests,
    allJobTestsForStats,
    allSkillTestsForStats,
    fetchDepartments,
    fetchSubjects,
    fetchAllSubjects,
    fetchJobs,
    fetchAllJobs,
    fetchSubjectTopics,
    fetchJobSkills,
    fetchSubjectTests,
    fetchSubjectTopicTests,
    fetchJobTests,
    fetchJobSkillTests,
    fetchAllSkillTestsForJob,
    fetchAllJobTestsForOverview,
    setSubjects,
    setJobs,
    setSubjectTopics,
    setJobSkills,
    setSubjectTests,
    setSubjectTopicTests,
    setJobTests,
    setJobSkillTests,
    setAllJobTestsForStats,
    setAllSkillTestsForStats,
  };
};

