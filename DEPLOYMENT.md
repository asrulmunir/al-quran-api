# 🚀 Deploy Your Own Quran API on Cloudflare Workers

**Deploy a complete Quran API in under 5 minutes!** This guide helps anyone create their own instance of the JQuranTree API on Cloudflare Workers - completely free for most use cases.

## 🎯 What You'll Get

- ✅ **Complete Quran API**: All 114 chapters, 6,236 verses, 77,430+ words
- ✅ **Advanced Arabic Search**: Unicode normalization and text processing
- ✅ **Global Performance**: Sub-second response times worldwide
- ✅ **Beautiful Test Interface**: Mobile-responsive web interface
- ✅ **Free Hosting**: 100K requests/day on Cloudflare's free tier
- ✅ **Custom Domain**: Optional custom domain support

## 📋 Prerequisites

1. **GitHub Account** (free)
2. **Cloudflare Account** (free) - [Sign up here](https://dash.cloudflare.com/sign-up)
3. **Basic terminal/command line knowledge**

## 🚀 Quick Start (5 Minutes)

### Step 1: Fork & Clone
```bash
# Fork this repository on GitHub, then clone your fork
git clone https://github.com/asrulmunir/al-quran-api.git
cd al-quran-api
```

### Step 2: Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Install Wrangler CLI globally
npm install -g wrangler
```

### Step 3: Login to Cloudflare
```bash
# Login to your Cloudflare account
wrangler login
```

### Step 4: Configure Your API
```bash
# Edit wrangler.toml - change the name to something unique
# Example: quran-api-yourname or quran-api-masjid-name
```

### Step 5: Deploy API
```bash
# Deploy to Cloudflare Workers
wrangler deploy
```

### Step 6: Deploy Test Interface
```bash
# Deploy the web interface to Cloudflare Pages
wrangler pages deploy public --project-name=YOUR-PROJECT-NAME
```

## 🎉 That's It!

Your Quran API is now live! You'll get URLs like:
- **API**: `https://your-api-name.your-account.workers.dev`
- **Interface**: `https://your-project.pages.dev`

## 🔧 Customization Options

### 1. Custom Domain (Optional)
```bash
# Add your custom domain in Cloudflare Dashboard
# Example: api.yourmasjid.org
```

### 2. Branding Customization
Edit `public/index.html` to customize:
- Masjid/Organization name
- Colors and styling
- Contact information
- Additional languages

### 3. API Limits (Optional)
Edit `src/index.js` to add:
- Rate limiting
- API key authentication
- Custom CORS policies
- Analytics tracking

## 📊 Usage Examples

### JavaScript/Fetch
```javascript
// Your deployed API
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

## 🌍 Use Cases

### **For Masjids/Islamic Centers**
- Embed in your website
- Mobile apps for congregation
- Study group resources
- Khutbah preparation tools

### **For Developers**
- Islamic mobile applications
- Quran study websites
- Research projects
- Educational platforms

### **For Students/Researchers**
- Academic research
- Linguistic analysis
- Cross-referencing tools
- Personal study aids

## 💰 Cost Breakdown

### Cloudflare Workers (API)
- **Free Tier**: 100,000 requests/day
- **Paid**: $5/month for 10M requests
- **Enterprise**: Custom pricing

### Cloudflare Pages (Interface)
- **Free**: Unlimited static hosting
- **Custom domains**: Free with Cloudflare

### **Total Cost for Most Users: $0/month** 🎉

## 🔒 Security Best Practices

### 1. Environment Variables
```bash
# Add sensitive config via Wrangler
wrangler secret put API_KEY
wrangler secret put ADMIN_EMAIL
```

### 2. Rate Limiting (Optional)
```javascript
// Add to src/index.js
const RATE_LIMIT = 1000; // requests per hour per IP
```

### 3. CORS Configuration
```javascript
// Customize allowed origins in src/index.js
const ALLOWED_ORIGINS = ['https://yourwebsite.com'];
```

## 📈 Monitoring & Analytics

### Built-in Cloudflare Analytics
- Request volume and patterns
- Error rates and performance
- Geographic distribution
- Cache hit rates

### Custom Analytics (Optional)
```javascript
// Add to your API for detailed tracking
console.log(`Search: ${query} from ${request.cf.country}`);
```

## 🤝 Community & Support

### Contributing Back
- Share improvements via Pull Requests
- Report issues on GitHub
- Help others in discussions
- Translate to more languages

### Getting Help
1. Check the [Issues](https://github.com/original-repo/issues) page
2. Join community discussions
3. Read Cloudflare Workers documentation
4. Contact the maintainers

## 📚 Advanced Configuration

### Multi-language Support
```javascript
// Add more languages to the interface
const SUPPORTED_LANGUAGES = ['en', 'ms', 'ar', 'ur', 'tr'];
```

### Custom Search Features
```javascript
// Add specialized search functions
- Root word analysis
- Semantic search
- Audio verse lookup
- Translation integration
```

### API Extensions
```javascript
// Extend with additional endpoints
- /api/translations
- /api/audio
- /api/tafsir
- /api/analytics
```

## 🎯 Roadmap Ideas

- [ ] Multiple translation support
- [ ] Audio recitation integration
- [ ] Tafsir (commentary) API
- [ ] Advanced linguistic analysis
- [ ] Mobile app templates
- [ ] WordPress plugin
- [ ] Telegram bot template

## 📄 License & Attribution

### **Quran Text**
- **Source**: [Tanzil.net](http://tanzil.net/) - Uthmani text
- **License**: [Creative Commons Attribution-NoDerivs 3.0 Unported (CC BY-ND 3.0)](https://creativecommons.org/licenses/by-nd/3.0/)
- **Attribution**: Quran text courtesy of Tanzil.net
- **Important**: The Quran text may not be modified under this license

### **API Software**
- **License**: GPL-3.0 (same as original JQuranTree)
- **Attribution**: Please keep original credits when deploying

## 🕌 Serving the Ummah

By deploying your own Quran API, you're contributing to making Islamic knowledge more accessible worldwide. May Allah reward your efforts in serving the Muslim community.

**Barakallahu feekum** for spreading the light of the Quran! 🤲

---

**Need help?** Open an issue or start a discussion. The community is here to help! 💚
