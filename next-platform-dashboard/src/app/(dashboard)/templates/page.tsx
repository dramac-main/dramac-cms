import type { Metadata } from "next";
import { TemplateGalleryPage } from "./template-gallery-page";
import { PLATFORM } from "@/lib/constants/platform";

export const metadata: Metadata = {
  title: `Templates | ${PLATFORM.name}`,
  description: "Browse industry templates for your website",
};

export default function TemplatesPage() {
  return <TemplateGalleryPage />;
}
