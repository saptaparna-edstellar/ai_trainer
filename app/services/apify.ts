import { ApifyClient } from "apify-client";
import { generateJobTitles } from "./groq";

const client = new ApifyClient({
  token: process.env.APIFY_TOKEN,
});

function experienceToSearchTerm(experience: string): string {
  switch (experience) {
    case "fresher": return "(fresher OR \"entry level\" OR junior)";
    case "5+":      return "(\"5 years\" OR \"6 years\" OR \"7 years\" OR \"8 years\" OR \"9 years\" OR experienced OR senior)";
    case "10+":     return "(\"10 years\" OR \"12 years\" OR \"15 years\" OR expert OR senior OR lead)";
    case "20+":     return "(\"20 years\" OR \"25 years\" OR veteran OR expert OR director OR principal)";
    default:        return "";
  }
}

export async function searchLinkedInProfiles(data: any) {
  try {
    const skills = (data.skills as string[]).filter(Boolean);
    const location = data.location || "";
    const industry = data.industry || "";
    const experienceTerm = experienceToSearchTerm(data.experience || "");
    const description = data.keywords || "";

    const jobTitles = skills.length
      ? await generateJobTitles(skills, description)
      : ["Trainer", "Consultant", "Coach", "Facilitator", "SME", "Instructor"];

    console.log("JOB TITLES:", jobTitles);

    const broadRoles = "(trainer OR instructor OR coach OR consultant OR facilitator OR \"subject matter expert\" OR advisor OR specialist OR expert)";

    // Key terms from description (first 8 words) for semantic queries
    const descTerms = description
      ? description.split(/\s+/).slice(0, 8).join(" ")
      : "";

    // Query 1: most specific — all criteria + description context
    const query1 = [
      "site:linkedin.com/in/",
      ...skills,
      `(${jobTitles.slice(0, 6).join(" OR ")})`,
      location,
      industry,
      experienceTerm,
      descTerms,
    ].filter(Boolean).join(" ");

    // Query 2: skills + broad professional roles + location + experience
    const query2 = [
      "site:linkedin.com/in/",
      ...skills,
      broadRoles,
      location,
      experienceTerm,
    ].filter(Boolean).join(" ");

    // Query 3: description-semantic — key terms from description drive the search
    const query3 = descTerms
      ? [
          "site:linkedin.com/in/",
          descTerms,
          location,
          "(trainer OR consultant OR coach OR expert OR specialist OR facilitator)",
        ].filter(Boolean).join(" ")
      : [
          "site:linkedin.com/in/",
          ...skills,
          location,
          "(consultant OR SME OR expert OR specialist)",
        ].filter(Boolean).join(" ");

    // Query 4: pure broad fallback — skills + location only, maximises recall
    const query4 = [
      "site:linkedin.com/in/",
      ...skills,
      location,
    ].filter(Boolean).join(" ");

    console.log("QUERY 1:", query1);
    console.log("QUERY 2:", query2);
    console.log("QUERY 3:", query3);
    console.log("QUERY 4:", query4);

    const run = await client
      .actor("apify/google-search-scraper")
      .call({
        queries: `${query1}\n${query2}\n${query3}\n${query4}`,
        maxPagesPerQuery: 3,
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
