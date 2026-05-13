import { ApifyClient } from "apify-client";
import { generateJobTitles } from "./groq";

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
});

async function runGoogleSearch(query: string): Promise<any[]> {
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

  return items
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
}

export async function searchLinkedInProfiles(data: any) {
  try {
    const skills = (data.skills as string[]).filter(Boolean);
    const location = data.location || "";
    const industry = data.industry || "";

    const jobTitles = skills.length
      ? await generateJobTitles(skills)
      : ["trainer"];

    console.log("LLM GENERATED JOB TITLES:", jobTitles);

    // Query 1: skills + LLM-generated trainer job titles + location
    const query1 = [
      "site:linkedin.com/in/",
      ...skills,
      `(${jobTitles.join(" OR ")})`,
      location,
      industry,
    ].filter(Boolean).join(" ");

    // Query 2: simple broad query — trainer + skills + location
    const query2 = [
      "site:linkedin.com/in/",
      "trainer",
      ...skills,
      location,
    ].filter(Boolean).join(" ");

    // Run both queries in parallel for more results
    const [results1, results2] = await Promise.all([
      runGoogleSearch(query1),
      runGoogleSearch(query2),
    ]);

    // Combine and deduplicate by URL
    const seen = new Set<string>();
    const profiles = [...results1, ...results2].filter((p) => {
      if (!p.url || seen.has(p.url)) return false;
      seen.add(p.url);
      return true;
    });

    console.log(`RAW PROFILES: ${profiles.length} (query1: ${results1.length}, query2: ${results2.length})`);
    return profiles;
  } catch (error: any) {
    console.log(error);
    throw error;
  }
}
