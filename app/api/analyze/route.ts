import { NextRequest, NextResponse } from "next/server";
import { analyzeCandidate } from "@/app/services/groq";

export async function POST(req: NextRequest) {
  try {
    const { candidate, requirements } = await req.json();

    const analysis = await analyzeCandidate({ candidate, requirements });

    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
