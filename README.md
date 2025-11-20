# 📦 Component Storage

**Self-hosted electronic component inventory management system**

A professional, modern web application to manage your electronic components with visual storage mapping, powerful search, and smart organization.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)

---

## ✨ Features

### Core Functionality
- 📦 **Visual Storage Management** - Type 1 (dual partition) and Type 2 (uniform) containers
- 🔍 **Global Search** - Press `Ctrl+K` to search across all components
- 📊 **Dashboard** - Real-time statistics and low stock alerts
- 🏷️ **Rich Metadata** - Track specifications, datasheets, purchase links, and more
- 📸 **Image Upload** - Visual reference for each component
- 🎨 **Modern UI** - Dark mode, responsive design, professional aesthetics

### Smart Features
- 🚨 **Low Stock Alerts** - Configurable minimum quantity thresholds
- 🗺️ **Location Mapping** - Auto-generated tray addresses (A1, B2, BIG-C3)
- 📈 **Statistics** - Component counts, categories, storage utilization
- 💾 **Auto Backup** - Daily database backups at midnight
- 🔄 **Live Updates** - Real-time data synchronization

---

## 🚀 Quick Install

### One-Line Installation

```
curl -sSL https://raw.githubusercontent.com/JungleeAadmi/component-storage/main/scripts/install.sh | bash
```

### Requirements
- Debian/Ubuntu Linux (or any systemd-based distro)
- Node.js 18+ (auto-installed if missing)
- 100MB free disk space
- Port 3210 available

---

## 📖 Usage

### Access the Application
After installation, access at:
```
http://YOUR_SERVER_IP:3210

```

### Default Credentials
No authentication required (local network only)

### Keyboard Shortcuts
- `Ctrl+K` - Global search
- `Ctrl+N` - Add new component
- `Esc` - Close modals

---

## 🔧 Management

### Update Application

```
curl -sSL https://raw.githubusercontent.com/JungleeAadmi/component-storage/main/scripts/update.sh | bash
```

### Manual Backup

```
/opt/component-storage/scripts/backup.sh
```

### View Logs

```
journalctl -u component-storage -f
```

### Restart Service

```
sudo systemctl restart component-storage
```

### Uninstall

```
curl -sSL https://raw.githubusercontent.com/JungleeAadmi/component-storage/main/scripts/uninstall.sh | bash
```

---

## 📁 Data Locations

- **Application**: `/opt/component-storage/`
- **Database**: `/opt/component-storage/data/components.db`
- **Uploads**: `/opt/component-storage/uploads/`
- **Backups**: `/opt/component-storage/backups/`
- **Logs**: `journalctl -u component-storage`

---

## 🛠️ Development

### Local Development Setup

Clone repository
git clone https://github.com/JungleeAadmi/component-storage.git
cd component-storage

Install dependencies
npm run install:all

Create .env file
cp .env.example backend/.env

Run development servers
npm run dev


Frontend: http://localhost:5173  
Backend: http://localhost:3210

### Build for Production

```
npm run build
```

---

## 📦 Storage Types

### Type 1 (Dual Partition)
- Top: 5 rows × 6 columns (30 trays)
- Bottom: 3 rows × 3 columns (9 large trays)
- Addresses: `1A-5F` (top), `BIG-1A-BIG-3C` (bottom)

### Type 2 (Uniform)
- Single grid: 5 rows × 6 columns (30 trays)
- Addresses: `1A-5F`

### Custom
- Fully customizable row/column configuration

---

## 🗂️ Component Fields

Each component can track:
- Name & Category
- Quantity & Minimum Stock
- Value/Rating & Specifications
- Package Type
- Manufacturer & Part Number
- Purchase Link & Price
- Datasheet URL
- Storage Location
- Image
- Notes

---

## 🔒 Security Notes

This application is designed for **local network use only**.

For internet exposure:
1. Use a reverse proxy (Nginx/Caddy)
2. Add SSL certificate
3. Implement authentication
4. Configure firewall rules

---

## 📊 Technology Stack

- **Backend**: Node.js + Express + SQLite3
- **Frontend**: React + Vite + TailwindCSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **State**: React Query
- **Routing**: React Router

---

## 🤝 Contributing

This is a personal project, but suggestions are welcome!

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file

---

## 🙏 Acknowledgments

Built with modern tools and best practices for the electronics enthusiast community.

---

## 📧 Support

For issues or questions, open an issue on GitHub.

---

**Happy Component Organizing! 🎉**




