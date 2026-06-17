// Shared inline icon set (stroke = currentColor) used by the HUD and the landing page.
// Hand-rolled 24x24 paths so we don't pull in an icon dependency.

const ICONS = {
  wheel: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M12 14.6V21M9.7 11 4.3 8M14.3 11l5.4-3" />
    </>
  ),
  flame: (
    <path d="M12 3c2.8 3.6 4.5 5.9 4.5 8.6a4.5 4.5 0 0 1-9 0c0-1.3.5-2.5 1.4-3.5.6.8 1.3 1.2 2 1.2C9.5 7.6 10.4 5.7 12 3Z" />
  ),
  camera: (
    <>
      <path d="M4 8h2.3l1.3-2h8.8l1.3 2H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="12.8" r="3" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6.5-5.8 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 15.2 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.4" />
    </>
  ),
  ruler: (
    <>
      <rect x="3" y="8.5" width="18" height="7" rx="1" />
      <path d="M7 8.5v2.6M11 8.5v3.4M15 8.5v2.6M19 8.5v3.4" />
    </>
  ),
  wave: <path d="M2.5 15c2 0 2.3-6 4.7-6s2.8 6 4.8 6 2.4-6 4.7-6" />,
  mountain: <path d="M3 19 9 8l3.2 5.2L15.5 8 21 19Z" />,
  bolt: <path d="M13 2 5.5 13H11l-1 9 8.5-12H12Z" />,
  arrow: <path d="M4 12h15M13 6l6 6-6 6" />,
  gauge: (
    <>
      <path d="M4 18a8 8 0 0 1 16 0" />
      <path d="M12 18l4.5-6.5" />
      <circle cx="12" cy="18" r="1.1" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 20h6M12 13v3" />
    </>
  ),
  map: (
    <>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="6" r="2.2" />
      <circle cx="18" cy="18" r="2.2" />
      <path d="M8.2 6H14a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h5.8" />
    </>
  ),
  sparkle: <path d="M12 3l1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />,
  locate: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  layers: (
    <>
      <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
      <path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  logout: <path d="M10 17l5-5-5-5M15 12H3M21 4v16" />,
};

export default function Icon({ name, size = 16, className = "", strokeWidth = 1.8 }) {
  return (
    <svg
      className={`hud-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}
