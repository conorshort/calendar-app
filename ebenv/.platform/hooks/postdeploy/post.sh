#! /bin/bash
docker cp $(docker ps --no-trunc -q | head -n 1):/code/static .