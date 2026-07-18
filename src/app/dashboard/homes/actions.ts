"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const publicationSchema = z.object({
  homeId: z.string().uuid(),
  state: z.enum(["draft", "published", "paused", "archived"]),
});

export async function setHomePublication(formData: FormData) {
  const parsed = publicationSchema.safeParse({
    homeId: formData.get("homeId"),
    state: formData.get("state"),
  });
  if (!parsed.success) return;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) return;
  await supabase
    .from("homes")
    .update({ publication_state: parsed.data.state })
    .eq("id", parsed.data.homeId)
    .eq("owner_member_id", data.claims.sub);
  revalidatePath("/dashboard/homes");
  revalidatePath("/");
  revalidatePath("/search");
}
