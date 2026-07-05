import Link from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy — Pomopal",
  description: "How Pomopal handles your data and privacy settings.",
};

export default function PrivacyPage() {
  return (
    <div className="flex h-dvh flex-col bg-gray-900 text-white">
      <header className="w-11/12 max-w-2xl mx-auto pt-8">
        <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">
          ← Back to Pomopal
        </Link>
      </header>

      <main className="flex-1 w-11/12 max-w-2xl mx-auto py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Privacy</h1>
          <p className="mt-3 text-white/70 leading-relaxed">
            Pomopal stores account information (name, email, profile photo from Google sign-in),
            focus session data, streaks, and optional social features like friends and leaderboard
            visibility. We will never sell your data to third parties and will never use your data to train AI models.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">What we collect</h2>
          <ul className="list-disc list-inside text-white/70 space-y-2 leading-relaxed">
            <li>Account details from Google OAuth (email, name, avatar)</li>
            <li>Pomodoro sessions, daily focus minutes, and streak history for analytics</li>
            <li>Notification preferences if you enable email or in-app alerts</li>
            <li>Privacy toggles for online status, stats, and leaderboard visibility</li>
            <li>Timezone for display of streak and analytics</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Your controls</h2>
          <p className="text-white/70 leading-relaxed">
            Signed-in users can manage visibility and notifications from the settings gear on the
            home page — privacy toggles and notification preferences live there.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-white">Contact</h2>
          <p className="text-white/70 leading-relaxed">
            Questions about your data? Reach us on the{" "}
            <Link href="/contact" className="text-white hover:underline">
              contact page
            </Link>
            .
          </p>
        </section>
      </main>

      <Footer className="mt-auto" />
    </div>
  );
}
