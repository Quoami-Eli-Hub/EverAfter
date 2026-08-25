"use client";

import {useState} from "react";

type EventType="wedding"|"memorial";
const templateCopy={
  wedding:{classic:["Classic","Timeless, graceful and ceremony-led"],garden:["Garden","Soft, organic and photography-forward"],editorial:["Editorial","Bold, modern and magazine-inspired"],cinematic:["Cinematic","Immersive, dramatic and image-led"],minimalist:["Minimal","Quiet luxury with generous space"]},
  memorial:{classic:["Legacy","Dignified, timeless and family-centred"],garden:["Serene","Gentle, natural and reflective"],editorial:["Tribute journal","Modern, editorial and story-led"],cinematic:["Remembrance film","Immersive, emotional and image-led"],minimalist:["Stillness","Restrained, peaceful and contemplative"]}
} as const;
const palettes={
  rose:["Rose","Warm blush and cocoa"],
  sage:["Sage","Botanical and understated"],
  champagne:["Champagne","Soft gold and warm ivory"],
  terracotta:["Terracotta","Earthy clay and cream"],
  plum:["Plum","Rich berry and lilac"],
  midnight:["Midnight","Deep navy and antique gold"]
} as const;
const fonts={editorial:["Editorial serif","Elegant and expressive"],modern:["Modern sans","Clean and direct"],romantic:["Romantic serif","Warm and personal"]} as const;

export function AppearancePicker({eventType,initialTheme,initialColor,initialFont,premium}:{eventType:EventType;initialTheme:string;initialColor:string;initialFont:string;premium:boolean}){
  const[theme,setTheme]=useState(initialTheme);
  const[color,setColor]=useState(initialColor);
  const[font,setFont]=useState(initialFont);
  return <section className={`appearance-builder preview-theme-${theme} preview-palette-${color} preview-font-${font}`}>
    <div className="appearance-heading"><div><p className="eyebrow">V2 appearance studio</p><h2>Choose how your story feels</h2><p>Templates change the composition—not your content. Switch at any time without losing details, guests or photographs.</p></div><div className="appearance-live"><small>Live style preview</small><div className="mini-page"><i/><div><span>{eventType==="wedding"?"SAVE THE DATE":"IN LOVING MEMORY"}</span><b>{eventType==="wedding"?"Ama & Kojo":"Remembering Kofi"}</b><em/></div></div></div></div>
    <fieldset><legend>Template</legend><div className="template-options">{Object.entries(templateCopy[eventType]).map(([key,value])=>{const locked=["cinematic","minimalist"].includes(key)&&!premium;return <label className={`template-option${locked?" locked-template":""}`} key={key}><input type="radio" name="theme" value={key} checked={theme===key} disabled={locked} onChange={()=>setTheme(key)}/><span className={`template-thumb thumb-${key}`}><i/><i/><i/></span><b>{value[0]}</b><small>{value[1]}</small><em>{locked?"Premium":theme===key?"Selected":"Choose"}</em></label>})}</div></fieldset>
    <div className="appearance-controls"><fieldset><legend>Colour palette</legend><p className="control-help">Each palette coordinates backgrounds, text, buttons and accents automatically for reliable contrast.</p><div className="palette-options">{Object.entries(palettes).map(([key,value])=><label key={key}><input type="radio" name="color" value={key} checked={color===key} onChange={()=>setColor(key)}/><span className={`palette-dot palette-dot-${key}`}/><span><b>{value[0]}</b><small>{value[1]}</small></span></label>)}</div></fieldset><fieldset><legend>Typography</legend><div className="font-options">{Object.entries(fonts).map(([key,value])=><label className={`font-option font-sample-${key}`} key={key}><input type="radio" name="font" value={key} checked={font===key} onChange={()=>setFont(key)}/><span><b>{value[0]}</b><small>{value[1]}</small></span></label>)}</div></fieldset></div>
  </section>;
}
