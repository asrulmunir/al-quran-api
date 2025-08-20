# 🕌 Al-Quran API - Deploy Your Own Quran API

**Deploy a complete Quran API in under 5 minutes!** A modern RESTful API for accessing and analyzing the Holy Quran, designed for easy deployment on Cloudflare Workers.

## 💻 Cross-Platform Compatibility

✅ **Windows 10/11**: PowerShell, Command Prompt, or WSL  
✅ **macOS**: Terminal with bash/zsh  
✅ **Linux**: Any distribution with bash  
✅ **Node.js**: Version 16+ required  
✅ **Git**: Required for cloning  

### **Prerequisites**
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Git](https://git-scm.com/)
- [Cloudflare Account](https://dash.cloudflare.com/sign-up) (free)

## 🚀 One-Click Deployment

### **macOS/Linux**
```bash
# Clone and deploy your own instance
git clone https://github.com/asrulmunir/al-quran-api.git
cd al-quran-api

# Option 1: Smart deployment with conflict handling (recommended)
./deploy-smart.sh

# Option 2: Standard deployment
./deploy.sh

# Option 3: macOS-optimized
./deploy-macos.sh

# Option 4: Maximum stability with error handling
./deploy-stable.sh

# Option 5: Simple deployment without advanced features
./deploy-simple.sh
```

### **Windows (PowerShell)**
```powershell
# Clone and deploy your own instance
git clone https://github.com/asrulmunir/al-quran-api.git
cd al-quran-api
.\deploy.ps1
```

### **Windows (Command Prompt)**
```cmd
# Clone and deploy your own instance
git clone https://github.com/asrulmunir/al-quran-api.git
cd al-quran-api
deploy.bat
```

**That's it!** Your Quran API will be live in minutes. 🎉

## 🌐 Live Demo

### 🔧 API Service (Cloudflare Workers)
**https://quran-api.asrulmunir.workers.dev**

### 🌐 Test Interface (Cloudflare Pages)
**https://quran-api-test.pages.dev**

## 📊 Features

- **Complete Quran Access**: All 114 chapters, 6,236 verses, 77,430+ words
- **Advanced Arabic Search**: Unicode normalization and text processing
- **RESTful API**: JSON responses with CORS enabled
- **Global Performance**: Cloudflare edge deployment
- **Beautiful Interface**: Mobile-responsive with Arabic font rendering
- **Free Hosting**: 100K requests/day on Cloudflare's free tier
- **Easy Deployment**: One-click setup for anyone

## 🎯 Perfect For

### 🕌 **Masjids & Islamic Centers**
- Embed in your website
- Mobile apps for congregation
- Study group resources
- Khutbah preparation tools

### 👨‍💻 **Developers**
- Islamic mobile applications
- Quran study websites
- Research projects
- Educational platforms

### 📚 **Students & Researchers**
- Academic research
- Linguistic analysis
- Cross-referencing tools
- Personal study aids

## 🚀 API Endpoints

| Endpoint | Description | Example |
|----------|-------------|---------|
| `GET /api/info` | Basic Quran statistics | [/api/info](https://quran-api.asrulmunir.workers.dev/api/info) |
| `GET /api/chapters` | List all chapters | [/api/chapters](https://quran-api.asrulmunir.workers.dev/api/chapters) |
| `GET /api/chapters/{id}` | Get specific chapter | [/api/chapters/1](https://quran-api.asrulmunir.workers.dev/api/chapters/1) |
| `GET /api/verses/{ch}/{v}` | Get specific verse | [/api/verses/2/255](https://quran-api.asrulmunir.workers.dev/api/verses/2/255) |
| `GET /api/search` | Search text | [/api/search?q=الله&normalize=true](https://quran-api.asrulmunir.workers.dev/api/search?q=الله&normalize=true&limit=5) |
| `GET /api/stats` | Statistics | [/api/stats](https://quran-api.asrulmunir.workers.dev/api/stats) |

## 🔍 Search Parameters

- **`q`**: Search query (required)
- **`type`**: `exact` or `substring` (default: substring)
- **`normalize`**: `true`/`false` - Arabic text normalization
- **`limit`**: Maximum results (default: 50)

## 💻 Usage Examples

### JavaScript/Fetch
```javascript
// Replace with your deployed API URL
const API_BASE = 'https://your-api-name.your-account.workers.dev/api';

// Search for Allah
fetch(`${API_BASE}/search?q=الله&normalize=true&limit=10`)
  .then(r => r.json())
  .then(data => console.log(`Found ${data.resultCount} verses`));

// Get Al-Fatiha
fetch(`${API_BASE}/chapters/1`)
  .then(r => r.json())
  .then(chapter => console.log(chapter.verses));
```

### cURL
```bash
# Replace with your API URL
curl "https://your-api-name.your-account.workers.dev/api/info"
curl "https://your-api-name.your-account.workers.dev/api/search?q=الله&limit=5"
```

### Python
```python
import requests

# Replace with your API URL
API_BASE = "https://your-api-name.your-account.workers.dev/api"

# Search verses
response = requests.get(f"{API_BASE}/search", params={
    "q": "الله",
    "normalize": True,
    "limit": 10
})
data = response.json()
print(f"Found {data['resultCount']} verses")
```

## 📁 Project Structure

```
├── src/
│   ├── index.js          # Main Worker script
│   └── quran-data.json   # Complete Quran data
├── public/
│   ├── index.html        # Test interface
│   └── _redirects        # Pages redirects
├── deploy.sh             # One-click deployment script
├── DEPLOYMENT.md         # Detailed deployment guide
├── package.json          # Dependencies
├── wrangler.toml         # Workers config
└── README.md            # This file
```

## 🛠️ Manual Deployment

If you prefer manual deployment:

### Prerequisites
```bash
npm install -g wrangler
wrangler login
```

### Deploy API (Workers)
```bash
npm install
wrangler deploy
```

### Deploy Test Interface (Pages)
```bash
wrangler pages deploy public --project-name=your-project-name
```

## 💰 Cost Breakdown

### **Free Tier (Perfect for Most Users)**
- **Cloudflare Workers**: 100,000 requests/day
- **Cloudflare Pages**: Unlimited static hosting
- **Custom Domain**: Free with Cloudflare
- **Total Cost: $0/month** 🎉

### **Paid Tier (High Traffic)**
- **Workers**: $5/month for 10M requests
- **Pages**: Still free
- **Enterprise**: Custom pricing available

## 🔒 Security & Best Practices

- ✅ HTTPS by default
- ✅ CORS properly configured
- ✅ Rate limiting ready (optional)
- ✅ Environment variables support
- ✅ No sensitive data in code
- ✅ **Subdomain conflict handling** - automatic retry with new names
- ✅ **Input validation** - prevents invalid project names

## ⚠️ Common Issues & Solutions

### **Subdomain Already Taken**
If you see errors like "subdomain already taken" or "name already exists":

```bash
# Use the smart deployment script (handles conflicts automatically)
./deploy-smart.sh

# Or manually choose unique names:
# Instead of: quran-api
# Try: quran-api-masjid, quran-api-2024, my-quran-api
```

### **Name Requirements**
- **Workers**: Only letters, numbers, and hyphens (max 63 characters)
- **Pages**: Only letters, numbers, and hyphens
- **Avoid**: Special characters, spaces, underscores

### **Deployment Failures**
```bash
# Check your internet connection
# Ensure you're logged into Cloudflare: wrangler login
# Try a different name if subdomain conflicts occur
# Use deploy-smart.sh for automatic conflict resolution
```

## 📊 Data Source & Attribution

### **Quran Text**
- **Source**: [Tanzil.net](http://tanzil.net/) - Uthmani text
- **License**: [Creative Commons Attribution-NoDerivs 3.0 Unported (CC BY-ND 3.0)](https://creativecommons.org/licenses/by-nd/3.0/)
- **Attribution**: Quran text courtesy of Tanzil.net
- **Accuracy**: Carefully verified and monitored text
- **Note**: The Quran text is provided under Creative Commons license and may not be modified

### **API Software**
- **License**: GPL-3.0 (maintaining compatibility with original JQuranTree project)
- **Attribution**: Based on JQuranTree library, adapted for Cloudflare Workers
- **Open Source**: Available for anyone to deploy and customize

## 🎯 Performance

- **Response Time**: Sub-second globally
- **Availability**: 99.9%+ uptime
- **Scalability**: Automatic scaling
- **Global**: 200+ edge locations worldwide

## 🌍 Community Impact

### **Current Deployments**
Help us track community deployments! If you deploy your own instance:
1. ⭐ Star this repository
2. 🍴 Fork for your customizations
3. 📝 Share your deployment in Discussions
4. 🤝 Contribute improvements back

### **Success Stories**
- Masjids using for congregation apps
- Students using for research projects
- Developers building Islamic applications
- Researchers conducting linguistic analysis

## 🤝 Contributing

We welcome contributions that help more people deploy their own Quran APIs:

- 🐛 Bug fixes and improvements
- 📚 Documentation enhancements
- 🌐 Translation additions
- 🎨 Interface improvements
- 🔧 Deployment optimizations

## 📚 Documentation

- **[Deployment Guide](DEPLOYMENT.md)**: Comprehensive setup instructions
- **[API Documentation](https://quran-api.asrulmunir.workers.dev/api)**: Complete API reference
- **[Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)**: Platform documentation

## 🔧 Development

Originally converted from the Java JQuranTree library to JavaScript for Cloudflare Workers deployment.

### Key Technologies
- **Cloudflare Workers**: Serverless API hosting
- **Cloudflare Pages**: Static site hosting
- **JavaScript ES6+**: Modern syntax and features
- **Arabic Unicode**: Proper text processing and normalization

## 📄 License

GPL-3.0 License - maintaining compatibility with original JQuranTree project.

## 🕌 Vision

**Making Quranic technology accessible to everyone.** Our vision is to enable every masjid, Islamic center, developer, and researcher to have their own Quran API instance, fostering innovation in Islamic technology and making the Holy Quran more accessible worldwide.

## 🤲 Islamic Etiquette

This project handles the Holy Quran with utmost respect:
- Accurate Uthmani text from trusted sources
- Proper Arabic text processing and display
- Respectful API design and documentation
- Community-driven improvements and verification

---

**🕌 Built with respect for the Holy Quran and the global Muslim community**

**Deploy your own instance today and join the mission of making Islamic knowledge more accessible!** 🚀

**Barakallahu feekum** 🤲