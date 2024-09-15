'use client'; // This makes the layout a Client Component

import './globals.css';
import { usePathname } from 'next/navigation';
import Navbar from './components/Navbar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Define paths that should NOT show the navbar (e.g., login, register)
  const noNavPaths = ['/login', '/register'];

  return (
    <html lang="en">
      <body>
        <div className="container mx-auto px-4">
          {/* Conditionally render the navbar based on the current route */}
          {!noNavPaths.includes(pathname) && <Navbar />}
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
