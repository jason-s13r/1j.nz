---
title: "A Personal Finance Webapp"
date: 2026-08-21T05:16:32+00:00
tags: ["react", "nextjs", "akahu", "2026"]
draft: false
---

I've made a [personal finance app](https://github.com/jason-s13r/money-next) to help me understand my spending habits.

<!--more-->

Blandly, I'm calling it Money, or blander, Money Next –– not just because it's written with NextJS, but also because it's the _next_ attempt in a series of setting up some tooling to reveal to me my actual spending habbits.

![dashboard](./dashboard.png?width=600&quality=100&as=webp)

I used to use a spreadsheet on Google Sheets, with charts and pivot tables. But the maintenance is cumbersome.  So I looked to other options: Bagels, Firefly iii, PocketSmith, BudgetBuddy.

But now I've created something that has been working well for the a month. A tool that doesn't just live in my terminal; a tool that my wife can also use.

<div class="image-grid">
    <figure>
        <img src="./monthly-breakdown.png?as=webp" alt="breakdown example"/>
        <figcaption>Categorised breakdown table for comparing across several spending periods.</figcaption>
    </figure>
    <figure>
        <img src="./sankey.png?as=webp" alt="sankey example" />
        <figcaption>Sankey diagram showing the flow of money from income sources through to categorised spending at various merchants</figcaption>
    </figure>