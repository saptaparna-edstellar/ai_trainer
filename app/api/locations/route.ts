import { NextRequest, NextResponse } from "next/server";

const LOCATIONS = [
  "Agra, Uttar Pradesh, India", "Ahmedabad, Gujarat, India", "Aizawl, Mizoram, India",
  "Aligarh, Uttar Pradesh, India", "Allahabad, Uttar Pradesh, India", "Amritsar, Punjab, India",
  "Aurangabad, Maharashtra, India", "Abu Dhabi, UAE", "Amsterdam, Netherlands",
  "Ankara, Turkey", "Athens, Greece", "Atlanta, Georgia, United States",
  "Auckland, New Zealand", "Austin, Texas, United States", "Australia",
  "Argentina", "Austria", "Azerbaijan",
  "Bangalore, Karnataka, India", "Bhopal, Madhya Pradesh, India", "Bhubaneswar, Odisha, India",
  "Bikaner, Rajasthan, India", "Bahrain", "Bangkok, Thailand", "Barcelona, Spain",
  "Beijing, China", "Berlin, Germany", "Birmingham, United Kingdom",
  "Bogotá, Colombia", "Boston, Massachusetts, United States", "Brisbane, Australia",
  "Brussels, Belgium", "Budapest, Hungary", "Buenos Aires, Argentina", "Brazil",
  "Belgium", "Bangladesh", "Bolivia",
  "Cairo, Egypt", "Calgary, Alberta, Canada", "Cape Town, South Africa",
  "Chandigarh, India", "Chennai, Tamil Nadu, India", "Chicago, Illinois, United States",
  "Coimbatore, Tamil Nadu, India", "Colombo, Sri Lanka", "Copenhagen, Denmark",
  "Canada", "Chile", "China", "Colombia", "Croatia", "Czech Republic",
  "Dakar, Senegal", "Dallas, Texas, United States", "Dar es Salaam, Tanzania",
  "Delhi, India", "Denver, Colorado, United States", "Dhaka, Bangladesh",
  "Doha, Qatar", "Dubai, UAE", "Dublin, Ireland", "Durban, South Africa",
  "Denmark", "Ecuador", "Edinburgh, United Kingdom", "Egypt",
  "Faridabad, Haryana, India", "Finland", "France", "Frankfurt, Germany",
  "Glasgow, United Kingdom", "Guadalajara, Mexico", "Guangzhou, China",
  "Gurugram, Haryana, India", "Guwahati, Assam, India", "Germany", "Greece",
  "Hamburg, Germany", "Helsinki, Finland", "Ho Chi Minh City, Vietnam",
  "Hong Kong", "Houston, Texas, United States", "Hyderabad, Telangana, India",
  "Hungary", "India", "Indonesia", "Ireland", "Israel", "Italy",
  "Istanbul, Turkey", "Indore, Madhya Pradesh, India",
  "Jaipur, Rajasthan, India", "Jakarta, Indonesia", "Jeddah, Saudi Arabia",
  "Johannesburg, South Africa", "Japan", "Jordan",
  "Karachi, Pakistan", "Kathmandu, Nepal", "Kochi, Kerala, India",
  "Kolkata, West Bengal, India", "Kuala Lumpur, Malaysia", "Kuwait City, Kuwait",
  "Kenya", "Kuwait", "Kazakhstan",
  "Lagos, Nigeria", "Lahore, Pakistan", "Leeds, United Kingdom",
  "Lima, Peru", "Lisbon, Portugal", "London, United Kingdom",
  "Los Angeles, California, United States", "Lucknow, Uttar Pradesh, India",
  "Luxembourg", "Malaysia", "Manila, Philippines", "Melbourne, Australia",
  "Mexico City, Mexico", "Miami, Florida, United States", "Milan, Italy",
  "Minneapolis, Minnesota, United States", "Montreal, Quebec, Canada",
  "Moscow, Russia", "Mumbai, Maharashtra, India", "Muscat, Oman",
  "Mexico", "Morocco", "Myanmar",
  "Nagpur, Maharashtra, India", "Nairobi, Kenya", "New Delhi, India",
  "New York, United States", "Nigeria", "Norway", "Nepal", "Netherlands",
  "Oslo, Norway", "Ottawa, Ontario, Canada", "Oman",
  "Paris, France", "Patna, Bihar, India", "Perth, Australia",
  "Philadelphia, Pennsylvania, United States", "Phoenix, Arizona, United States",
  "Portland, Oregon, United States", "Pune, Maharashtra, India",
  "Pakistan", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar", "Queenstown, New Zealand",
  "Raipur, Chhattisgarh, India", "Rajkot, Gujarat, India", "Ranchi, Jharkhand, India",
  "Riyadh, Saudi Arabia", "Rome, Italy", "Russia", "Romania",
  "San Francisco, California, United States", "Santiago, Chile",
  "São Paulo, Brazil", "Seattle, Washington, United States",
  "Seoul, South Korea", "Shanghai, China", "Sharjah, UAE",
  "Singapore", "Stockholm, Sweden", "Surat, Gujarat, India",
  "Sydney, Australia", "Saudi Arabia", "South Africa", "South Korea",
  "Spain", "Sri Lanka", "Sweden", "Switzerland",
  "Taipei, Taiwan", "Thiruvananthapuram, Kerala, India", "Tokyo, Japan",
  "Toronto, Ontario, Canada", "Turkey", "Tanzania", "Thailand", "Tunisia",
  "United Arab Emirates", "United Kingdom", "United States",
  "Vadodara, Gujarat, India", "Vancouver, British Columbia, Canada",
  "Visakhapatnam, Andhra Pradesh, India", "Vietnam",
  "Warsaw, Poland", "Washington DC, United States",
  "Zurich, Switzerland",
];

function filterLocal(query: string) {
  const q = query.toLowerCase();
  return LOCATIONS
    .filter((l) => l.toLowerCase().startsWith(q))
    .slice(0, 10)
    .map((l) => ({ label: l, value: l.split(",")[0].trim() }));
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  if (query.trim().length < 1) return NextResponse.json([]);

  // For 1–2 char queries use local list only (Nominatim unreliable for short queries)
  if (query.trim().length < 3) {
    return NextResponse.json(filterLocal(query));
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=12&addressdetails=1`,
      {
        headers: {
          "User-Agent": "linkedin-ai-sourcing/1.0 (recruiter-tool)",
          "Accept-Language": "en",
        },
      }
    );

    const data = await response.json();
    const seen = new Set<string>();
    const suggestions: { label: string; value: string }[] = [];

    // Start with local matches so they appear first
    for (const item of filterLocal(query)) {
      if (seen.has(item.label)) continue;
      seen.add(item.label);
      suggestions.push(item);
    }

    // Add Nominatim results
    for (const item of data) {
      const addr = item.address || {};
      const primary =
        addr.city || addr.town || addr.village || addr.county ||
        addr.state_district || addr.continent || item.name || "";

      const parts = [primary, addr.state, addr.country]
        .map((p) => (p || "").trim())
        .filter(Boolean);

      const unique = [...new Set(parts)];
      const label = unique.join(", ");
      const value = unique[0] || item.name;

      if (!label || seen.has(label)) continue;
      seen.add(label);
      suggestions.push({ label, value });
    }

    return NextResponse.json(suggestions.slice(0, 10));
  } catch {
    // Fall back to local list if Nominatim fails
    return NextResponse.json(filterLocal(query));
  }
}
