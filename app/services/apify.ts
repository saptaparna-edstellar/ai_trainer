import { ApifyClient } from "apify-client";
import { generateJobTitles } from "./groq";

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
});

export async function searchLinkedInProfiles(data: any) {
  try {
    const skills = (data.skills as string[]).filter(Boolean);

    // Use LLM to get realistic trainer job title synonyms for the given skills
    // e.g. "RoHS" → ["Compliance Trainer", "EHS Trainer", "HSE Trainer"]
    const jobTitles = skills.length
      ? await generateJobTitles(skills)
      : ["trainer"];

    console.log("LLM GENERATED JOB TITLES:", jobTitles);

    // Build Google query: skill terms + trainer title synonyms + location
    // Simple unquoted terms — Google handles relevance, Groq handles filtering
    const query = [
      "site:linkedin.com/in/",
      ...skills,
      `(${jobTitles.join(" OR ")})`,
      data.location || "",
      data.industry || "",
    ]
      .filter(Boolean)
      .join(" ");

    console.log("GOOGLE QUERY:", query);

    const run = await client
      .actor("apify/google-search-scraper")
      .call({
        queries: query,
        maxPagesPerQuery: 3,
        resultsPerPage: 10,
        mobileResults: false,
        languageCode: "en",
      });

    const { items } = await client
      .dataset(run.defaultDatasetId)
      .listItems();

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
      }));

    console.log("RAW PROFILES:", profiles.length);
    return profiles;
  } catch (error: any) {
    console.log(error);
    throw error;
  }
}
