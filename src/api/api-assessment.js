import axios from 'axios';

/**
 * Backend API proxy for AI-powered assessment generation
 */
const API_BASE_URL = import.meta.env.VITE_SERVER_API_URL || 'http://localhost:3001';

/**
 * Call the backend AI proxy endpoint
 * @param {string} prompt - The prompt to send to Vertex AI
 * @returns {Promise<Object>} AI response data
 */
const callGeminiAPI = async (prompt) => {
  try {
    // Get access token from localStorage
    const accessToken = localStorage.getItem('accessToken');
    const headers = {};
    
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await axios.post(
      `${API_BASE_URL}/api/ai/parse-job`,
      { prompt },
      { headers }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'AI generation failed');
    }
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};

/**
 * Generate AI-powered assessment questions for selected topics
 * @param {Object} payload - Assessment configuration
 * @param {string} payload.subjectName - Name of the subject
 * @param {Array} payload.topics - Array of topic objects with topicId, topicName, and questionCount
 * @param {number} payload.totalQuestions - Total number of questions to generate
 * @param {string} payload.difficulty - Difficulty level (easy/medium/hard)
 * @param {string} payload.testTitle - Title of the test
 * @param {string} payload.testDescription - Description of the test
 * @returns {Promise<Object>} Generated assessment with questions and answers
 */
export const generateAssessment = async (payload) => {
  const { subjectName, topics, totalQuestions, difficulty, testTitle, testDescription, contextDescription } = payload;

  // Build topic distribution description for AI
  const topicDescriptions = topics.map(t => 
    `- ${t.topicName}: ${t.questionCount} question${t.questionCount !== 1 ? 's' : ''}
     ${t.topicDescription ? `  (Context/Description: ${t.topicDescription})` : ''}`
  ).join('\n');

  const prompt = `
You are an expert educator and assessment creator. Generate a comprehensive assessment with multiple-choice questions.

**Assessment Details:**
- Subject: ${subjectName}
- Title: ${testTitle}
- Description: ${testDescription}
${contextDescription ? `- Additional Context (e.g. Job Description): ${contextDescription}` : ''}
- Difficulty Level: ${difficulty}
- Total Questions: ${totalQuestions}

**Topic Distribution:**
${topicDescriptions}

**Instructions:**
1. Generate EXACTLY ${totalQuestions} multiple-choice questions distributed across the specified topics.
2. Each question must have:
   - A clear, well-written question text
   - EXACTLY 4 answer options
   - One correct answer (must be one of the 4 options, word-for-word match)
   - The topicId associated with the question
   - Difficulty level (${difficulty})
3. Use the "Additional Context" provided above to make the questions relevant to the specific job or subject context if applicable.

4. Question Quality Guidelines:
   - Questions should test understanding, not just memorization
   - Options should be plausible and well-distributed
   - Avoid "all of the above" or "none of the above" options
   - Use clear, unambiguous language
   - Ensure the correct answer is definitively correct

5. For each topic, include the exact topicId in the response:
${topics.map(t => `   - ${t.topicName}: "${t.topicId}"`).join('\n')}

6. Format the output as a valid JSON object matching this structure:

{
  "questions": [
    {
      "questionText": "What is the primary purpose of HTML?",
      "options": [
        "To style web pages",
        "To structure web content",
        "To add interactivity",
        "To manage databases"
      ],
      "correctAnswer": "To structure web content",
      "topicId": "${topics[0]?.topicId || 'TOPIC_ID_HERE'}",
      "difficultyLevel": "${difficulty}"
    }
  ]
}

**CRITICAL:** 
- The "correctAnswer" must EXACTLY match one of the strings in the "options" array
- Generate ${totalQuestions} questions in total
- Distribute questions according to the topic counts specified above
- Use the exact topicId values provided above for each question
- Return ONLY valid JSON, no additional text or explanation

Now generate the assessment:
  `;

  return await callGeminiAPI(prompt);
};

/**
 * Validate generated assessment structure
 * @param {Object} assessment - Generated assessment object
 * @returns {Object} Validation result with isValid flag and errors array
 */
export const validateAssessment = (assessment) => {
  const errors = [];
  
  if (!assessment || typeof assessment !== 'object') {
    return { isValid: false, errors: ['Invalid assessment format'] };
  }
  
  if (!Array.isArray(assessment.questions)) {
    return { isValid: false, errors: ['Questions array is missing or invalid'] };
  }
  
  assessment.questions.forEach((q, index) => {
    if (!q.questionText || typeof q.questionText !== 'string') {
      errors.push(`Question ${index + 1}: Missing or invalid question text`);
    }
    
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      errors.push(`Question ${index + 1}: Must have exactly 4 options`);
    }
    
    if (!q.correctAnswer || typeof q.correctAnswer !== 'string') {
      errors.push(`Question ${index + 1}: Missing or invalid correct answer`);
    } else if (q.options && !q.options.includes(q.correctAnswer)) {
      errors.push(`Question ${index + 1}: Correct answer must match one of the options`);
    }
    
    if (!q.topicId) {
      errors.push(`Question ${index + 1}: Missing topicId`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  generateAssessment,
  validateAssessment
};

