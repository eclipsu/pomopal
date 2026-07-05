import Image from "next/image";

export const POMOPAL_ICON = "/favicon_io/android-chrome-512x512.png";

export default function PomopalIcon({ size = 24, className = "" }) {
  return (
    <Image
      src={POMOPAL_ICON}
      alt=""
      width={size}
      height={size}
      className={className}
      aria-hidden
    />
  );
}
