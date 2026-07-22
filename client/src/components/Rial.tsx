import type { CSSProperties } from "react";

// Traced from the official Omani rial mark (ريال). Uses currentColor so it
// recolors cleanly for light/dark mode and any accent.
export function Rial({ size = "1em", style, className }: {
  size?: number | string;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 1920 1075"
      width={size}
      height="auto"
      role="img"
      aria-label="Omani rial"
      className={className}
      style={{ display: "inline-block", verticalAlign: "-0.12em", fill: "currentColor", height: size, width: "auto", ...style }}
    >
      <g transform="translate(0.000000,1075.000000) scale(0.100000,-0.100000)">
        <path d="M9710 10289 c-781 -47 -1429 -576 -2062 -1684 -465 -813 -758 -1695
-867 -2610 -30 -249 -41 -410 -48 -692 l-6 -253 -1961 -2 -1960 -3 -503 -900
-502 -900 2779 -3 2779 -2 481 -468 480 -467 -3522 -3 -3523 -2 -502 -913
c-277 -502 -503 -916 -503 -920 0 -4 3628 -6 8062 -5 l8063 3 507 915 507 915
-287 7 c-158 4 -1144 16 -2192 27 -1048 12 -1944 23 -1993 26 -327 19 -1420
349 -2062 622 -160 68 -236 106 -344 172 -46 28 -88 51 -93 51 -5 0 -8 19 -6
42 l3 43 465 -3 c256 -1 1940 -12 3743 -24 1970 -13 3281 -18 3286 -12 15 15
993 1776 999 1796 4 17 -173 18 -5255 18 l-5260 0 -115 128 c-436 485 -638
800 -725 1131 -32 122 -36 300 -9 401 65 241 246 439 546 598 853 450 1891
149 3110 -902 203 -175 532 -490 725 -694 99 -105 182 -189 186 -186 3 2 9 27
12 56 14 117 99 436 317 1193 317 1098 420 1514 437 1762 9 134 -4 162 -136
293 -204 203 -637 534 -1076 823 -207 136 -337 208 -554 305 -546 247 -991
347 -1421 321z" />
      </g>
    </svg>
  );
}
