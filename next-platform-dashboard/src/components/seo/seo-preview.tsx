"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Facebook, Twitter } from "lucide-react";

interface SeoPreviewProps {
  title: string;
  description: string;
  url?: string;
  image?: string | null;
  siteName?: string;
  variant?: "google" | "facebook" | "twitter" | "all";
}

export function SeoPreview({
  title,
  description,
  url = "example.com",
  image,
  siteName = "Site",
  variant = "all",
}: SeoPreviewProps) {
  const truncateTitle = (text: string, max: number) => 
    text.length > max ? text.slice(0, max) + "..." : text;
  
  const truncateDescription = (text: string, max: number) => 
    text.length > max ? text.slice(0, max) + "..." : text;

  const renderGooglePreview = () => (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
      <p className="text-sm text-green-700 dark:text-green-400 mb-1">
        {url}
      </p>
      <h3 className="text-lg text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
        {truncateTitle(title || "Page Title", 60)}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        {truncateDescription(description || "No description provided", 160)}
      </p>
    </div>
  );

  const renderFacebookPreview = () => (
    <div className="bg-white dark:bg-gray-900 rounded-lg border overflow-hidden max-w-md">
      {image ? (
        <img 
          src={image} 
          alt="Preview" 
          className="w-full h-52 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div className="w-full h-52 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
          <span className="text-gray-400">No image</span>
        </div>
      )}
      <div className="p-3 border-t">
        <p className="text-xs text-gray-500 uppercase">{url.replace(/^https?:\/\//, '').split('/')[0]}</p>
        <p className="font-semibold text-gray-900 dark:text-white mt-1">
          {truncateTitle(title || "Page Title", 70)}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {truncateDescription(description || "No description provided", 100)}
        </p>
      </div>
    </div>
  );

  const renderTwitterPreview = () => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden max-w-md">
      {image ? (
        <img 
          src={image} 
          alt="Preview" 
          className="w-full h-48 object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
          <span className="text-gray-400">No image</span>
        </div>
      )}
      <div className="p-3 border-t">
        <p className="font-medium text-gray-900 dark:text-white">
          {truncateTitle(title || "Page Title", 70)}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {truncateDescription(description || "No description provided", 100)}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          {url.replace(/^https?:\/\//, '').split('/')[0]}
        </p>
      </div>
    </div>
  );

  if (variant === "google") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            Google Search Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderGooglePreview()}
        </CardContent>
      </Card>
    );
  }

  if (variant === "facebook") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Facebook className="h-4 w-4" />
            Facebook Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderFacebookPreview()}
        </CardContent>
      </Card>
    );
  }

  if (variant === "twitter") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Twitter className="h-4 w-4" />
            Twitter Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderTwitterPreview()}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            Google Search Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderGooglePreview()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Facebook className="h-4 w-4" />
            Facebook Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderFacebookPreview()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Twitter className="h-4 w-4" />
            Twitter Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderTwitterPreview()}
        </CardContent>
      </Card>
    </div>
  );
}
