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
    <div className={`flex flex-col xl:flex-row xl:items-start justify-between gap-8 mb-10 animate-in ${animationClass} duration-700`}>
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-1 w-8 bg-primary/50 rounded-full" />
          <span className="text-[9px] font-black text-primary/60 uppercase tracking-[0.4em]">
            {category}
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black font-display text-white tracking-tighter leading-none mb-3">
          {title}
        </h1>
        <div className="text-white/30 text-sm md:text-base font-medium leading-relaxed font-display">
          {subtitle}
        </div>
      </div>
      {actions && (
        <div className="flex flex-col gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
