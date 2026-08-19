import BlogNavbar from "@/components/blog/BlogNavbar";
import Footer from "@/components/Footer";
import { getAllPosts } from "@/lib/posts";
import Link from "next/link";

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
    <div className="relative flex min-h-dvh flex-col bg-white text-neutral-900">
      <BlogNavbar />

      <main className="mx-auto w-11/12 max-w-[40rem] flex-1 py-14 sm:py-16">
        <section className="mb-14">
          <h1 className="text-[2.35rem] font-bold leading-tight text-[#333333] sm:text-[2.85rem]">
            Blog
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-[1.7] text-[#555555]">
            Architecture notes and shipping decisions — written for engineers who
            skim.
          </p>
        </section>

        <section>
          <ul className="divide-y divide-[#eeeeee]">
            {posts.length === 0 ? (
              <li className="py-10 text-[17px] text-[#555555]">
                No posts yet. Check back soon.
              </li>
            ) : (
              posts.map((post) => (
                <li key={post.slug} className="py-8 first:pt-0">
                  <Link href={`/blog/${post.slug}`} className="group block">
                    <h2 className="text-[1.35rem] font-bold leading-snug text-[#333333] group-hover:text-[#1BA0D6] sm:text-[1.5rem]">
                      {post.title}
                    </h2>
                    {post.date && (
                      <time
                        dateTime={post.date}
                        className="mt-2 block text-sm text-[#999999]"
                      >
                        {formatDate(post.date)}
                      </time>
                    )}
                    {post.description && (
                      <p className="mt-3 text-[15px] leading-[1.7] text-[#555555]">
                        {post.description}
                      </p>
                    )}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
      </main>

      <Footer tone="light" className="mt-auto" />
    </div>
  );
}
