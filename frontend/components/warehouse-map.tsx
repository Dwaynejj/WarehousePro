import { useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';

/** GET /api/bins - BinLocation. `aisle` is @JsonIgnore'd on the model. */
export type Bin = {
  id: number;
  code: string;
  x: number;
  y: number;
  sku: string | null;
};

/** GET /api/aisles - Aisle, with its bins nested. `zone` is @JsonIgnore'd. */
export type Aisle = {
  id: number;
  name: string;
  orientation: 'VERTICAL' | 'HORIZONTAL';
  position: number;
  startPos: number;
  endPos: number;
  bins: Bin[];
};

type WarehouseMapProps = {
  aisles: Aisle[];
  bins: Bin[];
  /** Route order from the optimizer, start bin first. Empty = layout-only view. */
  routeCodes?: string[];
  /** Bin codes already picked — drawn green. */
  pickedCodes?: string[];
  /** Current target bin (pulsing orange ring). */
  currentCode?: string | null;
  /** Warehouse floor size, same units as bin x/y. */
  floor?: { width: number; height: number };
  /** Compact height for embedding in dense screens. */
  compact?: boolean;
};

const EDGE_PADDING = 28;
const AISLE_PAD = 14;
const MIN_HEIGHT = 220;
const MAX_HEIGHT = 480;

const START_FILL = '#0f172a';
const PICKED_FILL = '#10b981';
const CURRENT_FILL = '#f97316';
const ROUTE_FILL = '#fb923c';
const IDLE_FILL = '#cbd5e1';

function extent(values: number[]) {
  return { min: Math.min(...values), max: Math.max(...values) };
}

/**
 * Top-down warehouse floor plan.
 * Idle bins are grey; route stops are orange; picked bins (and their aisle tint) turn green.
 */
export function WarehouseMap({
  aisles,
  bins,
  routeCodes = [],
  pickedCodes,
  currentCode,
  floor,
  compact,
}: WarehouseMapProps) {
  const [width, setWidth] = useState(0);

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  if (bins.length === 0 && !floor) {
    return (
      <View className="card items-center border-dashed p-8">
        <Text className="text-sm text-slate-500">No bin locations configured yet.</Text>
      </View>
    );
  }

  const binXs = bins.map((bin) => bin.x);
  const binYs = bins.map((bin) => bin.y);
  const xs = floor
    ? { min: Math.min(0, ...binXs), max: Math.max(floor.width, ...binXs) }
    : extent(binXs.length ? binXs : [0]);
  const ys = floor
    ? { min: Math.min(0, ...binYs), max: Math.max(floor.height, ...binYs) }
    : extent(binYs.length ? binYs : [0]);
  const spanX = xs.max - xs.min || 1;
  const spanY = ys.max - ys.min || 1;

  const maxH = compact ? 320 : MAX_HEIGHT;
  const minH = compact ? 180 : MIN_HEIGHT;
  const height = Math.min(maxH, Math.max(minH, width * (spanY / spanX)));

  const usableW = Math.max(1, width - EDGE_PADDING * 2);
  const usableH = Math.max(1, height - EDGE_PADDING * 2);
  const scale = Math.min(usableW / spanX, usableH / spanY);
  const offsetX = EDGE_PADDING + (usableW - spanX * scale) / 2;
  const offsetY = EDGE_PADDING + (usableH - spanY * scale) / 2;

  const px = (x: number) => offsetX + (x - xs.min) * scale;
  const py = (y: number) => offsetY + (ys.max - y) * scale;
  const clampX = (value: number) => Math.min(Math.max(value, 1), Math.max(1, width - 1));
  const clampY = (value: number) => Math.min(Math.max(value, 1), Math.max(1, height - 1));

  const binByCode = new Map(bins.map((bin) => [bin.code, bin]));
  const routeSet = new Set(routeCodes);
  const picked = new Set(pickedCodes ?? []);
  const stops = routeCodes
    .map((code) => binByCode.get(code))
    .filter((bin): bin is Bin => Boolean(bin));

  function fillFor(bin: Bin, isStart: boolean): string {
    if (isStart) return START_FILL;
    if (picked.has(bin.code)) return PICKED_FILL;
    if (currentCode && bin.code === currentCode) return CURRENT_FILL;
    if (routeSet.has(bin.code)) return ROUTE_FILL;
    return IDLE_FILL;
  }

  return (
    <View
      onLayout={handleLayout}
      className="card overflow-hidden border-dashed">
      {width > 0 ? (
        <Svg width={width} height={height}>
          {floor ? (
            <Rect
              x={px(0)}
              y={py(floor.height)}
              width={floor.width * scale}
              height={floor.height * scale}
              rx={8}
              fill="#f8fafc"
              stroke="#cbd5e1"
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
          ) : null}

          {aisles.map((aisle) => {
            if (aisle.bins.length === 0) return null;
            const ax = extent(aisle.bins.map((bin) => bin.x));
            const ay = extent(aisle.bins.map((bin) => bin.y));
            const left = clampX(px(ax.min) - AISLE_PAD);
            const right = clampX(px(ax.max) + AISLE_PAD);
            const top = clampY(py(ay.max) - AISLE_PAD);
            const bottom = clampY(py(ay.min) + AISLE_PAD);
            const aislePicked = aisle.bins.some((bin) => picked.has(bin.code));
            const aisleOnRoute = aisle.bins.some((bin) => routeSet.has(bin.code));

            return (
              <G key={aisle.id}>
                <Rect
                  x={left}
                  y={top}
                  width={Math.max(1, right - left)}
                  height={Math.max(1, bottom - top)}
                  rx={12}
                  fill={aislePicked ? '#d1fae5' : aisleOnRoute ? '#ffedd5' : '#f1f5f9'}
                  stroke={aislePicked ? '#6ee7b7' : '#e2e8f0'}
                  strokeWidth={1.5}
                />
                <SvgText
                  x={(px(ax.min) + px(ax.max)) / 2}
                  y={Math.max(12, top - 6)}
                  fontSize={11}
                  fontWeight="700"
                  fill={aislePicked ? '#059669' : '#64748b'}
                  textAnchor="middle">
                  {aisle.name}
                </SvgText>
                {/* Shelf slots as rounded markers along the aisle */}
                {aisle.bins.map((bin) => (
                  <Rect
                    key={`slot-${bin.id}`}
                    x={px(bin.x) - 7}
                    y={py(bin.y) - 7}
                    width={14}
                    height={14}
                    rx={3}
                    fill={fillFor(bin, false)}
                    opacity={routeSet.has(bin.code) || picked.has(bin.code) ? 1 : 0.55}
                  />
                ))}
              </G>
            );
          })}

          {stops.slice(1).map((stop, index) => (
            <Line
              key={`leg-${index}`}
              x1={px(stops[index].x)}
              y1={py(stops[index].y)}
              x2={px(stop.x)}
              y2={py(stop.y)}
              stroke={picked.has(stop.code) ? '#34d399' : '#fb923c'}
              strokeWidth={2}
              strokeDasharray="5 4"
            />
          ))}

          {bins.map((bin) => {
            const isStart = routeCodes[0] === bin.code || bin.code.startsWith('PACK');
            const onRoute = routeSet.has(bin.code);
            const isCurrent = currentCode === bin.code;
            const r = isStart || onRoute || isCurrent ? 12 : 5;
            return (
              <G key={bin.id}>
                {isCurrent ? (
                  <Circle
                    cx={px(bin.x)}
                    cy={py(bin.y)}
                    r={r + 5}
                    fill="none"
                    stroke="#fdba74"
                    strokeWidth={2}
                  />
                ) : null}
                <Circle
                  cx={px(bin.x)}
                  cy={py(bin.y)}
                  r={r}
                  fill={fillFor(bin, isStart && onRoute)}
                />
                {(onRoute || isStart) && (
                  <SvgText
                    x={px(bin.x)}
                    y={py(bin.y) + 3.5}
                    fontSize={9}
                    fontWeight="700"
                    fill="#ffffff"
                    textAnchor="middle">
                    {isStart && onRoute
                      ? 'S'
                      : picked.has(bin.code)
                        ? '✓'
                        : String(Math.max(0, routeCodes.indexOf(bin.code)))}
                  </SvgText>
                )}
              </G>
            );
          })}
        </Svg>
      ) : (
        <View style={{ height: minH }} />
      )}

      <View className="flex-row flex-wrap gap-3 border-t border-slate-100 px-3 py-2">
        <Legend color={IDLE_FILL} label="Shelf" />
        <Legend color={ROUTE_FILL} label="On route" />
        <Legend color={CURRENT_FILL} label="Current" />
        <Legend color={PICKED_FILL} label="Picked" />
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center">
      <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <Text className="ml-1.5 text-[10px] font-medium text-slate-500">{label}</Text>
    </View>
  );
}
