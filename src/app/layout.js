import "./globals.css";
import { Inter } from "next/font/google";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

import { UserProvider } from "@/contexts/UserContext";
config.autoAddCss = false;
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Pomopal",
  description:
    "PomoPal is a FREE pomodoro timer app that helps students focus on their work by breaking it into intervals and reminding them to take breaks.",
  openGraph: {
    images: ["/assets/tomato.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <UserProvider>
        <body className={inter.className}>{children}</body>
      </UserProvider>
    </html>
  );
}
