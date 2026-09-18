---
title: "Tools for AI to Manage Shopping Carts"
date: 2026-09-18T00:59:21+00:00
tags: ["ai", "rust", "cli"]
draft: false
---

I have been using Claude to create [command line tools for managing shopping carts](https://github.com/jason-s13r/shopping-cli-tools) for various online retailers in New Zealand. This is so that my Hermes agent can manage our family's supermarket shopping cart.

<!--more-->

The [woolies-nz-cli](https://github.com/mcinteerj/woolies-nz-cli) tool we were using broke and I figured that since I wanted some other changes, I could built one using Claude.

Rust seemed like a good idea: I figured it would constrain Claude into good behaviour by requiring a compilation step and the strong typing could help avoid it becoming a soupy mess of Javascript or Python.

Replication seemed easy: I navigated the shopping site in Firefox, exported an .har of the network requests (definitely sanitised of credentials of course...), and gave it to Claude to inspect.

This approach kept working: record using the site, export .har, hand over to Claude to build an API crate and CLI app.  
So I have begun collecting online retail sites like they're Pokemon:

- `wwnz`: Woolworths
- `fsnz`: New World & Pak'nSave
- `kmart`: Kmart (Australia & New Zealand)
- `twlnz`: The Warehouse
- `bgnz`: Briscoes & Rebel Sport
- `mitre10`: Mitre10.


## Command Line

```
$ wwnz cart list
Regent Woolworths

┌─────┬──────────────────────────────────────────────────────────────────────┬────────┬────────────┐
│ Qty ┆ Product                                                              ┆ SKU    ┆ Line total │
╞═════╪══════════════════════════════════════════════════════════════════════╪════════╪════════════╡
│ 1   ┆ Wattie's Tomato Sauce 575g                                           ┆ 270378 ┆ $5.00      │
│ 1   ┆ Woolworths Oregano Flaked Leaves 10g                                 ┆ 251127 ┆ $2.70      │
│ 1   ┆ Woolworths Mixed Herbs 12g                                           ┆ 251120 ┆ $2.70      │
│ 1   ┆ Rexona Women Advanced Roll On Invisible Fresh 50mL                   ┆ 307518 ┆ $6.29      │
│ 1   ┆ Anchor Custard Creamy Vanilla 1kg                                    ┆ 753018 ┆ $7.79      │
│ 1   ┆ Nivea Men Anti-Perspirant Deodorant Sensitive Protect Quick Dry 156g ┆ 748714 ┆ $5.49      │
│ 2   ┆ Aunt Betty's Rice 2 Go Creamed Rice Vanilla Creamy Rice 400g 4 Pack  ┆ 232587 ┆ $9.40      │
└─────┴──────────────────────────────────────────────────────────────────────┴────────┴────────────┘
  Subtotal                    $39.37
  Fees                         $1.50
  Total                       $40.87

Please select a time slot to continue.
```


## Hermes via Telegram

With a command line tool available, I can have Baz, my Hermes agent use it to manage the cart.  With the Telegram integration, this makes the process even more convenient: By taking a photo of a product we've just finished, Baz can give us information about the product and add it to the cart.

<div class="image-grid">
    <figure>
        <img src="./list-cart.png?as=webp" alt="list woolworths cart"/>
        <figcaption>Baz responding with the items in the online shopping trolley</figcaption>
    </figure>
    <figure>
        <img src="./camera-to-cart.png?as=webp" alt="Take a photo, AI can add it to cart" />
        <figcaption>Baz reading a photo of a product and providing a price comparison.</figcaption>
    </figure>
</div>