import "./globals.css";
import localFont from "next/font/local";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

import { UserProvider } from "@/contexts/UserContext";
import { PresenceProvider } from "@/contexts/PresenceContext";
import { SoundPreferencesProvider } from "@/contexts/SoundPreferencesContext";
import QueryProvider from "@/providers/QueryProvider";
import { appBaseUrl } from "@/lib/seo";
config.autoAddCss = false;

const pomopalFont = localFont({
  src: "../../public/font.ttf",
  variable: "--font-pomopal",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(appBaseUrl()),
  title: "Pomopal",
  description:
    "PomoPal is a FREE pomodoro timer app that helps students focus on their work by breaking it into intervals and reminding them to take breaks.",
  manifest: "/favicon_io/site.webmanifest",
  openGraph: {
    siteName: "Pomopal",
    type: "website",
    images: ["/assets/tomato.png"],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${pomopalFont.className} ${pomopalFont.variable} min-h-dvh`}>
        <QueryProvider>
          <UserProvider>
            <SoundPreferencesProvider>
              <PresenceProvider>{children}</PresenceProvider>
            </SoundPreferencesProvider>
          </UserProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
