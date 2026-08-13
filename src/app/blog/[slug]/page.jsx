import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import BlogImage from "@/components/blog/BlogImage";
import MdxContent from "@/components/blog/MdxContent";
import RecordPostView from "@/components/blog/RecordPostView";
import ShareArticle from "@/components/blog/ShareArticle";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { absoluteUrl } from "@/lib/seo";
import { blogAssetUrl } from "@/utils/mediaUrl";

// SSG — bake HTML at build time. Do NOT add revalidate (that's ISR)
// or cookies/headers/fetch-to-view-API here (that forces SSR/dynamic).
export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  try {
    const { slug } = await params;
    const { meta } = getPostBySlug(slug);
    const cover = blogAssetUrl(meta.coverImage);
    return {
      title: `${meta.title} | Pomopal Engineering Blog`,
      description: meta.description,
      openGraph: {
        title: meta.title,
        description: meta.description,
        type: "article",
        publishedTime: meta.date,
        ...(cover ? { images: [{ url: cover, alt: meta.coverImageAlt }] } : {}),
      },
      twitter: {
        card: "summary_large_image",
        title: meta.title,
        description: meta.description,
        ...(cover ? { images: [cover] } : {}),
      },
    };
  } catch {
    return {};
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function PostPage({ params }) {
  const { slug } = await params;

  let post;
  try {
    post = getPostBySlug(slug);
  } catch {
    notFound();
  }

  const { meta, content } = post;
  const shareUrl = absoluteUrl(`/blog/${slug}`);

  return (
    <div className="flex min-h-dvh flex-col bg-gray-900 text-white">
      <header className="mx-auto w-11/12 max-w-2xl pt-8">
        <Link
          href="/blog"
          className="rounded-sm text-sm text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        >
          ← Back to Blog
        </Link>
      </header>

      <article className="mx-auto w-11/12 max-w-2xl flex-1 py-10">
        <header className="blog-hero-fade space-y-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {meta.title}
          </h1>
          {meta.description && (
            <p className="text-base leading-relaxed text-white/70 sm:text-lg">
              {meta.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {meta.date && (
              <time dateTime={meta.date} className="text-sm text-white/45">
                {formatDate(meta.date)}
              </time>
            )}
            <RecordPostView slug={slug} />
          </div>
          {meta.coverImage && (
            <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
              <BlogImage
                src={meta.coverImage}
                alt={meta.coverImageAlt || meta.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 92vw, 672px"
              />
            </div>
          )}
        </header>

        <hr className="mb-10 mt-10 border-white/10" />

        <div className="blog-prose">
          <MdxContent source={content} />
        </div>

        <footer className="mt-14 space-y-8 border-t border-white/10 pt-10">
          {meta.tags?.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                Tags
              </h2>
              <ul className="flex flex-wrap gap-2">
                {meta.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-lg bg-blue-500/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-blue-300"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <ShareArticle
            url={shareUrl}
            title={meta.title}
            description={meta.description || ""}
          />
        </footer>
      </article>

      <Footer className="mt-auto" />
    </div>
  );
}
