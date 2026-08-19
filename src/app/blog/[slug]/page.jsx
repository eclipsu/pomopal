import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import BlogNavbar from "@/components/blog/BlogNavbar";
import BlogImage from "@/components/blog/BlogImage";
import MdxContent from "@/components/blog/MdxContent";
import RecordPostView from "@/components/blog/RecordPostView";
import ShareArticle from "@/components/blog/ShareArticle";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { absoluteUrl } from "@/lib/seo";
import { blogAssetUrl } from "@/utils/mediaUrl";

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
    <div className="flex min-h-dvh flex-col bg-white text-neutral-900">
      <BlogNavbar />

      <article className="mx-auto w-11/12 max-w-[40rem] flex-1 py-12 sm:py-16">
        <header className="blog-hero-fade">
          <h1 className="text-[2.35rem] font-bold leading-[1.15] text-[#333333] sm:text-[2.85rem]">
            {meta.title}
          </h1>
          {meta.description && (
            <p className="mt-5 text-[15px] leading-[1.7] text-[#555555] sm:text-[15.5px]">
              {meta.description}
            </p>
          )}
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1">
            {meta.date && (
              <time dateTime={meta.date} className="text-sm text-[#999999]">
                {formatDate(meta.date)}
              </time>
            )}
            <RecordPostView slug={slug} />
          </div>
          {meta.coverImage && (
            <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden bg-white">
              <BlogImage
                src={meta.coverImage}
                alt={meta.coverImageAlt || meta.title}
                fill
                priority
                className="object-contain"
                sizes="(max-width: 768px) 92vw, 640px"
              />
            </div>
          )}
        </header>

        <div className="blog-prose mt-10">
          <MdxContent source={content} />
        </div>

        <footer className="mt-16 space-y-8 border-t border-[#eeeeee] pt-10">
          {meta.tags?.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#999999]">
                Tags
              </h2>
              <ul className="flex flex-wrap gap-2">
                {meta.tags.map((tag) => (
                  <li
                    key={tag}
                    className="text-sm font-medium text-[#1BA0D6]"
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

      <Footer tone="light" className="mt-auto" />
    </div>
  );
}
