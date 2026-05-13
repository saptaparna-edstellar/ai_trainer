

export default function CandidateCard({
  candidate,
}: any) {
  return (
    <div className="bg-white p-5 rounded-xl shadow border space-y-2">
      <h2 className="text-xl font-bold">
        {candidate.title}
      </h2>

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
              className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <a
        href={candidate.url}
        target="_blank"
        className="text-blue-500 font-medium text-sm block pt-1"
      >
        Open LinkedIn Profile
      </a>
    </div>
  );
}