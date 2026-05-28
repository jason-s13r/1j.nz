import path from 'node:path';
import process from "node:process";
import fs from "node:fs";
import pug from "pug";

export const cache = new Map();
export const postsCache = new Map();

export const toSlug = (tag: string) => tag.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-");

export const getPostInfo = (contents: string, postRoot: string) => {
  const [_, frontmatter, rawPreviewText, remainder] = contents.split(/---\n|<!--more-->\n/g, 4);
  const text = contents.split(/---\n/).slice(2).join('---\n').replace(/<!--more-->/g, '');

  const hasMore = /<!--more-->/.test(contents);
  
  const rawPreview = rawPreviewText
    .split("\n", 4)
    .join("\n")
    .split(/\. |\.$/g, 4);
  const computedPreviewText = (
    rawPreview.length > 3 ? rawPreview.slice(0, 3).concat([""]) : rawPreview
  ).join(". ");

  const preview = hasMore ? rawPreviewText : computedPreviewText;

  const meta = frontmatter.split("\n").reduce(
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

  return {
    ...meta,
    preview: preview.trim(),
    text,
    date: new Date(meta.date),
    tags: meta.tags.map((tag) => ({
      slug: toSlug(tag),
      // route: `${postRoot}/tags/${toSlug(tag)}/index.pug`,
      route: `/content/tags/${toSlug(tag)}/index.pug`,
      name: tag,
    })),
  };
};

export function* iterPosts(postRoot: string) {
  const options = { postRoot };
  const basedir = path.join(process.cwd());
  const searchdir = path.join(basedir, options.postRoot);
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

    const content = fs.readFileSync(filepath, { encoding: "utf-8" });
    const post = getPostInfo(content, postRoot);

    const entry = {
      ...post,
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

export function getPosts(postRoot: string) {
  if (!cache.has(postRoot)) {
    const iterator = iterPosts(postRoot);
    const list = iterator.toArray();
    const sorted = list.toSorted((a, b) => b.date.getTime() - a.date.getTime());
    cache.set(postRoot, sorted);
    console.debug('CACHED:', postRoot, sorted.length);
  }
  return cache.get(postRoot);
}

export function getSinglePost(route: string, postRoot: string) {
  if (!postsCache.has(route)) {
    getPosts(postRoot);
  }
  return postsCache.get(route);
}

export function withVariable(filter: string, markdown: string) {
  return pug.render(`${filter}\n  ${markdown.trim().split("\n").join("\n  ")}`);
}