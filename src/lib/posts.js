import fs from "fs";
import path from "path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

function mapMeta(data, slug) {
  return {
    slug,
    title: data.title,
    description: data.description,
    date: data.date,
    tags: data.tags ?? [],
    coverImage: data.coverImage ?? null,
    coverImageAlt: data.coverImageAlt ?? data.title ?? "",
  };
}

export function getAllPosts() {
  if (!fs.existsSync(POSTS_DIR)) return [];

  const files = fs.readdirSync(POSTS_DIR);

  return files
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const source = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
      const { data } = matter(source);
      return mapMeta(data, slug);
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug) {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Post not found: ${slug}`);
  }

  const source = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(source);

  return { meta: mapMeta(data, slug), content };
}
