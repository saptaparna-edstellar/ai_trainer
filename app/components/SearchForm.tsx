

"use client";

import { useState } from "react";
import CandidateCard from "./CandidateCard";

export default function SearchForm() {
  const [loading, setLoading] = useState(false);

  const [profiles, setProfiles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    skills: "",
    experience: "",
    location: "",
    keywords: "",
    industry: "",
  });

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          skills: formData.skills
            .split(",")
            .map((skill) => skill.trim()),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || "Something went wrong");
        setProfiles([]);
      } else {
        setProfiles(data.profiles || []);
      }
    } catch (error: any) {
      setError(error.message || "Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded-2xl shadow-lg border border-indigo-100"
      >
        <input
          type="text"
          placeholder="Skills"
          className="border border-gray-200 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50"
          value={formData.skills}
          onChange={(e) =>
            setFormData({
              ...formData,
              skills: e.target.value,
            })
          }
        />

        <select
          className="border border-gray-200 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50 text-gray-700"
          value={formData.experience}
          onChange={(e) =>
            setFormData({
              ...formData,
              experience: e.target.value,
            })
          }
        >
          <option value="">Any Experience</option>
          <option value="fresher">Fresher (0–1 years)</option>
          <option value="5+">5+ years</option>
          <option value="10+">10+ years</option>
          <option value="20+">20+ years</option>
        </select>

        <input
          type="text"
          placeholder="Location"
          className="border border-gray-200 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50"
          value={formData.location}
          onChange={(e) =>
            setFormData({
              ...formData,
              location: e.target.value,
            })
          }
        />

        <textarea
          placeholder="Description"
          rows={4}
          className="border border-gray-200 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50 resize-none"
          value={formData.keywords}
          onChange={(e) =>
            setFormData({
              ...formData,
              keywords: e.target.value,
            })
          }
        />

        <input
          type="text"
          placeholder="Industry"
          className="border border-gray-200 p-3 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50"
          value={formData.industry}
          onChange={(e) =>
            setFormData({
              ...formData,
              industry: e.target.value,
            })
          }
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-3 rounded-lg w-full font-semibold transition-all shadow-md disabled:opacity-60"
        >
          {loading
            ? "Searching..."
            : "Search Candidates"}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-5">
        {profiles.map((profile, index) => (
          <CandidateCard
            key={index}
            candidate={profile}
          />
        ))}
      </div>
    </div>
  );
}