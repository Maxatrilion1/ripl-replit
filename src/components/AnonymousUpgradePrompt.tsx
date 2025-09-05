import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { useAnonymousRestrictions } from '@/hooks/useAnonymousRestrictions';
import { Crown, Zap, Users, MessageCircle, Eye } from 'lucide-react';

interface AnonymousUpgradePromptProps {
  feature: string;
  description: string;
  inline?: boolean;
  className?: string;
}

const AnonymousUpgradePrompt = ({ 
  feature, 
  description, 
  inline = false, 
  className = "" 
}: AnonymousUpgradePromptProps) => {
  const { isAnonymous } = useAnonymousRestrictions();
  const navigate = useNavigate();

  if (!isAnonymous) return null;

  if (inline) {
    return (
      <Alert className={`border-cowork-primary/20 bg-cowork-primary/5 ${className}`}>
        <Crown className="h-4 w-4 text-cowork-primary" />
        <AlertDescription className="flex items-center justify-between">
          <span className="text-sm">
            <strong>{feature}</strong> requires an account. {description}
          </span>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate('/auth')}
            className="ml-2 shrink-0"
          >
            Upgrade
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={`border-cowork-primary/20 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cowork-primary/20 flex items-center justify-center">
              <Crown className="w-4 h-4 text-cowork-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Unlock {feature}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-cowork-primary/10 text-cowork-primary">
            <Eye className="w-3 h-3 mr-1" />
            View Only
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Full Account Benefits:</h4>
          <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="w-3 h-3 text-cowork-primary" />
              <span>Join and participate in focus sprints</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-3 h-3 text-cowork-primary" />
              <span>Chat and react with other members</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-cowork-primary" />
              <span>Create your own cowork sessions</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-3 h-3 text-cowork-primary" />
              <span>Professional profile and networking</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            className="flex-1" 
            onClick={() => navigate('/auth?method=email')}
          >
            Create Account
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate('/auth')}
          >
            Sign In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnonymousUpgradePrompt;