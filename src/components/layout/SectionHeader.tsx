"use client";

import React from "react";

interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  id?: string;
}

export default function SectionHeader({ title, icon, actions, id }: SectionHeaderProps) {
  return (
    <div id={id} className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 scroll-mt-24 group">
      <div className="flex items-center gap-6 w-full">
        <h2 className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] whitespace-nowrap flex items-center gap-4 group-hover:text-white/50 transition-colors">
          {icon && <span className="opacity-80 text-primary">{icon}</span>}
          {title}
        </h2>
        <div className="h-px w-full bg-white/[0.04] transition-colors group-hover:bg-white/[0.08]" />
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
