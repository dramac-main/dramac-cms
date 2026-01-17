# Media Library Setup Guide

## Storage Bucket Configuration

The media library requires a Supabase storage bucket to be configured. This **must be done once** before uploads will work.

---

## Setup Instructions

### Option 1: Run SQL Migration (Recommended)

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Open the migration file: `migrations/phase-81-media-bucket-setup.sql`
4. Copy the entire SQL content
5. Paste into Supabase SQL Editor
6. Click **Run**

This will:
- ✅ Create the `media` storage bucket
- ✅ Set bucket to public access
- ✅ Configure 50MB file size limit
- ✅ Set allowed MIME types (images, videos, docs, PDFs)
- ✅ Create storage RLS policies for authenticated users

---

### Option 2: Manual Setup via Supabase Dashboard

1. Open your **Supabase Dashboard**
2. Go to **Storage** section
3. Click **New Bucket**
4. Configure bucket:
   - **Name**: `media`
   - **Public bucket**: ✅ Enabled
   - **File size limit**: `50 MB`
   - **Allowed MIME types**: 
     - `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/svg+xml`
     - `video/mp4`, `video/quicktime`, `video/x-msvideo`
     - `application/pdf`
     - `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
     - `text/plain`, `text/csv`
5. Click **Create Bucket**
6. Go to **Policies** tab for the `media` bucket
7. Add these policies:
   - **INSERT**: Allow authenticated users to upload
   - **SELECT**: Allow authenticated users to read
   - **UPDATE**: Allow authenticated users to update
   - **DELETE**: Allow authenticated users to delete

---

## Verification

After setup, verify the bucket exists:

### Via Supabase SQL Editor:
```sql
SELECT * FROM storage.buckets WHERE name = 'media';
```

You should see one row with:
- `id`: `media`
- `name`: `media`
- `public`: `true`
- `file_size_limit`: `52428800` (50MB in bytes)

### Via Application:
1. Go to **Media Library** in the dashboard
2. Try uploading a file
3. Upload should succeed ✅

---

## Troubleshooting

### Error: "Media storage not configured"
- The `media` bucket doesn't exist
- **Solution**: Run the SQL migration or create bucket manually

### Error: "Bucket not found"
- Same as above
- **Solution**: Follow setup instructions

### Error: "new row violates row-level security policy"
- Trying to create bucket programmatically (not possible due to RLS)
- **Solution**: Bucket must be created via SQL migration or Supabase dashboard

### Error: "File too large"
- File exceeds 50MB limit
- **Solution**: Reduce file size or adjust bucket limit in Supabase

### Error: "Invalid file type"
- MIME type not in allowed list
- **Solution**: Add MIME type to bucket's allowed types in Supabase

---

## File Organization

Once bucket is configured, files are organized as:

```
media/
├── {agency-id-1}/
│   ├── file-abc123.jpg
│   ├── file-def456.png
│   └── file-ghi789.pdf
├── {agency-id-2}/
│   ├── file-jkl012.jpg
│   └── file-mno345.mp4
```

Each agency's files are stored in their own folder within the `media` bucket.

---

## Security Notes

- **Public Access**: Files are publicly accessible via URL (required for website display)
- **RLS Policies**: Database records (assets table) have RLS policies limiting access by agency
- **Folder Isolation**: Each agency's files are stored in separate folders
- **Super Admin**: Can access all agencies' media
- **Agency Members**: Can only upload/view, cannot delete or manage folders

---

## Next Steps

After bucket setup:
1. ✅ Test upload in Media Library
2. ✅ Verify files appear in grid
3. ✅ Test folder creation
4. ✅ Test metadata editing
5. ✅ Test search and filters

---

**Setup Required**: Run migration **before** using Media Library
**Migration File**: `migrations/phase-81-media-bucket-setup.sql`
**One-Time Setup**: Only needs to be done once per Supabase project
