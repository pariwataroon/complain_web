# Python FastAPI - Complaint Management System

## Getting Started

To get started with this template, simply paste this command into your terminal:

```bash
git clone https://gitlab.com/minertablochchain1/capts_mof_api.git
cd capts_mof_api
python -m venv venv
```

## Environment Setup

### Windows

```bash
venv\Scripts\activate
```

### macOS/Linux

```bash
source venv/bin/activate
```

### Library Install

```bash
pip install -r requirements.txt
```

## Development

To start the development server run:

```bash
uvicorn main:app --reload
```

### Development Tools

```bash
# Test worker locally
python workers/complaint_worker.py

# Check worker status
python app/services/check_worker_status.py

# View real-time dashboard
python app/services/status_dashboard.py
```

## Project Structure

```
capts_mof_api/
├── app/
│   ├── api/v1/routers/
│   │   └── health_router.py           # Health check API
│   └── services/
│       ├── monitor.py                 # Auto-restart monitor
│       ├── status_dashboard.py        # Real-time dashboard
│       ├── check_worker_status.py     # Worker status checker
│       └── complaint_queue_service.py # Queue service class
├── workers/
│   ├── complaint_worker.py            # Main worker process
│   └── start_worker.py               # Worker launcher
├── config/
│   ├── database.py                   # Database config
│   └── dotenv.py                     # Environment config
├── models/                           # SQLAlchemy models
├── main.py                          # FastAPI main app
└── README.md                        # This file
```

## Production Deployment

### Prerequisites

Ensure the following services are running:

1. **SQL Server Database** - Configure connection in `.env`
2. **RabbitMQ Server** - Message broker for async processing

```bash
# Start RabbitMQ (Ubuntu/Debian)
sudo systemctl start rabbitmq-server
sudo systemctl enable rabbitmq-server

# Or using Docker
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 -e RABBITMQ_DEFAULT_USER=admin -e RABBITMQ_DEFAULT_PASS=admin123 rabbitmq:3-management
```

### Production Setup

#### 1. Configure Health Check

Add this line to your `main.py`:

```python
# Import health router
from app.api.v1.routers import health_router

# Add health check routes
app.include_router(health_router.router, prefix="/api/v1", tags=["health"])
```

#### 2. Start Production Services

```bash
# Start FastAPI server
nohup uvicorn main:app --host 0.0.0.0 --port 8000 > api.log 2>&1 &

# Start complaint processing worker
nohup python workers/complaint_worker.py > worker.log 2>&1 &
```

#### 3. Start Monitoring (Optional)

```bash
# Start auto-restart monitor
nohup python app/services/monitor.py > monitor.log 2>&1 &
```

#### 4. Health Check & Status

```bash
# Check system health
curl http://localhost:8000/api/v1/health

# Simple health check (for load balancers)
curl http://localhost:8000/api/v1/health/simple

# Interactive status dashboard
python app/services/status_dashboard.py
```

## Service Management

### Check Running Services

```bash
# Check API server
ps aux | grep uvicorn

# Check worker process
ps aux | grep complaint_worker

# Check monitor process
ps aux | grep monitor.py

# Check open ports
netstat -tulpn | grep :8000
netstat -tulpn | grep :5672
```

### Stop Services

```bash
# Stop API server
pkill -f uvicorn

# Stop worker
pkill -f complaint_worker

# Stop monitor
pkill -f monitor.py
```

### View Logs

```bash
# API logs
tail -f api.log

# Worker logs
tail -f worker.log

# Monitor logs
tail -f monitor.log

# RabbitMQ logs
sudo tail -f /var/log/rabbitmq/rabbit@hostname.log
```

## Monitoring & Health Check

### Health Check Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/health` | Full system health check |
| `GET /api/v1/health/simple` | Simple health check for load balancers |

### Health Check Response

The health check endpoint returns:

```json
{
  "timestamp": "2025-05-28T12:00:00",
  "status": "healthy",
  "services": {
    "database": {
      "status": "up",
      "response_time_ms": 5
    },
    "rabbitmq": {
      "status": "up",
      "messages_pending": 0,
      "consumers": 1
    },
    "worker": {
      "status": "up",
      "last_heartbeat": "2025-05-28T12:00:00",
      "processed_today": 15
    }
  }
}
```

### Monitoring Tools

```bash
# Real-time dashboard
python app/services/status_dashboard.py

# Check worker status
python app/services/check_worker_status.py

# Auto-restart monitor
python app/services/monitor.py
```

## System Architecture

```
Frontend → FastAPI → RabbitMQ → Worker → Database
                ↓
           Health Check API
                ↓
            Monitor Script
```

### Components

- **FastAPI**: REST API server with async request handling
- **RabbitMQ**: Message queue for async complaint processing
- **Worker**: Background complaint processor with auto-restart
- **Health Check**: System monitoring and status endpoints
- **Monitor**: Auto-restart failed services and alerting
- **Dashboard**: Real-time system status visualization

## Features

✅ **Async Processing** - Non-blocking complaint creation via RabbitMQ  
✅ **Health Monitoring** - Real-time system status checking  
✅ **Auto-restart** - Automatic worker recovery on failures  
✅ **Production Ready** - Optimized logging and error handling  
✅ **Scalable** - Multiple workers can run simultaneously  
✅ **Monitoring Dashboard** - Visual system status interface  

## Troubleshooting

### Worker Not Processing Messages

1. Check worker is running: `ps aux | grep complaint_worker`
2. Check worker logs: `tail -f worker.log`
3. Check RabbitMQ queue: Visit http://localhost:15672 (admin/admin123)
4. Restart worker: `pkill -f complaint_worker && nohup python workers/complaint_worker.py > worker.log 2>&1 &`

### Database Connection Issues

1. Check database server status
2. Verify connection string in `.env`
3. Test connection: `python -c "from config.database import create_db_session; db = create_db_session(); print('OK')"`

### RabbitMQ Connection Issues

1. Check RabbitMQ service: `sudo systemctl status rabbitmq-server`
2. Check RabbitMQ management: http://localhost:15672
3. Verify RABBITMQ_URL in `.env`
4. Test connection: `python app/services/check_worker_status.py`

### API Server Issues

1. Check if port 8000 is available: `netstat -tulpn | grep :8000`
2. Check API logs: `tail -f api.log`
3. Test API health: `curl http://localhost:8000/api/v1/health/simple`

## Configuration

### Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL=mssql+pyodbc://username:password@server/database?driver=ODBC+Driver+18+for+SQL+Server

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# API Settings
SECRET_KEY=your-secret-key
DEBUG=false
```

### Production Checklist

- [ ] Database connection configured
- [ ] RabbitMQ server running
- [ ] Environment variables set
- [ ] Health check endpoint added to main.py
- [ ] SSL/TLS configured (if needed)
- [ ] Firewall rules configured
- [ ] Log rotation configured
- [ ] Backup strategy implemented

## Support

For issues and support:

1. Check the troubleshooting section above
2. Review logs in `api.log`, `worker.log`, and `monitor.log`
3. Use the health check API to identify failing components
4. Monitor system status with the dashboard

---

**Last Updated**: May 28, 2025  
**Version**: 1.0.0