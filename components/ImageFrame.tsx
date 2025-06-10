import Image from "next/image";

export function ImageFrame({ src, alt, aspectRatio, maxHeight }: { src: string, alt: string, aspectRatio: string, maxHeight?: number }) {
  return (
    <div
      className="relative rounded shadow bg-white flex items-center justify-center overflow-hidden"
      style={{
        width: '220px',
        maxWidth: '100%',
        aspectRatio,
        maxHeight: maxHeight ? `${maxHeight}px` : undefined,
      }}
    >
      <Image src={src} alt={alt} fill sizes="220px" className="object-contain rounded !static" priority />
    </div>
  );
}
