import { NextRequest, NextResponse } from "next/server";
import { searchLinkedInProfiles } from "@/app/services/apify";
import { filterCandidates } from "@/app/services/groq";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const rawProfiles = await searchLinkedInProfiles(body);
    console.log("RAW PROFILES FROM APIFY:", rawProfiles.length);

    if (!rawProfiles.length) {
      return NextResponse.json({ success: true, profiles: [] });
    }

    const top5 = await filterCandidates({ profiles: rawProfiles, requirements: body });
    const top5Urls = new Set(top5.map((p: any) => p.url));
    const rest = rawProfiles.filter((p: any) => !top5Urls.has(p.url));
    const profiles = [...top5, ...rest];

    console.log("TOP MATCHES:", top5.length, "TOTAL:", profiles.length);

    return NextResponse.json({ success: true, profiles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
