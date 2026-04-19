"use client";

import React from "react";

interface PageHeaderProps {
  category: string;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  actions?: React.ReactNode;
  animationVariant?: "left" | "top" | "right";
}

export default function PageHeader({
  category,
  title,
  subtitle,
  actions,
  animationVariant = "left",
}: PageHeaderProps) {
  const animationClass = {
    left: "slide-in-from-left",
    top: "slide-in-from-top-8",
    right: "slide-in-from-right",
  }[animationVariant];

  return (
    <div className={`flex flex-col xl:flex-row xl:items-start justify-between gap-8 mb-12 animate-in ${animationClass} duration-700`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-2 group/cat">
          <div className="h-[2px] w-7 bg-primary rounded-full group-hover/cat:w-10 transition-all duration-300" />
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">
            {category}
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-display text-white tracking-tighter leading-none mb-4">
          {title}
        </h1>
        <div className="text-white/40 text-sm md:text-lg font-medium font-display tracking-tight max-w-2xl">
          {subtitle}
        </div>
      </div>
      {actions && (
        <div className="flex flex-col gap-3 shrink-0 pt-2">
          {actions}
        </div>
      )}
    </div>
  );
}
