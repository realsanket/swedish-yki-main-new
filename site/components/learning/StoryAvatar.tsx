import Image from "next/image";
import {
  storyCharacterForSpeaker,
} from "@/lib/story-world";

export function StoryAvatar({
  name,
  size = 48,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const character = storyCharacterForSpeaker(name);

  if (!character) {
    return (
      <span
        className={`story-avatar story-avatar-fallback ${className}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {name.trim().charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <span
      className={`story-avatar ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Image
        src={character.image}
        alt=""
        width={size * 2}
        height={size * 2}
        sizes={`${size}px`}
      />
    </span>
  );
}

export function StoryCast({
  names,
  label = "In this chapter",
  compact = false,
}: {
  names: readonly string[];
  label?: string;
  compact?: boolean;
}) {
  return (
    <div className={`story-cast ${compact ? "is-compact" : ""}`}>
      <div className="story-cast-faces" aria-hidden="true">
        {names.map((name) => (
          <StoryAvatar key={name} name={name} size={compact ? 34 : 42} />
        ))}
      </div>
      <span>
        <small>{label}</small>
        <b>{names.join(", ")}</b>
      </span>
    </div>
  );
}

/** A scene without verified artwork shows its actual cast, never another scene. */
export function StoryPortraits({ names }: { names: readonly string[] }) {
  return (
    <div className="story-portraits" role="img" aria-label={`Cast: ${names.join(", ") || "a Swedish conversation"}`}>
      {names.map((name) => <StoryAvatar key={name} name={name} size={48} />)}
    </div>
  );
}
