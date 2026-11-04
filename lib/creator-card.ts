import { BOLD_CHAR, FONT, REG_CHAR, esc, estWidth, fitText, formatCard } from "./card";
import { cornerSquares, renderCornerSquares } from "./decor";
import { CURSEFORGE_COLOR, CURSEFORGE_ICON_PATH, MODRINTH_COLOR, MODRINTH_ICON_PATH } from "./icons";

export interface CreatorCardOptions {
  name: string;
  subtitle: string;
  accent: string;
  avatarDataUri?: string;
  totalDownloads: number;
  modrinthDownloads: number;
  curseforgeDownloads: number;
  seed: string;
}

// Same width as the profile card, but a single slim row: it closes off a
// mod's README, so it has to read as a footer rather than a headline.
const W = 840;
const H = 116;
const PAD = 28;
const AV = 60;
const BAR_H = 5;
// Layout stays at W×H; the SVG just declares double that size. Mod page
// descriptions go through image proxies that rasterize at the declared size,
// so this is what keeps them sharp. Every host scales it down to fit.
const SCALE = 2;

export function renderCreatorCard(opts: CreatorCardOptions): string {
  const value = formatCard(opts.totalDownloads);
  const label = `${opts.name}: ${value} lifetime downloads`;
  const midY = (H - BAR_H) / 2;
  const avY = midY - AV / 2;
  const avCx = PAD + AV / 2;

  const avatar = opts.avatarDataUri
    ? `<clipPath id="cr-av-clip"><circle cx="${avCx}" cy="${midY}" r="${AV / 2}"/></clipPath>
<image href="${opts.avatarDataUri}" x="${PAD}" y="${avY}" width="${AV}" height="${AV}" clip-path="url(#cr-av-clip)"/>
<circle cx="${avCx}" cy="${midY}" r="${AV / 2 + 1.5}" fill="none" stroke="${opts.accent}" stroke-width="2"/>`
    : `<circle cx="${avCx}" cy="${midY}" r="${AV / 2}" fill="${opts.accent}" fill-opacity="0.18"/>
<text x="${avCx}" y="${midY + 8}" text-anchor="middle" font-family="${FONT}" font-size="22" font-weight="800" fill="${opts.accent}">${esc(opts.name.charAt(0))}</text>`;

  // Right to left: the total, a divider, then one column per platform.
  let numSize = 38;
  while (estWidth(value, numSize, BOLD_CHAR) > 170 && numSize > 26) numSize -= 2;
  const totalW = Math.max(estWidth(value, numSize, BOLD_CHAR), estWidth("lifetime downloads", 12, REG_CHAR));
  const dividerX = W - PAD - totalW - 24;

  const stat = (right: number, path: string, color: string, n: number, name: string) => {
    const num = formatCard(n);
    const w = 26 + Math.max(estWidth(num, 18, BOLD_CHAR), estWidth(name, 12, REG_CHAR));
    const x = right - w;
    return {
      svg: `<svg x="${x}" y="${midY - 11}" width="18" height="18" viewBox="0 0 24 24"><path fill="${color}" d="${path}"/></svg>
<text x="${x + 26}" y="${midY + 3}" font-family="${FONT}" font-size="18" font-weight="700" fill="${color}">${num}</text>
<text x="${x + 26}" y="${midY + 21}" font-family="${FONT}" font-size="12" fill="#7d8590">${name}</text>`,
      left: x,
    };
  };
  const cf = stat(dividerX - 24, CURSEFORGE_ICON_PATH, CURSEFORGE_COLOR, opts.curseforgeDownloads, "CurseForge");
  const mr = stat(cf.left - 24, MODRINTH_ICON_PATH, MODRINTH_COLOR, opts.modrinthDownloads, "Modrinth");

  const textX = PAD + AV + 16;
  const textMax = mr.left - 16 - textX;
  const name = fitText(opts.name, textMax, [22, 19, 16], BOLD_CHAR);
  const subtitle = fitText(opts.subtitle, textMax, [12, 11], REG_CHAR);

  // Bottom edge doubles as the Modrinth/CurseForge split.
  const mrW = opts.totalDownloads ? (opts.modrinthDownloads / opts.totalDownloads) * W : 0;
  const barY = H - BAR_H;
  const split = [
    mrW >= 1 ? `<rect y="${barY}" width="${mrW.toFixed(1)}" height="${BAR_H}" fill="${MODRINTH_COLOR}"/>` : "",
    W - mrW >= 1 && opts.curseforgeDownloads ? `<rect x="${mrW.toFixed(1)}" y="${barY}" width="${(W - mrW).toFixed(1)}" height="${BAR_H}" fill="${CURSEFORGE_COLOR}"/>` : "",
  ].join("\n");

  const decor = renderCornerSquares(cornerSquares(opts.seed, W, H), opts.accent);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W * SCALE}" height="${H * SCALE}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
<title>${esc(label)}</title>
<defs>
<linearGradient id="crbg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#161b22"/>
<stop offset="1" stop-color="#0d1117"/>
</linearGradient>
<clipPath id="crcard-clip"><rect width="${W}" height="${H}" rx="16"/></clipPath>
</defs>
<g clip-path="url(#crcard-clip)">
<rect width="${W}" height="${H}" fill="url(#crbg)"/>
${decor}
${split}
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="15.5" fill="none" stroke="#3d444d"/>
</g>
${avatar}
<text x="${textX}" y="${midY - 19}" font-family="${FONT}" font-size="11" font-weight="700" letter-spacing="1.5" fill="${opts.accent}">CREATOR</text>
<text x="${textX}" y="${midY + 7}" font-family="${FONT}" font-size="${name.size}" font-weight="700" fill="#e6edf3">${esc(name.text)}</text>
<text x="${textX}" y="${midY + 26}" font-family="${FONT}" font-size="${subtitle.size}" fill="#7d8590">${esc(subtitle.text)}</text>
${mr.svg}
${cf.svg}
<line x1="${dividerX}" y1="${midY - 26}" x2="${dividerX}" y2="${midY + 26}" stroke="#3d444d"/>
<text x="${W - PAD}" y="${midY + 7}" text-anchor="end" font-family="${FONT}" font-size="${numSize}" font-weight="800" fill="${opts.accent}">${esc(value)}</text>
<text x="${W - PAD}" y="${midY + 26}" text-anchor="end" font-family="${FONT}" font-size="12" fill="#7d8590">lifetime downloads</text>
</svg>`;
}
