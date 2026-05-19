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
        content: `You are a recruiter. From the profiles below, pick the TOP 5 that best match ALL of these criteria:
- Skills: ${requirements.skills?.join(", ")}
- Location: ${requirements.location || "anywhere"}
${description ? `- Description context: "${description}"` : ""}
${expText ? `- Experience: ${expText}` : ""}
${requirements.industry ? `- Industry: ${requirements.industry}` : ""}

A good match has:
1. The skill (or closely related term) visible in title or snippet
2. The location matching (or no location mentioned — that's OK)
3. A teaching/training/consulting role (trainer, coach, consultant, instructor, faculty, advisor)

Return ONLY the top 5 as a JSON array sorted best first. Each must have a score 1–10.

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
