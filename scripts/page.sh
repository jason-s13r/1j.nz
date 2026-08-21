
timestamp=$(date -z U  -Iseconds)
year="${timestamp::4}"
routeName=$(echo $@ | tr '[:upper:]' '[:lower:]' | sed -e 's/[^a-z0-9][^a-z0-9]*/-/g')
routePath="./content/posts/$year/$routeName"

counter=0
while [ -e "$routePath/index.md" ]; do
  counter=$((counter + 1))
  routePath="./content/posts/$year/$routeName-$counter"
done

mkdir -p "$routePath"

cat <<FRONTMATTER > "${routePath}/index.md"
---
title: "$@"
date: ${timestamp}
tags: ["${year}"]
draft: false
---

[text visible in post listings]

<!--more-->

[main content of the post]
FRONTMATTER