import { useEffect, useRef, useState } from "react";
import building from "@/assets/building-wide.jpg";
import { BuildingCracks } from "@/components/BuildingCracks";
import { CRACK_START_ORDER } from "@/lib/building-cracks";
import { BuildingValueCounter } from "@/components/BuildingValueCounter";

const W = 760; // two building sections side by side (two entrances)
const H = 570;
const IMG_H = 623; // displayed image height: building (H) + lawn strip below

// Neon sign overlay box (component px): image band x108-348,y976-1021 erased,
// text re-rendered as SVG scaled 760/1536 (x) and 623/1264 (y) from image coords.
const SIGN = { x: 56.5, y: 483.5, w: 108, h: 19 };
// Centre band (x541-708, y997-1016) reads ЭКСПЕРТИЗА КВАРТИР; the right band
// (x1258-1446) reads АУДИТ ЖИЛЫХ ОБЪЕКТОВ. Both re-rendered as wave overlays.
const SIGN2 = { x: 622.6, y: 491.4, w: 92.8, h: 9.5 };
const SIGN3 = { x: 267.7, y: 491.4, w: 82.6, h: 9.5 };
// Former THE DAILY BEAN band (image x826-1026, y984-1023), now two lines.
const SIGN4 = { x: 408.7, y: 485.5, w: 98.9, h: 19 };

export function HeroBuilding() {
  const ref = useRef<HTMLDivElement>(null);
  const [sc, setSc] = useState(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setSc(Math.max(el.clientWidth / W, el.clientHeight / IMG_H));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      <div className="absolute" style={{ left: "50%", bottom: 0, width: W, height: IMG_H, transform: `translateX(-50%) scale(${sc})`, transformOrigin: "bottom center" }}>
      <div className="relative" style={{ width: W, height: IMG_H }}>
      <div className="absolute inset-0">
        {/* Original facade with an SVG crack overlay drawn on the piers. */}
        <img src={building} alt="" width={W} height={IMG_H} draggable={false}
          className="absolute left-0 top-0 block max-w-none select-none" style={{ width: W, height: IMG_H }} />
        <BuildingCracks key={CRACK_START_ORDER.join("-")} onTimeChange={setElapsedSeconds} />

        {/* Sign under the shade: light wave sweeps white -> yellow -> blue every 10s. */}
        <a href="#dir-docs" className="sign-frame pointer-events-auto absolute z-10" style={{ left: SIGN.x - 7, top: SIGN.y - 5 }}>
        <svg className="pointer-events-none select-none" style={{ overflow: "visible" }}
          width={SIGN.w} height={SIGN.h} viewBox={`0 0 ${SIGN.w} ${SIGN.h}`}>
          <defs>
            <linearGradient id="signWaveA" gradientUnits="userSpaceOnUse" x1="-108" y1="0" x2="216" y2="0">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.167" stopColor="#ffe600" />
              <stop offset="0.333" stopColor="#6ec1ff" />
              <stop offset="0.5" stopColor="#ffffff" />
              <stop offset="0.667" stopColor="#ffe600" />
              <stop offset="0.833" stopColor="#6ec1ff" />
              <stop offset="1" stopColor="#ffffff" />
              <animateTransform attributeName="gradientTransform" type="translate" values="0 0; -108 0" dur="10s" repeatCount="indefinite" calcMode="linear" />
            </linearGradient>
          </defs>
          <text className="sign-neon" fill="url(#signWaveA)" x="54.9" y="8.8" textAnchor="middle" textLength="64" lengthAdjust="spacingAndGlyphs">ВЕРИФИКАЦИЯ</text>
          <text className="sign-neon" fill="url(#signWaveA)" x="54.1" y="17.2" textAnchor="middle" textLength="107" lengthAdjust="spacingAndGlyphs">СТРОИТЕЛЬНОЙ ДОКУМЕНТАЦИИ</text>
        </svg>
        </a>

        <a href="#dir-flats" className="sign-frame pointer-events-auto absolute z-10" style={{ left: SIGN3.x - 7, top: SIGN3.y - 5 }}>
        <svg className="pointer-events-none select-none" style={{ overflow: "visible" }}
          width={SIGN3.w} height={SIGN3.h} viewBox={`0 0 ${SIGN3.w} ${SIGN3.h}`}>
          <defs>
            <linearGradient id="signWaveE" gradientUnits="userSpaceOnUse" x1="-108" y1="0" x2="216" y2="0">
              <stop offset="0" stopColor="#2036c8" />
              <stop offset="0.167" stopColor="#39d98a" />
              <stop offset="0.333" stopColor="#ff5050" />
              <stop offset="0.5" stopColor="#2036c8" />
              <stop offset="0.667" stopColor="#39d98a" />
              <stop offset="0.833" stopColor="#ff5050" />
              <stop offset="1" stopColor="#2036c8" />
              <animateTransform attributeName="gradientTransform" type="translate" values="0 0; -108 0" dur="10s" repeatCount="indefinite" calcMode="linear" />
            </linearGradient>
          </defs>
          <text className="sign-neon" fill="url(#signWaveE)" x={SIGN3.w / 2} y="7" textAnchor="middle" textLength="78" lengthAdjust="spacingAndGlyphs" style={{ fontSize: 6.2 }}>ЭКСПЕРТИЗА КВАРТИР</text>
        </svg>
        </a>

        <a href="#dir-houses" className="sign-frame pointer-events-auto absolute z-10" style={{ left: SIGN2.x - 7, top: SIGN2.y - 5 }}>
        <svg className="pointer-events-none select-none" style={{ overflow: "visible" }}
          width={SIGN2.w} height={SIGN2.h} viewBox={`0 0 ${SIGN2.w} ${SIGN2.h}`}>
          <defs>
            <linearGradient id="signWaveC" gradientUnits="userSpaceOnUse" x1="-108" y1="0" x2="216" y2="0">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.167" stopColor="#ffe600" />
              <stop offset="0.333" stopColor="#6ec1ff" />
              <stop offset="0.5" stopColor="#ffffff" />
              <stop offset="0.667" stopColor="#ffe600" />
              <stop offset="0.833" stopColor="#6ec1ff" />
              <stop offset="1" stopColor="#ffffff" />
              <animateTransform attributeName="gradientTransform" type="translate" values="0 0; -108 0" dur="10s" repeatCount="indefinite" calcMode="linear" />
            </linearGradient>
          </defs>
          <text className="sign-neon" fill="url(#signWaveC)" x={SIGN2.w / 2} y="7" textAnchor="middle" textLength="88" lengthAdjust="spacingAndGlyphs" style={{ fontSize: 6.2 }}>АУДИТ ЖИЛЫХ ОБЪЕКТОВ</text>
        </svg>
        </a>

        <a href="#dir-commercial" className="sign-frame pointer-events-auto absolute z-10" style={{ left: SIGN4.x - 7, top: SIGN4.y - 5 }}>
        <svg className="pointer-events-none select-none" style={{ overflow: "visible" }}
          width={SIGN4.w} height={SIGN4.h} viewBox={`0 0 ${SIGN4.w} ${SIGN4.h}`}>
          <defs>
            <linearGradient id="signWaveG" gradientUnits="userSpaceOnUse" x1="-108" y1="0" x2="216" y2="0">
              <stop offset="0" stopColor="#3d8bff" />
              <stop offset="0.167" stopColor="#ff5050" />
              <stop offset="0.333" stopColor="#39d98a" />
              <stop offset="0.5" stopColor="#3d8bff" />
              <stop offset="0.667" stopColor="#ff5050" />
              <stop offset="0.833" stopColor="#39d98a" />
              <stop offset="1" stopColor="#3d8bff" />
              <animateTransform attributeName="gradientTransform" type="translate" values="0 0; -108 0" dur="10s" repeatCount="indefinite" calcMode="linear" />
            </linearGradient>
          </defs>
          <text className="sign-neon" fill="url(#signWaveG)" x={SIGN4.w / 2} y="8.8" textAnchor="middle" textLength="94" lengthAdjust="spacingAndGlyphs">ИНСПЕКЦИЯ ВСТРОЕННЫХ</text>
          <text className="sign-neon" fill="url(#signWaveG)" x={SIGN4.w / 2} y="17.2" textAnchor="middle" textLength="94" lengthAdjust="spacingAndGlyphs">КОММЕРЧЕСКИХ ПОМЕЩЕНИЙ</text>
        </svg>
        </a>

      </div>
      </div>
      </div>
      {/* Text-legibility shade sits above the base sign copies; the bright copies below keep the signs vivid. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      <div className="pointer-events-none absolute" style={{ left: "50%", bottom: 0, width: W, height: IMG_H, transform: `translateX(-50%) scale(${sc})`, transformOrigin: "bottom center" }}>
        {/* Extra sign copy above the shade adds ~20% brightness, same wave. */}
        <svg className="pointer-events-none absolute select-none" style={{ left: SIGN.x, top: SIGN.y, overflow: "visible", opacity: 0.2 }}
          width={SIGN.w} height={SIGN.h} viewBox={`0 0 ${SIGN.w} ${SIGN.h}`}>
          <defs>
            <linearGradient id="signWaveB" gradientUnits="userSpaceOnUse" x1="-108" y1="0" x2="216" y2="0">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.167" stopColor="#ffe600" />
              <stop offset="0.333" stopColor="#6ec1ff" />
              <stop offset="0.5" stopColor="#ffffff" />
              <stop offset="0.667" stopColor="#ffe600" />
              <stop offset="0.833" stopColor="#6ec1ff" />
              <stop offset="1" stopColor="#ffffff" />
              <animateTransform attributeName="gradientTransform" type="translate" values="0 0; -108 0" dur="10s" repeatCount="indefinite" calcMode="linear" />
            </linearGradient>
          </defs>
          <text className="sign-neon" fill="url(#signWaveB)" x="54.9" y="8.8" textAnchor="middle" textLength="64" lengthAdjust="spacingAndGlyphs">ВЕРИФИКАЦИЯ</text>
          <text className="sign-neon" fill="url(#signWaveB)" x="54.1" y="17.2" textAnchor="middle" textLength="107" lengthAdjust="spacingAndGlyphs">СТРОИТЕЛЬНОЙ ДОКУМЕНТАЦИИ</text>
        </svg>
        <svg className="pointer-events-none absolute select-none" style={{ left: SIGN3.x, top: SIGN3.y, overflow: "visible", opacity: 0.2 }}
          width={SIGN3.w} height={SIGN3.h} viewBox={`0 0 ${SIGN3.w} ${SIGN3.h}`}>
          <defs>
            <linearGradient id="signWaveF" gradientUnits="userSpaceOnUse" x1="-108" y1="0" x2="216" y2="0">
              <stop offset="0" stopColor="#2036c8" />
              <stop offset="0.167" stopColor="#39d98a" />
              <stop offset="0.333" stopColor="#ff5050" />
              <stop offset="0.5" stopColor="#2036c8" />
              <stop offset="0.667" stopColor="#39d98a" />
              <stop offset="0.833" stopColor="#ff5050" />
              <stop offset="1" stopColor="#2036c8" />
              <animateTransform attributeName="gradientTransform" type="translate" values="0 0; -108 0" dur="10s" repeatCount="indefinite" calcMode="linear" />
            </linearGradient>
          </defs>
          <text className="sign-neon" fill="url(#signWaveF)" x={SIGN3.w / 2} y="7" textAnchor="middle" textLength="78" lengthAdjust="spacingAndGlyphs" style={{ fontSize: 6.2 }}>ЭКСПЕРТИЗА КВАРТИР</text>
        </svg>
        <svg className="pointer-events-none absolute select-none" style={{ left: SIGN2.x, top: SIGN2.y, overflow: "visible", opacity: 0.2 }}
          width={SIGN2.w} height={SIGN2.h} viewBox={`0 0 ${SIGN2.w} ${SIGN2.h}`}>
          <defs>
            <linearGradient id="signWaveD" gradientUnits="userSpaceOnUse" x1="-108" y1="0" x2="216" y2="0">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.167" stopColor="#ffe600" />
              <stop offset="0.333" stopColor="#6ec1ff" />
              <stop offset="0.5" stopColor="#ffffff" />
              <stop offset="0.667" stopColor="#ffe600" />
              <stop offset="0.833" stopColor="#6ec1ff" />
              <stop offset="1" stopColor="#ffffff" />
              <animateTransform attributeName="gradientTransform" type="translate" values="0 0; -108 0" dur="10s" repeatCount="indefinite" calcMode="linear" />
            </linearGradient>
          </defs>
          <text className="sign-neon" fill="url(#signWaveD)" x={SIGN2.w / 2} y="7" textAnchor="middle" textLength="88" lengthAdjust="spacingAndGlyphs" style={{ fontSize: 6.2 }}>АУДИТ ЖИЛЫХ ОБЪЕКТОВ</text>
        </svg>
        <svg className="pointer-events-none absolute select-none" style={{ left: SIGN4.x, top: SIGN4.y, overflow: "visible", opacity: 0.2 }}
          width={SIGN4.w} height={SIGN4.h} viewBox={`0 0 ${SIGN4.w} ${SIGN4.h}`}>
          <defs>
            <linearGradient id="signWaveH" gradientUnits="userSpaceOnUse" x1="-108" y1="0" x2="216" y2="0">
              <stop offset="0" stopColor="#3d8bff" />
              <stop offset="0.167" stopColor="#ff5050" />
              <stop offset="0.333" stopColor="#39d98a" />
              <stop offset="0.5" stopColor="#3d8bff" />
              <stop offset="0.667" stopColor="#ff5050" />
              <stop offset="0.833" stopColor="#39d98a" />
              <stop offset="1" stopColor="#3d8bff" />
              <animateTransform attributeName="gradientTransform" type="translate" values="0 0; -108 0" dur="10s" repeatCount="indefinite" calcMode="linear" />
            </linearGradient>
          </defs>
          <text className="sign-neon" fill="url(#signWaveH)" x={SIGN4.w / 2} y="8.8" textAnchor="middle" textLength="94" lengthAdjust="spacingAndGlyphs">ИНСПЕКЦИЯ ВСТРОЕННЫХ</text>
          <text className="sign-neon" fill="url(#signWaveH)" x={SIGN4.w / 2} y="17.2" textAnchor="middle" textLength="94" lengthAdjust="spacingAndGlyphs">КОММЕРЧЕСКИХ ПОМЕЩЕНИЙ</text>
        </svg>
      </div>
      <BuildingValueCounter elapsedSeconds={elapsedSeconds} />
    </div>
  );
}
