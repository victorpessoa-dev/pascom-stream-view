import { NextResponse } from "next/server";
import { NO_STORE_HEADERS } from "@/lib/utils/http";
import { createSupabaseServerClient } from "@/services/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("get_public_churches");
    if (error) throw error;
    return NextResponse.json(
      { churches: data || [] },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao listar igrejas",
      },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
