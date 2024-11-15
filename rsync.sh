#!/bin/bash

media_path_list="AnkiMediaPathList.txt"

while IFS= read -r media_path; do
  rsync -av --include '*/' --include '*.js' --exclude '*' . "$media_path"
done < "$media_path_list"
