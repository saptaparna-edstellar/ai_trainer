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
        content: `You are a recruiter. Pick the TOP 5 LinkedIn profiles that match ALL THREE of these together:
1. SKILL: ${requirements.skills?.join(", ")}
2. LOCATION: ${requirements.location || "anywhere"}
3. ROLE: trainer, coach, instructor, consultant, faculty, facilitator, or advisor (someone who teaches others)

All three carry equal weight. A profile missing ANY ONE of these three gets a low score.

SCORING:
- 9–10: Skill confirmed + Location confirmed (${requirements.location}) + Trainer role confirmed${description ? ` + context "${description}" matches` : ""}${expText ? ` + experience ${expText} matches` : ""}
- 7–8: Two of the three confirmed, third is possible but unclear from snippet
- 5–6: Only skill confirmed, location and role unclear from snippet (no wrong signals)
- 2–4: One confirmed but others missing or unclear
- 1: Location is CLEARLY WRONG (snippet says a different country/city — e.g. target is Germany but snippet says India or USA)

EXAMPLES of score 1 (wrong location): target "Germany" but snippet says "India", "Mumbai", "Bangalore", "United States", "UK" → score 1
EXAMPLES of score 9–10: snippet confirms "${requirements.location}" + mentions the skill + title says "trainer" or "consultant"

${description ? `Prefer profiles matching this context: "${description}"` : ""}
${expText ? `Prefer profiles with ${expText} experience.` : ""}
${requirements.industry ? `Prefer profiles mentioning ${requirements.industry}.` : ""}

Return ONLY the TOP 5 as a JSON array sorted best first:
[{"title":"...","url":"...","description":"...","score":9}]

Profiles:
${JSON.stringify(profiles.slice(0, 79))}

Return ONLY a valid JSON array sorted by score descending:
[{"title": "...", "url": "...", "description": "...", "score": 8}]`,
      },
    ],
  });

  const content = completion.choices[0].message.content || "";
  const match = content.match(/\[[\s\S]*\]/);
  if (!match) {
    return profiles.slice(0, 15).map((p: any) => ({ ...p, score: 3 }));
  }
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed)
      ? parsed
          .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
      : profiles.slice(0, 15).map((p: any) => ({ ...p, score: 3 }));
  } catch {
    return profiles.slice(0, 15).map((p: any) => ({ ...p, score: 3 }));
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
