import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tierlistrr — crée tes tier lists",
  description:
    "Crée, visualise et range n'importe quelle tier list (fromages, sauces piquantes, cocktails…) en glissant les éléments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}
      </body>
    </html>
  );
}
