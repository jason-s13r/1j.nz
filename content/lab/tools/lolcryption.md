---
title: "LOLcryption"
date: 2026-05-25T00:32:54.000Z
tags: ["tool", "react", "2026"]
draft: false
---

In 2015 I created [LOLcryption](https://lolcryption.1j.nz/), a Caesar substitution cipher that aims to preserve some ability to pronounce the output.

As an effort to learn a bit about React, I created a LOLcryption component and website that replaces the [original](https://lolcryption.master5o1.com).

<!--more-->

While ROT13 shifts the characters along one alphabet, LOLcryption separates the rotation to within the character type: consonants and vowels.

LOLcryption considers vowels separate, and shifts them independently, 'a' becomes 'i', 'e' becomes 'o', 'i' becomes 'u', 'o' becomes 'a', and 'u' becomes 'e'.
Similarly, 'b' becomes 'n', and so on until 'z' becomes 'm'.


<!--more-->

<web-lolcryption-app></web-lolcryption-app>
<script type="module">import '/src/lab/lolcryption/main.ts';</script>

https://github.com/jason-s13r/lolcryption-web