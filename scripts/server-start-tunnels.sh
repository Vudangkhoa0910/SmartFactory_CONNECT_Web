#!/bin/bash
# SmartFactory Database Tunnels Manager
# Usage: ./start-tunnels.sh [start|stop|status|restart]

ACTION=${1:-start}
LOG_DIR=~/smartfactory-db

case $ACTION in
  start)
    echo "🚀 Starting SmartFactory Database Tunnels..."
    pkill -f "bore local" 2>/dev/null
    sleep 1
    
    nohup ~/bore local 5432 --to bore.pub > $LOG_DIR/bore-pg.log 2>&1 &
    sleep 2
    PG_PORT=$(grep "listening at" $LOG_DIR/bore-pg.log | tail -1 | grep -oP ":\K\d+")
    
    nohup ~/bore local 27018 --to bore.pub > $LOG_DIR/bore-mongo.log 2>&1 &
    sleep 2
    MONGO_PORT=$(grep "listening at" $LOG_DIR/bore-mongo.log | tail -1 | grep -oP ":\K\d+")
    
    echo ""
    echo "✅ Tunnels Started!"
    echo "   PostgreSQL: bore.pub:$PG_PORT"
    echo "   MongoDB:    bore.pub:$MONGO_PORT"
    ;;
    
  stop)
    echo "🛑 Stopping tunnels..."
    pkill -f "bore local"
    echo "✅ Tunnels stopped"
    ;;
    
  status)
    echo "📊 Tunnel Status:"
    if pgrep -f "bore local" > /dev/null; then
      echo "   Status: ✅ Running"
      PG=$(grep "listening at" $LOG_DIR/bore-pg.log 2>/dev/null | tail -1)
      MONGO=$(grep "listening at" $LOG_DIR/bore-mongo.log 2>/dev/null | tail -1)
      echo "   PostgreSQL: $PG"
      echo "   MongoDB:    $MONGO"
    else
      echo "   Status: ❌ Not running"
    fi
    echo ""
    echo "📦 Docker Containers:"
    docker ps --format "   {{.Names}}: {{.Status}}" | grep smartfactory
    ;;
    
  restart)
    $0 stop
    sleep 2
    $0 start
    ;;
    
  *)
    echo "Usage: $0 {start|stop|status|restart}"
    ;;
esac
