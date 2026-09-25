import {EventPage} from "@/components/public-event-page";
export const metadata={title:"Romance · Premium wedding template · EverAfter",robots:{index:false,follow:false}};
export default async function RomanceDemo(){return EventPage({params:Promise.resolve({slug:"gil-harry"}),searchParams:Promise.resolve({}),demo:true});}
