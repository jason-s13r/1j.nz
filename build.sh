dir=/var/www/1j.nz/

head -n 10 $dir/template/index.html

cat $dir/template/header.html
cat $dir/sections/*.html

ls $dir/compiled/*.sh | bash

cat $dir/template/footer.html

echo "<!-- generated: $(date -Iseconds) -->"

tail -n 3 $dir/template/index.html
