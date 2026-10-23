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
  "--project-accent-01": "#FF7A45",
  "--project-accent-02": "#F2F1EE",
  "--project-accent-03": "#FF7A45",
  "--project-accent-04": "#F2F1EE",
  "--project-accent-05": "#FF7A45",
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
            backgroundColor: "#0B0B0C",
          }}
        />
      ),
      size,
    );
  }

  const accent = ACCENTS[project.accentVar] ?? "#FF7A45";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0B0B0C",
          color: "#F2F1EE",
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
              color: "#A3A3A8",
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
            borderTop: "1px solid #27272A",
            paddingTop: 24,
          }}
        >
          <div style={{ display: "flex", fontSize: 22, color: "#A3A3A8" }}>
            {`Status: ${statusLabels[project.status]} · Evidence: ${
              evidenceStatusLabels[project.evidenceStatus]
            }`}
          </div>
          <div
            style={{
              fontSize: 20,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#A3A3A8",
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
