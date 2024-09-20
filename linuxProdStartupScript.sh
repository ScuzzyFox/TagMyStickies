# Install Node.js and npm if not already installed
apt-get update
apt-get install -y nodejs npm

# Install PM2 globally
npm install -g pm2@latest
npm install

# If tagmystickiesNODE is already running, stop and delete it
pm2 stop tagmystickiesNODE || true
pm2 delete tagmystickiesNODE || true

# If tagmystickiesDJANGO is already running, stop and delete it
pm2 stop tagmystickiesDJANGO || true
pm2 delete tagmystickiesDJANGO || true

# Start Telegram bot with pm2
pm2 start "npm run start" --name tagmystickiesNODE

# Start Django application with pm2, using 'sh -c' to execute multiple commands
pm2 start ./start_django.sh --name tagmystickiesDJANGO


# Save PM2 process list to restart automatically on reboot
pm2 save
pm2 startup
