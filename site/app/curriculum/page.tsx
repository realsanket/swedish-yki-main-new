import type { Metadata } from "next";
import { FullCurriculum } from "@/components/learning/FullCurriculum";
import { CurriculumPrintControls } from "@/components/learning/CurriculumPrintControls";

export const metadata: Metadata = {
  title: "Stigen · Detailed Swedish curriculum",
  description:
    "A printable teaching index for Stigen's Swedish story path, including every live episode, topic, subtopic, example, and carry-forward point.",
};

export default async function CurriculumPage({
  searchParams,
}: {
  searchParams: Promise<{ print?: string | string[] }>;
}) {
  const { print } = await searchParams;
  const autoPrint = print === "1";

  return (
    <main className="standalone-curriculum" id="main-content">
      <CurriculumPrintControls autoPrint={autoPrint} />
      <FullCurriculum mode="standalone" />
    </main>
  );
}
