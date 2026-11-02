import Image from "next/image";
import poster from "@/public/route-map.png";

// The vector original is public/route-map.svg (1.9 MB). Phones get the PNG
// through next/image, which serves resized WebP/AVIF.
export default function MapArt() {
  return (
    <div className="poster-frame">
      <Image
        src={poster}
        alt="Screen-print poster map: Chunderdome II, from San Francisco over the Golden Gate, north on 101 to Petaluma, and west to the dome at Dillon Beach"
        priority
        placeholder="blur"
        sizes="(max-width: 560px) 100vw, 560px"
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    </div>
  );
}
