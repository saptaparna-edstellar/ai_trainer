import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const MODEL = "llama-3.3-70b-versatile";

export async function generateJobTitles(skills: string[], description: string = ""): Promise<string[]> {
  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 300,
    temperature: 0.3,
    messages: [
      {
        role: "user",
        content: `Generate 8 LinkedIn job titles for professionals who work with: ${skills.join(", ")}.${description ? ` Context: ${description}` : ""}

Include only roles where the person teaches, trains, coaches, or advises others — trainers, instructors, coaches, consultants, facilitators, mentors. No engineers, developers, or employees who just use the skill.
Return ONLY a JSON array like: ["Title 1", "Title 2"]. No explanation.`,
      },
    ],
  });

  const content = completion.choices[0].message.content || "";
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) return ["Trainer", "Consultant", "Coach"];
  try {
    const titles = JSON.parse(match[0]);
    return Array.isArray(titles) ? titles : ["Trainer", "Consultant", "Coach"];
  } catch {
    return ["Trainer", "Consultant", "Coach"];
  }
}

export async function filterCandidates({
  profiles,
  requirements,
}: {
  profiles: any[];
  requirements: any;
}) {
  const expLabel: Record<string, string> = {
    fresher: "0–1 years",
    "5+": "5 or more years",
    "10+": "10 or more years",
    "20+": "20 or more years",
  };
  const expText = requirements.experience ? expLabel[requirements.experience] ?? requirements.experience : null;
  const description = requirements.keywords || "";

  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 3000,
    temperature: 0.1,
    messages: [
      {
        role: "user",
        content: `You are a senior recruiter filtering LinkedIn profiles.

HARD RULE — remove any profile where the person is a pure practitioner (engineer, developer, employee) who just uses the skill but does NOT teach, train, coach, consult, or guide others. A consultant who advises others is valid. A coach is valid. A trainer is valid. A freelance Java developer who builds apps is NOT valid.

SKILLS: The person must work with: ${requirements.skills?.join(", ")}.

LOCATION: ${requirements.location || "anywhere"} — if unknown from snippet, keep the profile.

DESCRIPTION CONTEXT: "${description || ""}" — use this to understand what kind of professional is needed and boost matching profiles.

SCORING (2–10):
- 7–10: Teaches/trains/coaches/consults others in the skill + location match + ${expText ? `experience ${expText}` : "any experience"} + ${requirements.industry ? `industry ${requirements.industry}` : "any industry"}
- 4–6: Teaches/trains/coaches/consults others + location match, other filters partial or unknown
- 2–3: Teaches/trains/coaches/consults others + location uncertain

GOAL: Return exactly 20 profiles (all that pass the hard rule, padded to 20 with lower scores if needed).

Bonus scoring:
${expText ? `- Experience is ${expText}: +2 if matches, +1 if roughly close` : ""}
${requirements.industry ? `- Industry is ${requirements.industry}: +1 if mentioned` : ""}
${description ? `- Description match "${description}": +2 if closely matches the professional context, +1 if partial` : ""}

Profiles (up to 40):
${JSON.stringify(profiles.slice(0, 40))}

Return ONLY a valid JSON array sorted by score descending:
[{"title": "...", "url": "...", "description": "...", "score": 8}]`,
      },
    ],
  });

  const content = completion.choices[0].message.content || "[]";
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed)
      ? parsed
          .filter((p: any) => (p.score ?? 0) >= 2)
          .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
      : [];
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
  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 500,
    temperature: 0.3,
    messages: [
      {
        role: "user",
        content: `Candidate: ${JSON.stringify(candidate)}
Requirements: ${JSON.stringify(requirements)}

Return:
1. Match Score out of 100
2. Short Summary
3. Missing Skills
4. Strengths`,
      },
    ],
  });

  return completion.choices[0].message.content || "";
}
