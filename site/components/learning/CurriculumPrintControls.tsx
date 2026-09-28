"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, FileDown, Printer } from "lucide-react";

export function CurriculumPrintControls({ autoPrint }: { autoPrint: boolean }) {
  useEffect(() => {
    if (!autoPrint) return;
    const firstFrame = requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print());
    });
    return () => cancelAnimationFrame(firstFrame);
  }, [autoPrint]);

  return (
    <header className="curriculum-print-toolbar">
      <Link href="/#course">
        <ArrowLeft size={16} /> Back to Story path
      </Link>
      <div>
        <a href="/curriculum.md" download>
          <FileDown size={16} /> Export Markdown
        </a>
        <button type="button" onClick={() => window.print()}>
          <Printer size={16} /> Print this detailed curriculum
        </button>
      </div>
    </header>
  );
}
