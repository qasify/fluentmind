"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface AudioPlayerProps {
  src: string;
  durationOverride?: number;
}

export default function AudioPlayer({ src, durationOverride = 0 }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const volumePopoverRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationOverride);
  const [volume, setVolume] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

  // Close volume popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (volumePopoverRef.current && !volumePopoverRef.current.contains(e.target as Node)) {
        setShowVolume(false);
      }
    };
    if (showVolume) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showVolume]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (!audioRef.current || isDragging) return;
    const cur = audioRef.current.currentTime;
    const dur = duration || audioRef.current.duration || 1;
    setCurrentTime(cur);
    setProgress((cur / dur) * 100);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const d = audioRef.current.duration;
      if (d && d !== Infinity && !isNaN(d)) {
        setDuration(d);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(100);
    setCurrentTime(duration);
  };

  const seekFromEvent = (e: React.MouseEvent<HTMLDivElement> | MouseEvent) => {
    if (!trackRef.current || !audioRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const pct = (x / rect.width) * 100;
    const newTime = (pct / 100) * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(pct);
  };

  const handleTrackMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    seekFromEvent(e);

    const onMouseMove = (ev: MouseEvent) => seekFromEvent(ev);
    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const VolumeIcon = () => {
    if (volume === 0) return (
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
    );
    if (volume < 0.5) return (
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z" /></svg>
    );
    return (
      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
    );
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full bg-[#0d0d14] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 shadow-lg relative overflow-visible">
      {/* Ambient glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/8 rounded-full blur-[50px] pointer-events-none" />

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div className="flex items-center gap-4 relative z-10">
        {/* Play / Pause */}
        <button
          onClick={togglePlay}
          className="w-12 h-12 shrink-0 bg-gradient-primary rounded-full flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-105 hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] active:scale-95 transition-all"
        >
          {isPlaying ? (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Track area */}
        <div className="flex-1 flex flex-col gap-1">
          {/* Timestamps + Volume toggle */}
          <div className="flex items-center text-[11px] text-[#6b6b80] font-mono tracking-wider font-medium select-none">
            <span>{formatTime(currentTime)}</span>
            {/* Volume button + floating popover */}
            <div className="relative ml-2" ref={volumePopoverRef}>
              <button
                onClick={() => setShowVolume(!showVolume)}
                className={`p-1 rounded-md transition-all duration-200 ${showVolume ? "text-primary-400 bg-primary-500/10" : "text-[#4a4a5a] hover:text-[#a0a0b5]"}`}
              >
                <VolumeIcon />
              </button>

              {/* Vertical volume slider — floats above */}
              {showVolume && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="bg-[#12121a] border border-[rgba(255,255,255,0.08)] rounded-2xl p-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-sm flex flex-col items-center gap-3 relative">
                    {/* Gradient glow behind slider */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-primary-500/5 to-transparent pointer-events-none" />

                    {/* Vertical slider */}
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-1.5 h-28 appearance-none bg-[rgba(255,255,255,0.06)] rounded-full cursor-pointer relative z-10
                        [writing-mode:vertical-lr] [direction:rtl]
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(6,182,212,0.6)]
                        [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary-400
                        [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                    />

                    {/* Volume percentage */}
                    {/* <span className="text-[9px] text-[#6b6b80] font-mono font-bold tracking-widest relative z-10">
                      {Math.round(volume * 100)}%
                    </span> */}
                  </div>

                  {/* Arrow pointer */}
                  <div className="w-2.5 h-2.5 bg-[#12121a] border-r border-b border-[rgba(255,255,255,0.08)] rotate-45 absolute -bottom-[5px] left-1/2 -translate-x-1/2" />
                </div>
              )}
            </div>
            <span className="flex-1" />
            <span>{formatTime(duration)}</span>
          </div>

          {/* Progress track — fixed height wrapper prevents layout shift */}
          <div
            ref={trackRef}
            onMouseDown={handleTrackMouseDown}
            className="relative w-full h-5 flex items-center cursor-pointer group"
          >
            {/* Visual bar (centered within fixed hit area) */}
            <div className="w-full h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full group-hover:h-2.5 transition-all duration-150 relative overflow-visible">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-primary rounded-full pointer-events-none transition-[width] duration-75"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Scrub head */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_6px_rgba(6,182,212,0.5)] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
