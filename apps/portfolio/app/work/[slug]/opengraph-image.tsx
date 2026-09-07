import { ImageResponse } from "next/og";
import { getProject, projects } from "@/content/projects";
import {
  evidenceStatusLabels,
  statusLabels,
} from "@/lib/content-validation";
import { profile } from "@/content/profile";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Hex values matching styles/tokens.css, since ImageResponse has no CSS vars. */
const ACCENTS: Record<string, string> = {
  "--project-accent-01": "#315B85",
  "--project-accent-02": "#6253A3",
  "--project-accent-03": "#236350",
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
            backgroundColor: "#F6F3ED",
          }}
        />
      ),
      size,
    );
  }

  const accent = ACCENTS[project.accentVar] ?? "#A33B24";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#F6F3ED",
          color: "#1D2424",
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
              color: "#5E655F",
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
            borderTop: "1px solid #D6D0C6",
            paddingTop: 24,
          }}
        >
          <div style={{ display: "flex", fontSize: 22, color: "#5E655F" }}>
            {`Status: ${statusLabels[project.status]} · Evidence: ${
              evidenceStatusLabels[project.evidenceStatus]
            }`}
          </div>
          <div
            style={{
              fontSize: 20,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "#5E655F",
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
