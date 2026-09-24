import { layoutShapes, SIZE_GUIDE } from './homeLayout';

const { pxPerInch, sofaInches, artBottom, viewW, viewH } = SIZE_GUIDE;

/**
 * Every print size we sell, drawn to one scale above an 84-inch sofa, so a
 * buyer can picture the real size on their wall.
 */
export function SizeGuide() {
  const shapes = layoutShapes();
  const sofaW = sofaInches * pxPerInch;
  const sofaX = (viewW - sofaW) / 2;
  const label = shapes.map((s) => `${s.label} (${s.price})`).join(', ');

  return (
    <figure className="rounded-xl bg-background p-5 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <figcaption className="font-display text-2xl text-foreground md:text-3xl">
          How big is it, really?
        </figcaption>
        <span className="text-sm text-muted-foreground">Every shape is drawn to the same scale</span>
      </div>
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        className="mt-5 w-full"
        role="img"
        aria-label={`Print sizes drawn to scale above an 84-inch sofa: ${label}`}
      >
        <g fontFamily="DM Sans, sans-serif" fontSize="15" textAnchor="middle">
          {shapes.map((s) => (
            <g key={s.label}>
              <rect
                x={s.x}
                y={s.y}
                width={s.w}
                height={s.h}
                fill="#2a2419"
                stroke={s.kind === 'poster' ? '#bdb7ad' : '#c9a959'}
                strokeWidth={2}
                strokeDasharray={s.kind === 'poster' ? '6 4' : undefined}
              />
              <text x={s.x + s.w / 2} y={artBottom + 22} fill="#d4cfc6">
                {s.label}
              </text>
              <text x={s.x + s.w / 2} y={artBottom + 40} fill="#8f897f">
                {s.price}
              </text>
            </g>
          ))}
        </g>
        <rect x={sofaX} y={300} width={sofaW} height={30} rx={10} fill="#4a453b" />
        <rect x={sofaX + 20} y={330} width={14} height={16} fill="#4a453b" />
        <rect x={sofaX + sofaW - 34} y={330} width={14} height={16} fill="#4a453b" />
        <text
          x={viewW / 2}
          y={355}
          fontFamily="DM Sans, sans-serif"
          fontSize="14"
          fill="#8f897f"
          textAnchor="middle"
        >
          84-inch sofa
        </text>
      </svg>
      {/* On phones and tablets the drawing's labels are too small to read,
          so repeat them as plain text. */}
      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-base lg:hidden">
        {shapes.map((s) => (
          <li key={s.label} className="flex justify-between border-b border-border pb-1">
            <span className="text-foreground">{s.label}</span>
            <span className="text-muted-foreground">{s.price}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
