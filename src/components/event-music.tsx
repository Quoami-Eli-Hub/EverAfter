"use client";

import {useRef, useState} from "react";

export function EventMusic({src}: {src:string}) {
  const audio=useRef<HTMLAudioElement>(null);
  const [playing,setPlaying]=useState(false);
  const [error,setError]=useState(false);
  async function toggle(){
    if(!audio.current)return;
    setError(false);
    if(!audio.current.paused){audio.current.pause();return;}
    try{await audio.current.play();}catch{setPlaying(false);setError(true);}
  }
  return <div className="event-music">
    <audio ref={audio} src={src} loop preload="none" onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onError={()=>{setPlaying(false);setError(true);}}/>
    <button type="button" onClick={toggle} aria-pressed={playing} aria-label={playing?"Pause music":"Play music"}><span aria-hidden="true">{playing?"Ⅱ":"♫"}</span>{playing?"Pause music":"Play music"}</button>
    {error&&<p role="status">Music couldn’t load. Try again or refresh the page.</p>}
  </div>;
}
