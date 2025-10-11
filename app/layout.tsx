// app/layout.tsx
import {Inter} from "next/font/google";
import "./globals.css";

const inter = Inter({subsets: ["latin"]});

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="scroll-smooth"> {/* Add scroll-smooth for anchor links */}
        <body className={inter.className}>
        {children}
        </body>
        </html>
    );
}