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

ROLE INTENT: The recruiter is looking for: "${description}".
Extract the intended role type from this description (e.g. "trainer", "consultant", "coach"). A profile must show evidence of that role — not just domain knowledge. A compliance officer or engineer who only does compliance work but does NOT train or teach others is NOT a match when the description says "trainer". A consultant who also trains is a match. A coach who teaches the topic is a match.

SKILLS: The person must have relevance to: ${requirements.skills?.join(", ")}. Domain experts in adjacent but unrelated fields should score low.

LOCATION: Include profiles in or near ${requirements.location || "anywhere"}. If location is unknown from the snippet, keep the profile. Only exclude if the location is clearly a different region with no connection.

EXCLUSION RULE — remove a profile only if it meets ALL of:
- No relevance to the required skills
- Clearly wrong location
- No evidence of the role type described

SCORING (assign 2–10; do not assign 1 — if a profile is that marginal, exclude it):
- 8–10: Strong match on skills + location + role type from description + experience + industry
- 5–7: Matches skills + location + role type, partial on experience/industry
- 2–4: Matches skills + location but role type is unclear or only partially evident

GOAL: Return up to 20 profiles. At least 2 must score 8 or higher. Keep the list tight — a shorter accurate list beats a long irrelevant one.

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
