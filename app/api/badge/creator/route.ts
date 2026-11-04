import { getAuthorStats } from "@/lib/stats";
import { renderCreatorCard } from "@/lib/creator-card";
import { imageDataUri } from "@/lib/images";
import { errorBadge } from "@/lib/svg";
import { AUTHOR_CONFIG } from "@/lib/projects.config";

export const dynamic = "force-dynamic";

function svgResponse(body: string, cacheSeconds: number) {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": `public, max-age=0, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
    },
  });
}

function formatMonth(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

// Creator card: a slim footer for mod READMEs with lifetime downloads across
// Modrinth and CurseForge, config-driven (see lib/projects.config.ts).
export async function GET() {
  try {
    const stats = await getAuthorStats();

    const avatarDataUri = await imageDataUri(`https://github.com/${AUTHOR_CONFIG.githubUser}.png?size=120`, {
      width: 120,
      height: 120,
      format: "png",
    });

    const svg = renderCreatorCard({
      name: AUTHOR_CONFIG.displayName,
      subtitle: `${stats.projectCount} projects · since ${formatMonth(stats.memberSince)}`,
      accent: AUTHOR_CONFIG.accent,
      avatarDataUri,
      totalDownloads: stats.totalDownloads,
      modrinthDownloads: stats.modrinthDownloads,
      curseforgeDownloads: stats.curseforgeDownloads,
      seed: AUTHOR_CONFIG.modrinthUser,
    });

    return svgResponse(svg, 3600);
  } catch {
    return svgResponse(errorBadge("unavailable"), 60);
  }
}
