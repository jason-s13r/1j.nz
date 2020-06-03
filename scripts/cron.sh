#!/usr/bin/env  bash

dir="/var/www/jason.schwarzenberger.co.nz"
cd $dir

git checkout master
git pull

source ./env/bin/activate
python $dir/scripts/gists.py

rm $dir/public
rm /var/www/1j.nz/public

/home/linuxbrew/.linuxbrew/bin/hugo
/home/linuxbrew/.linuxbrew/bin/hugo -b https://1j.nz/ -d /var/www/1j.nz/public

chown jason:jason $dir -R
chown jason:jason /var/www/1j.nz -R
