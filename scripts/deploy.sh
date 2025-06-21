#!/bin/bash

# Templation Railway Deployment Helper
set -e

echo "🚀 Templation Railway Deployment Helper"
echo "========================================"

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in to Railway
if ! railway status &> /dev/null; then
    echo "🔐 Please login to Railway first:"
    railway login
fi

echo ""
echo "📋 Pre-deployment Checklist:"
echo "- [ ] GitHub repository created and pushed"
echo "- [ ] Auth0 account set up"
echo "- [ ] GitHub personal access token generated"
echo ""

read -p "Have you completed the checklist above? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please complete the checklist and run this script again."
    exit 1
fi

echo ""
echo "🏗️  Creating Railway project..."

# Create new project
railway create templation

echo ""
echo "✅ Railway project created!"
echo ""
echo "📝 Next steps:"
echo "1. Go to your Railway dashboard: https://railway.app/dashboard"
echo "2. Follow the DEPLOYMENT.md guide to:"
echo "   - Add Redis database"
echo "   - Deploy backend service (root: backend/)"
echo "   - Deploy frontend service (root: frontend/)"
echo "   - Configure environment variables"
echo "   - Set up Auth0"
echo ""
echo "🔗 Useful commands:"
echo "   railway open          # Open project dashboard"
echo "   railway logs          # View logs"
echo "   railway variables     # Manage environment variables"
echo ""
echo "📖 Full deployment guide: ./DEPLOYMENT.md"
echo ""
echo "Happy deploying! 🎉" 