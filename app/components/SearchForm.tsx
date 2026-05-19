"use client";

import { useState, useRef, useEffect } from "react";
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
  const [locationSuggestions, setLocationSuggestions] = useState<{ label: string; value: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLocationChange(value: string) {
    setFormData((prev) => ({ ...prev, location: value }));

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 1) {
      setLocationSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLocationLoading(true);
      try {
        const res = await fetch(`/api/locations?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        setLocationSuggestions(data);
        setShowDropdown(data.length > 0);
      } catch {
        setLocationSuggestions([]);
      } finally {
        setLocationLoading(false);
      }
    }, 300);
  }

  function selectLocation(item: { label: string; value: string }) {
    setFormData((prev) => ({ ...prev, location: item.value }));
    setShowDropdown(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          skills: formData.skills.split(",").map((skill) => skill.trim()),
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

  const inputClass =
    "border border-gray-200 p-3 w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-gray-50 text-sm text-gray-800";

  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-200 p-7 rounded-2xl shadow-lg border border-gray-200 space-y-5"
      >
        {/* Skills */}
        <div>
          <label className={labelClass}>Skills <span className="text-indigo-500">*</span></label>
          <input
            type="text"
            placeholder="e.g. Java, RoHS, Leadership, Excel"
            className={inputClass}
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
          />
          {/* <p className="text-xs text-gray-400 mt-1.5">Separate multiple skills with commas</p> */}
        </div>

        {/* Experience + Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Experience Level</label>
            <select
              className={inputClass}
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
            >
              <option value="">Any Experience</option>
              <option value="fresher">Fresher (0–1 years)</option>
              <option value="5+">5+ years</option>
              <option value="10+">10+ years</option>
              <option value="20+">20+ years</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Location</label>
            <div ref={locationRef} className="relative">
              <input
                type="text"
                placeholder="e.g. Bangalore, India, USA"
                className={inputClass}
                value={formData.location}
                onChange={(e) => handleLocationChange(e.target.value)}
                onFocus={() => locationSuggestions.length > 0 && setShowDropdown(true)}
                autoComplete="off"
              />
              {locationLoading && (
                <span className="absolute right-3 top-3.5 text-xs text-gray-400">Loading...</span>
              )}
              {showDropdown && locationSuggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-60 overflow-y-auto">
                  {locationSuggestions.map((item) => (
                    <li
                      key={item.label}
                      onMouseDown={() => selectLocation(item)}
                      className="px-4 py-2.5 cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 text-sm text-gray-700 border-b border-gray-50 last:border-0"
                    >
                      {item.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            placeholder="e.g. Experienced RoHS compliance trainer with expertise in environmental regulations"
            rows={4}
            className={`${inputClass} resize-none`}
            value={formData.keywords}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
          />
          {/* <p className="text-xs text-gray-400 mt-1.5">More detail here improves match quality</p> */}
        </div>

        {/* Industry */}
        <div>
          <label className={labelClass}>Industry</label>
          <input
            type="text"
            placeholder="e.g. Manufacturing, IT, Healthcare"
            className={inputClass}
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-indigo-400 to-purple-400 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-3.5 rounded-xl w-full font-semibold transition-all shadow-md disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Searching...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
              Search Trainers &amp; Consultants
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}
{/* 
      {profiles.length > 0 && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            <p className="text-sm font-semibold text-gray-700">
              Found <span className="text-indigo-600">{profiles.length}</span> profile{profiles.length !== 1 ? "s" : ""}
            </p>
          </div>
          <span className="text-xs text-gray-400">Sorted by match score</span>
        </div>
      )} */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {profiles.map((profile, index) => (
          <CandidateCard key={index} candidate={profile} index={index} />
        ))}
      </div>
    </div>
  );
}
