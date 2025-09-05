import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlaceSearchRequest {
  query: string;
  location?: {
    lat: number;
    lng: number;
  };
  radius?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Search Places Function Start ===');
    
    const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");
    console.log('API Key present:', Boolean(GOOGLE_PLACES_API_KEY));
    console.log('API Key first 10 chars:', GOOGLE_PLACES_API_KEY?.substring(0, 10) || 'NONE');
    
    if (!GOOGLE_PLACES_API_KEY) {
      console.error('Google Places API key not found in environment');
      return new Response(JSON.stringify({ 
        error: "Google Places API key not configured",
        debug: "Environment variable GOOGLE_PLACES_API_KEY is missing"
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query, location, radius = 2000 }: PlaceSearchRequest = await req.json();
    console.log('Search request:', { query, hasLocation: Boolean(location), radius });

    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}`;
    
    if (location) {
      url += `&location=${location.lat},${location.lng}&radius=${radius}`;
    }

    console.log('Making Google Places API request...');
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Google API response not ok:', response.status, response.statusText);
      throw new Error(`Google API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Google API response status:', data.status);
    console.log('Google API results count:', data.results?.length || 0);

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error('Google Places API error:', data.status, data.error_message);
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    const places = (data.results || []).map((place: any) => ({
      place_id: place.place_id,
      name: place.name,
      address: place.formatted_address,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      photo_url: place.photos?.[0] ? 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}` 
        : null,
      rating: place.rating,
      types: place.types
    }));

    console.log('Returning', places.length, 'places');
    
    return new Response(JSON.stringify({ 
      places,
      debug: {
        status: data.status,
        resultsCount: places.length
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('=== Search Places Error ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      debug: {
        type: error.constructor.name,
        timestamp: new Date().toISOString()
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});