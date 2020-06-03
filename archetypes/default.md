---
title: "{{ replace .Name "-" " " | title }}"
date: {{ .Date }}
tags: ["{{ now.Format "2006-01-02" }}", "posts"]
draft: true
---

