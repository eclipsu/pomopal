import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import BlogImage from "@/components/blog/BlogImage";

const prettyCodeOptions = {
  theme: "github-dark-dimmed",
  keepBackground: false,
  defaultLang: "txt",
};

const mdxComponents = {
  h1: (props) => (
    <h1
      className="mt-10 mb-4 text-2xl font-bold tracking-tight text-white first:mt-0"
      {...props}
    />
  ),
  h2: (props) => (
    <h2
      className="mt-10 mb-3 text-xl font-bold tracking-tight text-white"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="mt-8 mb-2 text-lg font-semibold tracking-tight text-white"
      {...props}
    />
  ),
  p: (props) => (
    <p
      className="my-4 text-base leading-relaxed text-white/70 sm:text-lg"
      {...props}
    />
  ),
  a: (props) => (
    <a
      className="rounded-sm font-medium text-blue-400 underline-offset-2 transition-colors hover:text-blue-300 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
      {...props}
    />
  ),
  ul: (props) => (
    <ul
      className="my-4 list-disc space-y-2 pl-5 text-base leading-relaxed text-white/70 sm:text-lg"
      {...props}
    />
  ),
  ol: (props) => (
    <ol
      className="my-4 list-decimal space-y-2 pl-5 text-base leading-relaxed text-white/70 sm:text-lg"
      {...props}
    />
  ),
  li: (props) => <li className="pl-1 marker:text-white/40" {...props} />,
  strong: (props) => <strong className="font-semibold text-white" {...props} />,
  em: (props) => <em className="italic text-white/80" {...props} />,
  hr: (props) => <hr className="my-10 border-white/10" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="my-6 rounded-r-xl border-l-[3px] border-blue-500/70 bg-blue-500/[0.07] py-3 pl-4 pr-4 text-white/65 italic leading-relaxed"
      {...props}
    />
  ),
  // Chess.com-inspired soft panel; Pomopal dark/blue palette (not Discord embed).
  pre: ({ children, ...props }) => (
    <pre
      className="blog-code-block my-6 overflow-x-auto rounded-2xl border border-blue-400/15 bg-blue-500/[0.08] p-5 text-[0.925rem] leading-relaxed text-white/85 sm:p-6"
      {...props}
    >
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className);
    if (isBlock) {
      return (
        <code className={`${className ?? ""} font-mono text-[0.9em]`} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded-md bg-blue-500/15 px-1.5 py-0.5 font-mono text-[0.9em] text-blue-300"
        {...props}
      >
        {children}
      </code>
    );
  },
  table: ({ children, ...props }) => (
    <div className="my-8 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
      <table className="w-full min-w-[28rem] border-collapse text-left text-sm sm:text-base" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-blue-500/10 text-white" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-white/10 text-white/70" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="transition-colors hover:bg-white/[0.03]" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-white/80 sm:px-5"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-3 align-top leading-relaxed sm:px-5" {...props}>
      {children}
    </td>
  ),
  img: ({ src, alt = "", ...props }) => {
    if (!src) return null;
    return (
      <span className="my-6 block overflow-hidden rounded-2xl border border-white/10">
        <BlogImage
          src={src}
          alt={alt}
          width={1200}
          height={675}
          className="h-auto w-full object-cover"
          sizes="(max-width: 768px) 92vw, 672px"
          {...props}
        />
      </span>
    );
  },
};

export default function MdxContent({ source }) {
  return (
    <MDXRemote
      source={source}
      components={mdxComponents}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [[rehypePrettyCode, prettyCodeOptions]],
        },
      }}
    />
  );
}
