"use client";

import Image from "next/image";
import { useState, ChangeEvent } from "react";

type Props = {
  currentAvatarUrl?: string | null;
};

export function AvatarUploader({ currentAvatarUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl ?? null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-3 text-sm text-[var(--color-text-heading)] sm:col-span-2">
      <span className="font-medium">Profile picture</span>
      <div className="flex flex-wrap items-start gap-4">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-100 focus-within:ring-2 focus-within:ring-brand-primary/30">
          <input
            type="file"
            name="avatarFile"
            accept="image/*"
            className="sr-only"
            onChange={handleChange}
          />
          <span>Select image</span>
        </label>
        <div className="flex flex-col gap-2">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-neutral-100 text-xs text-neutral-500">
            {preview ? (
              <Image
                src={preview}
                alt="Avatar preview"
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>No photo</span>
            )}
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">Upload a square JPG or PNG under 2 MB.</p>
        </div>
      </div>
    </div>
  );
}
