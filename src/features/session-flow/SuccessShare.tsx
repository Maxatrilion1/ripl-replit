import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, CheckCircle, Share2 } from 'lucide-react';
import { useSessionFlowStore } from './store';
import { toast } from '@/hooks/use-toast';

export const SuccessShare = () => {
  const navigate = useNavigate();
  const { title, slug, sessionId, reset } = useSessionFlowStore();
  const [copied, setCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/invite/${slug}`;

  useEffect(() => {
    if (!sessionId || !slug) {
      navigate('/create-session/cafe');
    }
  }, [sessionId, slug, navigate]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link with others to invite them to your session."
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please copy the link manually.",
        variant: "destructive"
      });
    }
  };

  const handleViewSession = () => {
    if (sessionId) {
      reset(); // Clear the flow state
      navigate(`/sessions/${sessionId}`);
    }
  };

  const handleCreateAnother = () => {
    reset();
    navigate('/create-session/cafe');
  };

  const handleGoHome = () => {
    reset();
    navigate('/');
  };

  if (!sessionId || !slug) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="shadow-lg border-0 bg-card/95 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">
              Session Created!
            </CardTitle>
            <p className="text-muted-foreground">
              Your coworking session is ready. Share the link to invite others.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Session Info */}
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">{title}</h3>
              <Badge variant="secondary">Public Session</Badge>
            </div>

            {/* Share Link */}
            <div className="space-y-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2">Share Link</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background p-2 rounded border text-muted-foreground break-all">
                    {shareUrl}
                  </code>
                </div>
              </div>

              <Button
                onClick={handleCopyLink}
                className="w-full h-12 gap-2"
                variant={copied ? "secondary" : "default"}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Invite Link
                  </>
                )}
              </Button>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={handleViewSession}
                variant="outline"
                className="w-full h-12 gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Go to Session
              </Button>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateAnother}
                  variant="ghost"
                  className="flex-1 h-10"
                >
                  Create Another
                </Button>
                <Button
                  onClick={handleGoHome}
                  variant="ghost"
                  className="flex-1 h-10"
                >
                  Go Home
                </Button>
              </div>
            </div>

            {/* Share tip */}
            <div className="text-center p-3 bg-primary/5 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Share2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Pro Tip</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link on social media, Slack, or text to invite others to your coworking session
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};