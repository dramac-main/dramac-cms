import type { Metadata } from "next";
import { TemplateGalleryPage } from "./template-gallery-page";

export const metadata: Metadata = {
  title: "Templates | DramaC CMS",
  description: "Browse industry templates for your website",
};

export default function TemplatesPage() {
  return <TemplateGalleryPage />;
}
