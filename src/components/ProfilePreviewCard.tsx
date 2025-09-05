import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfilePreviewCardProps {
  name?: string;
  title?: string;
  avatarUrl?: string;
  linkedinUrl?: string;
  className?: string;
}

export const ProfilePreviewCard = ({
  name = "Your Name",
  title = "Your Title",
  avatarUrl,
  linkedinUrl,
  className
}: ProfilePreviewCardProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={cn("w-full max-w-sm mx-auto", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <Avatar className="h-12 w-12 flex-shrink-0">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {name ? getInitials(name) : "YN"}
            </AvatarFallback>
          </Avatar>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {title}
            </p>
          </div>

          {/* LinkedIn Icon */}
          {linkedinUrl && (
            <button
              onClick={() => window.open(linkedinUrl, '_blank')}
              className="flex-shrink-0 p-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              aria-label="Open LinkedIn profile"
            >
              <Linkedin className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};