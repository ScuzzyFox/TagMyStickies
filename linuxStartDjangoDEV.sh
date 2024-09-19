# don't forget to chmod +x this file
# alternatively you can just copy + paste this into terminal

xport DJANGO_SETTINGS_MODULE="tagmystickies.settings"
cd Django
source env/bin/activate
pip install -r requirements.txt
cd tagmystickies
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
