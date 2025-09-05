import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface OnlineUser {
  user_id: string;
  name: string;
  online_at: string;
}

interface SessionPresenceProps {
  memberCount: number;
  onlineUsers: OnlineUser[];
  onlineCount: number;
}

export const SessionPresence = ({ memberCount, onlineUsers, onlineCount }: SessionPresenceProps) => {
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-4">
      {/* Live counts */}
      <div className="flex items-center gap-4">
        <Badge variant="secondary" className="gap-2">
          <Users className="w-3 h-3" />
          {memberCount} joined
        </Badge>
        
        <Badge variant="outline" className="gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          {onlineCount} online
        </Badge>
      </div>

      {/* Online users avatars */}
      {onlineUsers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Currently online:</p>
          <div className="flex flex-wrap gap-2">
            {onlineUsers.slice(0, 8).map((user) => (
              <div key={user.user_id} className="flex items-center gap-2">
                <Avatar className="w-6 h-6 border border-border">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {user.name}
                </span>
              </div>
            ))}
            {onlineUsers.length > 8 && (
              <Badge variant="outline" className="text-xs">
                +{onlineUsers.length - 8} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};