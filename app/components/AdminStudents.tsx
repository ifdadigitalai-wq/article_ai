"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2,
  Mail,
  Hash,
  GraduationCap,
  Calendar,
  Sparkles,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string | null;
  branch: string;
  batch: string;
  isPaid: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [paidFilter, setPaidFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [accessFilter, setAccessFilter] = useState<"all" | "active" | "revoked">("all");

  // Form State for Adding Student
  const [isAdding, setIsAdding] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRollNumber, setFormRollNumber] = useState("");
  const [formBranch, setFormBranch] = useState("Kalkalji");
  const [formBatch, setFormBatch] = useState("2026");
  const [formIsPaid, setFormIsPaid] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/students");
      if (!res.ok) {
        throw new Error("Failed to fetch students data.");
      }
      const data = await res.json();
      setStudents(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim() || !formBranch || !formBatch) {
      setSubmitError("Please fill out all required fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword,
          rollNumber: formRollNumber.trim() || null,
          branch: formBranch,
          batch: formBatch.trim(),
          isPaid: formIsPaid,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create student account.");
      }

      const newStudent = await res.json();
      setStudents((prev) => [newStudent, ...prev]);

      // Reset form
      setFormName("");
      setFormEmail("");
      setFormPassword("");
      setFormRollNumber("");
      setFormBranch("Kalkalji");
      setFormBatch("2026");
      setFormIsPaid(false);
      setIsAdding(false);
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePaid = async (studentId: string, currentPaid: boolean) => {
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid: !currentPaid }),
      });

      if (!res.ok) {
        throw new Error("Failed to update payment status.");
      }

      const updated = await res.json();
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, isPaid: updated.isPaid } : s))
      );
    } catch (err: any) {
      alert(err.message || "Could not update payment status.");
    }
  };

  const handleToggleAccess = async (studentId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });

      if (!res.ok) {
        throw new Error("Failed to update student access.");
      }

      const updated = await res.json();
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, isActive: updated.isActive } : s))
      );
    } catch (err: any) {
      alert(err.message || "Could not update access status.");
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to delete this student account? All reading statistics, streak information, and comments for this user will be removed.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete student.");
      }

      setStudents((prev) => prev.filter((s) => s.id !== studentId));
    } catch (err: any) {
      alert(err.message || "Could not delete student.");
    }
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let generated = "";
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormPassword(generated);
  };

  // Filtering Logic
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPaid =
      paidFilter === "all" ? true : paidFilter === "paid" ? s.isPaid : !s.isPaid;

    const matchesAccess =
      accessFilter === "all" ? true : accessFilter === "active" ? s.isActive : !s.isActive;

    return matchesSearch && matchesPaid && matchesAccess;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg shadow-slate-200/40 dark:shadow-slate-900/40 p-6">

        {/* Gradient Glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/20 blur-3xl rounded-full"></div>

        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-5">

          {/* Left Content */}
          <div className="text-center sm:text-left space-y-2">

            {/* Title */}
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3 justify-center sm:justify-start">

              {/* Icon Badge */}
              <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow-md">
                <Users className="w-5 h-5" />
              </span>

              <span className="bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                Manage Enrolled Students
              </span>
            </h2>

            {/* Subtitle */}
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
              Provision student credentials, configure tuition paid status, and manage platform permissions.
            </p>
          </div>

          {/* Right Actions */}
          <div className="flex gap-3 w-full sm:w-auto">

            {/* Add Student Button */}
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 
        bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-700 hover:to-cyan-600 
        text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 
        transition-all duration-300 hover:scale-[1.03] active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isAdding ? "Cancel Form" : "Add Student"}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={fetchStudents}
              disabled={isLoading}
              className="flex items-center justify-center px-3 py-2.5 
        bg-white/60 dark:bg-slate-800/60 backdrop-blur-md 
        border border-slate-200 dark:border-slate-700 
        hover:bg-white dark:hover:bg-slate-800 
        rounded-xl transition-all duration-300 
        shadow-sm hover:shadow-md 
        disabled:opacity-50"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 text-slate-600 dark:text-slate-300 ${isLoading ? "animate-spin" : ""}`} />
            </button>

          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-start gap-3 text-rose-600 dark:text-rose-400 text-sm font-semibold">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Student Slide-Down Form */}
     {isAdding && (
  <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-lg p-6 space-y-5 animate-in slide-in-from-top duration-300">

    {/* Glow Effects */}
    <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full"></div>
    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/20 blur-3xl rounded-full"></div>

    <div className="relative space-y-5">

      {/* Header */}
      <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-500 text-white shadow">
          <UserPlus className="w-4 h-4" />
        </span>
        Enroll New Student Account
      </h3>

      {/* Error */}
      {submitError && (
        <div className="p-3 bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200/40 dark:border-rose-900/30 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold backdrop-blur">
          <AlertTriangle className="w-4 h-4" />
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleAddStudent} className="space-y-5">

        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Name */}
          <div>
            <label className="form-label">Student Name *</label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Michael Scott"
              className="input-premium"
            />
          </div>

          {/* Email */}
          <div>
            <label className="form-label">Email Address *</label>
            <div className="relative">
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="student@institute.edu"
                className="input-premium pl-9"
              />
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Password */}
          <div>
            <label className="form-label flex justify-between">
              <span>Password *</span>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Auto Generate
              </button>
            </label>
            <input
              type="text"
              required
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="Set login password"
              className="input-premium font-mono"
            />
          </div>

          {/* Roll */}
          <div>
            <label className="form-label">Roll Number</label>
            <div className="relative">
              <input
                type="text"
                value={formRollNumber}
                onChange={(e) => setFormRollNumber(e.target.value)}
                placeholder="e.g. 24IT105"
                className="input-premium pl-9"
              />
            </div>
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Branch */}
          <div>
            <label className="form-label">Branch</label>
            <div className="relative">
              <select
                value={formBranch}
                onChange={(e) => setFormBranch(e.target.value)}
                className="input-premium pl-9 appearance-none cursor-pointer"
              >
                <option value="Kalkalji">Kalkalji</option>
                <option value="Badarpur">Badarpur</option>
              </select>
            </div>
          </div>

          {/* Batch */}
          <div>
            <label className="form-label">Batch / Year</label>
            <div className="relative">
              <input
                type="text"
                required
                value={formBatch}
                onChange={(e) => setFormBatch(e.target.value)}
                placeholder="2026"
                className="input-premium pl-9"
              />
            </div>
          </div>

          {/* Paid */}
          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={formIsPaid}
                onChange={(e) => setFormIsPaid(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition">
                Tuition Paid
              </span>
            </label>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">

          <button
            type="button"
            onClick={() => setIsAdding(false)}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white 
            bg-gradient-to-r from-indigo-600 to-cyan-500 
            hover:from-indigo-700 hover:to-cyan-600 
            shadow-md shadow-indigo-500/20 
            flex items-center gap-2 transition-all duration-300 hover:scale-[1.03] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Enrolling...
              </>
            ) : (
              "Create Account"
            )}
          </button>

        </div>
      </form>
    </div>
  </div>
)}

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs">
        {/* Search */}
        <div className="sm:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students by name, email, roll..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-xl text-slate-800 dark:text-slate-250 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs"
          />
        </div>
      </div>
      {/* Student list grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          <span className="text-sm font-medium">Loading student directory...</span>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6 text-slate-400 dark:text-slate-500">
          <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
          <p className="font-bold text-sm">No students found</p>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search criteria or register a student above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredStudents.map((student) => {
            const avatarInitial = student.name.charAt(0).toUpperCase();
            return (
              <div
                key={student.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/85 rounded-2xl p-5 shadow-xs hover:border-slate-350 dark:hover:border-slate-750 transition-all flex flex-col justify-between gap-4"
              >
                {/* Top: Metadata */}
                <div className="flex gap-3.5 items-start">
                  {/* Circle initial avatar */}
                  <div className="h-10 w-10 shrink-0 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100/30 dark:border-indigo-900/20 text-base font-extrabold flex items-center justify-center shadow-inner">
                    {avatarInitial}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-extrabold text-slate-850 dark:text-white truncate">
                        {student.name}
                      </h4>
                      {student.rollNumber && (
                        <span className="text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 font-bold font-mono text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-md">
                          {student.rollNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={student.email}>
                      {student.email}
                    </p>
                    <div className="flex gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pt-0.5">
                      <span>{student.branch}</span>
                      <span>•</span>
                      <span>Batch {student.batch}</span>
                    </div>
                  </div>
                </div>
                {/* Bottom: Actions */}
                <div className="flex items-center justify-end border-t border-slate-100 dark:border-slate-855 pt-3.5 mt-1">
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteStudent(student.id)}
                    className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                    title="Delete student"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
