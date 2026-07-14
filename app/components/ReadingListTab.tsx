"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, FolderOpen, Calendar, Plus, Check, RefreshCw, Layers, Edit2, Trash2 } from "lucide-react";
import { Article } from "../types";

interface ReadingList {
  id: string;
  title: string;
  articleIds: string[];
  branch: string;
  isPublic: boolean;
  createdBy: string;
}

interface ReadingListTabProps {
  articles: Article[];
  onRead: (article: Article) => void;
  userRole: string;
  userBranch: string;
}

export default function ReadingListTab({ articles, onRead, userRole, userBranch }: ReadingListTabProps) {
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingList, setEditingList] = useState<ReadingList | null>(null);
  const [title, setTitle] = useState("");
  const [branch, setBranch] = useState(userBranch || "Kalkalji");
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

  const handleStartEdit = (list: ReadingList) => {
    setEditingList(list);
    setIsCreating(false);
    setTitle(list.title);
    setBranch(list.branch);
    setSelectedArticles(list.articleIds);
    setError(null);
  };

  const handleCancelEditOrAdd = () => {
    setIsCreating(false);
    setEditingList(null);
    setTitle("");
    setBranch(userBranch || "Kalkalji");
    setSelectedArticles([]);
    setError(null);
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
          branch,
          isPublic: true,
        }),
      });

      if (res.ok) {
        const newList = await res.json();
        setLists([newList, ...lists]);
        handleCancelEditOrAdd();
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

  const handleUpdateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingList) return;
    if (!title.trim() || selectedArticles.length === 0) {
      setError("Please provide a title and select at least one article.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/reading-lists/${editingList.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          articleIds: selectedArticles,
          branch,
          isPublic: true,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setLists(lists.map((l) => (l.id === updated.id ? updated : l)));
        handleCancelEditOrAdd();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to update reading list");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!window.confirm("Are you sure you want to delete this reading list?")) {
      return;
    }

    try {
      const res = await fetch(`/api/reading-lists/${listId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setLists(lists.filter((l) => l.id !== listId));
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete reading list");
      }
    } catch (err: any) {
      console.error("Delete reading list error:", err);
      alert("Failed to delete reading list");
    }
  };

  const isFaculty = userRole === "faculty" || userRole === "admin";

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-sm font-medium">Loading reading lists...</span>
      </div>
    );
  }

  return (
<div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

  {/* 🔷 HEADER */}
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600 p-[1px] shadow-lg">
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
      
      <div className="space-y-1 text-center md:text-left">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
          <Layers className="w-6 h-6 text-indigo-500" />
          Curated Reading Lists
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Smart syllabus reading collections curated by faculty.
        </p>
      </div>

      {isFaculty && (
        <button
          onClick={() => {
            if (isCreating || editingList) {
              handleCancelEditOrAdd();
            } else {
              setIsCreating(true);
            }
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-90 text-white font-semibold rounded-xl text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          {isCreating || editingList ? "View Lists" : "Create List"}
        </button>
      )}
    </div>
  </div>

  {/* 🔷 FORM */}
  {(isCreating || editingList) && isFaculty ? (
    <form
      onSubmit={editingList ? handleUpdateList : handleCreateList}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800 rounded-2xl p-6 shadow-xl space-y-6"
    >
      <div className="flex justify-between items-center border-b pb-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          {editingList ? "Edit Reading List" : "Create New List"}
        </h3>
        <button
          type="button"
          onClick={handleCancelEditOrAdd}
          className="text-xs text-indigo-500 hover:underline"
        >
          Cancel
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-3 bg-rose-100/60 dark:bg-rose-900/30 text-rose-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* INPUTS */}
      <div className="grid md:grid-cols-2 gap-5">
        <input
          type="text"
          placeholder="List Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 outline-none text-sm"
        />

        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-400 text-sm"
        >
          <option value="Kalkalji">Kalkalji Branch</option>
          <option value="Badarpur">Badarpur Branch</option>
        </select>
      </div>

      {/* ARTICLES */}
      <div>
        <p className="text-xs font-semibold mb-2 text-slate-500">
          Select Articles ({selectedArticles.length})
        </p>

        <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
          {articles.map((art) => {
            const isChecked = selectedArticles.includes(art.id);

            return (
              <div
                key={art.id}
                onClick={() => handleArticleToggle(art.id)}
                className={`p-3 rounded-xl flex justify-between items-center cursor-pointer transition-all border ${
                  isChecked
                    ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-400"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {art.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {art.category} • {art.readTime}
                  </p>
                </div>

                {isChecked && (
                  <Check className="text-indigo-600 w-4 h-4" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl text-sm font-semibold shadow hover:scale-[1.02] transition"
        >
          {isSubmitting
            ? "Saving..."
            : editingList
            ? "Update List"
            : "Create List"}
        </button>
      </div>
    </form>
  ) : (

    /* 🔷 LIST GRID */
    <div className="grid md:grid-cols-2 gap-6">
      {lists.map((list) => {
        const matchedArticles = list.articleIds
          .map((id) => articles.find((a) => a.id === id))
          .filter(Boolean);

        return (
          <div
            key={list.id}
            className="group relative rounded-2xl p-[1px] bg-gradient-to-br from-indigo-500 to-cyan-500 hover:scale-[1.02] transition-all"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 space-y-4 h-full shadow-lg hover:shadow-xl transition">

              {/* TOP */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full font-bold uppercase tracking-wide">
                  {list.branch}
                </span>

                {isFaculty && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <Edit2
                      onClick={() => handleStartEdit(list)}
                      className="w-4 h-4 cursor-pointer hover:text-indigo-500"
                    />
                    <Trash2
                      onClick={() => handleDeleteList(list.id)}
                      className="w-4 h-4 cursor-pointer hover:text-rose-500"
                    />
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {list.title}
              </h3>

              {/* ARTICLES */}
              <div className="space-y-2">
                {matchedArticles.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => onRead(art)}
                    className="flex justify-between items-center p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition"
                  >
                    <span className="text-xs font-medium truncate">
                      {art.title}
                    </span>
                    <BookOpen className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>
  );
}
