import Link from "next/link";
import {planCode,planExperience} from "@/lib/plans";
import "./plan-workflow.css";

export function PlanWorkflow({plan,paid}:{plan:string|null;paid:boolean}){
  const code=planCode(plan),experience=planExperience[code];
  return <section className={`plan-workflow workflow-${code}`} aria-label="Your plan guide"><p className="eyebrow">{paid?`${experience.name} · Your next steps`:"Free draft · Make it yours"}</p><h2>{experience.tagline}</h2><p>{experience.description}</p><ol>{experience.steps.map(step=><li key={step.title}><Link href={step.href}><strong>{step.title}</strong><span>{step.detail}</span></Link></li>)}</ol>{!paid&&<Link className="button button-dark" href="/dashboard/billing">Choose a plan when you’re ready to publish →</Link>}</section>;
}
