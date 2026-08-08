/* eslint-disable @next/next/no-img-element -- Markdown images have unknown remote dimensions and are intentionally rendered without Next.js optimization. */
/* eslint-disable @typescript-eslint/no-unused-vars -- react-markdown component props include an AST node that must not be forwarded to DOM elements. */

import type { ComponentProps } from "react";
import Markdown, {
  defaultUrlTransform,
  type Components,
  type UrlTransform,
} from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

function isExternalHttpUrl(value: string) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function isAllowedImageUrl(value: string) {
  const transformed = defaultUrlTransform(value);
  if (!transformed || transformed.startsWith("//")) return false;
  try {
    return new URL(transformed).protocol === "https:";
  } catch {
    return true;
  }
}

export const announcementUrlTransform: UrlTransform = (url, key, node) => {
  if (key === "src" && node.tagName === "img") {
    return isAllowedImageUrl(url) ? defaultUrlTransform(url) : "";
  }
  return defaultUrlTransform(url);
};

const components: Components = {
  h1: ({ node: _node, ...props }) => (
    <h2
      className="mt-6 font-display text-2xl font-black tracking-tight first:mt-0"
      {...props}
    />
  ),
  h2: ({ node: _node, ...props }) => (
    <h3
      className="mt-5 font-display text-xl font-bold tracking-tight first:mt-0"
      {...props}
    />
  ),
  h3: ({ node: _node, ...props }) => (
    <h4 className="mt-4 text-base font-bold first:mt-0" {...props} />
  ),
  h4: ({ node: _node, ...props }) => (
    <h5 className="mt-4 text-sm font-bold first:mt-0" {...props} />
  ),
  h5: ({ node: _node, ...props }) => (
    <h6 className="mt-4 text-sm font-semibold first:mt-0" {...props} />
  ),
  h6: ({ node: _node, ...props }) => (
    <p className="mt-4 text-sm font-semibold first:mt-0" {...props} />
  ),
  p: ({ node: _node, ...props }) => (
    <p className="mt-3 leading-7 first:mt-0" {...props} />
  ),
  ul: ({ node: _node, ...props }) => (
    <ul className="mt-3 list-disc space-y-1 pl-6 first:mt-0" {...props} />
  ),
  ol: ({ node: _node, ...props }) => (
    <ol className="mt-3 list-decimal space-y-1 pl-6 first:mt-0" {...props} />
  ),
  li: ({ node: _node, ...props }) => (
    <li className="leading-7 marker:text-primary" {...props} />
  ),
  blockquote: ({ node: _node, ...props }) => (
    <blockquote
      className="mt-4 border-l-4 border-primary/35 bg-primary/[0.045] px-4 py-2 text-muted-foreground first:mt-0"
      {...props}
    />
  ),
  hr: ({ node: _node, ...props }) => (
    <hr className="my-6 border-primary/15" {...props} />
  ),
  pre: ({ node: _node, ...props }) => (
    <pre
      className="mt-4 overflow-x-auto rounded-lg bg-foreground p-4 font-mono text-xs leading-6 text-background first:mt-0 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit"
      {...props}
    />
  ),
  code: ({ node: _node, ...props }) => (
    <code
      className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[0.9em] text-foreground"
      {...props}
    />
  ),
  a: ({ node: _node, href = "", ...props }) => {
    const external = href.startsWith("//") || isExternalHttpUrl(href);
    return (
      <a
        {...props}
        href={href}
        className="font-medium text-primary underline decoration-primary/35 underline-offset-4 hover:decoration-primary"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      />
    );
  },
  img: ({ node: _node, src = "", alt = "", ...props }) => {
    const source = typeof src === "string" ? src : "";
    if (!isAllowedImageUrl(source)) {
      return alt ? (
        <span className="text-sm text-muted-foreground">[{alt}]</span>
      ) : null;
    }
    return (
      <img
        {...props}
        src={source}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="my-4 max-h-[60vh] max-w-full rounded-lg border border-primary/15 bg-white object-contain shadow-sm first:mt-0 last:mb-0"
      />
    );
  },
  table: ({ node: _node, ...props }) => (
    <div className="mt-4 overflow-x-auto rounded-lg border border-primary/15 first:mt-0">
      <table className="w-full min-w-md border-collapse text-left" {...props} />
    </div>
  ),
  thead: ({ node: _node, ...props }) => (
    <thead className="bg-secondary/75" {...props} />
  ),
  th: ({ node: _node, ...props }) => (
    <th
      className="border-b border-primary/15 px-3 py-2 font-semibold"
      {...props}
    />
  ),
  td: ({ node: _node, ...props }) => (
    <td
      className="border-b border-primary/10 px-3 py-2 last:border-b-0"
      {...props}
    />
  ),
  input: ({ node: _node, ...props }) => (
    <input
      {...(props as ComponentProps<"input">)}
      disabled
      className="mr-2 align-middle accent-primary"
    />
  ),
};

export function AnnouncementMarkdown({
  markdown,
  className,
}: {
  markdown: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 [overflow-wrap:anywhere] text-sm text-foreground sm:text-[15px]",
        className,
      )}
    >
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        skipHtml
        urlTransform={announcementUrlTransform}
        components={components}
      >
        {markdown}
      </Markdown>
    </div>
  );
}
