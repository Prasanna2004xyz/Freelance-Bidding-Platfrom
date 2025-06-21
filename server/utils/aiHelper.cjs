const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateProposal = async ({ jobTitle, jobDescription, userSkills, currentProposal, freelancerName }) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error('[AI] Missing OpenAI API key. Set OPENAI_API_KEY in your .env');
      throw new Error('OpenAI API key not configured');
    }
    
    if (!jobTitle || !jobDescription) {
      console.error('[AI] Missing job title or description for proposal generation');
      throw new Error('Job title and description are required');
    }

    const systemPrompt = `You are an expert freelancer proposal writer with years of experience helping freelancers win projects. Your goal is to create compelling, professional proposals that stand out and win jobs.

Guidelines for writing winning proposals:
- Be professional but personable and approachable
- Highlight relevant skills and experience that match the job requirements
- Address the client's specific needs and pain points
- Include a clear value proposition and what makes you unique
- Keep it concise but comprehensive (150-300 words)
- Use a confident but not arrogant tone
- Show understanding of the project scope
- Include a clear call to action
- Structure with clear paragraphs for readability
- Mention specific deliverables or milestones if appropriate

The proposal should demonstrate expertise, reliability, and enthusiasm for the project.`;

    const userPrompt = `Job Title: ${jobTitle}
Job Description: ${jobDescription}
Freelancer Name: ${freelancerName}
Freelancer Skills: ${userSkills.join(', ')}
${currentProposal ? `Current Proposal Draft: ${currentProposal}` : ''}

Please ${currentProposal ? 'improve and rewrite' : 'write'} a winning proposal for this job. Make it compelling, professional, and tailored to the specific requirements.`;

    console.log('[AI] Generating proposal for job:', jobTitle);

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 600,
      temperature: 0.7,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });

    if (!completion.choices || !completion.choices[0]?.message?.content) {
      console.error('[AI] OpenAI returned no content:', completion);
      throw new Error('AI did not return a proposal. Please try again.');
    }

    const generatedProposal = completion.choices[0].message.content.trim();
    
    console.log('[AI] Successfully generated proposal, length:', generatedProposal.length);
    
    return generatedProposal;
  } catch (error) {
    // Log full error for debugging
    console.error('[AI] Proposal generation error:', error);
    
    // Return user-friendly error messages based on error type
    if (error.code === 'insufficient_quota') {
      return "AI service quota exceeded. Please try again later or write your proposal manually.";
    } else if (error.code === 'invalid_api_key') {
      return "AI service configuration error. Please contact support.";
    } else if (error.message?.includes('rate limit')) {
      return "AI service is busy. Please try again in a moment or write your proposal manually.";
    } else if (error.message?.includes('timeout')) {
      return "AI service request timed out. Please try again or write your proposal manually.";
    } else {
      return "Couldn't connect to AI service. Please try again later or write your proposal manually.";
    }
  }
};

module.exports = {
  generateProposal
};