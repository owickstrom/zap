#!/bin/bash

git stash || 1
git checkout gh-pages
make clean index.html
git add --all -f index.html dist
(git commit -m "Deploy to gh-pages at $(date)" && git rebase master && git push origin +gh-pages) || echo "Nothing has changed!"
git checkout master
git stash pop
