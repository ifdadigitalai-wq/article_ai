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
  Lock,
  Unlock,
  CreditCard,
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
  department: string;
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
  const [formDepartment, setFormDepartment] = useState("CSE");
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
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim() || !formDepartment || !formBatch) {
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
          department: formDepartment,
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
      setFormDepartment("CSE");
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2 justify-center sm:justify-start">
            <Users className="w-6 h-6 text-indigo-650 dark:text-indigo-400" />
            <span>Manage Enrolled Students</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Provision student credentials, configure tuition paid status, and manage platform permissions.
          </p>
        </div>

        <div className="flex gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-500/10 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isAdding ? "Cancel Form" : "Add Student"}</span>
          </button>

          <button
            onClick={fetchStudents}
            disabled={isLoading}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer text-slate-650 dark:text-slate-350 disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
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
        <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-850 rounded-2xl p-6 shadow-sm space-y-4 animate-in slide-in-from-top duration-300">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <UserPlus className="w-4.5 h-4.5 text-indigo-500" />
            <span>Enroll New Student Account</span>
          </h3>

          {submitError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-900/20 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleAddStudent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wide">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Michael Scott"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wide">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="student@institute.edu"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wide flex items-center justify-between">
                  <span>Password *</span>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto Generate</span>
                  </button>
                </label>
                <input
                  type="text"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Set login password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wide">
                  Roll Number
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={formRollNumber}
                    onChange={(e) => setFormRollNumber(e.target.value)}
                    placeholder="e.g. 24IT105"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-855 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wide">
                  Department
                </label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={formDepartment}
                    onChange={(e) => setFormDepartment(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs cursor-pointer appearance-none"
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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 uppercase tracking-wide">
                  Batch/Year
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formBatch}
                    onChange={(e) => setFormBatch(e.target.value)}
                    placeholder="2026"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formIsPaid}
                    onChange={(e) => setFormIsPaid(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-650 bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 focus:ring-indigo-500/20 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Tuition / Fee Paid
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-indigo-655 text-white hover:bg-indigo-700 border border-indigo-600 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Enrolling...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </div>
          </form>
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
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs"
          />
        </div>

        {/* Paid Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <select
            value={paidFilter}
            onChange={(e) => setPaidFilter(e.target.value as any)}
            className="w-full pl-8 pr-3.5 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-slate-800 dark:text-slate-200 text-xs cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Tuition Status</option>
            <option value="paid">Paid Only</option>
            <option value="unpaid">Unpaid Only</option>
          </select>
        </div>

        {/* Access Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <select
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value as any)}
            className="w-full pl-8 pr-3.5 py-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-slate-800 dark:text-slate-200 text-xs cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="all">All Access Permissions</option>
            <option value="active">Active/Invoked</option>
            <option value="revoked">Revoked Only</option>
          </select>
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
          <p className="text-xs text-slate-450 mt-1">
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
                        <span className="text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 font-bold font-mono text-slate-500 px-1.5 py-0.5 rounded-md">
                          {student.rollNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-450 truncate" title={student.email}>
                      {student.email}
                    </p>
                    <div className="flex gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 pt-0.5">
                      <span>{student.department}</span>
                      <span>•</span>
                      <span>Batch {student.batch}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom: Actions */}
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-3.5 mt-1">
                  {/* Badges and Actions */}
                  <div className="flex gap-2">
                    {/* Paid Button */}
                    <button
                      onClick={() => handleTogglePaid(student.id, student.isPaid)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-all ${
                        student.isPaid
                          ? "bg-emerald-50/50 border-emerald-100/60 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-450 hover:bg-emerald-100 dark:hover:bg-emerald-950/30"
                          : "bg-amber-50/50 border-amber-100/60 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-450 hover:bg-amber-100 dark:hover:bg-amber-950/30"
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{student.isPaid ? "Paid" : "Unpaid"}</span>
                    </button>

                    {/* Access Permission Button */}
                    <button
                      onClick={() => handleToggleAccess(student.id, student.isActive)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-all ${
                        student.isActive
                          ? "bg-indigo-50/50 border-indigo-105/60 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-905/30 dark:text-indigo-450 hover:bg-indigo-100 dark:hover:bg-indigo-950/30"
                          : "bg-rose-50/50 border-rose-100/60 text-rose-700 dark:bg-rose-955/20 dark:border-rose-900/30 dark:text-rose-450 hover:bg-rose-100 dark:hover:bg-rose-950/30"
                      }`}
                    >
                      {student.isActive ? (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Revoked</span>
                        </>
                      )}
                    </button>
                  </div>

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
