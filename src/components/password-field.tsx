"use client";

import {useId,useState} from "react";
import "./password-field.css";

export function PasswordField({label,name,autoComplete,minLength}:{label:string;name:string;autoComplete:"current-password"|"new-password";minLength?:number}){
  const id=useId();
  const [visible,setVisible]=useState(false);
  return <div className="password-field">
    <label htmlFor={id}>{label}</label>
    <div className="password-field-control">
      <input id={id} name={name} type={visible?"text":"password"} autoComplete={autoComplete} minLength={minLength} required autoCapitalize="none" spellCheck={false}/>
      <button type="button" aria-controls={id} aria-label={`${visible?"Hide":"Show"} ${label.toLowerCase()}`} onClick={()=>setVisible(value=>!value)}>{visible?"Hide":"Show"}</button>
    </div>
  </div>;
}
