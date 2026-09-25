export function GuestSpamField(){
  return <div aria-hidden="true" style={{position:"absolute",width:1,height:1,overflow:"hidden",clipPath:"inset(50%)"}}>
    <label>Leave this field empty<input name="website" type="text" tabIndex={-1} autoComplete="off"/></label>
  </div>;
}
