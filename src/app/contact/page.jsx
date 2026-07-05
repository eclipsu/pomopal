import Link from "next/link";
import Footer, { CONTACT_EMAIL } from "@/components/Footer";

export const metadata = {
  title: "Contact — Pomopal",
  description: "Get in touch with the Pomopal team.",
};

export default function ContactPage() {
  return (
    <div className="flex h-dvh flex-col bg-gray-900 text-white">
      <header className="w-11/12 max-w-2xl mx-auto pt-8">
        <Link href="/" className="text-sm text-white/60 hover:text-white transition-colors">
          ← Back to Pomopal
        </Link>
      </header>

      <main className="flex-1 w-11/12 max-w-2xl mx-auto py-16 flex flex-col items-center justify-center text-center">
        <h1 className="text-3xl font-bold mb-4">Contact</h1>
        <p className="text-white/70 mb-8 max-w-md leading-relaxed">
          Bug reports, feature ideas, or partnership — send us an email.
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/90 hover:bg-red-500 text-white font-medium transition-colors"
        >
          {CONTACT_EMAIL}
        </a>
      </main>

      <Footer className="mt-auto" />
    </div>
  );
}
