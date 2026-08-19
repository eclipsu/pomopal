import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import remarkGfm from "remark-gfm";
import BlogImage from "@/components/blog/BlogImage";

const prettyCodeOptions = {
  theme: "github-light",
  keepBackground: false,
  defaultLang: "txt",
};

const BODY =
  "my-5 text-[15px] font-normal leading-[1.7] text-[#555555] sm:text-[15.5px]";

const mdxComponents = {
  h1: (props) => (
    <h1
      className="mb-8 mt-12 text-[1.75rem] font-bold leading-snug text-[#333333] first:mt-0 sm:text-[2rem]"
      {...props}
    />
  ),
  h2: (props) => (
    <h2
      className="mb-5 mt-11 text-[1.35rem] font-bold leading-snug text-[#333333] sm:text-[1.5rem]"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="mb-4 mt-10 text-[1.2rem] font-bold leading-snug text-[#333333]"
      {...props}
    />
  ),
  p: (props) => <p className={BODY} {...props} />,
  a: (props) => (
    <a
      className="font-normal text-[#1BA0D6] no-underline hover:underline"
      {...props}
    />
  ),
  ul: (props) => (
    <ul className={`${BODY} list-disc space-y-2 pl-5`} {...props} />
  ),
  ol: (props) => (
    <ol className={`${BODY} list-decimal space-y-2 pl-5`} {...props} />
  ),
  li: (props) => <li className="pl-1 marker:text-[#999999]" {...props} />,
  strong: (props) => (
    <strong className="font-normal text-[#1BA0D6]" {...props} />
  ),
  em: (props) => <em className="italic text-[#555555]" {...props} />,
  hr: (props) => <hr className="my-12 border-[#eeeeee]" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="my-8 border-l-[3px] border-[#1BA0D6] pl-5 text-[17px] leading-[1.7] text-[#555555] sm:text-[18px]"
      {...props}
    />
  ),
  pre: ({ children, ...props }) => (
    <pre
      className="blog-code-block my-8 overflow-x-auto rounded-lg border border-[#eeeeee] bg-[#fafafa] p-5 font-mono text-[0.9rem] leading-relaxed text-[#333333] sm:p-6"
      style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
      {...props}
    >
      {children}
    </pre>
  ),
  code: ({ className, children, ...props }) => {
    const isBlock = Boolean(className);
    if (isBlock) {
      return (
        <code
          className={`${className ?? ""} text-[0.9em]`}
          style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded bg-[#f4f4f4] px-1.5 py-0.5 text-[0.9em] text-[#333333]"
        style={{
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        }}
        {...props}
      >
        {children}
      </code>
    );
  },
  table: ({ children, ...props }) => (
    <div className="my-8 overflow-x-auto">
      <table
        className="w-full min-w-[28rem] border-collapse text-left text-[16px] text-[#555555]"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="border-b border-[#eeeeee] text-[#333333]" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-[#f0f0f0]" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => <tr {...props}>{children}</tr>,
  th: ({ children, ...props }) => (
    <th className="py-3 pr-6 text-left text-sm font-normal text-[#333333]" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="py-3 pr-6 align-top leading-relaxed" {...props}>
      {children}
    </td>
  ),
  img: ({ src, alt = "", ...props }) => {
    if (!src) return null;
    return (
      <span className="my-8 block">
        <BlogImage
          src={src}
          alt={alt}
          width={1200}
          height={675}
          className="h-auto w-full"
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
