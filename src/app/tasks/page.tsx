"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  CheckSquare,
  Square,
  Trash2,
  Sparkles,
  Calendar,
  Flag,
  SortAsc,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToTasks, addTask, updateTask, deleteTask } from "@/lib/firestore";
import type { Task, TaskPriority } from "@/lib/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { getPriorityColor, cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface TaskForm {
  title: string;
  description: string;
  priority: TaskPriority;
  type: "daily" | "weekly";
  dueDate: string;
  userRole: "mum" | "dad";
  category: string;
}

const DEFAULT_FORM: TaskForm = {
  title: "",
  description: "",
  priority: "medium",
  type: "daily",
  dueDate: "",
  userRole: "mum",
  category: "",
};

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const TYPE_OPTIONS = [
  { value: "daily", label: "Today" },
  { value: "weekly", label: "This week" },
];

export default function TasksPage() {
  const { activeUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<TaskForm>({ ...DEFAULT_FORM, userRole: activeUser });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "mum" | "dad">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "daily" | "weekly">("all");
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const unsub = subscribeToTasks(setTasks);
    return unsub;
  }, []);

  function openAdd() {
    setForm({ ...DEFAULT_FORM, userRole: activeUser });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    setSaving(true);
    try {
      await addTask({
        title: form.title.trim(),
        description: form.description,
        priority: form.priority,
        type: form.type,
        dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
        userRole: form.userRole,
        userId: form.userRole,
        category: form.category,
        completed: false,
        createdAt: new Date(),
      });
      toast.success("Task added");
      setShowModal(false);
    } catch {
      toast.error("Failed to add task");
    } finally {
      setSaving(false);
    }
  }

  async function toggleComplete(task: Task) {
    try {
      await updateTask(task.id, {
        completed: !task.completed,
        completedAt: !task.completed ? new Date() : undefined,
      });
    } catch {
      toast.error("Failed to update task");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTask(id);
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  }

  async function getAISuggestions() {
    setAiSuggesting(true);
    setAiSuggestions([]);
    try {
      const pending = tasks.filter((t) => !t.completed && t.userRole === activeUser);
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `I'm ${activeUser === "mum" ? "a busy woman" : "a retired man who enjoys enduro motorbiking and classic cars"}. My current pending tasks are: ${pending.map((t) => `"${t.title}" (${t.priority} priority)`).join(", ") || "none yet"}.

              Please suggest 5 practical tasks I should add to my list for today or this week. Format your response as a simple numbered list, one task per line, no extra commentary. Just the task titles.`,
            },
          ],
          context: "tasks",
        }),
      });
      const data = await res.json();
      const suggestions = data.response
        .split("\n")
        .filter((l: string) => l.trim())
        .map((l: string) => l.replace(/^\d+\.\s*/, "").trim())
        .filter((l: string) => l.length > 0)
        .slice(0, 5);
      setAiSuggestions(suggestions);
    } catch {
      toast.error("Could not get AI suggestions");
    } finally {
      setAiSuggesting(false);
    }
  }

  const filtered = tasks
    .filter((t) => filter === "all" || t.userRole === filter)
    .filter((t) => typeFilter === "all" || t.type === typeFilter);

  const pendingTasks = filtered.filter((t) => !t.completed);
  const completedTasks = filtered.filter((t) => t.completed);

  const completionRate =
    filtered.length > 0
      ? Math.round((completedTasks.length / filtered.length) * 100)
      : 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Task Manager"
        subtitle="Daily & weekly tasks for the family"
        actions={
          <Button
            variant={activeUser === "mum" ? "mum" : "dad"}
            size="sm"
            icon={<Plus size={16} />}
            onClick={openAdd}
          >
            Add Task
          </Button>
        }
      />

      {/* Stats + Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Progress */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-card p-4 flex items-center gap-4">
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                strokeWidth="6"
                className="stroke-slate-100"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                style={{
                  strokeDasharray: `${2 * Math.PI * 22}`,
                  strokeDashoffset: `${2 * Math.PI * 22 * (1 - completionRate / 100)}`,
                  stroke: activeUser === "mum" ? "#d946ef" : "#0ea5e9",
                  transition: "stroke-dashoffset 0.5s ease",
                }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">
              {completionRate}%
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Progress</p>
            <p className="text-sm text-slate-400">
              {completedTasks.length} / {filtered.length} tasks done
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white">
            {(["all", "mum", "dad"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors capitalize",
                  filter === f
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {f === "all" ? "All" : f === "mum" ? "💜 Mum" : "💙 Dad"}
              </button>
            ))}
          </div>
          <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-white">
            {(["all", "daily", "weekly"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-colors capitalize",
                  typeFilter === f
                    ? "bg-slate-900 text-white"
                    : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {f === "all" ? "All" : f === "daily" ? "Today" : "This Week"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <span className="font-semibold text-slate-900 text-sm">
              AI Task Suggestions
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={getAISuggestions}
            loading={aiSuggesting}
          >
            Suggest tasks
          </Button>
        </div>
        {aiSuggestions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {aiSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  setForm({ ...DEFAULT_FORM, title: s, userRole: activeUser });
                  setShowModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 text-sm font-medium hover:bg-violet-100 transition-colors border border-violet-100"
              >
                <Plus size={12} />
                {s}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            Get personalised task suggestions powered by Claude
          </p>
        )}
      </div>

      {/* Pending Tasks */}
      <div className="space-y-2 mb-6">
        <h2 className="font-semibold text-slate-900 text-sm uppercase tracking-wide px-1">
          Pending ({pendingTasks.length})
        </h2>
        {pendingTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card py-10 text-center text-slate-400">
            <CheckSquare size={28} className="mx-auto mb-2 opacity-30" />
            <p>All tasks complete! Great work 🎉</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingTasks
              .sort((a, b) => {
                const order = { high: 0, medium: 1, low: 2 };
                return order[a.priority] - order[b.priority];
              })
              .map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleComplete(task)}
                  onDelete={() => handleDelete(task.id)}
                />
              ))}
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-slate-400 text-sm uppercase tracking-wide px-1">
            Completed ({completedTasks.length})
          </h2>
          <div className="space-y-1.5 opacity-60">
            {completedTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={() => toggleComplete(task)}
                onDelete={() => handleDelete(task.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Add Task"
        size="md"
      >
        <div className="px-6 py-5 space-y-4">
          <Input
            label="Task title"
            placeholder="What needs to be done?"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          {/* Who */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">For</label>
            <div className="flex gap-2">
              {(["mum", "dad"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setForm({ ...form, userRole: role })}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm font-semibold border transition-all",
                    form.userRole === role
                      ? role === "mum"
                        ? "bg-gradient-to-r from-mum-500 to-purple-500 text-white border-transparent"
                        : "bg-gradient-to-r from-dad-500 to-cyan-500 text-white border-transparent"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {role === "mum" ? "💜 Mum" : "💙 Dad"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
              options={PRIORITY_OPTIONS}
            />
            <Select
              label="Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "daily" | "weekly" })}
              options={TYPE_OPTIONS}
            />
          </div>

          <Input
            label="Due date (optional)"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />

          <Textarea
            label="Notes (optional)"
            placeholder="Any extra details..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
          />
        </div>

        <div className="px-6 pb-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            variant={form.userRole === "mum" ? "mum" : "dad"}
            onClick={handleSave}
            loading={saving}
          >
            Add Task
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const priorityColors: Record<TaskPriority, string> = {
    high: "bg-red-50 border-red-100",
    medium: "bg-amber-50/50 border-amber-100/50",
    low: "bg-white border-slate-100",
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3.5 rounded-2xl border shadow-sm transition-all duration-200",
        task.completed ? "bg-slate-50 border-slate-100" : priorityColors[task.priority]
      )}
    >
      <button
        onClick={onToggle}
        className="flex-shrink-0 text-slate-300 hover:text-emerald-500 transition-colors"
      >
        {task.completed ? (
          <CheckSquare size={20} className="text-emerald-500" />
        ) : (
          <Square size={20} />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium",
            task.completed ? "line-through text-slate-400" : "text-slate-900"
          )}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.dueDate && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar size={10} />
              {format(task.dueDate, "d MMM")}
            </span>
          )}
          <span
            className={cn(
              "text-xs px-1.5 py-0.5 rounded-md font-medium capitalize",
              getPriorityColor(task.priority)
            )}
          >
            {task.priority}
          </span>
          <span className="text-xs text-slate-400 capitalize">
            {task.type === "daily" ? "Today" : "This week"}
          </span>
        </div>
      </div>

      <Avatar
        name={task.userRole === "mum" ? "Mum" : "Dad"}
        role={task.userRole}
        size="sm"
      />

      <button
        onClick={onDelete}
        className="p-1 text-slate-300 hover:text-red-400 transition-colors"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
