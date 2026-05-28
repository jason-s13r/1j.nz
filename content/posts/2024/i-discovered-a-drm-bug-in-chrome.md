---
title: "I Discovered a DRM bug in Chrome"
date: 2024-08-26T01:52:08.217Z
tags: ["bugs", "chromium", "2024"]
draft: false
---

I discovered a [bug in Chrome web browser](https://issues.chromium.org/issues/362007492) that reveals DRM protected video during a screen recording if there are CSS filters applied to any parent element.

Here is a [demo reproduction](/content/cr-drm/index.html) page.

<!--more-->
-----------

<include src="./content/cr-drm/index.html"></include>