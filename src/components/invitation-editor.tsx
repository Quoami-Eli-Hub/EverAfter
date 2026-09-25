"use client";

import { useActionState, useState } from "react";
import { InvitationCover } from "./invitation-cover";
import { invitationSettings, type InvitationSettings } from "@/lib/invitation";
import { saveInvitationCover } from "@/app/dashboard/invitation-actions";

export function InvitationEditor({ initial, names, date, palette, font, eventId, canEdit, theme="classic", memorial=false }: { initial: unknown; names: string; date: string; palette: string; font: string; eventId: number; canEdit: boolean; theme?:string; memorial?:boolean }) {
  const [settings, setSettings] = useState(() => invitationSettings(memorial?{message:"Join family and friends as we honour a cherished life and share memories together.",...(initial&&typeof initial==="object"?initial:{})}:initial));
  const [size, setSize] = useState("desktop");
  const [replay, setReplay] = useState(0);
  const [result, action, pending] = useActionState(saveInvitationCover, { ok: false, message: "" });
  function update<K extends keyof InvitationSettings>(key: K, value: InvitationSettings[K]) { setSettings(previous => ({ ...previous, [key]: value })); }
  return <section className="panel invitation-studio"><p className="eyebrow">The first impression</p><h2>Invitation cover</h2><p>Welcome guests with a personal invitation that opens to reveal your event page. Saving applies this cover to your current page.</p>
    <div className="invitation-studio-grid"><form action={action} className="manage-form">
      <input type="hidden" name="eventId" value={eventId}/>
      <fieldset disabled={!canEdit || pending} style={{ border: 0, padding: 0, display: "grid", gap: 16 }}>
        <p>Every event opens with this invitation before guests enter the page.</p>
        <label>Invitation title<input name="names" maxLength={120} value={settings.names} placeholder={names} onChange={e => update("names", e.target.value)}/></label>
        <label>Date label<input name="date" maxLength={100} value={settings.date} placeholder={date} onChange={e => update("date", e.target.value)}/></label>
        <small>Leave names and date blank to follow your event details.</small>
        <label>Invitation message<textarea name="message" maxLength={240} value={settings.message} onChange={e => update("message", e.target.value)}/></label>
        <label>Button label<input name="button" required maxLength={40} value={settings.button} onChange={e => update("button", e.target.value)}/></label>
        <label>Emblem<select name="emblem" value={settings.emblem} onChange={e => update("emblem", e.target.value as InvitationSettings["emblem"])}><option value="initials">Initials</option><option value="flower">Sunburst flower</option><option value="none">No emblem</option></select></label>
        <button className="button button-dark">{pending ? "Saving…" : "Save invitation cover"}</button>
      </fieldset>
      {!canEdit && <p>Only the owner and planners can change the invitation.</p>}
      <p role="status">{result.message}</p>
    </form><div><div className="invitation-preview-tools"><button type="button" aria-pressed={size === "desktop"} onClick={() => setSize("desktop")}>Desktop</button><button type="button" aria-pressed={size === "mobile"} onClick={() => setSize("mobile")}>Mobile</button><button type="button" onClick={() => setReplay(x => x + 1)}>Replay opening</button></div>
      <div className={`invitation-preview-frame ${size} theme-${theme} palette-${palette} font-${font}`}><InvitationCover memorial={memorial} key={replay} settings={settings} names={names} date={date} preview/></div>
      <p><small>Preview uses your saved palette and typography. Save to apply your invitation changes.</small></p>
    </div></div>
  </section>;
}
