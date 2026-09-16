import { ImageResponse } from "next/og";
import { getProject, projects } from "@/content/projects";
import {
  evidenceStatusLabels,
  statusLabels,
} from "@/lib/content-validation";
import { profile } from "@/content/profile";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Required by `output: "export"`: one card per project, at build time. */
export const dynamic = "force-static";

/** Hex values matching styles/tokens.css, since ImageResponse has no CSS vars. */
const ACCENTS: Record<string, string> = {
  "--project-accent-01": "#6EACDA",
  "--project-accent-02": "#E2E2B6",
  "--project-accent-03": "#6EACDA",
  "--project-accent-04": "#E2E2B6",
  "--project-accent-05": "#6EACDA",
};

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export const alt =
  "Case study card: project number, the strategic question, the project title, and its current status and evidence label.";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            backgroundColor: "#021526",
          }}
        />
      ),
      size,
    );
  }

  const accent = ACCENTS[project.accentVar] ?? "#6EACDA";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#021526",
          color: "#E2E2B6",
          padding: "64px 72px",
          borderTop: `10px solid ${accent}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
            <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: accent,
            }}
          >
            {`Project ${project.number}`}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#A9BFD0",
              marginTop: 24,
              maxWidth: 780,
            }}
          >
            {project.question}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 92,
            lineHeight: 1.05,
            letterSpacing: -2,
            maxWidth: 940,
          }}
        >
          {project.title}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            borderTop: "1px solid #25445D",
            paddingTop: 24,
          }}
        >
          <div style={{ display: "flex", fontSize: 22, color: "#A9BFD0" }}>
            {`Status: ${statusLabels[project.status]} · Evidence: ${
              evidenceStatusLabels[project.evidenceStatus]
            }`}
          </div>
          <div
            style={{
              fontSize: 20,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#A9BFD0",
            }}
          >
            {profile.name}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
