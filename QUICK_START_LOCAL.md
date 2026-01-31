# SmartFactory CONNECT - Quick Start Local Network

Huong dan nhanh 5 phut de chay he thong trong mang LAN.

---

## QUICK START (5 PHUT)

### Buoc 1: Cap nhat IP (30 giay)

Windows (PowerShell):
```powershell
cd SmartFactory_CONNECT_Web
.\scripts\update-local-ip.ps1
```

macOS/Linux:
```bash
cd SmartFactory_CONNECT_Web
chmod +x scripts/update-local-ip.sh
./scripts/update-local-ip.sh
```

### Buoc 2: Khoi dong Docker (2-3 phut)

```bash
# Dung docker-compose cho local network
docker-compose -f docker-compose.local.yml up -d

# Hoac neu da co images
docker-compose -f docker-compose.local.yml up -d --no-build
```

### Buoc 3: Kiem tra (30 giay)

```bash
# Xem status
docker-compose -f docker-compose.local.yml ps

# Xem IP va URLs
cat LOCAL_NETWORK_INFO.txt
```

### Buoc 4: Truy cap

Mo browser va truy cap: `http://<YOUR_IP>` (xem trong LOCAL_NETWORK_INFO.txt)

---

## KET NOI MOBILE APP

1. Mo file `LOCAL_NETWORK_INFO.txt` de xem IP
2. Trong Flutter app, import `local_network_config.dart`
3. Build va run app
4. Dam bao dien thoai cung WiFi voi server

---

## KHI DOI MANG WIFI

```bash
# 1. Chay script cap nhat IP
./scripts/update-local-ip.sh  # Mac
.\scripts\update-local-ip.ps1  # Windows

# 2. Restart services
docker-compose -f docker-compose.local.yml restart backend frontend

# 3. Rebuild mobile app neu can
```

---

## TROUBLESHOOTING NHANH

### Khong ket noi duoc tu thiet bi khac?

1. Kiem tra cung WiFi: Tat ca phai cung mang
2. Kiem tra Firewall: Mo ports 80, 3000, 8001
3. Kiem tra Docker: `docker-compose ps` phai thay "0.0.0.0:xxxx"
4. Chay lai script: `./scripts/update-local-ip.sh`

### CORS Error?

```bash
# Restart backend sau khi update IP
docker-compose -f docker-compose.local.yml restart backend
```

### Mobile app khong connect?

- Dam bao dung IP that (khong phai localhost)
- Kiem tra lai `local_network_config.dart`
- Rebuild app sau khi doi config

---

## PORTS SU DUNG

| Service | Port | URL |
|---------|------|-----|
| Web | 80 | http://YOUR_IP |
| Backend API | 3000 | http://YOUR_IP:3000 |
| RAG Service | 8001 | http://YOUR_IP:8001 |
| PostgreSQL | 5432 | YOUR_IP:5432 |
| MongoDB | 27017 | YOUR_IP:27017 |

---

## COMMANDS HUU ICH

```bash
# Xem logs
docker-compose -f docker-compose.local.yml logs -f

# Xem logs 1 service
docker-compose -f docker-compose.local.yml logs -f backend

# Restart tat ca
docker-compose -f docker-compose.local.yml restart

# Dung he thong
docker-compose -f docker-compose.local.yml stop

# Xoa va khoi dong lai
docker-compose -f docker-compose.local.yml down
docker-compose -f docker-compose.local.yml up -d
```

---

Xem huong dan chi tiet: docs/LOCAL_NETWORK_SETUP_GUIDE.md
