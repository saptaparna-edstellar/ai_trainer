import { ApifyClient } from "apify-client";
import { generateJobTitles } from "./groq";

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
});

function experienceToSearchTerm(experience: string): string {
  switch (experience) {
    case "fresher": return "(fresher OR \"entry level\" OR \"junior trainer\")";
    case "5+":      return "(experienced trainer OR \"5 years\" OR \"6 years\" OR \"7 years\" OR \"8 years\" OR \"9 years\")";
    case "10+":     return "(senior trainer OR \"10 years\" OR \"12 years\" OR \"15 years\" OR expert)";
    case "20+":     return "(expert trainer OR \"20 years\" OR \"25 years\" OR veteran)";
    default:        return "";
  }
}

export async function searchLinkedInProfiles(data: any) {
  try {
    const skills = (data.skills as string[]).filter(Boolean);
    const location = data.location || "";
    const industry = data.industry || "";
    const experienceTerm = experienceToSearchTerm(data.experience || "");
    const keywords = data.keywords || "";

    const jobTitles = skills.length
      ? await generateJobTitles(skills)
      : ["Trainer", "Instructor", "Coach"];

    console.log("JOB TITLES:", jobTitles);

    // Query 1: all criteria — skills + job titles + location + industry + experience
    const query1 = [
      "site:linkedin.com/in/",
      ...skills,
      `(${jobTitles.join(" OR ")})`,
      location,
      industry,
      experienceTerm,
    ].filter(Boolean).join(" ");

    // Query 2: skills + location + experience (no industry)
    const query2 = [
      "site:linkedin.com/in/",
      ...skills,
      "(trainer OR instructor OR coach)",
      location,
      experienceTerm,
    ].filter(Boolean).join(" ");

    // Query 3: broad fallback — skills + trainer + location or keywords
    const query3 = [
      "site:linkedin.com/in/",
      "trainer",
      ...skills,
      location,
      keywords,
    ].filter(Boolean).join(" ");

    console.log("QUERY 1:", query1);
    console.log("QUERY 2:", query2);
    console.log("QUERY 3:", query3);

    const run = await client
      .actor("apify/google-search-scraper")
      .call({
        queries: `${query1}\n${query2}\n${query3}`,
        maxPagesPerQuery: 2,
        resultsPerPage: 10,
        mobileResults: false,
        languageCode: "en",
      });

    const { items } = await client
      .dataset(run.defaultDatasetId)
      .listItems();

    const seen = new Set<string>();
    const profiles = items
      .flatMap((item: any) => item.organicResults || [])
      .filter((r: any) => r.url?.includes("linkedin.com/in/"))
      .map((r: any) => ({
        title: r.title || "",
        url: r.url || "",
        description: String(r.description || "").slice(0, 300),
        location: "",
        skills: [],
        experience: [],
      }))
      .filter((p: any) => {
        if (!p.url || seen.has(p.url)) return false;
        seen.add(p.url);
        return true;
      });

    console.log("RAW PROFILES:", profiles.length);
    return profiles;
  } catch (error: any) {
    console.log(error);
    throw error;
  }
}
