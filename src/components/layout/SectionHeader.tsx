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
    <div id={id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 scroll-mt-24">
      <div className="flex items-center gap-6 w-full">
        <h2 className="text-[9px] font-black text-white/10 uppercase tracking-[0.6em] whitespace-nowrap flex items-center gap-3">
          {icon && <span className="opacity-50">{icon}</span>}
          {title}
        </h2>
        <div className="h-px w-full bg-white/5" />
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
