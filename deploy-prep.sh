#!/bin/bash
# Quick deployment preparation script

echo "🚀 Preparing StudyForge for deployment..."

# Check if we're in the right directory
if [ ! -d "client" ] || [ ! -d "server" ]; then
    echo "❌ Error: Run this script from the StudyForge root directory"
    exit 1
fi

echo "📦 Installing dependencies..."

# Install frontend dependencies
cd client
bun install
cd ..

# Install backend dependencies  
cd server
bun install
cd ..

echo "🏗️ Building frontend..."
cd client
bun run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
else
    echo "❌ Frontend build failed"
    exit 1
fi

cd ..

echo "✅ Ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git add . && git commit -m 'Deploy' && git push"
echo "2. Deploy frontend to Vercel (see DEPLOYMENT.md)"
echo "3. Deploy backend to Render (see DEPLOYMENT.md)"
echo ""
echo "📖 Full guide: DEPLOYMENT.md"
