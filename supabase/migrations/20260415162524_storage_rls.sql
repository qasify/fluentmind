-- 1. Allow authenticated users to upload files to 'sessions_audio' (only into their own folder designated by their UID)
CREATE POLICY "Users can upload their own audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'sessions_audio' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Allow authenticated users to view their own audio files
CREATE POLICY "Users can view their own audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'sessions_audio' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow authenticated users to delete their own audio files
CREATE POLICY "Users can delete their own audio"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'sessions_audio' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Note: In order for this to work perfectly, the user will upload the audio file 
-- to the path: `<user_id>/<session_id>.webm`. 
-- `(storage.foldername(name))[1]` extracts that `<user_id>` prefix!

-- Add audio_url to sessions table to track the storage link
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS audio_url TEXT;
