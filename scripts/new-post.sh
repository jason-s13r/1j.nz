#!/usr/bin/env sh

title="$@"
timestamp=$(date -z U  -Iseconds)
year="${timestamp::4}"
routeName=$(echo $title | tr '[:upper:]' '[:lower:]' | sed -e 's/[^a-z0-9][^a-z0-9]*/-/g')
routePath="./content/posts/$year/$routeName"

counter=0
while [ -e "$routePath/index.md" ]; do
  counter=$((counter + 1))
  routePath="./content/posts/$year/$routeName-$counter"
done

extractTags() {
  echo "$1" \
    | tr '[:upper:]' '[:lower:]' \
    | sed -e 's/[^a-z0-9][^a-z0-9]*/\n/g' \
    | awk 'length >= 5' \
    | sort -u \
    | sed -e 's/^/"/g' \
    | sed -e 's/$/",/g' \
    | tr '\n' ' ' \
    | sed -e 's/, $/\n/'
}

mkdir -p "$routePath"
echo "$routePath"
cat <<FRONTMATTER | tee "${routePath}/index.md" | head -n 6
---
title: "$title"
date: ${timestamp}
tags: [$(extractTags "$title")]
draft: true
---

[text visible in post listings]

<!--more-->

[main content of the post]
FRONTMATTER