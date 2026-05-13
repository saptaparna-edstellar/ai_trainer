

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
        className="space-y-4 bg-white p-6 rounded-xl shadow"
      >
        <input
          type="text"
          placeholder="Skills"
          className="border p-3 w-full rounded-lg"
          value={formData.skills}
          onChange={(e) =>
            setFormData({
              ...formData,
              skills: e.target.value,
            })
          }
        />

        <input
          type="text"
          placeholder="Experience"
          className="border p-3 w-full rounded-lg"
          value={formData.experience}
          onChange={(e) =>
            setFormData({
              ...formData,
              experience: e.target.value,
            })
          }
        />

        <input
          type="text"
          placeholder="Location"
          className="border p-3 w-full rounded-lg"
          value={formData.location}
          onChange={(e) =>
            setFormData({
              ...formData,
              location: e.target.value,
            })
          }
        />

        <input
          type="text"
          placeholder="Keywords"
          className="border p-3 w-full rounded-lg"
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
          className="border p-3 w-full rounded-lg"
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
          className="bg-black text-white px-5 py-3 rounded-lg w-full"
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