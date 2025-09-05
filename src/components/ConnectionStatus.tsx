import { AlertCircle, CheckCircle, Loader2, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  reconnectAttempts?: number;
  className?: string;
}

export const ConnectionStatus = ({ status, reconnectAttempts = 0, className }: ConnectionStatusProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: <CheckCircle className="w-3 h-3" />,
          text: 'Live',
          variant: 'default' as const,
        };
      case 'connecting':
        return {
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
          text: reconnectAttempts > 0 ? `Reconnecting... (${reconnectAttempts})` : 'Connecting...',
          variant: 'secondary' as const,
        };
      case 'disconnected':
        return {
          icon: <WifiOff className="w-3 h-3" />,
          text: 'Disconnected',
          variant: 'outline' as const,
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          text: 'Connection Error',
          variant: 'destructive' as const,
        };
      default:
        return {
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
          text: 'Connecting...',
          variant: 'secondary' as const,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant={config.variant} className={`gap-1 text-xs ${className}`}>
      {config.icon}
      {config.text}
    </Badge>
  );
};