import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    console.log('Calendar sync requested for session:', sessionId);

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch session details with venue information
    const { data: session, error } = await supabaseClient
      .from('cowork_sessions')
      .select(`
        *,
        venues(name, address, latitude, longitude),
        profiles(display_name)
      `)
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      console.error('Error fetching session:', error);
      return new Response(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Session found:', session.title, 'at venue:', session.venues?.name);

    // Format dates for ICS
    const formatICSDate = (dateString: string) => {
      return new Date(dateString).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startTime = formatICSDate(session.start_time);
    const endTime = formatICSDate(session.end_time);
    const now = formatICSDate(new Date().toISOString());

    // Create ICS content
    const venueName = session.venues?.name || 'TBD';
    const venueAddress = session.venues?.address || '';
    const hostName = session.profiles?.display_name || 'Host';
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Ripl//Work Session//EN',
      'BEGIN:VEVENT',
      `UID:ripl-session-${sessionId}@ripl.app`,
      `DTSTAMP:${now}`,
      `DTSTART:${startTime}`,
      `DTEND:${endTime}`,
      `SUMMARY:${session.title}`,
      `DESCRIPTION:${session.description ? session.description + '\\n\\n' : ''}Hosted by ${hostName}\\n\\nJoin: https://ripl.app/sessions/${sessionId}`,
      `LOCATION:${venueName}${venueAddress ? ', ' + venueAddress : ''}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Work session starting in 15 minutes',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\\r\\n');

    // Generate Google Calendar URL
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(session.title)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(
      `${session.description ? session.description + '\n\n' : ''}Hosted by ${hostName}\n\nJoin: https://ripl.app/sessions/${sessionId}`
    )}&location=${encodeURIComponent(`${venueName}${venueAddress ? ', ' + venueAddress : ''}`)}`;

    console.log('Calendar sync completed successfully for:', session.title);
    
    return new Response(
      JSON.stringify({
        icsContent,
        googleCalendarUrl,
        session: {
          title: session.title,
          start_time: session.start_time,
          end_time: session.end_time,
          venue: venueName,
          address: venueAddress
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in calendar-sync function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});