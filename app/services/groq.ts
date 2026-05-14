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

Include a diverse mix: trainers, instructors, coaches, consultants, facilitators, subject matter experts, compliance leads, and advisors.
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

VALID PROFESSIONAL ROLES: trainers, instructors, coaches, facilitators, consultants, subject matter experts (SMEs), compliance leads, advisors, and anyone who actively works with or teaches the required skills. Do not restrict to "trainer" title alone.

PRIMARY FILTER — only exclude a profile if BOTH of the following are true simultaneously:
- Zero relevance to the skills: ${requirements.skills?.join(", ")}
- AND location is clearly a different country/region with no connection to ${requirements.location || "anywhere"}

If either condition is absent, keep the profile. Err on the side of inclusion.

LOCATION RULE: Include profiles in or near ${requirements.location || "anywhere"}. If location cannot be determined from the snippet, keep the profile.

DESCRIPTION CONTEXT: The recruiter is looking for: "${description}". Use this to understand the professional type needed and semantically boost matching profiles. This guides ranking, not hard filtering.

SCORING (assign 1–10):
- 8–10: Matches skills + location + description context + experience + industry (strong all-round)
- 5–7: Matches skills + location + partial description relevance or partial experience/industry
- 2–4: Matches skills + location; description relevance weak or unclear
- 1: Partial match on skills or location but has some professional relevance

GOAL: Return up to 20 profiles. At least 2 must score 8 or higher. Do not drop borderline profiles.

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
    return Array.isArray(parsed) ? parsed.sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0)) : [];
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
