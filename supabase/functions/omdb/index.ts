import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OMDB_API_KEY = "6a599c65";
const OMDB_BASE_URL = "http://www.omdbapi.com/";

interface OMDbSearchParams {
  s?: string;
  i?: string;
  t?: string;
  y?: string;
  type?: string;
  page?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const searchParams: OMDbSearchParams = {};

    if (url.searchParams.has("s")) {
      searchParams.s = url.searchParams.get("s") || undefined;
    }
    if (url.searchParams.has("i")) {
      searchParams.i = url.searchParams.get("i") || undefined;
    }
    if (url.searchParams.has("t")) {
      searchParams.t = url.searchParams.get("t") || undefined;
    }
    if (url.searchParams.has("y")) {
      searchParams.y = url.searchParams.get("y") || undefined;
    }
    if (url.searchParams.has("type")) {
      searchParams.type = url.searchParams.get("type") || undefined;
    }
    if (url.searchParams.has("page")) {
      searchParams.page = url.searchParams.get("page") || undefined;
    }

    const omdbUrl = new URL(OMDB_BASE_URL);
    omdbUrl.searchParams.set("apikey", OMDB_API_KEY);

    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) {
        omdbUrl.searchParams.set(key, value);
      }
    });

    const response = await fetch(omdbUrl.toString());
    const data = await response.json();

    if (data.Response === "False") {
      return new Response(
        JSON.stringify({ error: data.Error || "OMDb API error" }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
