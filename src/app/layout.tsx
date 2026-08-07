import { Metadata } from "next";
import { Inter } from "next/font/google";
import "react-date-range/dist/styles.css"; // main style file
import "react-date-range/dist/theme/default.css"; // theme css f
import AppProvider from "./providers/app-provider";

export const metadata: Metadata = {
  title: "Task System",
  description: "Task Management System",
};
const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} w-full antialiased`}>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
