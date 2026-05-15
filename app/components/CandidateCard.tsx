export default function CandidateCard({
  candidate,
  index,
}: {
  candidate: any;
  index: number;
}) {
  const score = candidate.score ?? 0;

  const scoreBadge =
    score >= 7
      ? "bg-green-100 text-green-700"
      : score >= 4
      ? "bg-amber-100 text-amber-700"
      : "bg-gray-100 text-gray-500";

  const chipColors = [
    "bg-indigo-50 text-indigo-700 border-indigo-200",
    "bg-purple-50 text-purple-700 border-purple-200",
    "bg-blue-50 text-blue-700 border-blue-200",
    "bg-violet-50 text-violet-700 border-violet-200",
    "bg-sky-50 text-sky-700 border-sky-200",
  ];

  const shortUrl =
    candidate.url?.replace("https://www.linkedin.com/in/", "").replace(/\/$/, "") || "";

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-200 hover:from-gray-100 hover:to-gray-300 rounded-2xl shadow-sm border border-gray-200 transition-all duration-200 flex flex-col">
      <div className="p-6 flex flex-col gap-4 flex-1">

        {/* Header: title + score */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center min-w-0">
            <h2 className="text-base font-bold text-gray-800 leading-snug">
              {candidate.title}
            </h2>
          </div>
          {candidate.score !== undefined && (
            <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${scoreBadge}`}>
              {/* {score}/10 */}
            </span>
          )}
        </div>

        {/* Location */}
        {candidate.location && (
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {candidate.location}
          </div>
        )}

        {/* Description */}
        {candidate.description && (
          <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">
            {candidate.description}
          </p>
        )}

        {/* Skills */}
        {candidate.skills?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {candidate.skills.map((skill: string, i: number) => (
              <span
                key={i}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium ${chipColors[i % chipColors.length]}`}
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Spacer pushes button to bottom */}
        <div className="flex-1" />

        {/* Bottom: URL + button */}
        <div className="pt-3 border-t border-gray-100 space-y-3">
          <p className="text-xs text-gray-400 truncate">linkedin.com/in/{shortUrl}</p>
          <a
            href={candidate.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#0077B5] hover:bg-[#005f8e] text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            View Profile
          </a>
        </div>

      </div>
    </div>
  );
}
