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

ROLE INTENT: The recruiter is looking for: "${description || requirements.skills?.join(", ")}".
Extract the intended role type (e.g. "trainer", "consultant", "coach", "faculty", "advisor"). A profile must show evidence of that role.

SKILLS: The person must have relevance to: ${requirements.skills?.join(", ")}.

LOCATION FILTER (apply this FIRST before scoring):
Target location: "${requirements.location || "anywhere"}".

Step 1 — Read the snippet carefully. Does it mention ANY city, state, or country?
Step 2 — If YES and that place is NOT "${requirements.location || "anywhere"}" or the same region → DROP this profile. Do not include it at all.
Step 3 — If the snippet has NO location mention → keep it but max score is 5.
Step 4 — If location matches the target → proceed to full scoring.

Examples of wrong location (DROP immediately):
- Target "Mumbai" but snippet says "Hyderabad, Telangana" → DROP
- Target "Mumbai" but snippet says "Bangalore" → DROP
- Target "Mumbai" but snippet says "United States" → DROP
- Target "Mumbai" but snippet says "Delhi" → DROP

SKILLS FILTER: Drop profiles with zero relevance to: ${requirements.skills?.join(", ")}.

SCORING (2–10):
- 8–10: Skills match + location confirmed in snippet + role type matches${expText ? ` + experience ${expText}` : ""}
- 5–7: Skills match + role type matches, but location not confirmed in snippet
- 2–4: Skills match, location not confirmed, role type unclear

Bonus scoring:
${expText ? `- Experience is ${expText}: +2 if matches, +1 if roughly close` : ""}
${requirements.industry ? `- Industry is ${requirements.industry}: +1 if mentioned` : ""}
${description ? `- Description match "${description}": +2 if closely matches the professional context, +1 if partial` : ""}

GOAL: Return up to 20 genuine profiles. At least 2 must score 8 or higher. Keep list tight — do NOT pad with unrelated people.

Profiles (up to 40):
${JSON.stringify(profiles.slice(0, 40))}

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
          .filter((p: any) => (p.score ?? 0) >= 2)
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
