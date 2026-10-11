"use client";

import {useState} from "react";
import Image, {type ImageProps} from "next/image";

/** Remote album art and YouTube avatars can disappear after they are saved. */
export default function ResilientImage({src, alt, onError, ...props}: ImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const source = typeof src === "string" ? src : "src" in src ? src.src : src.default.src;
  if (failedSource === source) {
    return <span role="img" aria-label={alt || "Image unavailable"}
      className={`${props.fill ? "absolute inset-0" : "inline-flex"} items-center justify-center bg-surface-raised text-2xl text-accent ${props.className ?? ""}`}
      style={{...props.style, ...(!props.fill ? {width: props.width, height: props.height} : {})}}>♫</span>;
  }

  // Avoid repeated server-side optimizer 404s for externally hosted YouTube avatars.
  const youtubeAvatar = /^https:\/\/yt3\.googleusercontent\.com\//i.test(source);
  return <Image {...props} src={src} alt={alt} unoptimized={props.unoptimized || youtubeAvatar}
    onError={event => {setFailedSource(source); onError?.(event);}} />;
}
