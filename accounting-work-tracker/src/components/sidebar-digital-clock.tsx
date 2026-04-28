"use client";

import { useEffect, useMemo, useState } from "react";

function getNow() {
  return new Date();
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function formatThaiBuddhistDate(date: Date) {
  const day = new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
  }).format(date);

  const month = new Intl.DateTimeFormat("th-TH", {
    month: "long",
  }).format(date);

  const buddhistYear = date.getFullYear() + 543;

  return `${day} ${month} ${buddhistYear}`;
}

export function SidebarDigitalClock() {
  const [now, setNow] = useState<Date>(getNow);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(getNow());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const time = useMemo(() => formatTime(now), [now]);
  const date = useMemo(() => formatThaiBuddhistDate(now), [now]);

  return (
    <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white shadow-[0_30px_70px_-35px_rgba(15,23,42,0.65)]">
      <div className="flex flex-col items-center justify-center text-center">
        <div className="font-mono text-[2.2rem] font-semibold leading-none tracking-[0.08em] text-white">
          {time}
        </div>
        <p className="mt-3 text-sm text-slate-300">{date}</p>
      </div>
    </div>
  );
}
