import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { ProfilePreviewCard } from "./ProfilePreviewCard";

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    name?: string;
    title?: string;
    avatar_url?: string;
    linkedin_profile_url?: string;
  };
  onProfileUpdate: (profile: any) => void;
}

export const ProfileEditModal = ({
  open,
  onOpenChange,
  profile,
  onProfileUpdate
}: ProfileEditModalProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: profile.name || "",
    title: profile.title || "",
    linkedinUrl: profile.linkedin_profile_url || "",
    avatarUrl: profile.avatar_url || ""
  });

  useEffect(() => {
    setFormData({
      name: profile.name || "",
      title: profile.title || "",
      linkedinUrl: profile.linkedin_profile_url || "",
      avatarUrl: profile.avatar_url || ""
    });
  }, [profile]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setPhotoUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
      toast({ title: "Photo uploaded successfully!" });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name.trim(),
          title: formData.title.trim(),
          linkedin_profile_url: formData.linkedinUrl.trim() || null,
          avatar_url: formData.avatarUrl || null
        })
        .eq('user_id', user.id);

      if (error) throw error;

      const updatedProfile = {
        ...profile,
        name: formData.name.trim(),
        title: formData.title.trim(),
        linkedin_profile_url: formData.linkedinUrl.trim() || null,
        avatar_url: formData.avatarUrl || null
      };

      onProfileUpdate(updatedProfile);
      toast({ title: "Profile updated successfully!" });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update failed",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Live Preview */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">
              Preview
            </Label>
            <ProfilePreviewCard
              name={formData.name || "Your Name"}
              title={formData.title || "Your Title"}
              avatarUrl={formData.avatarUrl}
              linkedinUrl={formData.linkedinUrl}
            />
          </div>

          <Separator />

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Photo Upload */}
            <div>
              <Label htmlFor="photo" className="text-sm font-medium mb-2 block">
                Profile Photo
              </Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={formData.avatarUrl} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {formData.name ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : "YN"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    type="file"
                    id="photo"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('photo')?.click()}
                    disabled={photoUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {photoUploading ? "Uploading..." : "Upload Photo"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium mb-2 block">
                Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your name"
              />
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title" className="text-sm font-medium mb-2 block">
                Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter your title or role"
              />
            </div>

            {/* LinkedIn */}
            <div>
              <Label htmlFor="linkedinUrl" className="text-sm font-medium mb-2 block">
                LinkedIn Profile URL (Optional)
              </Label>
              <Input
                id="linkedinUrl"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                placeholder="https://linkedin.com/in/your-profile"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};