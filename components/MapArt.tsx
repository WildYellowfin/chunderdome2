import Image from "next/image";
import poster from "@/public/route-map.png";

// The vector original is public/route-map.svg (2.6 MB). Phones get the PNG
// through next/image, which serves resized WebP/AVIF.
export default function MapArt() {
  return (
    <div className="poster-frame">
      <Image
        src={poster}
        alt="Screen-print poster map: Chunderdome II, from San Francisco across the Golden Gate Bridge, north on 101 and west through Tomales to the dome at Dillon Beach, where a model rocket is launching at sunset"
        priority
        placeholder="blur"
        sizes="(max-width: 560px) 100vw, 560px"
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    </div>
  );
}
