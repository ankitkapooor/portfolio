import { ImageResponse } from "next/og";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { headlineText } from "@/lib/hero-headline";

export const alt =
  "Ankit Kapoor — I investigate how AI changes competition, customer value, and business economics. Former machine learning engineer, MBA candidate at USC Marshall.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Required by `output: "export"`: the card is rendered once, at build time. */
export const dynamic = "force-static";

/*
 * Original graphics only: the site's own palette, its own copy, a rule, and
 * the three project numbers. No photograph, no logo, no borrowed imagery.
 *
 * ImageResponse renders with its bundled default sans face rather than the
 * site's Instrument Serif, because next/font keeps its downloaded files inside
 * the build output. The composition carries the identity instead.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: "#F6F3ED",
          color: "#1D2424",
          padding: "64px 72px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            flex: 1,
            paddingRight: 56,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                width: 132,
                height: 6,
                backgroundColor: "#A33B24",
                marginBottom: 34,
              }}
            />
            <div
              style={{
                fontSize: 22,
                letterSpacing: 4,
                textTransform: "uppercase",
                color: "#5E655F",
              }}
            >
              {profile.name}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: 56,
              lineHeight: 1.1,
              letterSpacing: -1,
              maxWidth: 700,
            }}
          >
            {headlineText()}
          </div>

          <div style={{ display: "flex", fontSize: 24, color: "#5E655F" }}>
            Former machine learning engineer · MBA candidate at USC Marshall
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            width: 300,
            borderLeft: "1px solid #D6D0C6",
            paddingLeft: 40,
          }}
        >
          {projects.map((project) => (
            <div
              key={project.slug}
              style={{
                display: "flex",
                flexDirection: "column",
                borderTop: "1px solid #D6D0C6",
                paddingTop: 16,
                paddingBottom: 22,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  letterSpacing: 3,
                  color: "#5E655F",
                  marginBottom: 8,
                }}
              >
                {project.number}
              </div>
              <div style={{ fontSize: 25, lineHeight: 1.2 }}>
                {project.question}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
