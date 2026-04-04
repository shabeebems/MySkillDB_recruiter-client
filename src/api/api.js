/**
 * AI Configuration for Vertex AI Access via Integrated Backend Server
 * * * NOTE: The Gemini API Key (VITE_GEMINI_API_KEY) has been completely removed 
 * and is no longer used by the frontend.
 * * All secure AI calls are now proxied through the main backend server 
 * defined by VITE_SERVER_API_URL (which is currently http://localhost:8000).
 */

import { postRequest } from './apiRequests';

/**
 * Call the Integrated Backend for Vertex AI (uses authenticated /api/ai/parse-job)
 * @param {string} prompt - The prompt to send to the backend
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @returns {Promise<{success: boolean, data: any, error: string|null}>}
 */
export const callGeminiAPI = async (prompt, maxRetries = 3) => {
  const payload = { prompt: prompt };

  let attempt = 0;
  let waitTime = 1;

  while (attempt < maxRetries) {
    attempt++;

    try {
      const response = await postRequest('ai/parse-job', payload);
      const httpCode = response.status;
      const result = response.data;
      
      // Check for successful response from the integrated backend
      if (httpCode >= 200 && httpCode < 300 && result.success) {
        // The backend handles the complex API interaction and JSON parsing
        return { success: true, data: result.data, error: null };
      } else if (httpCode === 503 || (httpCode === 500 && result.error?.includes?.('VERTEX_AI_FAILURE'))) {
        // Retry on service unavailability (503 status code or custom error code from backend)
        if (attempt < maxRetries) {
          console.warn(`Backend/API Error (Attempt ${attempt}). Retrying in ${waitTime} seconds...`);
          await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
          waitTime *= 2; // Exponential backoff
          continue;
        }
      } else {
        const errorMessage = result.error || `HTTP Error ${httpCode}`;
        return {
          success: false,
          data: result,
          error: `Proxy Error (${errorMessage})`
        };
      }
    } catch (error) {
      const status = error.response?.status;
      const result = error.response?.data;
      if (
        status === 503 ||
        (status === 500 && result?.error?.includes?.('VERTEX_AI_FAILURE'))
      ) {
        if (attempt < maxRetries) {
          console.warn(`Backend/API Error (Attempt ${attempt}). Retrying in ${waitTime} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
          waitTime *= 2;
          continue;
        }
      }
      if (status === 401 || status === 403) {
        return {
          success: false,
          data: result?.message || result,
          error: result?.message || 'Please log in to use AI features.',
        };
      }
      if (attempt < maxRetries) {
        console.error(`Request Error to Backend (Attempt ${attempt}):`, error);
        await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
        waitTime *= 2;
        continue;
      }
      return {
        success: false,
        data: null,
        error: `Network Error: Could not reach the AI parse endpoint. Ensure your main server is running and you are logged in.`,
      };
    }
  }

  return {
    success: false,
    data: null,
    error: `The service is unavailable after ${maxRetries} attempts. Please try again later.`
  };
};

// --- Exported functions remain the same, as they just call the updated callGeminiAPI ---

/**
 * Parse job posting text to extract structured data
 * @param {string} jobText - The full job posting text
 * @returns {Promise<{success: boolean, data: any, error: string|null}>}
 */
export const parseJobPosting = async (jobText) => {
  const prompt = `
Act as an expert recruitment data parser. I will paste a large block of unstructured text from a job posting. 
Your job is to analyze the text and extract the following fields:

1.  \`job_title\`: The job title (e.g., 'Senior Software Engineer').
2.  \`company\`: The company name. If not found, return 'Not specified'.
3.  \`description\`: The main job description, responsibilities, and qualifications, formatted as clean text.
4.  \`requirements\`: Extract all job requirements, qualifications, and must-have skills as an ARRAY of strings. Each requirement should be a separate point. If no requirements are found, return an empty array [].
5.  \`salary\`: The salary range (e.g., '$120,000 - $140,000' or 'INR 10 LPA - 15 LPA'). If not found, return 'Not specified'.
6.  \`location\`: The job location (e.g., 'Kochi, Kerala' or 'Remote'). If not found, return 'Not specified'.
7.  \`job_type\`: The employment type (e.g., 'Full-time', 'Contract', 'Internship'). If not found, return 'Full-time'.

IMPORTANT: The \`requirements\` field MUST be an array of strings, where each string is a separate requirement point. For example:
- "Bachelor's degree in Computer Science or related field"
- "3+ years of experience with React.js"
- "Strong problem-solving skills"
- "Experience with REST APIs"

Format the entire output as a single, valid JSON object.

Example Output:
{"job_title": "Senior Software Engineer", "company": "Tech Corp", "description": "Responsibilities:\\n- Build and maintain...", "requirements": ["Bachelor's degree in CS", "3+ years React experience", "Strong problem-solving skills"], "salary": "Not specified", "location": "Remote", "job_type": "Full-time"}

Here is the text to parse:

${jobText}
  `;

  return await callGeminiAPI(prompt);
};

/**
 * Extract skills from job description
 * @param {string} jobDescription - The job description text
 * @returns {Promise<{success: boolean, data: any, error: string|null}>}
 */
export const extractSkills = async (jobDescription) => {
  const prompt = `
Act as an expert recruitment analyst. Analyze the following job description.
**Your most important task is to infer skills from responsibilities**, not just list keywords.

For example, if a responsibility is 'Develop new user-facing features', the skills are 'Feature Development' and 'Frontend Development'.
If a responsibility is 'Communicate with stakeholders', the skill is 'Stakeholder Communication'.

Extract the following:

1.  \`technical_skills\`: The 6 MOST IMPORTANT technical/hard skills for this job (e.g., 'React.js', 'Python', 'Data Analysis', 'Safety Inspections'). Only list exactly 6 skills, prioritizing the most critical ones.
2.  \`tools\`: The 2 MOST IMPORTANT specific software or tools needed for this job. Only list exactly 2 tools. If fewer than 2 are mentioned, infer the most likely tools based on the job requirements.
3.  \`soft_skills\`: The 2 MOST IMPORTANT soft skills needed for this job (e.g., 'Communication', 'Teamwork', 'Problem Solving', 'Leadership'). Only list exactly 2 skills.
4.  \`education\`: The required educational qualifications. If not specified, return 'Not specified'.

For each skill in \`technical_skills\`, \`tools\`, and \`soft_skills\`, provide an object with two keys:
1.  \`skill\`: The name of the skill/tool.
2.  \`explanation\`: A brief (max 150 characters) explanation of how this skill is used in the job, based *only* on the description.

**IMPORTANT**: You must return EXACTLY 6 technical skills, 2 tools, and 2 soft skills. No more, no less.

Format the entire output as a single valid JSON object.

Example Output:
{
  "technical_skills": [
    {"skill": "React.js", "explanation": "Build and maintain user interface components."},
    {"skill": "TypeScript", "explanation": "Develop type-safe frontend applications."},
    {"skill": "REST APIs", "explanation": "Integrate backend services with frontend."},
    {"skill": "State Management", "explanation": "Manage complex application state."},
    {"skill": "Responsive Design", "explanation": "Create mobile-friendly interfaces."},
    {"skill": "Unit Testing", "explanation": "Write tests for frontend components."}
  ],
  "tools": [
    {"skill": "Git", "explanation": "Version control and collaboration."},
    {"skill": "JIRA", "explanation": "Track tasks and project management."}
  ],
  "soft_skills": [
    {"skill": "Communication", "explanation": "Collaborate with cross-functional teams."},
    {"skill": "Problem Solving", "explanation": "Debug and resolve technical issues."}
  ],
  "education": "Bachelor's Degree in Computer Science"
}

Job Description:

${jobDescription}
  `;

  return await callGeminiAPI(prompt);
};

/**
 * Generate a comprehensive reading module for a skill
 * @param {string} jobTitle - The job title
 * @param {string} companyName - The company name
 * @param {string} skillName - The skill to generate content for
 * @returns {Promise<{success: boolean, data: any, error: string|null}>}
 */
export const generateReadingModule = async (jobTitle, companyName, skillName) => {
  const prompt = `
You are writing a short, focused learning guide (maximum 2 pages when printed). Be concise. No fluff.

**Context:**
- Job role: ${jobTitle}
- Company: ${companyName}
- Skill: ${skillName}

**Required structure (exactly 3 sections, each brief):**

1. **How this skill is used in this role**  
   In 2–4 short paragraphs or bullets: how ${skillName} is applied day-to-day in a ${jobTitle} role (e.g. tasks, outcomes). Keep it practical and role-specific.

2. **Online resources to learn this skill**  
   List 3–5 specific, real resources: official docs, free courses (e.g. Coursera, YouTube channels), blogs, or practice sites. For each give: name, what it’s good for, and URL if well-known. Use a short list or table. No long descriptions.

3. **How to use the Interview Buddy to learn what you need**  
   In 2–3 short paragraphs: how to talk to the “Interview Buddy” (in-app Interview Buddy chat) to get the most out of it for this skill. Include: example questions to ask, how to ask for examples or practice ideas, and how to ask for role-specific advice. Tone: direct and actionable.

**Output format:**  
Return ONLY a valid JSON object (no markdown, no extra text). Use \\n for newlines in strings. Escape any quotes inside string values with a backslash.
- "skillName" must be exactly: ${JSON.stringify(skillName)}
- "jobContext" must be exactly: ${JSON.stringify(`${jobTitle} at ${companyName}`)}
- "introduction": 1-2 sentences only.
- "keyConcepts": array of exactly 3 objects, each with "title" and "content". Titles: "How this skill is used in this role", "Online resources to learn this skill", "How to use the Interview Buddy".
- "summary": array of 2-3 short strings.

**Rules:**
- Total reading length: maximum 2 pages (roughly 500–700 words total). Prefer shorter.
- Be specific (real resource names, concrete question examples).
- Return ONLY the JSON object. No code fences, no explanation before or after.
`;

  return await callGeminiAPI(prompt);
};

/**
 * Generate a teleprompter-style video script for students
 * @param {string} jobTitle - The target job title
 * @param {string} jobDescription - The job description for context
 * @param {string} skillName - The skill being discussed
 * @param {string} scriptType - Type of script: 'teaching', 'linkedin_post', 'problem_solving'
 * @param {string} userInput - User's specific input based on script type
 * @param {string} duration - Video duration: '2-3', '5-7', or '8-10' minutes
 * @param {string} studentName - The student's name to personalize the script
 * @param {object} cvData - Optional CV data (profile, education, experience) for YouTube video scripts
 * @returns {Promise<{success: boolean, data: any, error: string|null}>}
 */
export const generateTeleprompterScript = async (jobTitle, jobDescription, skillName, scriptType, userInput, duration, studentName = 'Your Name', cvData = null) => {
  console.log('[generateTeleprompterScript] Called with:', {
    jobTitle,
    skillName,
    scriptType,
    userInput: userInput || '(empty)',
    duration,
    studentName,
    hasCvData: !!cvData
  });

  let scriptPrompt = '';
  
  // Base context for all scripts
  const contextInfo = `
**Job Context:**
- Target Role: ${jobTitle}
- Job Description: ${jobDescription || 'Not specified'}
- Skill in Focus: ${skillName}
- Video Duration: ${duration} minutes
- Student Name: ${studentName}

**IMPORTANT:** Use the student's actual name "${studentName}" in the script, NOT placeholders like [Student's Name] or [Your Name].
`;

  // Different prompts based on script type
  switch (scriptType) {
    case 'teaching':
      // Build CV context string
      let cvContext = '';
      if (cvData) {
        const educationInfo = cvData.education?.length > 0 
          ? cvData.education.map(edu => `${edu.title || edu.degree || ''} from ${edu.institution || ''}`).join(', ')
          : 'Not specified';
        const experienceInfo = cvData.experience?.length > 0
          ? cvData.experience.map(exp => `${exp.title || exp.position || ''} at ${exp.company || exp.organization || ''}`).join(', ')
          : 'No prior experience';
        
        cvContext = `
**Student CV Context:**
- Education: ${educationInfo}
- Experience: ${experienceInfo}
- About: ${cvData.profile?.aboutMe || 'Not specified'}
`;
      }
      
      scriptPrompt = `
${contextInfo}
${cvContext}

**Script Type:** YouTube Video - Skill Building Journey

**What this video is:**
"I am preparing for a specific role, and this is how I'm building the required skills."

**Why this works (Recruiter Psychology):**
- Shows intent + clarity
- Proves discipline and planning
- Honest and believable
- Signals long-term hire potential

**Script Tone:** First-person, Calm, reflective, No exaggeration

${userInput ? `**User's Input:** ${userInput}` : '**Note:** No specific user input provided. Generate a comprehensive script based on the job role, skill, and CV context.'}

**AI Script Flow (Job-Centric but Honest):**
1. **Who I am + role I'm preparing for** - Introduce yourself naturally, mention your background briefly, and state the role you're preparing for (${jobTitle})
2. **Why I chose this role** - Explain your motivation and interest in this role authentically
3. **Core skills required for this role** - Discuss the key skills needed for ${jobTitle}, focusing on "${skillName}" as the skill you're building
4. **How I am learning it** - Describe your learning methods (courses, AI Tutor, reading online, watching videos, hands-on practice, etc.)
5. **What I am focusing on improving next** - Share what aspects you're working on and your learning roadmap
6. **How it is connected to my degree** - Connect your learning journey to your educational background naturally
7. **Use context from CV data** - Naturally weave in relevant information from your education and experience

**Script Requirements:**
1. **First-Person Narrative** - Write as if ${studentName} is speaking directly to camera in a calm, reflective manner
2. **Authentic & Honest** - No exaggeration, be genuine about the learning process
3. **Job-Focused** - Keep the ${jobTitle} role as the central theme
4. **Skill-Specific** - Focus on "${skillName}" as the primary skill being developed
5. **CV Integration** - Naturally incorporate education and experience context where relevant
6. **Timing Markers** - Include approximate timestamps for pacing (${duration} minutes total)

**Output Format (JSON):**
{
  "title": "Building ${skillName} for ${jobTitle} - My Learning Journey",
  "duration": "${duration} minutes",
  "sections": [
    {
      "timestamp": "0:00 - 0:30",
      "section": "Introduction - Who I am and the role I'm preparing for",
      "script": "Exact words to say in first-person, calm and reflective tone..."
    },
    {
      "timestamp": "0:30 - 1:30",
      "section": "Why I chose this role",
      "script": "Exact words to say..."
    },
    {
      "timestamp": "1:30 - 2:30",
      "section": "Core skills required for this role",
      "script": "Exact words to say, focusing on ${skillName}..."
    },
    {
      "timestamp": "2:30 - 3:30",
      "section": "How I am learning it",
      "script": "Exact words to say about learning methods..."
    },
    {
      "timestamp": "3:30 - 4:00",
      "section": "What I am focusing on improving next",
      "script": "Exact words to say..."
    },
    {
      "timestamp": "4:00 - 4:30",
      "section": "How it connects to my degree",
      "script": "Exact words to say, connecting to education..."
    },
    {
      "timestamp": "4:30 - END",
      "section": "Conclusion - Reflection and next steps",
      "script": "Exact words to say..."
    }
  ],
  "tips": ["Speak naturally and calmly", "Maintain eye contact with camera", "Be authentic and honest", "No need to exaggerate achievements"]
}

**IMPORTANT INSTRUCTIONS:**
- Adjust timestamps to fit the ${duration} minute duration appropriately
- Use ${studentName}'s actual name throughout the script
- Write in first-person perspective
- Maintain a calm, reflective tone - no exaggeration
- Naturally integrate CV context (education, experience) where relevant
- Keep the focus on ${jobTitle} role and "${skillName}" skill
- Make it sound authentic and believable

Generate the complete teleprompter script now.`;
      break;

    case 'linkedin_post':
      scriptPrompt = `
${contextInfo}

**Script Type:** LinkedIn Learning Journey Post

**What the Student Learned:** ${userInput}

**Objective:**
Create a teleprompter-style script for a video where the student shares their learning journey with "${skillName}" on LinkedIn. They want to talk about what they learned and what they found challenging, positioning themselves as someone actively learning and growing for a ${jobTitle} role.

**Script Requirements:**
1. **Authentic & Relatable** - Honest about challenges and learning process
2. **Professional Yet Personal** - LinkedIn-appropriate but genuine
3. **Value-Driven** - Share insights that help others
4. **Career-Focused** - Connect learning to ${jobTitle} aspirations
5. **Engagement Hooks** - Questions or statements that encourage comments

**Output Format (JSON):**
{
  "title": "My Learning Journey with ${skillName}",
  "duration": "${duration} minutes",
  "sections": [
    {
      "timestamp": "0:00 - 0:20",
      "section": "Hook - Why I'm Learning This",
      "script": "Exact words to say..."
    },
    {
      "timestamp": "0:20 - 1:30",
      "section": "What I Learned",
      "script": "Exact words to say..."
    },
    {
      "timestamp": "1:30 - 3:00",
      "section": "Challenges I Faced",
      "script": "Exact words to say..."
    },
    {
      "timestamp": "3:00 - 4:30",
      "section": "How I Overcame Them",
      "script": "Exact words to say..."
    },
    {
      "timestamp": "4:30 - 5:00",
      "section": "Call to Action & Engagement",
      "script": "Exact words to say..."
    }
  ],
  "hashtagSuggestions": ["#${skillName.replace(/\s+/g, '')}", "#${jobTitle.replace(/\s+/g, '')}", "#LearningJourney", "#CareerGrowth"],
  "tips": ["Tip 1 for delivery", "Tip 2 for delivery"]
}

Generate the complete teleprompter script now.`;
      break;

    case 'problem_solving':
      scriptPrompt = `
${contextInfo}

**Script Type:** Real-World Problem Solving Case Study

**Problem the Student Solved:** ${userInput}

**Objective:**
Create a teleprompter-style script for a student who wants to showcase how they used "${skillName}" to solve a real-world problem. This demonstrates practical application and problem-solving ability relevant to a ${jobTitle} role.

**Script Requirements:**
1. **Story-Driven** - Use the STAR method (Situation, Task, Action, Result)
2. **Technical Yet Accessible** - Show expertise without jargon overload
3. **Results-Focused** - Emphasize outcomes and impact
4. **Skill Demonstration** - Clearly show how ${skillName} was applied
5. **Professional Confidence** - Position as a capable problem-solver

**Output Format (JSON):**
{
  "title": "How I Used ${skillName} to Solve [Problem]",
  "duration": "${duration} minutes",
  "sections": [
    {
      "timestamp": "0:00 - 0:30",
      "section": "Hook - The Problem",
      "script": "Exact words to say..."
    },
    {
      "timestamp": "0:30 - 1:30",
      "section": "Situation & Context",
      "script": "Exact words to say..."
    },
    {
      "timestamp": "1:30 - 3:00",
      "section": "My Approach & Solution",
      "script": "Exact words to say..."
    },
    {
      "timestamp": "3:00 - 4:30",
      "section": "Implementation & Challenges",
      "script": "Exact words to say..."
    },
    {
      "timestamp": "4:30 - 5:00",
      "section": "Results & Key Learnings",
      "script": "Exact words to say..."
    }
  ],
  "tips": ["Tip 1 for delivery", "Tip 2 for delivery"]
}

Generate the complete teleprompter script now.`;
      break;

    default:
      return {
        success: false,
        error: 'Invalid script type',
        data: null
      };
  }

  try {
    console.log('[generateTeleprompterScript] Sending prompt to AI...');
    const response = await callGeminiAPI(scriptPrompt);
    console.log('[generateTeleprompterScript] AI Response:', {
      success: response.success,
      hasData: !!response.data,
      dataType: typeof response.data,
      error: response.error
    });
    
    // Validate response structure for script generation
    if (response.success && response.data) {
      // Check if the response is a raw string (parsing failed on backend)
      if (typeof response.data === 'string') {
        console.warn('[generateTeleprompterScript] Received raw string response, attempting to parse...');
        try {
          // Try to extract JSON from the raw string
          const jsonMatch = response.data.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            response.data = JSON.parse(jsonMatch[0]);
            console.log('[generateTeleprompterScript] Successfully parsed JSON from raw string');
          } else {
            throw new Error('Could not extract JSON from raw response');
          }
        } catch (parseError) {
          console.error('[generateTeleprompterScript] Failed to parse raw response:', parseError);
          console.error('[generateTeleprompterScript] Raw response:', response.data);
          return {
            success: false,
            error: 'Failed to parse AI response. Please try again.',
            data: null
          };
        }
      }
      
      // Validate that we have sections
      if (!response.data.sections || !Array.isArray(response.data.sections)) {
        console.error('[generateTeleprompterScript] Invalid script response structure:', response.data);
        console.error('[generateTeleprompterScript] Response keys:', Object.keys(response.data || {}));
        return {
          success: false,
          error: 'AI response missing required sections. Please try again.',
          data: null
        };
      }
      
      console.log('[generateTeleprompterScript] Successfully validated response with', response.data.sections.length, 'sections');
    } else {
      console.error('[generateTeleprompterScript] Response not successful:', response);
    }
    
    return response;
  } catch (error) {
    console.error('[generateTeleprompterScript] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate script',
      data: null
    };
  }
};

/**
 * Generate AI-powered job skills, tools, and responsibilities based on job title
 * @param {string} jobTitle - The job title to analyze
 * @returns {Promise<{success: boolean, data: {skills: Array, tools: Array, responsibilities: Array}, error: string|null}>}
 */
export const generateJobSkillsAndTools = async (jobTitle) => {
  const prompt = `
You are an expert HR consultant and job market analyst. Your task is to analyze the job title "${jobTitle}" and provide industry-standard requirements.

**Job Title:** ${jobTitle}

**Task:** Generate a comprehensive list of:
1. **Required Skills** (10-15 skills) - Technical and domain-specific skills needed
2. **Tools & Technologies** (10-15 tools) - Software, platforms, and technologies commonly used
3. **Key Responsibilities** (10-15 responsibilities) - Main duties and tasks for this role

**Output Format:**
Return ONLY a valid JSON object with this exact structure:
{
  "skills": [
    {"name": "Skill name", "level": "Beginner/Intermediate/Advanced/Expert"},
    ...
  ],
  "tools": [
    {"name": "Tool name", "purpose": "Brief purpose description"},
    ...
  ],
  "responsibilities": [
    "Responsibility description 1",
    "Responsibility description 2",
    ...
  ]
}

**Requirements:**
- Focus on industry-standard, current market requirements
- Skills should be specific and relevant to the role
- Tools should be popular and widely used in the industry
- Responsibilities should be clear, actionable, and realistic
- Ensure all JSON is properly formatted and escaped
- Return ONLY the JSON object, no additional text

Generate the response now:
`;

  return await callGeminiAPI(prompt);
};
