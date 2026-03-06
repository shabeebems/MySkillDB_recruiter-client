// @ts-ignore
import { useState, useEffect } from "react";
// @ts-ignore
import OrgMenuNavigation from "../../../components/org-admin/org-admin-menu_components/OrgMenuNavigation";
import LoaderOverlay from "../../../components/common/loader/LoaderOverlay";
// @ts-ignore
import toast, { Toaster } from "react-hot-toast";
// @ts-ignore
import { postRequest, getRequest, deleteRequest } from "../../../api/apiRequests";
import { callGeminiAPI } from "../../../api/api";
// @ts-ignore
import { useSelector } from "react-redux";
import * as XLSX from "xlsx";

const TopicManagement = () => {
  // Get organization from Redux
  const organization = useSelector((state) => state.organization);

  // State for navigation
  const [currentPage, setCurrentPage] = useState("topic-management");

  // Tab State
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' or 'existing'

  // Pipeline Step State
  const [currentStep, setCurrentStep] = useState(0); // 0: Choose Method, 1: Context, 2: Jobs, 3: Skills, 4: AI Generate, 5: Review, 6: Created
  const [creationMethod, setCreationMethod] = useState(null); // 'job-based' or 'manual'
  
  // Manual Topic Creation States
  const [manualSelectedSubject, setManualSelectedSubject] = useState("");
  const [manualTopics, setManualTopics] = useState([{ name: "", description: "", difficultyLevel: "Medium" }]);

  // State for filters
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");

  // State for data
  const [departments, setDepartments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [jobSkills, setJobSkills] = useState({}); 
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [allExtractedSkills, setAllExtractedSkills] = useState([]);
  const [jobSkillsCategorized, setJobSkillsCategorized] = useState({}); 

  // AI Generation States
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSubject, setGeneratedSubject] = useState({
    name: "",
    description: "",
  });
  const [generatedTopics, setGeneratedTopics] = useState([]);
  const [aiMatchResult, setAiMatchResult] = useState(null); // { matchPercentage, matchedSubject, matchedSubjectId, reasoning }

  // Existing Subjects & Topics (for viewing)
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    departments: false,
    classes: false,
    sections: false,
    jobs: false,
    skills: false,
    subjects: false,
    topics: false,
  });

  // --- API CALLS ---

  const fetchDepartments = async () => {
    if (!organization?._id) return;
    try {
      setLoadingStates((prev) => ({ ...prev, departments: true }));
      const response = await getRequest(
        `/organization-setup/departments/${organization._id}`
      );
      if (response.data.success && response.data.data) {
        setDepartments(response.data.data || []);
      } else {
        setDepartments([]);
        toast.error("No departments found. Please create departments first.");
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      setDepartments([]);
      toast.error("Failed to fetch departments. Please try again.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, departments: false }));
    }
  };

  const fetchClasses = async (departmentId) => {
    if (!organization?._id || !departmentId) {
      setClasses([]);
      return;
    }
    try {
      setLoadingStates((prev) => ({ ...prev, classes: true }));
      const response = await getRequest(
        `/organization-setup/classes/${organization._id}/${departmentId}`
      );
      if (response.data.success && response.data.data) {
        setClasses(response.data.data || []);
        if (!response.data.data || response.data.data.length === 0) {
          toast.error("No classes found for this department. Please create classes first.");
        }
      } else {
        setClasses([]);
        toast.error("No classes found for this department.");
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      setClasses([]);
      toast.error("Failed to fetch classes. Please try again.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, classes: false }));
    }
  };

  const fetchSections = async (classId, departmentId) => {
    if (!organization?._id || !classId || !departmentId) {
      setSections([]);
      return;
    }
    try {
      setLoadingStates((prev) => ({ ...prev, sections: true }));
        const response = await getRequest(
        `/organization-setup/sections/${organization._id}/${departmentId}/${classId}`
        );
      if (response.data.success && response.data.data) {
        setSections(response.data.data || []);
        if (!response.data.data || response.data.data.length === 0) {
          toast.error("No sections found for this class. Please create sections first.");
        }
      } else {
        setSections([]);
        toast.error("No sections found for this class.");
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      setSections([]);
      toast.error("Failed to fetch sections. Please try again.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, sections: false }));
    }
  };

  const fetchJobs = async (departmentId) => {
    if (!departmentId || !organization?._id) {
      setJobs([]);
      return;
    }
    try {
      setLoadingStates((prev) => ({ ...prev, jobs: true }));
          const response = await getRequest(
            `/jobs/organization/${organization._id}?departmentId=${departmentId}`
          );
      if (response.data.success && response.data.data) {
        const jobsData = response.data.data.jobs || response.data.data || [];
        setJobs(jobsData);
        if (jobsData.length === 0) {
          toast.error("No jobs found for this department. Please create jobs first.");
        }
      } else {
        setJobs([]);
        toast.error("No jobs found for this department.");
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setJobs([]);
      toast.error("Failed to fetch jobs. Please try again.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, jobs: false }));
    }
  };

  // Helper function to categorize skills
  const categorizeSkills = (skills) => {
    const categorized = {
      technical: [],
      tools: [],
      soft: []
    };

    // Common soft skills keywords
    const softSkillsKeywords = [
      'communication', 'leadership', 'teamwork', 'problem solving', 'critical thinking',
      'time management', 'adaptability', 'creativity', 'collaboration', 'analytical',
      'interpersonal', 'presentation', 'negotiation', 'mentoring', 'project management',
      'agile', 'scrum', 'planning', 'organization', 'decision making', 'team collaboration',
      'attention to detail', 'analytical thinking', 'system integration', 'process improvement',
      'safety standards', 'sustainability'
    ];

    // Common tools (software, platforms, frameworks that are tools)
    const toolsKeywords = [
      'git', 'docker', 'kubernetes', 'jenkins', 'terraform', 'aws', 'azure', 'gcp',
      'jira', 'confluence', 'slack', 'figma', 'sketch', 'postman', 'swagger',
      'autocad', 'solidworks', 'catia', 'matlab', 'simulink', 'cadence', 'etabs',
      'staad', 'primavera', 'excel', 'tableau', 'power bi', 'xcode', 'android studio',
      'jupyter', 'next.js', 'tailwind css', 'redux'
    ];

    // Programming languages and technical concepts (always technical)
    const technicalKeywords = [
      'react', 'javascript', 'typescript', 'python', 'node.js', 'java', 'c++', 'c#',
      'c/c++', 'html/css', 'express', 'mongodb', 'postgresql', 'graphql', 'rest apis',
      'react native', 'flutter', 'swift', 'kotlin', 'django', 'flask', 'verilog', 'vhdl',
      'microcontrollers', 'arduino', 'raspberry pi', 'rtos', 'iot', 'circuit design',
      'vlsi design', 'pcb design', 'semiconductor', 'power systems', 'rf design',
      'antenna design', 'signal processing', 'plc programming', 'scada', 'industrial automation',
      'mechanical design', '3d modeling', 'gd&t', 'fea', 'manufacturing processes',
      'cnc machining', 'quality control', 'lean manufacturing', 'six sigma', 'hvac design',
      'thermal analysis', 'cfd', 'robotics', 'control systems', 'mechatronics',
      'structural analysis', 'reinforced concrete', 'steel design', 'seismic design',
      'transportation planning', 'traffic engineering', 'highway design', 'environmental engineering',
      'water treatment', 'wastewater management', 'data analysis', 'machine learning',
      'pandas', 'numpy', 'apache spark', 'data science', 'system design', 'infrastructure'
    ];

    skills.forEach(skill => {
      const skillLower = skill.toLowerCase();
      
      // Check if it's a soft skill first
      if (softSkillsKeywords.some(keyword => skillLower.includes(keyword))) {
        categorized.soft.push(skill);
      }
      // Check if it's a tool (but not if it's also a technical skill)
      else if (toolsKeywords.some(keyword => skillLower.includes(keyword)) && 
               !technicalKeywords.some(keyword => skillLower.includes(keyword))) {
        categorized.tools.push(skill);
      }
      // Default to technical (includes programming languages, frameworks, technical concepts)
      else {
        categorized.technical.push(skill);
      }
    });

    return categorized;
  };

  // Helper function to check if a string is a valid MongoDB ObjectId
  const isValidObjectId = (id) => {
    // MongoDB ObjectIds are 24-character hex strings
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  const fetchSkillsForJob = async (jobId) => {
    // Only fetch skills for valid MongoDB ObjectIds
    if (!isValidObjectId(jobId)) {
      console.warn(`Invalid jobId format: ${jobId}. Skipping skills fetch.`);
      setJobSkills(prev => ({ ...prev, [jobId]: [] }));
      setJobSkillsCategorized(prev => ({ ...prev, [jobId]: { technical: [], tools: [], soft: [] } }));
      return [];
    }

    try {
      const response = await getRequest(`/skills/job/${jobId}`);
      if (response.data.success && response.data.data) {
        const skills = response.data.data.map(skill => skill.name || skill.title).filter(Boolean);
        if (skills.length > 0) {
        const categorized = categorizeSkills(skills);
        setJobSkills(prev => ({ ...prev, [jobId]: skills }));
        setJobSkillsCategorized(prev => ({ ...prev, [jobId]: categorized }));
        return skills;
        } else {
          // No skills found for this job
          setJobSkills(prev => ({ ...prev, [jobId]: [] }));
          setJobSkillsCategorized(prev => ({ ...prev, [jobId]: { technical: [], tools: [], soft: [] } }));
          toast.error(`No skills found for this job. Please add skills to the job first.`);
          return [];
        }
      } else {
        setJobSkills(prev => ({ ...prev, [jobId]: [] }));
        setJobSkillsCategorized(prev => ({ ...prev, [jobId]: { technical: [], tools: [], soft: [] } }));
        return [];
      }
    } catch (error) {
      console.error(`Error fetching skills for job ${jobId}:`, error);
      setJobSkills(prev => ({ ...prev, [jobId]: [] }));
      setJobSkillsCategorized(prev => ({ ...prev, [jobId]: { technical: [], tools: [], soft: [] } }));
      toast.error(`Failed to fetch skills for this job. Please try again.`);
      return [];
    }
  };

  const extractSkillsFromJobs = async () => {
    if (selectedJobs.length === 0) {
      toast.error("Please select at least one job");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, skills: true }));
    const allSkills = [];
    const skillsMap = {};

    // Fetch skills for all selected jobs (this will populate jobSkillsCategorized)
    for (const jobId of selectedJobs) {
      const skills = await fetchSkillsForJob(jobId);
      if (skills && skills.length > 0) {
      skills.forEach(skill => {
        if (!skillsMap[skill]) {
          skillsMap[skill] = true;
          allSkills.push(skill);
        }
      });
      }
    }

    if (allSkills.length === 0) {
      toast.error("No skills found for the selected jobs. Please add skills to the jobs first.");
      setLoadingStates((prev) => ({ ...prev, skills: false }));
      return;
    }

    setAllExtractedSkills(allSkills);
    setSelectedSkills(allSkills); // Select all by default
    setLoadingStates((prev) => ({ ...prev, skills: false }));
    setCurrentStep(3); // Move to skills selection step
  };

  // Download Generated Results
  const downloadGeneratedResults = () => {
    if (!generatedSubject.name || generatedTopics.length === 0) {
      toast.error('No generated content to download');
      return;
    }

    // Prepare data for Excel - each topic gets its own row with subject info
    const data = [
      ['Subject', 'Subject Description', 'Topic', 'Topic Description', 'Difficulty'],
    ];

    // Add subject and topics - each topic row includes subject info
    generatedTopics.forEach(topic => {
      data.push([
        generatedSubject.name,
        generatedSubject.description || '',
        topic.name || '',
        topic.description || '',
        'Medium' // Default difficulty for download
      ]);
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Generated Content');

    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 30 }, // Subject
      { wch: 50 }, // Subject Description
      { wch: 35 }, // Topic
      { wch: 60 }, // Topic Description
      { wch: 15 }  // Difficulty
    ];

    // Generate filename with timestamp and subject name (sanitized)
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const sanitizedSubjectName = generatedSubject.name.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
    const fileName = `Generated_${sanitizedSubjectName}_${timestamp}.xlsx`;

    XLSX.writeFile(wb, fileName);
    toast.success('Generated content downloaded successfully!');
  };

  const generateSubjectAndTopics = async () => {
    if (selectedJobs.length === 0 || selectedSkills.length === 0) {
      toast.error("Please select jobs and skills first");
      return;
    }

    // Validate that subjects exist
    if (!subjects || subjects.length === 0) {
      toast.error("No existing subjects found. Please create subjects first before adding topics.");
      return;
    }

    setIsGenerating(true);
    setAiMatchResult(null);
    try {
      const selectedJobsData = jobs.filter(job => selectedJobs.includes(job._id));
      const jobsInfo = selectedJobsData.map(job => ({
        title: job.name || job.title,
        company: job.companyName || job.company,
        description: job.description || ''
      })).slice(0, 5); // Limit to 5 jobs for prompt

      // Fetch all topics for all existing subjects
      const allTopicsForSubjects = {};
      for (const subject of subjects) {
        try {
          const topicsResponse = await getRequest(`/topics/subject/${subject._id}`);
          if (topicsResponse.data.success && topicsResponse.data.data) {
            allTopicsForSubjects[subject._id] = topicsResponse.data.data.map(t => ({
          name: t.name,
          description: t.description || '',
          difficultyLevel: t.difficultyLevel || 'Medium'
            }));
          } else {
            allTopicsForSubjects[subject._id] = [];
          }
        } catch (error) {
          console.error(`Error fetching topics for subject ${subject._id}:`, error);
          allTopicsForSubjects[subject._id] = [];
        }
      }

      // Prepare existing subjects/topics data for AI with fetched topics
      const existingSubjectsData = subjects.map(subj => ({
        _id: subj._id,
        name: subj.name,
        description: subj.description || '',
        topics: allTopicsForSubjects[subj._id] || []
      }));

      let prompt = `You are an expert curriculum designer. Your task is to ANALYZE existing subjects and identify which topics need to be ADDED to match the job requirements and skills.

Jobs:
${JSON.stringify(jobsInfo, null, 2)}

Selected Skills:
${selectedSkills.join(', ')}

Existing Subjects and ALL Their Topics in the system:
${JSON.stringify(existingSubjectsData, null, 2)}

CRITICAL REQUIREMENTS:
1. You MUST match the job requirements and skills to ONE of the existing subjects above
2. You CANNOT create a new subject - you must only add topics to an existing subject
3. Analyze which existing subject best matches the job requirements and selected skills
4. CAREFULLY review ALL existing topics in the matched subject (check the "topics" array)
5. Compare each proposed topic name against ALL existing topic names in the matched subject
6. Generate ONLY topics that are GENUINELY MISSING from the matched subject
7. DO NOT create topics that are similar or equivalent to existing topics - check for:
   - Exact name matches (case-insensitive)
   - Semantic similarity (e.g., "React Basics" vs "React Fundamentals" are similar)
   - Conceptual overlap (e.g., "JavaScript" vs "JS Fundamentals" cover the same thing)
   - Variations of the same concept (e.g., "HTML" vs "HTML Basics" vs "HTML Fundamentals")

DUPLICATE/SIMILAR TOPIC DETECTION RULES:
- If a topic with similar name/meaning already exists, DO NOT include it
- Compare topic names semantically, not just character-by-character
- If "React Components" exists, don't create "React Component Basics" or "Components in React"
- If "JavaScript Fundamentals" exists, don't create "JS Basics" or "JavaScript Basics"
- Only generate topics that cover NEW skills/concepts not already covered by existing topics

Provide your response in this EXACT JSON structure:
{
  "matchAnalysis": {
    "matchPercentage": <number between 0-100 indicating how well the matched subject covers the job requirements>,
    "matchedSubjectId": "<_id of the matched subject from the existing subjects list>",
    "matchedSubjectName": "<exact name of the matched subject from existing subjects>",
    "reasoning": "<brief explanation of why this subject was matched, which topics already exist, and what NEW topics are missing>"
  },
  "subject": {
    "name": "<EXACT name from matched subject - DO NOT change it>",
    "description": "<description from matched subject or improve it if needed>"
  },
  "topics": [
    {
      "name": "Topic name that does NOT exist and is NOT similar to any existing topic in the matched subject",
      "description": "Brief description of what this topic covers",
      "difficultyLevel": "Easy|Medium|Hard"
    }
  ]
}

Requirements for topics:
- Generate ONLY topics that are COMPLETELY NEW and NOT similar to any existing topics
- Before generating each topic, verify it doesn't match or overlap with existing topics
- Topics should cover skills from the selected skills that are NOT covered by existing topics
- If all skills are already covered by existing topics, return an empty topics array []
- Typically 0-8 new topics (only what's genuinely needed, NO duplicates or similar topics)
- Difficulty levels should progress from Easy to Hard
- Each topic should have a clear, actionable name that is distinct from existing ones
- Return ONLY valid JSON, no markdown formatting`;

      const response = await callGeminiAPI(prompt);
      
      if (response.success && response.data) {
        let parsedData;
        try {
          parsedData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        } catch (e) {
          // Try to extract JSON from string
          const jsonMatch = response.data.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Could not parse AI response');
          }
        }

        // Store match analysis - always adding to existing subject
        const matchedSubjectId = parsedData.matchAnalysis?.matchedSubjectId || 
          subjects.find(s => s.name.toLowerCase() === parsedData.matchAnalysis?.matchedSubjectName?.toLowerCase())?._id ||
          null;
        const matchedSubjectName = parsedData.matchAnalysis?.matchedSubjectName || parsedData.subject?.name || null;
        const matchedSubject = subjects.find(s => s._id === matchedSubjectId || s.name.toLowerCase() === matchedSubjectName?.toLowerCase());

        if (parsedData.matchAnalysis) {
          setAiMatchResult({
            matchPercentage: parsedData.matchAnalysis.matchPercentage || 0,
            matchedSubjectId: matchedSubjectId,
            matchedSubject: matchedSubjectName,
            reasoning: parsedData.matchAnalysis.reasoning || ''
          });
        }

        // Use the matched subject's data
        setGeneratedSubject({
          name: matchedSubject?.name || parsedData.subject?.name || "",
          description: matchedSubject?.description || parsedData.subject?.description || "",
          _id: matchedSubject?._id || matchedSubjectId
        });

        setGeneratedTopics(
          parsedData.topics?.map((topic, index) => ({
            _id: `temp-topic-${index}`,
            name: topic.name || `Topic ${index + 1}`,
            description: topic.description || "",
            difficultyLevel: topic.difficultyLevel || "Medium",
          })) || []
        );

        setCurrentStep(4); // Move to review step
        toast.success("Subject and topics generated successfully!");
      } else {
        throw new Error(response.error || "Failed to generate");
      }
    } catch (error) {
      console.error("Error generating subject and topics:", error);
      const errorMessage = error.message || "Failed to generate subject and topics using AI";
      toast.error(`AI Generation Failed: ${errorMessage}. Please try again.`);
      setIsGenerating(false);
      // Don't set any fallback data - let the user know AI failed
      // User can retry or manually create topics
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchSubjects = async (departmentId, classId, sectionId) => {
    if (!organization?._id || !departmentId || !classId || !sectionId) {
      setSubjects([]);
      return;
    }
    try {
      setLoadingStates((prev) => ({ ...prev, subjects: true }));
        const response = await getRequest(
          `/organization-setup/subjects/${organization._id}/${departmentId}`
        );
      if (response.data.success && response.data.data) {
        setSubjects(response.data.data || []);
        if (!response.data.data || response.data.data.length === 0) {
          // Don't show error toast here as it's expected when no subjects exist yet
        }
      } else {
        setSubjects([]);
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setSubjects([]);
      toast.error("Failed to fetch subjects. Please try again.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, subjects: false }));
    }
  };

  const fetchTopics = async (subjectId) => {
    if (!subjectId) {
      setTopics([]);
      return;
    }
    try {
      setLoadingStates((prev) => ({ ...prev, topics: true }));
      const response = await getRequest(`/topics/subject/${subjectId}`);
      if (response.data.success) {
        setTopics(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
      setTopics([]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, topics: false }));
    }
  };

  // --- HANDLERS ---

  const handleDepartmentChange = (departmentId) => {
    setSelectedDepartment(departmentId);
    setSelectedClass("");
    setSelectedSection("");
    setSelectedJobs([]);
    setSelectedSkills([]);
    setAllExtractedSkills([]);
    setSubjects([]);
    setTopics([]);
    setSelectedSubject(null);
    if (creationMethod) {
    setCurrentStep(1);
    }
    if (departmentId) {
      fetchClasses(departmentId);
      if (creationMethod === 'job-based') {
      fetchJobs(departmentId);
      }
      } else {
      setClasses([]);
      setSections([]);
      setJobs([]);
    }
  };

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    setSelectedSection("");
    setSubjects([]);
    setTopics([]);
    setSelectedSubject(null);
    if (creationMethod) {
    setCurrentStep(1);
    }
    if (classId && selectedDepartment) {
      fetchSections(classId, selectedDepartment);
          } else {
      setSections([]);
    }
  };

  const handleSectionChange = (sectionId) => {
    setSelectedSection(sectionId);
    if (sectionId && selectedDepartment && selectedClass) {
      if (creationMethod === 'manual') {
      fetchSubjects(selectedDepartment, selectedClass, sectionId);
        // Stay on step 1 for manual creation
      } else if (creationMethod === 'job-based') {
        // Automatically move to step 2 when all context is selected for job-based
      setCurrentStep(2);
      // Ensure jobs are loaded
      if (jobs.length === 0 && selectedDepartment) {
        fetchJobs(selectedDepartment);
        }
      // CRITICAL: Fetch subjects for job-based flow so AI can match to existing subjects
      fetchSubjects(selectedDepartment, selectedClass, sectionId);
      } else if (activeTab === 'existing') {
        // Fetch subjects when in existing tab
        fetchSubjects(selectedDepartment, selectedClass, sectionId);
      }
    }
  };

  const handleJobToggle = (jobId) => {
    setSelectedJobs((prev) =>
      prev.includes(jobId)
        ? prev.filter((id) => id !== jobId)
        : [...prev, jobId]
    );
  };

  const handleSelectAllJobs = () => {
    if (selectedJobs.length === jobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobs.map((job) => job._id));
    }
  };

  const handleSkillToggle = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const handleSelectAllSkills = () => {
    if (selectedSkills.length === allExtractedSkills.length) {
      setSelectedSkills([]);
    } else {
      setSelectedSkills([...allExtractedSkills]);
    }
  };

  const handleContinueToSkills = () => {
    if (selectedJobs.length === 0) {
      toast.error("Please select at least one job");
      return;
    }
    extractSkillsFromJobs();
  };

  const handleContinueToAI = () => {
    if (selectedSkills.length === 0) {
      toast.error("Please select at least one skill");
      return;
    }
    setCurrentStep(3);
  };

  const handleCreateSubjectWithTopics = async () => {
    if (!generatedSubject._id) {
      toast.error("No matched subject found. Please ensure subjects exist first.");
      return;
    }
    if (generatedTopics.length === 0) {
      toast.error("At least one topic is required");
      return;
    }

    setIsLoading(true);
    try {
      // Always use the matched existing subject - never create new subjects
      const subjectId = generatedSubject._id;
      
      if (!subjectId) {
        throw new Error("Subject ID is required");
      }

      // Prepare topics data for batch creation
      const topicsData = generatedTopics.map(topic => ({
          name: topic.name,
        description: topic.description || '',
          subjectId: subjectId,
          departmentId: selectedDepartment,
        difficultyLevel: topic.difficultyLevel || 'Medium',
        organizationId: organization._id,
      }));

      // Add topics to the existing subject using batch endpoint
      const response = await postRequest("/topics/batch", {
        topics: topicsData
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to add topics");
      }
      
      toast.success(`Successfully added ${topicsData.length} topic(s) to "${generatedSubject.name}"!`);
      
      // Reset pipeline
      setCurrentStep(6);
      setSelectedJobs([]);
      setSelectedSkills([]);
      setAllExtractedSkills([]);
      setGeneratedSubject({ name: "", description: "" });
      setGeneratedTopics([]);
      setAiMatchResult(null);
      
      // Refresh subjects list
      await fetchSubjects(selectedDepartment, selectedClass, selectedSection);
    } catch (error) {
      console.error("Error creating subject and topics:", error);
      toast.error(error.message || "Failed to create subject and topics");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubjectClick = async (subject) => {
    setSelectedSubject(subject);
    await fetchTopics(subject._id);
  };

  const handleDeleteTopic = async (topicId, topicName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the topic "${topicName}"?`
    );
    if (!confirmed) return;

    setIsLoading(true);
    try {
      const response = await deleteRequest(`/topics/${topicId}`);
      if (response.data.success) {
        toast.success("Topic deleted successfully");
        if (selectedSubject) {
          await fetchTopics(selectedSubject._id);
        }
      } else {
        toast.error(response.data.message || "Failed to delete topic");
      }
    } catch (error) {
      console.error("Error deleting topic:", error);
      toast.error("Failed to delete topic");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const resetPipeline = () => {
    setCurrentStep(0);
    setCreationMethod(null);
    setSelectedJobs([]);
    setSelectedSkills([]);
    setAllExtractedSkills([]);
    setGeneratedSubject({ name: "", description: "" });
    setGeneratedTopics([]);
    setAiMatchResult(null);
    setManualSelectedSubject("");
    setManualTopics([{ name: "", description: "", difficultyLevel: "Medium" }]);
    // Note: CSV data is kept intentionally so user doesn't have to re-upload
  };

  const handleMethodSelection = (method) => {
    setCreationMethod(method);
    if (method === 'job-based') {
      setCurrentStep(1); // Go to context selection
    } else if (method === 'manual') {
      // Fetch subjects if context is already selected
      if (selectedDepartment && selectedClass && selectedSection) {
        fetchSubjects(selectedDepartment, selectedClass, selectedSection);
      }
      setCurrentStep(1); // Still need context first
    }
  };

  const handleAddManualTopic = () => {
    setManualTopics([...manualTopics, { name: "", description: "", difficultyLevel: "Medium" }]);
  };

  const handleRemoveManualTopic = (index) => {
    if (manualTopics.length > 1) {
      setManualTopics(manualTopics.filter((_, i) => i !== index));
    }
  };

  const handleManualTopicChange = (index, field, value) => {
    const updated = [...manualTopics];
    updated[index][field] = value;
    setManualTopics(updated);
  };

  const handleCreateManualTopics = async () => {
    if (!manualSelectedSubject) {
      toast.error("Please select a subject");
      return;
    }

    const validTopics = manualTopics.filter(topic => topic.name.trim() !== "");
    if (validTopics.length === 0) {
      toast.error("Please add at least one topic with a name");
      return;
    }

    setIsLoading(true);
    try {
      const topicsData = validTopics.map(topic => ({
        name: topic.name.trim(),
        description: topic.description.trim() || '',
        subjectId: manualSelectedSubject,
        departmentId: selectedDepartment,
        difficultyLevel: topic.difficultyLevel || 'Medium',
        organizationId: organization._id,
      }));

      const response = await postRequest("/topics/batch", {
        topics: topicsData
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to add topics");
      }
      
      toast.success(`Successfully added ${topicsData.length} topic(s)!`);
      
      // Reset manual creation
      setManualSelectedSubject("");
      setManualTopics([{ name: "", description: "", difficultyLevel: "Medium" }]);
      setCurrentStep(6); // Show success message
      
      // Refresh subjects list
      await fetchSubjects(selectedDepartment, selectedClass, selectedSection);
    } catch (error) {
      console.error("Error creating manual topics:", error);
      toast.error(error.message || "Failed to create topics");
    } finally {
      setIsLoading(false);
    }
  };

  // --- EFFECTS ---

  useEffect(() => {
    if (organization?._id) {
      fetchDepartments();
    }
  }, [organization?._id]);

  useEffect(() => {
    if (selectedDepartment && selectedClass && selectedSection) {
      if (creationMethod === 'job-based') {
        // Always show step 2 when context is selected for job-based
      setCurrentStep(2);
      // Always fetch jobs when all context is selected
      fetchJobs(selectedDepartment);
      // CRITICAL: Fetch subjects for job-based flow so AI can match to existing subjects
      fetchSubjects(selectedDepartment, selectedClass, selectedSection);
      } else if (creationMethod === 'manual') {
        // For manual, stay on step 1 but fetch subjects
        fetchSubjects(selectedDepartment, selectedClass, selectedSection);
      } else if (activeTab === 'existing') {
        // Fetch subjects when in existing tab
        fetchSubjects(selectedDepartment, selectedClass, selectedSection);
      }
    } else if (currentStep > 0) {
      setCurrentStep(1);
    }
  }, [selectedDepartment, selectedClass, selectedSection, creationMethod, activeTab]);

  // Pipeline Steps Configuration
  const steps = [
    { number: 0, title: "Method", description: "Choose creation method" },
    { number: 1, title: "Context", description: "Select Department, Class & Section" },
    { number: 2, title: "Jobs", description: "Choose relevant jobs" },
    { number: 3, title: "Skills", description: "Select skills from jobs" },
    { number: 4, title: "Generate", description: "AI creates subject & topics" },
    { number: 5, title: "Review", description: "Review and edit" },
  ];

  return (
    <div className="bg-neutral-50 min-h-screen flex flex-col">
      <Toaster position="top-right" />
      <LoaderOverlay
        isVisible={isLoading}
        title="MySkillDB"
        subtitle="Loading your data, please wait…"
      />

      {/* Navigation Component */}
        <OrgMenuNavigation
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />

      {/* Main Content */}
      <div className="lg:ml-72 flex-1 flex flex-col pt-14 lg:pt-0">
        <main className="flex-1 pt-3 pb-3 px-4 md:pt-4 md:pb-4 md:px-6 lg:pt-4 lg:pb-8 lg:px-8 space-y-4 lg:space-y-6">
          {/* Header - Apple Design */}
          <header className="bg-neutral-50/50 backdrop-blur-sm border-b border-neutral-200/50 py-3 px-5 md:py-4 md:px-6 lg:py-4 lg:px-8 sticky top-14 lg:top-0 z-30 -mx-4 md:-mx-6 lg:-mx-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight mb-1.5">
                Topic Management
              </h1>
              <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
                Create and manage subjects and topics for your curriculum
              </p>
            </div>
          </header>

          {/* Tab Navigation - Apple Design */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
            <div className="flex">
              <button
                onClick={() => setActiveTab('pipeline')}
                className={`flex-1 px-4 md:px-6 py-3 md:py-4 text-sm font-medium transition-all duration-200 relative ${
                  activeTab === 'pipeline'
                    ? 'text-blue-600 bg-blue-50/60'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50/60'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <i className="fas fa-magic text-xs"></i>
                  <span className="hidden sm:inline">Create New</span>
                  <span className="sm:hidden">New</span>
                </div>
                {activeTab === 'pipeline' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('existing')}
                className={`flex-1 px-4 md:px-6 py-3 md:py-4 text-sm font-medium transition-all duration-200 relative ${
                  activeTab === 'existing'
                    ? 'text-blue-600 bg-blue-50/60'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50/60'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <i className="fas fa-book text-xs"></i>
                  <span className="hidden sm:inline">Existing</span>
                  <span className="sm:hidden">View</span>
                  {subjects.length > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-full">
                      {subjects.length}
                    </span>
                  )}
                </div>
                {activeTab === 'existing' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'pipeline' && (
            <div className="space-y-6">
          {/* Pipeline Progress Indicator - Apple Design */}
          {currentStep < 6 && creationMethod && (
            <section className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-5 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">Pipeline Progress</h2>
                {currentStep > 0 && (
                  <button
                    onClick={resetPipeline}
                    className="text-xs text-neutral-600 hover:text-neutral-900 font-medium px-3 py-1.5 rounded-xl hover:bg-neutral-100 transition-all duration-200"
                  >
                    <i className="fas fa-redo mr-1.5 text-[10px]"></i>
                    Reset
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between relative">
                {/* Connection Lines */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-neutral-200 -z-0" style={{ margin: '0 2.5rem' }}></div>
                <div 
                  className="absolute top-5 left-0 h-0.5 bg-blue-600 transition-all duration-500 ease-out -z-0"
                  style={{ 
                    margin: '0 2.5rem',
                    width: `${(currentStep / (steps.length - 1)) * 100}%`
                  }}
                ></div>

                {steps.filter(step => step.number > 0 || creationMethod === 'job-based').map((step, index) => {
                  const isActive = currentStep === step.number;
                  const isCompleted = currentStep > step.number;
                  return (
                    <div key={step.number} className="flex flex-col items-center flex-1 relative z-10">
                      <div
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-semibold text-xs md:text-sm transition-all duration-200 ${
                          isCompleted
                            ? "bg-blue-600 text-white shadow-md"
                            : isActive
                            ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-200"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {isCompleted ? (
                          <i className="fas fa-check text-white text-xs"></i>
                        ) : (
                          step.number
                        )}
                      </div>
                      <div className="mt-2.5 text-center">
                        <p className={`text-[11px] md:text-xs font-medium ${isActive || isCompleted ? 'text-blue-600' : 'text-neutral-500'}`}>
                          {step.title}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-0.5 hidden md:block">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Step 0: Choose Creation Method */}
          {currentStep === 0 && (
            <section className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-5 md:p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-50 rounded-xl flex items-center justify-center ring-1 ring-blue-200/50">
                  <i className="fas fa-route text-blue-600 text-xs md:text-sm"></i>
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-neutral-900 tracking-tight">Choose Creation Method</h2>
                  <p className="text-xs md:text-sm text-neutral-600 leading-relaxed">Select how you want to create topics</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Job-Based Card */}
                <button
                  onClick={() => handleMethodSelection('job-based')}
                  className="group p-6 rounded-2xl border-2 border-neutral-200 hover:border-blue-500 hover:shadow-lg transition-all duration-200 text-left bg-white hover:bg-blue-50/30"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
                      <i className="fas fa-briefcase text-white text-lg"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-blue-700 transition-colors">
                        Job-Based Creation
                      </h3>
                      <p className="text-sm text-neutral-600 leading-relaxed mb-3">
                        Generate topics automatically using AI based on job requirements and skills. Perfect for aligning curriculum with industry needs.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                        <span>Recommended</span>
                        <i className="fas fa-arrow-right"></i>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Manual Card */}
                <button
                  onClick={() => handleMethodSelection('manual')}
                  className="group p-6 rounded-2xl border-2 border-neutral-200 hover:border-purple-500 hover:shadow-lg transition-all duration-200 text-left bg-white hover:bg-purple-50/30"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
                      <i className="fas fa-edit text-white text-lg"></i>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-purple-700 transition-colors">
                        Manual Creation
                      </h3>
                      <p className="text-sm text-neutral-600 leading-relaxed mb-3">
                        Add topics manually to an existing subject. Full control over topic names, descriptions, and difficulty levels.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-purple-600 font-medium">
                        <span>Quick & Simple</span>
                        <i className="fas fa-arrow-right"></i>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </section>
          )}

          {/* Step 1: Context Selection */}
          {currentStep >= 1 && (
          <section className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-5 md:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-50 rounded-xl flex items-center justify-center ring-1 ring-blue-200/50">
                  <span className="text-blue-600 font-semibold text-xs md:text-sm">1</span>
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-neutral-900 tracking-tight">Select Context</h2>
                  <p className="text-xs md:text-sm text-neutral-600 leading-relaxed">Choose Department, Class, and Section</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-neutral-700 mb-2">
                    Department *
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full h-11 bg-neutral-50 border-0 rounded-xl px-4 text-sm text-neutral-900 focus:ring-2 focus:ring-blue-500/40 focus:outline-none transition-all duration-200 disabled:opacity-50"
                    disabled={loadingStates.departments}
                  >
                    <option value="">
                      {loadingStates.departments ? "Loading..." : "Select Department"}
                    </option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-neutral-700 mb-2">
                    Class *
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full h-11 bg-neutral-50 border-0 rounded-xl px-4 text-sm text-neutral-900 focus:ring-2 focus:ring-blue-500/40 focus:outline-none transition-all duration-200 disabled:opacity-50"
                    disabled={!selectedDepartment || loadingStates.classes}
                  >
                    <option value="">
                      {!selectedDepartment
                        ? "Select Department first"
                        : loadingStates.classes
                        ? "Loading..."
                        : "Select Class"}
                    </option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-medium text-neutral-700 mb-2">
                    Section *
                  </label>
                  <select
                    value={selectedSection}
                    onChange={(e) => handleSectionChange(e.target.value)}
                    className="w-full h-11 bg-neutral-50 border-0 rounded-xl px-4 text-sm text-neutral-900 focus:ring-2 focus:ring-blue-500/40 focus:outline-none transition-all duration-200 disabled:opacity-50"
                    disabled={!selectedClass || loadingStates.sections}
                  >
                    <option value="">
                      {!selectedClass
                        ? "Select Class first"
                        : loadingStates.sections
                        ? "Loading..."
                        : "Select Section"}
                    </option>
                    {sections.map((section) => (
                      <option key={section._id} value={section._id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* Manual Topic Creation Section */}
          {currentStep >= 1 && creationMethod === 'manual' && selectedDepartment && selectedClass && selectedSection && (
            <section className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-5 md:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-purple-50 rounded-xl flex items-center justify-center ring-1 ring-purple-200/50">
                  <i className="fas fa-edit text-purple-600 text-xs md:text-sm"></i>
                </div>
                <div>
                  <h2 className="text-base md:text-lg font-semibold text-neutral-900 tracking-tight">Add Topics Manually</h2>
                  <p className="text-xs md:text-sm text-neutral-600 leading-relaxed">Select a subject and add topics manually</p>
                </div>
              </div>

              {/* Subject Selection */}
              <div className="mb-6">
                <label className="block text-xs md:text-sm font-medium text-neutral-700 mb-2">
                  Select Subject *
                </label>
                {loadingStates.subjects ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent mx-auto mb-2"></div>
                    <p className="text-sm text-neutral-600">Loading subjects...</p>
                  </div>
                ) : subjects.length === 0 ? (
                  <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                    <p className="text-sm text-neutral-600 mb-2">No subjects found for this context.</p>
                    <p className="text-xs text-neutral-500">Please create subjects first using the job-based method or through subject management.</p>
                  </div>
                ) : (
                  <select
                    value={manualSelectedSubject}
                    onChange={(e) => setManualSelectedSubject(e.target.value)}
                    className="w-full h-11 bg-neutral-50 border-0 rounded-xl px-4 text-sm text-neutral-900 focus:ring-2 focus:ring-purple-500/40 focus:outline-none transition-all duration-200"
                  >
                    <option value="">Select a subject</option>
                    {subjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Manual Topics List */}
              {manualSelectedSubject && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-neutral-900">Topics</h3>
                    <button
                      onClick={handleAddManualTopic}
                      className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-all duration-200"
                    >
                      <i className="fas fa-plus text-xs"></i>
                      <span>Add Topic</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {manualTopics.map((topic, index) => (
                      <div
                        key={index}
                        className="group relative bg-neutral-50 rounded-xl border-2 border-neutral-200 hover:border-purple-300 transition-all p-4"
                      >
                        {manualTopics.length > 1 && (
                          <button
                            onClick={() => handleRemoveManualTopic(index)}
                            className="absolute -right-2 -top-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove topic"
                          >
                            <i className="fas fa-times text-[10px]"></i>
                          </button>
                        )}

                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </div>
                          <span className="text-xs font-medium text-neutral-600">Topic {index + 1}</span>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                              Topic Name *
                            </label>
                            <input
                              type="text"
                              value={topic.name}
                              onChange={(e) => handleManualTopicChange(index, 'name', e.target.value)}
                              className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 outline-none transition-all"
                              placeholder="Enter topic name..."
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                              Description
                            </label>
                            <textarea
                              value={topic.description}
                              onChange={(e) => handleManualTopicChange(index, 'description', e.target.value)}
                              rows={2}
                              className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-700 focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 outline-none resize-none transition-all"
                              placeholder="Enter topic description..."
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                              Difficulty Level
                            </label>
                            <select
                              value={topic.difficultyLevel}
                              onChange={(e) => handleManualTopicChange(index, 'difficultyLevel', e.target.value)}
                              className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 outline-none transition-all"
                            >
                              <option value="Easy">Easy</option>
                              <option value="Medium">Medium</option>
                              <option value="Hard">Hard</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Create Button */}
                  <div className="flex justify-end pt-4 border-t border-neutral-200">
                    <button
                      onClick={handleCreateManualTopics}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                      disabled={isLoading || !manualSelectedSubject}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span className="text-sm">Creating Topics...</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plus text-xs"></i>
                          <span className="text-sm">Create Topics</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Step 2: Job Selection */}
          {selectedDepartment && selectedClass && selectedSection && creationMethod === 'job-based' && (
            <section className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 md:w-10 md:h-10 bg-blue-50 rounded-xl flex items-center justify-center ring-1 ring-blue-200/50">
                    <span className="text-blue-600 font-semibold text-xs md:text-sm">2</span>
                  </div>
                  <div>
                    <h2 className="text-base md:text-lg font-semibold text-neutral-900 tracking-tight">Select Jobs</h2>
                    <p className="text-xs md:text-sm text-neutral-600 leading-relaxed">
                      Choose jobs to extract skills from ({selectedJobs.length} selected)
                    </p>
                  </div>
                </div>
                {jobs.length > 0 && !loadingStates.jobs && (
                  <button
                    onClick={handleSelectAllJobs}
                    className="text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-all duration-200"
                  >
                    {selectedJobs.length === jobs.length ? "Deselect All" : "Select All"}
                  </button>
                )}
              </div>

              {loadingStates.jobs ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                  <p className="text-sm text-neutral-600">Loading jobs...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-8 bg-neutral-50 rounded-xl">
                  <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <i className="fas fa-briefcase text-neutral-400 text-sm"></i>
                  </div>
                  <p className="text-neutral-600 text-sm mb-2">Loading jobs for this department...</p>
                  <p className="text-xs text-neutral-400">Please wait a moment</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                    {jobs.map((job) => {
                      const isSelected = selectedJobs.includes(job._id);
                      return (
                        <button
                          key={job._id}
                          onClick={() => handleJobToggle(job._id)}
                          className={`p-4 rounded-xl transition-all duration-200 text-left ${
                            isSelected
                              ? "bg-blue-50 ring-2 ring-blue-500 shadow-sm"
                              : "bg-white ring-1 ring-black/5 hover:ring-blue-300 hover:bg-blue-50/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200 ${
                                isSelected
                                  ? "border-blue-600 bg-blue-600"
                                  : "border-neutral-300"
                              }`}
                            >
                              {isSelected && (
                                <i className="fas fa-check text-white text-[10px]"></i>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-neutral-900 text-sm mb-1 truncate">
                                {job.name || job.title}
                              </h3>
                              <p className="text-xs text-neutral-600 truncate">
                                {job.companyName || job.company || "Company"}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {selectedJobs.length > 0 && (
                    <div className="flex justify-end pt-4 border-t border-neutral-200">
                      <button
                        onClick={handleContinueToSkills}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all duration-200 inline-flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                        disabled={loadingStates.skills}
                      >
                        {loadingStates.skills ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span className="text-sm">Extracting Skills...</span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm">Extract Skills</span>
                            <i className="fas fa-arrow-right text-xs"></i>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          )}

          {/* Step 3: Skills Selection */}
          {currentStep >= 3 && selectedJobs.length > 0 && creationMethod === 'job-based' && (
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold text-sm">3</span>
                          </div>
                        <div>
                    <h2 className="text-lg font-semibold text-slate-900">Select Skills</h2>
                    <p className="text-sm text-slate-600">
                      Choose skills to include in subject ({selectedSkills.length} selected)
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSelectAllSkills}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  {selectedSkills.length === allExtractedSkills.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {loadingStates.skills ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                  <p className="text-sm text-slate-500">Extracting skills from jobs...</p>
                          </div>
                        ) : (
                <>
                  <div className="space-y-6 mb-6">
                    {selectedJobs.map((jobId) => {
                      const job = jobs.find(j => j._id === jobId);
                      const categorizedSkills = jobSkillsCategorized[jobId] || { technical: [], tools: [], soft: [] };
                      const hasSkills = categorizedSkills.technical.length > 0 || categorizedSkills.tools.length > 0 || categorizedSkills.soft.length > 0;
                      
                      if (!hasSkills) return null;

                            return (
                        <div key={jobId} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <i className="fas fa-briefcase text-indigo-600"></i>
                            {job?.name || job?.title || 'Job'}
                          </h3>
                          
                          <div className="space-y-4">
                            {/* Technical Skills */}
                            {categorizedSkills.technical.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">Technical</span>
                                  <span className="text-xs text-slate-500">({categorizedSkills.technical.length})</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {categorizedSkills.technical.map((skill) => {
                                    const isSelected = selectedSkills.includes(skill);
                                    return (
                                      <button
                                        key={`${jobId}-tech-${skill}`}
                                        onClick={() => handleSkillToggle(skill)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                          isSelected
                                            ? "bg-blue-600 text-white shadow-sm"
                                            : "bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
                                        }`}
                                      >
                                        {skill}
                                      </button>
                                    );
                                  })}
                                    </div>
                              </div>
                            )}

                            {/* Tools */}
                            {categorizedSkills.tools.length > 0 && (
                                    <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded">Tools</span>
                                  <span className="text-xs text-slate-500">({categorizedSkills.tools.length})</span>
                        </div>
                                <div className="flex flex-wrap gap-2">
                                  {categorizedSkills.tools.map((skill) => {
                                    const isSelected = selectedSkills.includes(skill);
                                    return (
                                      <button
                                        key={`${jobId}-tool-${skill}`}
                                        onClick={() => handleSkillToggle(skill)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                          isSelected
                                            ? "bg-purple-600 text-white shadow-sm"
                                            : "bg-white border border-purple-200 text-purple-700 hover:bg-purple-50"
                                        }`}
                                      >
                                        {skill}
                                      </button>
                                    );
                                  })}
                      </div>
                    </div>
                            )}

                            {/* Soft Skills */}
                            {categorizedSkills.soft.length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">Soft Skills</span>
                                  <span className="text-xs text-slate-500">({categorizedSkills.soft.length})</span>
                                    </div>
                                <div className="flex flex-wrap gap-2">
                                  {categorizedSkills.soft.map((skill) => {
                                    const isSelected = selectedSkills.includes(skill);
                                    return (
                                      <button
                                        key={`${jobId}-soft-${skill}`}
                                        onClick={() => handleSkillToggle(skill)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                          isSelected
                                            ? "bg-green-600 text-white shadow-sm"
                                            : "bg-white border border-green-200 text-green-700 hover:bg-green-50"
                                        }`}
                                      >
                                        {skill}
                                      </button>
                                    );
                                  })}
                                  </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                                </div>

                  {selectedSkills.length > 0 && (
                    <div className="flex justify-end pt-4 border-t border-slate-200">
                      <button
                        onClick={generateSubjectAndTopics}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Generating with AI...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-magic"></i>
                            <span>Generate Topics with AI</span>
                          </>
                        )}
                      </button>
                                      </div>
                  )}
                </>
              )}
            </section>
          )}

          {/* Step 4: AI Generation & Review */}
          {currentStep >= 4 && generatedSubject.name && creationMethod === 'job-based' && (
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                    <i className="fas fa-magic text-white text-sm"></i>
                                        </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Review Generated Content</h2>
                    <p className="text-sm text-slate-600">Edit and refine before creating</p>
                  </div>
                </div>
                                        <button
                  onClick={downloadGeneratedResults}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
                  title="Download generated subject and topics as Excel"
                >
                  <i className="fas fa-download"></i>
                  <span className="text-sm">Download Results</span>
                </button>
              </div>

              {/* AI Match Analysis Result */}
              {aiMatchResult && (
                <div className="mb-6 p-4 rounded-xl border-2 bg-green-50 border-green-300">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-green-100 text-green-600">
                      <i className="fas fa-link text-sm"></i>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-slate-900">
                          Match Found: {aiMatchResult.matchPercentage}%
                        </h3>
                          <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                          Adding Topics to Existing Subject
                          </span>
                      </div>
                      {aiMatchResult.matchedSubject && (
                        <p className="text-sm text-slate-700 mb-2">
                          <span className="font-medium">Matched Subject:</span> {aiMatchResult.matchedSubject}
                        </p>
                      )}
                      <p className="text-sm text-slate-600">
                        {aiMatchResult.reasoning || `Match percentage: ${aiMatchResult.matchPercentage}%`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Subject */}
              <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subject Name *
                </label>
                <input
                  type="text"
                  value={generatedSubject.name}
                  onChange={(e) =>
                    setGeneratedSubject({ ...generatedSubject, name: e.target.value })
                  }
                  className="w-full bg-white border border-indigo-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none mb-3"
                  placeholder="Subject name"
                />
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description (Read-only)
                </label>
                <textarea
                  value={generatedSubject.description}
                  readOnly
                  className="w-full bg-white border border-green-300 rounded-lg px-4 py-2.5 text-sm outline-none resize-none h-24 cursor-not-allowed"
                  placeholder="Subject description"
                />
                          </div>

              {/* Generated Topics */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">
                      Generated Topics
                    </h3>
                    <p className="text-sm text-slate-600">
                      Review and edit the AI-generated topics below. Click on any field to make changes.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setGeneratedTopics([
                        ...generatedTopics,
                      {
                        _id: `temp-topic-${Date.now()}`,
                        name: "",
                        description: "",
                        difficultyLevel: "Medium", // Keep for backend compatibility
                      },
                      ]);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors shadow-sm hover:shadow-md"
                                        >
                                          <i className="fas fa-plus"></i>
                                          <span>Add Topic</span>
                                        </button>
                                      </div>
                
                <div className="space-y-4">
                  {generatedTopics.map((topic, index) => (
                    <div
                      key={topic._id}
                      className="group relative bg-white rounded-xl border-2 border-slate-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow-md p-5"
                    >
                      {/* Topic Number Badge */}
                      <div className="absolute -left-3 -top-3 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                        {index + 1}
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          setGeneratedTopics(generatedTopics.filter((_, i) => i !== index));
                        }}
                        className="absolute -right-3 -top-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete topic"
                      >
                        <i className="fas fa-times text-xs"></i>
                      </button>

                      <div className="space-y-4">
                        {/* Topic Name */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                            Topic Name
                          </label>
                          <input
                            type="text"
                            value={topic.name}
                            onChange={(e) => {
                              const updated = [...generatedTopics];
                              updated[index].name = e.target.value;
                              setGeneratedTopics(updated);
                            }}
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg px-4 py-3 text-base font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all hover:border-slate-300"
                            placeholder="Enter topic name..."
                          />
                        </div>

                        {/* Topic Description */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
                            Description
                          </label>
                          <textarea
                            value={topic.description}
                            onChange={(e) => {
                              const updated = [...generatedTopics];
                              updated[index].description = e.target.value;
                              setGeneratedTopics(updated);
                            }}
                            rows={3}
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-all hover:border-slate-300"
                            placeholder="Enter topic description..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {generatedTopics.length === 0 && (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
                      <i className="fas fa-inbox text-4xl text-slate-400 mb-3"></i>
                      <p className="text-slate-500 font-medium">No topics generated yet</p>
                      <p className="text-sm text-slate-400 mt-1">Click "Generate Subject & Topics with AI" to create topics</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Create Button */}
              <div className="flex justify-end pt-4 border-t border-slate-200 gap-3">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors"
                >
                  Back
                </button>
                  <button
                    onClick={handleCreateSubjectWithTopics}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Adding Topics...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus"></i>
                        <span>Add Topics to Existing Subject</span>
                      </>
                    )}
                  </button>
                                        </div>
            </section>
          )}

          {/* Step 6: Success Message */}
          {currentStep === 6 && (
            <section className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl shadow-sm border border-emerald-200 p-8 text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check text-white text-2xl"></i>
              </div>
              <h2 className="text-2xl font-semibold text-emerald-900 mb-2">
                Subject & Topics Created Successfully!
              </h2>
              <p className="text-emerald-700 mb-6">
                Your subject and topics have been created and are now available.
              </p>
              <button
                onClick={resetPipeline}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                <i className="fas fa-plus"></i>
                <span>Create Another</span>
              </button>
            </section>
          )}
            </div>
          )}

          {activeTab === 'existing' && (
            <div className="space-y-6">
              {/* Context Selection for Existing View */}
              {(!selectedDepartment || !selectedClass || !selectedSection) && (
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <i className="fas fa-filter text-indigo-600"></i>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">Select Context</h2>
                      <p className="text-sm text-slate-600">Choose Department, Class, and Section to view subjects</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Department *</label>
                      <select
                        value={selectedDepartment}
                        onChange={(e) => handleDepartmentChange(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      >
                        <option value="">Select Department</option>
                        {departments.map((dept) => (
                          <option key={dept._id} value={dept._id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Class *</label>
                      <select
                        value={selectedClass}
                        onChange={(e) => handleClassChange(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-slate-50"
                        disabled={!selectedDepartment}
                      >
                        <option value="">Select Class</option>
                        {classes.map((cls) => (
                          <option key={cls._id} value={cls._id}>{cls.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Section *</label>
                      <select
                        value={selectedSection}
                        onChange={(e) => handleSectionChange(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:bg-slate-50"
                        disabled={!selectedClass}
                      >
                        <option value="">Select Section</option>
                        {sections.map((section) => (
                          <option key={section._id} value={section._id}>{section.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>
              )}

              {/* Existing Subjects & Topics View - Google Material Design */}
              {selectedDepartment && selectedClass && selectedSection && (
                <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                        <i className="fas fa-book text-white"></i>
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">Subjects & Topics</h2>
                        <p className="text-sm text-slate-600">
                          {selectedDepartment && selectedClass && selectedSection
                            ? `${departments.find(d => d._id === selectedDepartment)?.name || ''} - ${classes.find(c => c._id === selectedClass)?.name || ''} - ${sections.find(s => s._id === selectedSection)?.name || ''}`
                            : 'Select context to view subjects'}
                        </p>
                      </div>
                    </div>
                    {subjects.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full">
                          {subjects.length} {subjects.length === 1 ? 'Subject' : 'Subjects'}
                        </span>
                      </div>
                    )}
                  </div>

              {loadingStates.subjects ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                  <p className="text-sm text-slate-500">Loading subjects...</p>
                </div>
              ) : subjects.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-dashed border-slate-300">
                  <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-book-open text-3xl text-slate-400"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No Subjects Found</h3>
                  <p className="text-slate-500 text-sm mb-4">Start creating subjects using the pipeline</p>
                  <button
                    onClick={() => setActiveTab('pipeline')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Create First Subject
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {subjects.map((subject) => {
                    const isSelected = selectedSubject?._id === subject._id;
                    const subjectTopics = topics.filter(t => t.subjectId === subject._id);

                                            return (
                      <div
                        key={subject._id}
                        className={`bg-white rounded-xl border-2 transition-all overflow-hidden ${
                          isSelected
                            ? "border-indigo-500 shadow-lg"
                            : "border-slate-200 hover:border-indigo-300 hover:shadow-md"
                        }`}
                      >
                        {/* Subject Header */}
                        <div
                          className="p-5 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => handleSubjectClick(subject)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                                <i className="fas fa-book text-white text-lg"></i>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                  {subject.name}
                                </h3>
                                {subject.description && (
                                  <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                                    {subject.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <i className="fas fa-list"></i>
                                    {subjectTopics.length} {subjectTopics.length === 1 ? 'Topic' : 'Topics'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'bg-indigo-100 text-indigo-600'
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              <i className={`fas fa-chevron-${isSelected ? 'up' : 'down'} text-sm`}></i>
                            </button>
                          </div>
                        </div>

                        {/* Topics List - Expandable */}
                        {isSelected && (
                          <div className="border-t border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                            {loadingStates.topics ? (
                              <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                                <p className="text-sm text-slate-500">Loading topics...</p>
                              </div>
                            ) : subjectTopics.length === 0 ? (
                              <div className="text-center py-12">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <i className="fas fa-file-alt text-slate-400"></i>
                                </div>
                                <p className="text-slate-500 text-sm font-medium">No topics added yet</p>
                                <p className="text-xs text-slate-400 mt-1">Topics will appear here once added</p>
                              </div>
                            ) : (
                              <div className="p-5">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                                    Topics ({subjectTopics.length})
                                  </h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {subjectTopics.map((topic, index) => (
                                              <div
                                                key={topic._id}
                                      className="group relative bg-white rounded-lg border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all"
                                    >
                                      {/* Topic Number */}
                                      <div className="absolute -left-2 -top-2 w-7 h-7 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-semibold shadow-md">
                                        {index + 1}
                                      </div>
                                      
                                      {/* Delete Button */}
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteTopic(topic._id, topic.name);
                                                  }}
                                        className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                  title="Delete topic"
                                                >
                                                  <i className="fas fa-trash text-xs"></i>
                                                </button>

                                      <div className="pr-10">
                                        <h5 className="font-semibold text-slate-900 text-base mb-3 leading-tight">
                                                    {topic.name}
                                                  </h5>
                                                {topic.description && (
                                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                                    {topic.description}
                                                  </p>
                                                )}
                                              </div>
                                    </div>
                                  ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                  })}
                      </div>
                    )}
            </section>
            )}
          </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TopicManagement;
