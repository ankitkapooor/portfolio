import { getProject, projects } from "@/content/projects";
import { ogSize, signatureCard } from "@/lib/og-card";

export const size = ogSize;
export const contentType = "image/png";

/** Required by `output: "export"`: one card per project, at build time. */
export const dynamic = "force-static";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export const alt = "Ankit Kapoor's handwritten signature, with the project name written below it.";

/** The link preview for a case study: the signature, captioned with the project. */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return signatureCard({ caption: getProject(slug)?.title });
}
