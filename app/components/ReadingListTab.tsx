"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, FolderOpen, Calendar, Plus, Check, RefreshCw, Layers } from "lucide-react";
import { Article } from "../types";

interface ReadingList {
  id: string;
  title: string;
  articleIds: string[];
  department: string;
  isPublic: boolean;
  createdBy: string;
}

interface ReadingListTabProps {
  articles: Article[];
  onRead: (article: Article) => void;
  userRole: string;
  userDepartment: string;
}

export default function ReadingListTab({ articles, onRead, userRole, userDepartment }: ReadingListTabProps) {
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState(userDepartment || "CSE");
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReadingLists();
  }, []);

  const fetchReadingLists = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/reading-lists");
      if (res.ok) {
        const data = await res.json();
        setLists(data);
      }
    } catch (err) {
      console.error("Failed to load reading lists:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArticleToggle = (artId: string) => {
    if (selectedArticles.includes(artId)) {
      setSelectedArticles(selectedArticles.filter((id) => id !== artId));
    } else {
      setSelectedArticles([...selectedArticles, artId]);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedArticles.length === 0) {
      setError("Please provide a title and select at least one article.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reading-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          articleIds: selectedArticles,
          department,
          isPublic: true,
        }),
      });

      if (res.ok) {
        const newList = await res.json();
        setLists([newList, ...lists]);
        setIsCreating(false);
        setTitle("");
        setSelectedArticles([]);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to create reading list");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFaculty = userRole === "faculty" || userRole === "admin";

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-405 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-sm font-medium">Loading reading lists...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div className="text-center md:text-left space-y-1">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2 justify-center md:justify-start">
            <Layers className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Curated Reading Lists</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Syllabus and department-recommended reading lists curated by institute faculty.
          </p>
        </div>

        {isFaculty && (
          <button
            onClick={() => setIsCreating(!isCreating)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? "View Lists" : "Create List"}</span>
          </button>
        )}
      </div>

      {/* Create form */}
      {isCreating && isFaculty ? (
        <form
          onSubmit={handleCreateList}
          className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs space-y-5"
        >
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            New Reading List
          </h3>

          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-rose-600 dark:text-rose-455 text-sm font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                List Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AI Ethics and Modern Society"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Target Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm cursor-pointer"
              >
                <option value="CSE">Computer Science (CSE)</option>
                <option value="ECE">Electronics (ECE)</option>
                <option value="EEE">Electrical (EEE)</option>
                <option value="MECH">Mechanical (MECH)</option>
                <option value="CIVIL">Civil (CIVIL)</option>
                <option value="MBA">Management (MBA)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
              Select Articles ({selectedArticles.length} selected)
            </label>
            <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 p-1">
              {articles.map((art) => {
                const isChecked = selectedArticles.includes(art.id);
                return (
                  <button
                    type="button"
                    key={art.id}
                    onClick={() => handleArticleToggle(art.id)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-850/50 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="space-y-0.5 max-w-[85%]">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{art.title}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{art.category} • {art.readTime}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        isChecked
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Save Reading List"}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(() => {
            const studentFilteredLists = lists.filter((list) => {
              if (isFaculty) return true;
              const matchedArticles = list.articleIds
                .map((id) => articles.find((a) => a.id === id))
                .filter(Boolean) as Article[];
              return matchedArticles.some((art) => art.isCustom);
            });

            if (studentFilteredLists.length === 0) {
              return (
                <div className="col-span-full p-8 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl">
                  No reading lists created yet. Faculty members will release syllabus guides soon!
                </div>
              );
            }

            return studentFilteredLists.map((list) => {
              const matchedArticles = list.articleIds
                .map((id) => articles.find((a) => a.id === id))
                .filter(Boolean) as Article[];

              const displayArticles = isFaculty
                ? matchedArticles
                : matchedArticles.filter((art) => art.isCustom);

              const assignedToStudent = list.department === userDepartment;

              return (
                <div
                  key={list.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-sm transition-all duration-300 relative overflow-hidden"
                >
                  {assignedToStudent && (
                    <div className="absolute top-0 right-0 bg-indigo-600 dark:bg-indigo-500 text-white text-[9px] uppercase font-black px-2.5 py-1 rounded-bl-lg tracking-wider">
                      Assigned
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 rounded">
                      {list.department} Department
                    </span>
                    <h3 className="text-base font-bold text-slate-850 dark:text-slate-150 leading-snug">
                      {list.title}
                    </h3>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-2.5">
                    <p className="text-xs font-semibold text-slate-450 uppercase tracking-wide">
                      Articles List ({displayArticles.length})
                    </p>
                    <div className="space-y-1.5">
                      {displayArticles.map((art) => (
                        <button
                          key={art.id}
                          onClick={() => onRead(art)}
                          className="w-full text-left p-2.5 bg-slate-50 dark:bg-slate-950/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/10 border border-slate-200/50 dark:border-slate-800/50 hover:border-indigo-150 dark:hover:border-indigo-900/40 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer group"
                        >
                          <div className="truncate max-w-[85%]">
                            <span className="font-semibold text-slate-700 dark:text-slate-250 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                              {art.title}
                            </span>
                          </div>
                          <BookOpen className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-455 transition-colors" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
}
