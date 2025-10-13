#!/bin/bash

# LagosAI Deployment Script
# This script helps deploy the application to Vercel

set -e

echo "🚀 Starting LagosAI deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed. Please install it first:"
    echo "npm i -g vercel"
    exit 1
fi

# Check if user is logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo "❌ You're not logged in to Vercel. Please login first:"
    echo "vercel login"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found. Please create it with your environment variables."
    exit 1
fi

# Build the application
echo "📦 Building application..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

# Check deployment status
if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set environment variables in Vercel dashboard"
    echo "2. Configure your domain (optional)"
    echo "3. Set up WhatsApp webhook URL in Meta dashboard"
    echo "4. Test your deployed application"
    echo ""
    echo "📖 Check the README.md for detailed setup instructions"
else
    echo "❌ Deployment failed. Please check the errors above."
    exit 1
fi