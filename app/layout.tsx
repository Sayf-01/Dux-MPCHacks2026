import './globals.css';

export const metadata = {
  title: 'Dux Travel Backend',
  description: 'Backend API for the travel planner itinerary service'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}