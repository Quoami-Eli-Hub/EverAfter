"use client";

import {useState} from "react";

type Venue={id:number;name:string;address:string|null;directions:string|null;map_url:string|null};
export function VenueGuide({venues}:{venues:Venue[]}){
  const [selected,setSelected]=useState(venues[0]?.id);
  const venue=venues.find(item=>item.id===selected)??venues[0];
  if(!venue)return null;
  return <section className="romance-venues" aria-label="Event locations"><p className="event-kicker">WE WILL MEET YOU HERE</p><h2>Find your way</h2><div className="venue-options" aria-label="Choose a venue">{venues.map(item=><button type="button" key={item.id} aria-pressed={item.id===venue.id} onClick={()=>setSelected(item.id)}>{item.name}</button>)}</div><iframe key={venue.id} title={`Map to ${venue.name}`} loading="lazy" referrerPolicy="no-referrer" src={`https://www.google.com/maps?q=${encodeURIComponent([venue.name,venue.address].filter(Boolean).join(", "))}&output=embed`}/><h3>{venue.name}</h3><p>{venue.address}</p>{venue.directions&&<p>{venue.directions}</p>}<a href={venue.map_url||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([venue.name,venue.address].filter(Boolean).join(", "))}`} target="_blank" rel="noreferrer">Get directions ↗</a></section>;
}
