#!/bin/bash
set -e

echo "🐳 Step 1: Building Docker images..."
docker build -t todo-backend:latest ./backend
echo "✅ Backend image built"
docker build -t todo-frontend:latest ./frontend
echo "✅ Frontend image built"

echo ""
echo "☸️  Step 2: Applying Kubernetes manifests..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

echo ""
echo "⏳ Step 3: Waiting for pods to be ready..."
kubectl wait --namespace todo-app \
  --for=condition=ready pod \
  --selector=app=postgres \
  --timeout=120s

kubectl wait --namespace todo-app \
  --for=condition=ready pod \
  --selector=app=backend \
  --timeout=120s

echo ""
echo "📋 Step 4: Pod Status:"
kubectl get pods -n todo-app
echo ""
echo "🌐 Services:"
kubectl get services -n todo-app

echo ""
echo "🎉 DONE! Your app is running at:"
echo "   Frontend → http://localhost:30001"
echo "   Backend  → http://localhost:30000"
