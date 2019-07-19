echo "	<section class="gists">"
echo "		<h3>Gists</h3>"
curl --silent -s "https://api.github.com/users/master5o1/gists" \
 | jq '.[0:10] | map("<article class=\"gist\"><a href=\"\(.html_url)\">\(.files | keys | .[0])</a><time datetime=\"\(.created_at)\">\(.created_at)</time><p class=\"caption\">\(.description)</p></article>") | add' \
 | sed -e 's/\\"/"/g' \
 | cut -c 2- | rev | cut -c 2- | rev \
 | sed -e 's/^/\t\t/'
echo "	</section>"
echo ""
