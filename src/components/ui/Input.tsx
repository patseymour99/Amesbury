import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          className={cn(
            "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 text-sm placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-colors",
            "disabled:bg-slate-50 disabled:cursor-not-allowed",
            icon && "pl-10",
            error && "border-red-300 focus:ring-red-300",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 text-sm placeholder:text-slate-400 resize-none",
          "focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-colors",
          error && "border-red-300 focus:ring-red-300",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        className={cn(
          "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 text-sm",
          "focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-300 transition-colors",
          "disabled:bg-slate-50 disabled:cursor-not-allowed",
          error && "border-red-300 focus:ring-red-300",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
