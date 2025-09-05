import { useAuth } from '@/hooks/useAuth';

// Analytics events for tracking user journey
export const ANALYTICS_EVENTS = {
  INVITE_PREVIEW_VIEWED: 'invite_preview_viewed',
  JOIN_PATH_CHOSEN: 'join_path_chosen',
  MAGIC_LINK_SENT: 'magic_link_sent',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  VENUE_CREATION_ATTEMPTED: 'venue_creation_attempted',
  VENUE_CREATION_COMPLETED: 'venue_creation_completed',
} as const;

type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];

interface AnalyticsProperties {
  invite_code?: string;
  join_method?: 'linkedin' | 'email' | 'guest';
  step_number?: number;
  step_name?: string;
  error_message?: string;
  venue_id?: string;
  user_type?: 'anonymous' | 'authenticated' | 'new_user';
  session_id?: string;
  email?: string;
  name?: string;
  has_title?: boolean;
  has_photo?: boolean;
}

export const useAnalytics = () => {
  const { user } = useAuth();

  const track = (event: AnalyticsEvent, properties: AnalyticsProperties = {}) => {
    try {
      // Enhanced logging with user context
      const eventData = {
        event,
        properties: {
          ...properties,
          user_id: user?.id || null,
          user_anonymous: user?.user_metadata?.is_anonymous || false,
          timestamp: new Date().toISOString(),
          session_timestamp: Date.now()
        }
      };

      // Log to console for debugging (in production, this would go to analytics service)
      console.log('📊 ANALYTICS:', JSON.stringify(eventData, null, 2));

      // In a real app, you'd send this to your analytics service:
      // analytics.track(event, eventData.properties);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  };

  return { track };
};