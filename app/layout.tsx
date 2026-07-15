import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pacientes Javi",
  description: "Panel local y privado para el seguimiento resumido de pacientes.",
  icons: {
    icon: "/app-icon.svg",
  },
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
