import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserId, getCurrentUserRole, isSuperAdmin } from "@/lib/auth/permissions";
import { uploadMediaFile, validateFile } from "@/lib/media/upload-service";

export const runtime = "nodejs";
export const maxDuration = 60; // 60 seconds for large uploads

// Maximum file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get user's agency
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", userId)
      .single();

    if (!profile?.agency_id) {
      return NextResponse.json(
        { error: "No agency found" },
        { status: 400 }
      );
    }

    const agencyId = profile.agency_id;

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const folderId = formData.get("folderId") as string | null;
    const siteId = formData.get("siteId") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      // Validate file
      const validation = await validateFile({
        name: file.name,
        type: file.type,
        size: file.size,
      }, { maxSize: MAX_FILE_SIZE });

      if (!validation.valid) {
        errors.push({ file: file.name, error: validation.error });
        continue;
      }

      // Convert to ArrayBuffer
      const buffer = await file.arrayBuffer();

      // Upload file
      const result = await uploadMediaFile(
        agencyId,
        buffer,
        file.name,
        file.type,
        file.size,
        {
          folderId: folderId || undefined,
          siteId: siteId || undefined,
        }
      );

      if (result.success) {
        results.push({
          name: file.name,
          fileId: result.fileId,
          publicUrl: result.publicUrl,
        });
      } else {
        errors.push({ file: file.name, error: result.error });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      uploaded: results,
      errors,
    });
  } catch (error) {
    console.error("[Upload API] Error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

// Handle URL imports
export async function PUT(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get user's agency
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", userId)
      .single();

    if (!profile?.agency_id) {
      return NextResponse.json(
        { error: "No agency found" },
        { status: 400 }
      );
    }

    const agencyId = profile.agency_id;
    const body = await request.json();
    const { url, folderId, siteId } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Fetch the image from URL
    const response = await fetch(url, {
      headers: { "User-Agent": "DramaCMS/1.0" },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image from URL" },
        { status: 400 }
      );
    }

    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const buffer = await response.arrayBuffer();

    // Extract filename from URL
    const urlObj = new URL(url);
    let fileName = urlObj.pathname.split("/").pop() || "imported-file";
    if (!fileName.includes(".")) {
      const ext = contentType.split("/")[1]?.split(";")[0];
      if (ext) fileName = `${fileName}.${ext}`;
    }

    // Upload
    const result = await uploadMediaFile(
      agencyId,
      buffer,
      fileName,
      contentType,
      buffer.byteLength,
      {
        folderId: folderId || undefined,
        siteId: siteId || undefined,
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      fileId: result.fileId,
      publicUrl: result.publicUrl,
    });
  } catch (error) {
    console.error("[Upload API] URL import error:", error);
    return NextResponse.json(
      { error: "Import failed" },
      { status: 500 }
    );
  }
}
