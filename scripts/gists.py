#!/usr/bin/env python3
import json
import re

import requests
import os
import subprocess


def sizeof_fmt(num, suffix='B'):
    for unit in ['','Ki','Mi','Gi','Ti','Pi','Ei','Zi']:
        if abs(num) < 1024.0:
            return "%3.1f%s%s" % (num, unit, suffix)
        num /= 1024.0
    return "%.1f%s%s" % (num, 'Yi', suffix)

def main():
	API_URL = "https://api.github.com/users/jason-s13r/gists"
	MAX_EMBED_SIZE = 10000

	directory = os.path.join('content', 'posts', 'gist')
	if not os.path.exists(directory) or not os.path.isdir(directory):
		os.mkdir(directory)

	print("Fetching gists.")
	r = requests.get(API_URL)
	if r.status_code != 200:
		return
	data = r.json()
	for gist in data:
		if not gist.get('public'):
			continue
		gist_id = gist.get('id')
		files = gist.get('files')
		date = gist.get('created_at')
		description = gist.get('description')
		url = gist.get('html_url')
		titles = list(files.keys())
		title = titles[0].strip(".md")
		print(f"GIST {gist_id} {title}")
		shortdate = date.split("T", maxsplit=1)[0]
		shortdate = date.split("-", maxsplit=1)[0]
		tags = set(["gist", f"{shortdate}"])
		sections = []
		attachments = ["| Attachment | Type | Size |\n| - | - | - |"]
		for attachment in files.values():
			name = attachment.get("filename")
			url = attachment.get("raw_url")
			mime = attachment.get("type")
			language = attachment.get("language")
			size = attachment.get("size")
			size = sizeof_fmt(size)
			section = []
			if len(list(files.keys())) > 0:
				attachments.append(f"| [{name}]({url}) | {mime} | {size} |")
				section = [f"### [{name}]({url}) -- {mime}, {size}"]
			rf = requests.get(url)
			body = rf.text
			if language == "Markdown":
				section.append(body)
			else:
				language = '' if language is None else language.lower()
				section.append(f"```{language}")
				section.append(body)
				section.append("```")
				if language:
					tags.add(language)
			sections.append("\n".join(section))
		text = f"""---
title: "{title}"
date: {date}
tags: {json.dumps(list(tags))}
draft: false
---
{description}\n\n
<!--more-->\n\n
[gist link]({url})\n\n
"""
		filehash = gist_id if len(gist_id) < 6 else f"{gist_id[:3]}{gist_id[-3:]}"
		filetitle = re.sub(r'[ \/\\:*?"<>|]+', '-', title).strip('-')
		subdir = os.path.join(directory, f"{filehash}-{filetitle}".lower())
		filepath = os.path.join(subdir, "index.md")
		print(f"\toutput: {filepath}")

		embeds = []
		for attachment in files.values():
			size = attachment.get("size")
			embedpath = os.path.join(subdir, attachment.get("filename"))
			if embedpath.endswith(".html"): # and size < MAX_EMBED_SIZE:
				text += f'<div class="gist-embed-container"><include src="{embedpath}"></include></div>\n\n'

		if len(attachments) > 1:
			text = text + "\n".join(attachments) + "\n\n"
		text = text + "\n***\n\n"
		text = text + "\n***\n".join(sections) + "\n\n"

		if os.path.exists(subdir):
			rm = subprocess.run(["rm", "-rf", subdir])
			print(f"rm stderr: {rm.stderr}")
			print(f"rm stdout: {rm.stdout}")
		pull = subprocess.run(["git", "clone", gist.get('git_pull_url'), "--depth", "1", subdir])

		print(f"git pull stderr: {pull.stderr}")
		print(f"git pull stdout: {pull.stdout}")

		if not os.path.exists(subdir) or not os.path.isdir(subdir):
			os.mkdir(subdir)

		with open(filepath, 'w+') as file:
			file.write(text)


if __name__ == '__main__':
	main()
