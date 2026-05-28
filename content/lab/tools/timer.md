---
title: "Timer"
date: 2026-05-25T11:38:10.000Z
tags: ["tool", "react", "2026"]
draft: false
---

As an effort to learn a bit about React, I created a [timer](https://timer.1j.nz) that uses the `Temporal` API.

Measurement is based on duration between `Temporal.Instant` instances, subtracting any accumulated paused time.
<!--more-->

<web-timer Hz="30"></web-timer>
<script async type="module">import '/src/lab/timer/main.ts';</script>

https://github.com/jason-s13r/timer-web