-- Add file_url column to articles and lessons
ALTER TABLE articles ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS file_url text;

-- Create a bucket for documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Set up access control for the documents bucket
CREATE POLICY "Public Access Documents"
ON storage.objects FOR SELECT
USING ( bucket_id = 'documents' );

CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'documents' );

CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'documents' AND (auth.uid() = owner) );

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'documents' AND (auth.uid() = owner) );
