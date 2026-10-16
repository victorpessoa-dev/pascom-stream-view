import { NextResponse } from "next/server";
import { z } from "zod";
import { inviteAdministrator } from "@/lib/services/provisioning";
import { createSupabaseAdminClient } from "@/services/supabase/admin";

const inviteSchema = z.object({ email: z.string().trim().email().max(320) });

export async function POST(request) {
  const configuredKey = process.env.PROVISIONING_API_KEY;
  const providedKey = request.headers.get("x-provisioning-key");
  if (!configuredKey || !providedKey || providedKey !== configuredKey) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = inviteSchema.parse(await request.json());
    const administrator = await inviteAdministrator({
      adminClient: createSupabaseAdminClient(),
      email: body.email,
      // Use the current public origin so the invitation never falls back to
      // Supabase's site URL (which may be the marketing landing page).
      redirectTo: new URL(
        "/confirmar-convite",
        request.nextUrl.origin,
      ).toString(),
    });
    return NextResponse.json({ administrator }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar o convite",
      },
      { status: 400 },
    );
  }
}
