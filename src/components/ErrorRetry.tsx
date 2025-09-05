import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Wifi } from 'lucide-react';

interface ErrorRetryProps {
  error: string;
  onRetry: () => void;
  retryLabel?: string;
  type?: 'network' | 'upload' | 'general';
  className?: string;
}

const ErrorRetry = ({ 
  error, 
  onRetry, 
  retryLabel = 'Try Again', 
  type = 'general',
  className = '' 
}: ErrorRetryProps) => {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'network':
        return <Wifi className="h-4 w-4" />;
      case 'upload':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getErrorMessage = () => {
    switch (type) {
      case 'network':
        return 'Network connection failed. Please check your internet connection and try again.';
      case 'upload':
        return 'Upload failed. Please check your file and try again.';
      default:
        return error;
    }
  };

  return (
    <Alert variant="destructive" className={className}>
      {getIcon()}
      <AlertDescription className="flex items-center justify-between">
        <span>{getErrorMessage()}</span>
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleRetry}
          disabled={retrying}
          className="ml-2 shrink-0 border-destructive/20 hover:bg-destructive/10"
        >
          {retrying ? (
            <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3 mr-1" />
          )}
          {retryLabel}
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default ErrorRetry;