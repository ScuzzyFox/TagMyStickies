# Need to do `npm run start` to run telegram app with pm2
# need to do (with pm2?) `export DJANGO_SETTINGS_MODULE="tagmystickies.settings" && cd Django && source env/bin/activate &&  pip install -r requirements.txt && cd tagmystickies && python manage.py makemigrations && python manage.py migrate && hypercorn tagmystickies.asgi:application`
# need both those scripts to run at the same time.
# nodejs must be installed
# pm2 must be installed globally

apt-get update
apt-get install -y nodejs npm


npm install -g pm2@latest
npm install

pm2 "npm run start" --name tagmystickiesNODE
pm2 "export DJANGO_SETTINGS_MODULE="tagmystickies.settings" && cd Django && source env/bin/activate &&  pip install -r requirements.txt && cd tagmystickies && python manage.py makemigrations && python manage.py migrate && hypercorn tagmystickies.asgi:application" --name tagmystickiesDJANGO
