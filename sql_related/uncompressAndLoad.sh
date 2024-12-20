#!/bin/bash
# uncompress the backup file and load it 
if [ "$#" -eq 1 ]; then
    gunzip < "$1" | mysql -u root -p carbnr_dev_db
else
    echo "Usage: $0 backup.sql.gz"
fi
