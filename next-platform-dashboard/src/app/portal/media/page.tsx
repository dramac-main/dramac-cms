"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Image, Construction } from "lucide-react";

export default function PortalMediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
        <p className="text-muted-foreground">
          View and manage images and files for your sites
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5" />
            Coming Soon
          </CardTitle>
          <CardDescription>
            The media library feature is currently being developed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Image className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Media Library</h3>
            <p className="text-muted-foreground max-w-md">
              Soon you&apos;ll be able to browse, upload, and manage all your images and files 
              across your sites from this central location.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
