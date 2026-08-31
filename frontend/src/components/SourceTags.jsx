import React from 'react';

const SECTION_LABELS = {
  summary: 'Summary',
  skills: 'Skills',
  experience: 'Experience',
  orky: 'Orky.io',
  projects: 'Projects',
  certifications: 'Certifications',
  education: 'Education',
  achievements: 'Achievements',
  coding_profiles: 'Coding & Problem Solving',
  languages: 'Languages',
};

export default function SourceTags({ sources = [] }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 pt-2 text-[11px] sm:text-xs font-mono text-muted tracking-wide select-none transition-opacity duration-150 ease-in"
      aria-label="Resume sources used for this answer"
    >
      <span className="text-muted/60">Grounded in:</span>
      {sources.map((srcId) => {
        const label = SECTION_LABELS[srcId] || srcId;
        return (
          <span
            key={srcId}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-2/70 text-muted border border-border-subtle/60"
          >
            <span className="text-accent/80">·</span> {label}
          </span>
        );
      })}
    </div>
  );
}
