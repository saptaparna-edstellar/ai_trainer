import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateJobTitles(skills: string[]): Promise<string[]> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 200,
    messages: [
      {
        role: "user",
        content: `List 6 LinkedIn job titles for a trainer who teaches: ${skills.join(", ")}.
Return ONLY a JSON array like: ["Title 1", "Title 2"]. No explanation.`,
      },
    ],
  });

  const content = message.content[0].type === "text" ? message.content[0].text : "";
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

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 5000,
    messages: [
      {
        role: "user",
        content: `You are a recruiter ranking LinkedIn trainer profiles. Assign a score 0–9 to each profile and return them sorted highest first.

Search requirements:
- Skills: ${requirements.skills?.join(", ")}
${requirements.location ? `- Location: ${requirements.location}` : ""}
${expText ? `- Experience: ${expText}` : ""}
${requirements.industry ? `- Industry: ${requirements.industry}` : ""}
${requirements.keywords ? `- Keywords: ${requirements.keywords}` : ""}

--- SCORING BREAKDOWN (add up points, max 9) ---

1. SKILLS (0–3 pts):
   +3 if skills clearly match
   +1–2 if partially match
   +0 if no match

2. LOCATION (0–2 pts):
   +2 if location matches
   +0 if doesn't match or unknown

3. EXPERIENCE (0–2 pts) — READ CAREFULLY:
${requirements.experience === "fresher" ? `   +2 if profile shows 0–2 years training experience  ← BEST
   +1 if profile shows 3–5 years training experience
   +0 if profile shows 6+ years OR no training role` : ""}
${requirements.experience === "5+" ? `   +2 if profile shows 5–9 years training experience  ← BEST
   +1 if profile shows 10–15 years (acceptable but over-qualified)
   +0 if profile shows 16+ years OR less than 5 years` : ""}
${requirements.experience === "10+" ? `   +2 if profile shows 10–19 years training experience  ← BEST (e.g. "15 years" fits here)
   +1 if profile shows 20+ years (acceptable but over-qualified)
   +0 if profile shows less than 10 years` : ""}
${requirements.experience === "20+" ? `   +2 if profile shows 20+ years training experience  ← BEST
   +1 if profile shows 15–19 years (close)
   +0 if profile shows less than 15 years` : ""}
${!requirements.experience ? `   Experience not required — skip, give +0` : ""}

4. INDUSTRY (0–1 pt — only score if industry was provided):
   +1 if profile mentions or works in the specified industry
   +0 if industry doesn't match or not mentioned

5. KEYWORDS (0–1 pt — only if keywords were provided):
   +1 if keywords appear in profile

TOTAL = sum of above (max 9)

--- MANDATORY EXCLUSION RULES (apply BEFORE scoring, no exceptions) ---
1. EXCLUDE if the required skills (${requirements.skills?.join(", ")}) do NOT appear in the title or description. Must actually be mentioned — no guessing.
2. EXCLUDE if location does NOT match "${requirements.location || "any"}". If location is unknown from the profile, still exclude.
3. EXCLUDE if profile has NO training/coaching/instructing/facilitating role at all.

Any profile that fails ANY of the above 3 rules must be removed — even if it scores well on other criteria.

--- RANKING (after exclusion) ---
- Top (score 7–9): matches skills + location + experience + industry + keywords — almost all criteria
- Middle (score 4–6): matches skills + location + experience, missing industry or keywords
- Bottom (score 1–3): matches skills + location only, experience/industry/keywords unknown or missing
- A profile with 15 years MUST score higher than 20+ years when experience selected is "10+"
- Include up to 20 profiles — include everyone who passed the exclusion rules

Profiles:
${JSON.stringify(profiles, null, 2)}

Return ONLY a JSON array sorted by score descending:
[{"title": "...", "url": "...", "description": "...", "score": 8}]`,
      },
    ],
  });

  const content = message.content[0].type === "text" ? message.content[0].text : "[]";
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
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 500,
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

  return message.content[0].type === "text" ? message.content[0].text : "";
}
