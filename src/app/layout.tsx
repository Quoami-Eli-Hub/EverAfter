import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"EverAfter — Meaningful event pages",description:"Create a beautiful, shareable page for a wedding or memorial."};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}
