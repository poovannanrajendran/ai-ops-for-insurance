import { geoGraticule10, geoNaturalEarth1, geoPath } from "d3-geo";
import countries110m from "world-atlas/countries-110m.json";
import { feature } from "topojson-client";

interface MapPoint {
  country: string;
  intensity: number;
  latitude: number;
  locationId: string;
  longitude: number;
  tiv: number;
}

const viewWidth = 960;
const viewHeight = 460;

type TopologyLike = {
  objects: {
    countries: unknown;
  };
};

const worldTopology = countries110m as unknown as TopologyLike;
const countries = feature(worldTopology as never, worldTopology.objects.countries as never) as unknown as { features: unknown[] };

const projection = geoNaturalEarth1().fitExtent(
  [
    [12, 12],
    [viewWidth - 12, viewHeight - 12]
  ],
  { type: "Sphere" }
);

const pathGenerator = geoPath(projection);
const sphere = { type: "Sphere" } as const;
const graticule = geoGraticule10();

function getAutoZoomTransform(points: MapPoint[]) {
  if (points.length === 0) {
    return { scale: 1, tx: 0, ty: 0 };
  }

  const projected = points
    .map((point) => projection([point.longitude, point.latitude]))
    .filter((coords): coords is [number, number] => Array.isArray(coords));

  if (projected.length === 0) {
    return { scale: 1, tx: 0, ty: 0 };
  }

  const xs = projected.map(([x]) => x);
  const ys = projected.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const spreadRatio = Math.max(spanX / viewWidth, spanY / viewHeight);

  // Subtle auto-zoom only: never zoom out, never exceed a mild cap.
  const targetRatio = 0.33;
  const minSpread = 0.18;
  const scale = Math.min(Math.max(targetRatio / Math.max(spreadRatio, minSpread), 1), 1.35);

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const tx = viewWidth / 2 - centerX * scale;
  const ty = viewHeight / 2 - centerY * scale;

  return { scale, tx, ty };
}

export function WorldExposureMap({ points }: { points: MapPoint[] }) {
  const transform = getAutoZoomTransform(points);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <svg className="h-[320px] w-full" preserveAspectRatio="xMidYMid meet" viewBox={`0 0 ${viewWidth} ${viewHeight}`}>
        <g transform={`translate(${transform.tx} ${transform.ty}) scale(${transform.scale})`}>
          <path d={pathGenerator(sphere) ?? ""} fill="#e0ecff" stroke="#bfdbfe" strokeWidth="1.2" />
          <path d={pathGenerator(graticule) ?? ""} fill="none" stroke="#c7d2fe" strokeOpacity="0.65" strokeWidth="0.8" />

          {countries.features.map((countryFeature: unknown, index: number) => (
            <path
              d={pathGenerator(countryFeature as never) ?? ""}
              fill="#cbd5e1"
              fillOpacity="0.82"
              key={`country-${index}`}
              stroke="#94a3b8"
              strokeWidth="0.5"
            />
          ))}

          {points.map((point) => {
            const coords = projection([point.longitude, point.latitude]);
            if (!coords) {
              return null;
            }

            const [x, y] = coords;
            const radius = 4 + point.intensity * 14;
            const fill = point.intensity >= 0.75 ? "#b45309" : point.intensity >= 0.45 ? "#f59e0b" : "#0d9488";

            return (
              <g key={point.locationId}>
                <circle cx={x} cy={y} fill={fill} fillOpacity="0.24" r={radius + 8} />
                <circle
                  cx={x}
                  cy={y}
                  fill={fill}
                  fillOpacity="0.72"
                  r={radius}
                  stroke="#0f172a"
                  strokeOpacity="0.35"
                  strokeWidth="1.1"
                >
                  <title>{`${point.locationId} | ${point.country} | TIV ${point.tiv.toLocaleString("en-GB")}`}</title>
                </circle>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
