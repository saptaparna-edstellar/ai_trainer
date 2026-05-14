import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const MODEL = "llama-3.3-70b-versatile";

export async function generateJobTitles(skills: string[]): Promise<string[]> {
  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 200,
    temperature: 0.3,
    messages: [
      {
        role: "user",
        content: `List 6 LinkedIn job titles for a trainer who teaches: ${skills.join(", ")}.
Return ONLY a JSON array like: ["Title 1", "Title 2"]. No explanation.`,
      },
    ],
  });

  const content = completion.choices[0].message.content || "";
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
  const expLabel: Record<string, string> = {
    fresher: "0–1 years",
    "5+": "5 or more years",
    "10+": "10 or more years",
    "20+": "20 or more years",
  };
  const expText = requirements.experience ? expLabel[requirements.experience] ?? requirements.experience : null;

  const completion = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 4000,
    temperature: 0.1,
    messages: [
      {
        role: "user",
        content: `You are filtering LinkedIn profiles to find trainers.

THREE REQUIRED CRITERIA — a profile must pass ALL three to be included:
1. TRAINER: The person must be a trainer, instructor, coach, or facilitator. Not a developer, manager, or salesperson unless they explicitly train others in the skill.
2. SKILL: The person must teach or train specifically in: ${requirements.skills?.join(", ")}. A yoga trainer, sales trainer, or soft-skills coach does NOT count unless they also train in these skills.
3. LOCATION: The person must be based in or near: ${requirements.location || "anywhere"}. If location is clearly different, exclude them. If location is unknown from the snippet, keep them.

If a profile fails ANY of the three criteria above — remove it completely.

AFTER filtering, rank the remaining profiles by how many additional criteria they match:
${expText ? `- Training experience is ${expText}: +2 if matches, +1 if close, +0 if not` : ""}
${requirements.industry ? `- Industry is ${requirements.industry}: +1 if mentioned` : ""}
${requirements.keywords ? `- Keywords ${requirements.keywords}: +1 if mentioned` : ""}

Return up to 20 profiles sorted best match first. Include ALL that pass the three criteria — do not drop valid profiles.

Profiles:
${JSON.stringify(profiles, null, 2)}

Return ONLY a JSON array:
[{"title": "...", "url": "...", "description": "...", "score": 7}]`,
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
