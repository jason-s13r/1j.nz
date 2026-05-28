import path from "node:path";
import process from "node:process";
import fs from "node:fs";
import pug from "pug";

export const cache = new Map();
export const postsCache = new Map();

export const toSlug = (tag: string) => tag.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-");

type Frontmatter = Record<string, any> & {
  title: string;
  date: Date;
  tags: string[];
  draft: boolean;
};
type PostTag = {
  slug: string;
  route: string;
  name: string;
};
type PostMeta = {
  file: string;
  filepath: string;
};
interface PostInfo extends Omit<Frontmatter, 'tags'> {
  preview: string;
  text: string;
  tags: PostTag[]
}
type Post = PostInfo & {
  meta: PostMeta;
  route: string;
};

export const getPostInfo = (contents: string, postRoot: string, rootTag?: string): PostInfo | undefined => {
  const [bad, frontmatterText, rawPreviewText, remainder] = contents.split(/---\n|<!--more-->\n/g, 4);
  
  if (bad) {
    return undefined;
  }

  const text = contents
    .split(/---\n/)
    .slice(2)
    .join("---\n")
    .replace(/<!--more-->/g, "");

  const hasMore = /<!--more-->/.test(contents);

  const rawPreview = rawPreviewText
    .split("\n", 4)
    .join("\n")
    .split(/\. |\.$/g, 4);
  const computedPreviewText = (rawPreview.length > 3 ? rawPreview.slice(0, 3).concat([""]) : rawPreview).join(". ");

  const preview = hasMore ? rawPreviewText : computedPreviewText;

  const frontmatter: Frontmatter = frontmatterText.split("\n").reduce(
    (data, line) => {
      const [key, ...parts] = line.split(":");
      const value = parts.join(":").trim();
      try {
        return { ...data, [key.trim()]: JSON.parse(value) };
      } catch {
        return { ...data, [key.trim()]: value };
      }
    },
    {
      title: "",
      date: new Date(),
      tags: [],
      draft: false,
    },
  );

  const tags = new Set(frontmatter.tags.concat(rootTag ? [rootTag] : []));

  return {
    ...frontmatter,
    preview: preview.trim(),
    text,
    date: frontmatter.date ? new Date(frontmatter.date) : new Date(0),
    tags: Array.from(tags).map((tag) => ({
      slug: toSlug(tag),
      route: `/content/tags/${toSlug(tag)}/index.pug`,
      name: tag,
    })),
  };
};

export function* iterPosts(postRoot: string) {
  const basedir = path.join(process.cwd());
  const searchdir = path.join(basedir, postRoot);
  const files = fs.readdirSync(searchdir, {
    recursive: true,
    encoding: "utf-8",
  });

  while (files.length) {
    const file = files.pop();
    if (!file || !path.matchesGlob(file, "**/*.md")) {
      continue;
    }

    const filepath = path.join(searchdir, file);
    const slug = path.relative(basedir, filepath);
    const route = "/" + slug;

    if (postsCache.has(route)) {
      yield postsCache.get(route);
      continue;
    }

    const rootTagMatcher = slug.match(/content\/([^/]+)\//);
    const rootTag = rootTagMatcher ? rootTagMatcher[1] : undefined;
    const content = fs.readFileSync(filepath, { encoding: "utf-8" });
    const postInfo = getPostInfo(content, postRoot, rootTag);

    if (!postInfo) {
      continue;
    }

    const entry: Post = {
      ...postInfo,
      route,
      meta: {
        file,
        filepath,
      },
    };

    if (entry.draft && !process.env.SHOW_DRAFTS) {
      continue;
    }

    postsCache.set(entry.route, entry);

    yield entry;
  }
}

export function getPosts(postRoot: string): Post[] {
  if (!cache.has(postRoot)) {
    const iterator = iterPosts(postRoot);
    const list = iterator.toArray();
    const sorted = list.toSorted((a, b) => b.date.getTime() - a.date.getTime());
    cache.set(postRoot, sorted);
    console.debug("CACHED:", postRoot, sorted.length);
  }
  return cache.get(postRoot);
}

export function getSinglePost(route: string, postRoot: string): Post {
  if (!postsCache.has(route)) {
    getPosts(postRoot);
  }
  return postsCache.get(route);
}

export function withVariable(filter: string, markdown: string) {
  return pug.render(`${filter}\n  ${markdown.trim().split("\n").join("\n  ")}`);
}
