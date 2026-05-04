"use client";

import type { LucideIcon } from "lucide-react";

export function SectionEyebrow({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <p className="eyebrow eyebrow-with-icon">
      <span className="eyebrow-icon" aria-hidden="true">
        <Icon size={16} />
      </span>
      <span>{children}</span>
    </p>
  );
}
