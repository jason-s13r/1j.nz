#!/usr/bin/env  bash

dir="/var/www/jason.schwarzenberger.co.nz"
cd $dir

git checkout master
git pull

source ./env/bin/activate
python $dir/scripts/gists.py

rm -r $dir/public

/home/linuxbrew/.linuxbrew/bin/hugo

chown jason:jason $dir -R
