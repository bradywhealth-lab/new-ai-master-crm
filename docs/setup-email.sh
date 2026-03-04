#!/bin/bash

# Email Configuration Setup for brighterhealthsolutions@gmail.com
# This script helps you configure your email for sending emails

echo "==========================================="
echo "Email Configuration Setup"
echo "==========================================="
echo ""
echo "Adding email configuration to .env.local..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "Creating .env.local from example..."
  cp .env.local.example .env.local
fi

# Add/update email configuration
echo "" >> .env.local
echo "# Email Configuration - Added via setup script" >> .env.local
echo "SMTP_HOST=smtp.gmail.com" >> .env.local
echo "SMTP_PORT=587" >> .env.local
echo "SMTP_SECURE=false" >> .env.local
echo "SMTP_USER=brighterhealthsolutions@gmail.com" >> .env.local
echo "# SMTP_PASS=your-app-password-here" >> .env.local
echo "# SMTP_FROM=brighterhealthsolutions@gmail.com" >> .env.local
echo ""

echo "✓ Email configuration added to .env.local"
echo ""
echo "==========================================="
echo "IMPORTANT: You need to complete the setup manually:"
echo "==========================================="
echo ""
echo "1. Create an App Password for your Google Account:"
echo "   - Go to: https://myaccount.google.com/apppasswords"
echo "   - Select 'Mail' app"
echo "   - Enter: 'InsureAssist' as the app name"
echo "   - Click 'Generate' and copy the password"
echo ""
echo "2. Update .env.local with your App Password:"
echo "   - Edit .env.local"
echo "   - Replace 'your-app-password-here' with the generated password"
echo "   - Uncomment the SMTP_PASS line by removing the # at the start"
echo ""
echo "3. Restart the dev server:"
echo "   - Run: npm run dev"
echo ""
echo "==========================================="
