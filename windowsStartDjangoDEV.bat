@echo off
SET DJANGO_SETTINGS_MODULE=tagmystickies.settings
cd Django

:: Activate the virtual environment
cd ./env/Scripts/
call activate
cd ../..

:: Install requirements
pip install -r requirements.txt

:: Run Django commands
cd tagmystickies
python manage.py makemigrations
python manage.py migrate

:: Start the Django development server and keep it running
python manage.py runserver

:: Keep the window open after execution
pause
