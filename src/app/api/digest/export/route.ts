import { getLatestDigest } from "@/lib/repositories";
import { isAuthenticated } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!await isAuthenticated()) return new Response("Unauthorized", { status: 401 });
  const digest = await getLatestDigest();
  if (!digest) return new Response("No digest has been generated yet.", { status: 404 });

  return new Response(digest.content, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="nereid-scout-digest-${digest.createdAt.toISOString().slice(0, 10)}.md"`,
      "Content-Type": "text/markdown; charset=utf-8"
    }
  });
}
