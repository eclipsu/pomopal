import Link from "next/link";
import Footer from "@/components/Footer";
import BlogImage from "@/components/blog/BlogImage";
import PomopalIcon from "@/components/PomopalIcon";
import { getAllPosts } from "@/lib/posts";

// SSG — post list is filesystem MDX, no live DB data needed for HTML.
export const dynamic = "force-static";

export const metadata = {
  title: "Engineering Blog | Pomopal",
  description:
    "Engineering decisions, architecture notes, and user analytics behind Pomopal.",
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="relative flex min-h-dvh flex-col bg-gray-900 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{
          background:
            "radial-gradient(720px 360px at 18% -8%, rgba(59,130,246,0.14), transparent 55%)",
        }}
      />

      <header className="relative z-10 mx-auto w-11/12 max-w-3xl pt-8">
        <Link
          href="/"
          className="rounded-sm text-sm text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        >
          ← Back to Pomopal
        </Link>
      </header>

      <main className="relative z-10 mx-auto w-11/12 max-w-3xl flex-1 py-10">
        <section className="mb-14">
          <div className="flex items-center gap-2.5">
            <PomopalIcon size={22} className="shrink-0 opacity-90" />
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/45">
              Engineering
            </p>
          </div>
          <h1 className="mt-4 text-5xl font-bold tracking-tight sm:text-6xl">
            Blog
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-white/70">
            Architecture notes and shipping decisions — written for engineers who
            skim.
          </p>
        </section>

        <section>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-white/45">
            Latest
          </p>

          {posts.length === 0 ? (
            <div className="rounded-2xl border-2 border-white/10 border-b-4 border-b-white/20 bg-white/[0.03] px-6 py-10 text-center">
              <p className="leading-relaxed text-white/60">
                No posts yet. Check back soon.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {posts.map((post) => (
                <li key={post.slug}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block overflow-hidden rounded-2xl border-2 border-white/10 border-b-4 border-b-white/20 bg-white/[0.03] transition duration-200 hover:-translate-y-0.5 hover:border-blue-400/40 hover:border-b-blue-500/50 hover:bg-white/[0.05] hover:shadow-[0_18px_40px_-24px_rgba(59,130,246,0.55)] active:translate-y-0 active:border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                  >
                    {post.coverImage && (
                      <div className="relative aspect-[16/9] w-full border-b border-white/10 bg-white/[0.02]">
                        <BlogImage
                          src={post.coverImage}
                          alt={post.coverImageAlt || post.title}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-[1.02]"
                          sizes="(max-width: 768px) 92vw, 768px"
                        />
                      </div>
                    )}
                    <div className="flex items-stretch gap-3 px-5 py-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                          <h2 className="text-xl font-bold tracking-tight text-white transition-colors group-hover:text-blue-400 sm:text-2xl">
                            {post.title}
                          </h2>
                          {post.date && (
                            <time
                              dateTime={post.date}
                              className="shrink-0 text-sm text-white/45"
                            >
                              {formatDate(post.date)}
                            </time>
                          )}
                        </div>
                        {post.description && (
                          <p className="mt-2 text-base leading-relaxed text-white/60">
                            {post.description}
                          </p>
                        )}
                        {post.tags?.length > 0 && (
                          <ul className="mt-3 flex flex-wrap gap-2">
                            {post.tags.map((tag) => (
                              <li
                                key={tag}
                                className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/45"
                              >
                                {tag}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <span
                        aria-hidden
                        className="flex shrink-0 items-center self-center text-2xl font-semibold text-blue-400/50 transition duration-200 group-hover:translate-x-0.5 group-hover:text-blue-400"
                      >
                        →
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <Footer className="relative z-10 mt-auto" />
    </div>
  );
}
