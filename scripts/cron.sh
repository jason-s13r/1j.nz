#!/usr/bin/env  bash

dir="/var/www/jason.schwarzenberger.co.nz"
cd $dir

git checkout master
git pull

source ./env/bin/activate
python $dir/scripts/gists.py

rm -r $dir/public

if [ -f /home/linuxbrew/.linuxbrew/bin/hugo ]; then
    /home/linuxbrew/.linuxbrew/bin/hugo
elif [ -f /usr/bin/hugo ]; then
    /usr/bin/hugo
fi

if id -u "jason" >/dev/null 2>&1; then
    chown jason:jason $dir -R
fi
