// app/layout.tsx
import './globals.css'; // Ensure you have global styles imported

export const metadata = {
  title: 'VoxAi SQL',
  description: 'A platform for voice-to-SQL translation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children} {/* Render the child components here */}
      </body>
    </html>
  );
}
