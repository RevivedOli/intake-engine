"use client";

interface AnnouncementBannerProps {
  message: string;
  backgroundColor: string;
  textColor: string;
}

export function AnnouncementBanner({
  message,
  backgroundColor,
  textColor,
}: AnnouncementBannerProps) {
  if (!message.trim()) return null;

  const bg = backgroundColor?.trim() || "#c41e3a";
  const fg = textColor?.trim() || "#ffffff";

  return (
    <div
      className="w-full py-2.5 px-4 text-center text-sm font-medium"
      style={{
        backgroundColor: bg,
        color: fg,
      }}
    >
      {message}
    </div>
  );
}
