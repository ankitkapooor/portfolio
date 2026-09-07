import type { Metadata } from "next";
import PlayClient from "./PlayClient";

export const metadata: Metadata = {
  title: "Play",
  description:
    "Choose a side and run four quarterly decisions against a rules-based opponent.",
};

export default function PlayPage() {
  return <PlayClient />;
}
