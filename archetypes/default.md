---
title: "{{ replace .Name "-" " " | title }}"
date: {{ .Date }}
tags: ["post", "{{ now.Format "2006-01-02" }}"]
draft: true
---

