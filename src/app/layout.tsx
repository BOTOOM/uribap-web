import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Uribap | Nuestro plan de comida",
  description: "Planifica comidas, inventario, compras y preparación en un solo hogar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
