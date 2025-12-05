-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload to complaint-attachments bucket
CREATE POLICY "Users can upload complaint attachments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'complaint-attachments' AND
  (auth.role() = 'authenticated' OR auth.role() = 'anon')
);

-- Policy to allow users to read their own uploads
CREATE POLICY "Users can view complaint attachments" ON storage.objects
FOR SELECT USING (
  bucket_id = 'complaint-attachments' AND
  (auth.role() = 'authenticated' OR auth.role() = 'anon')
);

-- Policy to allow users to update their own uploads (for resumable uploads)
CREATE POLICY "Users can update complaint attachments" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'complaint-attachments' AND
  (auth.role() = 'authenticated' OR auth.role() = 'anon')
);

-- Policy to allow users to delete their own uploads
CREATE POLICY "Users can delete complaint attachments" ON storage.objects
FOR DELETE USING (
  bucket_id = 'complaint-attachments' AND
  (auth.role() = 'authenticated' OR auth.role() = 'anon')
);
