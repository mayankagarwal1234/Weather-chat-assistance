"use client";
import { useEffect, useState } from "react";

export default function MessageTime({ date }: { date: Date }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    // Render only after hydration
    setTime(date.toLocaleTimeString());
  }, [date]);

  if (!time) return null; // avoid SSR mismatch

  return (
    <div className="text-[10px] opacity-60 mt-1 text-right hidden text-gray-600 dark:text-blue-200">
      {time}
    </div>
  );
}
