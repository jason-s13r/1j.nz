#!/usr/bin/env python3.7
import requests
import os
from datetime import datetime

def sizeof_fmt(num, suffix='B'):
    for unit in ['','Ki','Mi','Gi','Ti','Pi','Ei','Zi']:
        if abs(num) < 1024.0:
            return "%3.1f%s%s" % (num, unit, suffix)
        num /= 1024.0
    return "%.1f%s%s" % (num, 'Yi', suffix)

def main():
	API_URL = "https://api.github.com/users/master5o1/gists"

	directory = os.path.join('content', 'posts', f'gist')
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
		text = f"""---
title: "{title}"
date: {date}
tags: ["gist", "{shortdate}"]
draft: false
---
{description}\n\n
<!--more-->\n\n
[gist link]({url})\n\n
"""
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
			if len(list(files.keys())) > 1:
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
			sections.append("\n".join(section))
		if len(attachments) > 1:
			text = text + "\n".join(attachments) + "\n\n"
		text = text + "\n***\n\n"
		text = text + "\n***\n".join(sections) + "\n\n"
		subdir = os.path.join(directory, shortdate)
		if not os.path.exists(subdir) or not os.path.isdir(subdir):
			os.mkdir(subdir)
		filehash = gist_id if len(gist_id) < 6 else f"{gist_id[:3]}{gist_id[-3:]}"
		filename = f"{filehash}-{title}.md"
		print(f"\t\toutput: {filename}")
		path = os.path.join(subdir, filename)
		with open(path, 'w+') as file:
			file.write(text)


if __name__ == '__main__':
	main()