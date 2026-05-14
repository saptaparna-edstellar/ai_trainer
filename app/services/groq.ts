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
  const criteria = [
    `Skills: ${requirements.skills?.join(", ")}`,
    requirements.experience ? `Experience: ${requirements.experience} years in training (match if profile shows AT LEAST this much experience)` : "",
    requirements.location ? `Location: ${requirements.location}` : "",
    requirements.industry ? `Industry: ${requirements.industry}` : "",
    requirements.keywords ? `Keywords: ${requirements.keywords}` : "",
  ].filter(Boolean).join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `You are a recruiter scoring LinkedIn trainer profiles.

Requirements:
${criteria}

Score each profile (0-9) based on how many criteria match from the profile title/description:
- Skills match: +3 points
- Location match: +2 points
- Experience level match: +2 points
- Industry match: +1 point
- Keywords match: +1 point

Rules:
- Only include trainers, instructors, coaches, facilitators — exclude pure developers/engineers with no training role
- Return up to 20 profiles sorted by score descending (best match first)

Profiles:
${JSON.stringify(profiles, null, 2)}

Return ONLY a JSON array sorted by score: [{"title": "...", "url": "...", "description": "...", "score": 7}]`,
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
