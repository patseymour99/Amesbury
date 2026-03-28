import React from "react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/types";

interface AvatarProps {
  name: string;
  role: UserRole;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({ name, role, size = "md", className }: AvatarProps) {
  const sizes = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };

  const gradients = {
    mum: "from-mum-500 to-purple-500",
    dad: "from-dad-500 to-cyan-500",
  };

  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold flex-shrink-0",
        sizes[size],
        gradients[role],
        className
      )}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
