"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  hover?: boolean;
}

export function Card({ className, children, onClick, hover }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-card border border-slate-100",
        hover && "transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export function CardHeader({ className, children }: CardHeaderProps) {
  return (
    <div className={cn("px-5 py-4 border-b border-slate-100", className)}>
      {children}
    </div>
  );
}

export function CardBody({ className, children }: CardHeaderProps) {
  return (
    <div className={cn("px-5 py-4", className)}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children }: CardHeaderProps) {
  return (
    <div className={cn("px-5 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl", className)}>
      {children}
    </div>
  );
}
