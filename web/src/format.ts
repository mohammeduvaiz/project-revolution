export const formatDuration = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;

export const lessonNumber = (index: number): string => String(index + 1).padStart(2, "0");
