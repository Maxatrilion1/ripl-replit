-- Allow anonymous uploads to temp folder for onboarding
CREATE POLICY "Allow anonymous uploads to temp folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = 'temp');