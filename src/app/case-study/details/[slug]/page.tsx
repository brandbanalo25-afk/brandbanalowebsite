import CaseStudyDetailsSections from "@/components/main/CaseStudyDetailsSections";
import caseStudyData from "@/data/caseStudyData.json";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamicParams = false;

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = caseStudyData.caseStudies.find((p) => p.slug === slug);

  if (!caseStudy) {
    return {
      title: "Case Study",
      description:
        "Explore Brandbanalo case studies and see how our branding, web, SEO, and performance marketing work delivers measurable results.",
    };
  }

  return {
    title: caseStudy.title,
    description: caseStudy.description,
  };
}

export function generateStaticParams() {
  return caseStudyData.caseStudies.map((caseStudy) => ({
    slug: caseStudy.slug,
  }));
}

export default async function CaseStudyDetailsPage({ params }: Props) {
  const { slug } = await params;
  const caseStudy = caseStudyData.caseStudies.find((p) => p.slug === slug);

  if (!caseStudy) {
    notFound();
  }

  const caseStudyIndex = caseStudyData.caseStudies.findIndex((p) => p.slug === slug);
  const prevCaseStudy = caseStudyIndex > 0 ? caseStudyData.caseStudies[caseStudyIndex - 1] : null;
  const nextCaseStudy = caseStudyIndex < caseStudyData.caseStudies.length - 1 ? caseStudyData.caseStudies[caseStudyIndex + 1] : null;

  return (
    <main>
      <CaseStudyDetailsSections 
        caseStudy={caseStudy}
        prevCaseStudy={prevCaseStudy}
        nextCaseStudy={nextCaseStudy}
      />
    </main>
  );
}
