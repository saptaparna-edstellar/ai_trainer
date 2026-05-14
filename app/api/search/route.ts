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

    const profiles = rawProfiles.length
      ? await filterCandidates({ profiles: rawProfiles, requirements: body })
      : [];

    console.log("FILTERED PROFILES:", profiles.length);

    return NextResponse.json({ success: true, profiles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
