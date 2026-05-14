

export default function CandidateCard({
  candidate,
}: any) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-md border-l-4 border-indigo-500 space-y-2 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-xl font-bold text-indigo-800">
          {candidate.title}
        </h2>
        {candidate.score !== undefined && (
          <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full ${
            candidate.score >= 7 ? "bg-green-100 text-green-700" :
            candidate.score >= 4 ? "bg-yellow-100 text-yellow-700" :
            "bg-gray-100 text-gray-500"
          }`}>
            {candidate.score}
          </span>
        )}
      </div>

      {candidate.location && (
        <p className="text-sm text-gray-500">
          {candidate.location}
        </p>
      )}

      {candidate.description && (
        <p className="text-gray-600 text-sm">
          {candidate.description}
        </p>
      )}

      {candidate.skills?.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {candidate.skills.map((skill: string, i: number) => (
            <span
              key={i}
              className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-full border border-indigo-200"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <a
        href={candidate.url}
        target="_blank"
        className="inline-block mt-1 bg-indigo-600 hover:bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        Open LinkedIn Profile
      </a>
    </div>
  );
}