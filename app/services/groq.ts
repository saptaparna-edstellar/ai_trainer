import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function generateJobTitles(skills: string[]): Promise<string[]> {
  const prompt = `
You are a LinkedIn recruiter. Given these skills, return a JSON array of LinkedIn job titles that a TRAINER specializing in these skills would typically have on their profile.

Skills: ${skills.join(", ")}

Rules:
- Only include trainer/instructor/coach related titles
- Include 5 to 8 realistic LinkedIn job titles
- Return ONLY a JSON array of strings like: ["Title 1", "Title 2"]
- No explanation, no markdown
`;

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  const content = completion.choices[0].message.content || '["Trainer"]';
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) return ["Trainer"];
  try {
    const titles = JSON.parse(match[0]);
    return Array.isArray(titles) ? titles : ["Trainer"];
  } catch {
    return ["Trainer"];
  }
}

export async function filterCandidates({
  profiles,
  requirements,
}: {
  profiles: any[];
  requirements: any;
}) {
  // Data is already trimmed at source in apify.ts — pass through as-is
  const trimmed = profiles;

  const prompt = `
You are a recruiter AI. Filter these LinkedIn profiles and return only trainers who match the requirements.

Requirements:
- Must be a trainer (not a developer, engineer, or non-trainer role)
- Required skills: ${requirements.skills?.join(", ")}
${requirements.experience ? `- Experience: ${requirements.experience}` : ""}
${requirements.location ? `- Location: ${requirements.location}` : ""}
${requirements.industry ? `- Industry: ${requirements.industry}` : ""}

Use the skills array and experience titles to verify the match. Use location to verify city.

Profiles:
${JSON.stringify(trimmed, null, 2)}

Return a valid JSON array of matching profiles:
[{"title": "...", "url": "...", "description": "..."}]

Return ONLY the JSON array. No explanation. No markdown.
`;

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
  });

  const content = completion.choices[0].message.content || "[]";
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    return JSON.parse(match[0]);
  } catch {
    return [];
  }
}

export async function analyzeCandidate({
  candidate,
  requirements,
}: {
  candidate: any;
  requirements: any;
}) {
  const prompt = `
You are an AI trainer.

Candidate:
${JSON.stringify(candidate)}

Requirements:
${JSON.stringify(requirements)}

Return:
1. Match Score out of 100
2. Short Summary
3. Missing Skills
4. Strengths
`;

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
  });
  return completion.choices[0].message.content;
}