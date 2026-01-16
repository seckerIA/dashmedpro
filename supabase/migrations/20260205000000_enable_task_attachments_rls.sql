-- Enable RLS for task-attachments bucket

-- Policy to allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload task attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'task-attachments' );

-- Policy to allow authenticated users to view files
CREATE POLICY "Authenticated users can view task attachments"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'task-attachments' );

-- Policy to allow authenticated users to update files (e.g. metadata)
CREATE POLICY "Authenticated users can update task attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'task-attachments' );

-- Policy to allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete task attachments"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'task-attachments' );
