# 🕌 Al-Quran API - Deploy Your Own Quran API

**Deploy a complete Quran API in under 5 minutes!** A modern RESTful API for accessing and analyzing the Holy Quran, designed for easy deployment on Cloudflare Workers.

## 🚀 One-Click Deployment

```bash
# Clone and deploy your own instance
git clone https://github.com/asrulmunir/al-quran-api.git
cd al-quran-api
./deploy.sh
```

**That's it!** Your Quran API will be live in minutes. 🎉

## 🌐 Live Demo API

**https://quran-api.asrulmunir.workers.dev**

## 📊 Features

- **Complete Quran Access**: All 114 chapters, 6,236 verses, 77,430+ words
- **Complete Translations**: English (Hilali-Khan), Malay (Basmeih), Chinese (Ma Jian), and Tamil (Jan Turst Foundation) from Tanzil.net
- **Advanced Arabic Search**: Unicode normalization and text processing
- **Multilingual Reverse Search**: Find verses by meaning in 4 languages
- **RESTful API**: JSON responses with CORS enabled
- **Global Performance**: Cloudflare edge deployment
- **Free Hosting**: 100K requests/day on Cloudflare's free tier
- **Easy Deployment**: One-click setup for anyone

## 🎯 Perfect For

### 🕌 **Masjids & Islamic Centers**
- Mobile apps for congregation
- Study group resources
- Khutbah preparation tools
- Website integration

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
| `GET /api/compare/{ch}/{v}` | Compare Arabic with translations | [/api/compare/1/1](https://quran-api.asrulmunir.workers.dev/api/compare/1/1) |
| `GET /api/translations` | List available translations | [/api/translations](https://quran-api.asrulmunir.workers.dev/api/translations) |
| `GET /api/search` | Search Arabic text | [/api/search?q=الله&normalize=true](https://quran-api.asrulmunir.workers.dev/api/search?q=الله&normalize=true&limit=5) |
| `GET /api/search/translation` | **🔍 Reverse search in translations** | [/api/search/translation?q=mercy&lang=en](https://quran-api.asrulmunir.workers.dev/api/search/translation?q=mercy&lang=en&limit=5) |
| `GET /api/stats` | Statistics | [/api/stats](https://quran-api.asrulmunir.workers.dev/api/stats) |
| `GET /api/LLM` | **LLM-friendly comprehensive guide** | [/api/LLM](https://quran-api.asrulmunir.workers.dev/api/LLM) |

## 🤖 AI/LLM Integration

### **Special LLM Endpoint: `/api/LLM`**
This API includes a special endpoint designed specifically for AI assistants and Large Language Models:

**https://quran-api.asrulmunir.workers.dev/api/LLM**

This endpoint provides:
- ✅ **Comprehensive API documentation** in LLM-friendly format
- ✅ **Detailed endpoint descriptions** with parameters and examples
- ✅ **Common use cases** and integration patterns
- ✅ **Best practices** for handling Quranic content
- ✅ **Islamic etiquette guidelines** for respectful handling
- ✅ **Code examples** in multiple programming languages
- ✅ **Response format specifications** and error handling

**Perfect for:**
- 🤖 **AI assistants** helping users with Quranic queries
- 🔧 **Automated tools** that need to understand the API structure
- 📚 **Documentation generators** and API explorers
- 🎯 **Integration planning** and development guidance

## 🔍 Search Parameters

### **Arabic Text Search (`/api/search`)**
- **`q`**: Search query (required)
- **`type`**: `exact` or `substring` (default: substring)
- **`normalize`**: `true`/`false` - Arabic text normalization
- **`limit`**: Maximum results (default: 50)

### **🔄 Reverse Search in Translations (`/api/search/translation`)**
Find verses by searching in English, Malay, Chinese, or Tamil translations - perfect for non-Arabic speakers!

- **`q`**: Search query in English, Malay, Chinese, or Tamil (required)
- **`lang`**: Language - `en` for English, `ms` for Malay, `zh` for Chinese, `ta` for Tamil (default: en)
- **`type`**: `exact` or `substring` (default: substring)
- **`limit`**: Maximum results (default: 50)
- **`include_arabic`**: Include Arabic text in results (default: true)

#### **Examples:**
```bash
# Find verses about mercy in English
/api/search/translation?q=mercy&lang=en

# Find verses about love in Malay
/api/search/translation?q=kasih&lang=ms

# Find verses about Allah in Chinese
/api/search/translation?q=真主&lang=zh

# Find verses about God in Tamil
/api/search/translation?q=அல்லாஹ்&lang=ta

# Exact word search for "forgiveness"
/api/search/translation?q=forgiveness&lang=en&type=exact
```

#### **Popular Search Terms:**
- **English**: mercy, forgiveness, guidance, paradise, prayer, faith, charity, patience
- **Malay**: kasih, ampun, petunjuk, syurga, solat, iman, sedekah, sabar
- **Chinese**: 真主, 慈悲, 宽恕, 引导, 天堂, 祈祷, 信仰, 施舍
- **Tamil**: அல்லாஹ், கருணை, மன்னிப்பு, வழிகாட்டுதல், சொர்க்கம், தொழுகை, நம்பிக்கை, தர்மம்

## 💻 Usage Examples

### JavaScript/Fetch
```javascript
// Replace with your deployed API URL
const API_BASE = 'https://your-api-name.your-account.workers.dev/api';

// Search for Allah in Arabic
fetch(`${API_BASE}/search?q=الله&normalize=true&limit=10`)
  .then(r => r.json())
  .then(data => console.log(`Found ${data.resultCount} verses`));

// Reverse search: Find verses about mercy in English
fetch(`${API_BASE}/search/translation?q=mercy&lang=en&limit=10`)
  .then(r => r.json())
  .then(data => {
    console.log(`Found ${data.resultCount} verses about mercy`);
    data.results.forEach(result => {
      console.log(`${result.chapterNumber}:${result.verseNumber} - ${result.translation.text}`);
    });
  });

// Get Al-Fatiha
fetch(`${API_BASE}/chapters/1`)
  .then(r => r.json())
  .then(chapter => console.log(chapter.verses));

// Compare translations
fetch(`${API_BASE}/compare/1/1`)
  .then(r => r.json())
  .then(data => {
    console.log('Arabic:', data.arabic.text);
    console.log('English:', data.translations['en.hilali'].text);
    console.log('Malay:', data.translations['ms.basmeih'].text);
  });
```

### cURL
```bash
# Replace with your API URL
curl "https://your-api-name.your-account.workers.dev/api/info"
curl "https://your-api-name.your-account.workers.dev/api/search?q=الله&limit=5"
curl "https://your-api-name.your-account.workers.dev/api/compare/2/255"

# Reverse search examples
curl "https://your-api-name.your-account.workers.dev/api/search/translation?q=mercy&lang=en&limit=5"
curl "https://your-api-name.your-account.workers.dev/api/search/translation?q=kasih&lang=ms&limit=5"
curl "https://your-api-name.your-account.workers.dev/api/search/translation?q=真主&lang=zh&limit=5"
curl "https://your-api-name.your-account.workers.dev/api/search/translation?q=அல்லாஹ்&lang=ta&limit=5"
```

### Python
```python
import requests

# Replace with your API URL
API_BASE = "https://your-api-name.your-account.workers.dev/api"

# Search verses in Arabic
response = requests.get(f"{API_BASE}/search", params={
    "q": "الله",
    "normalize": True,
    "limit": 10
})
data = response.json()
print(f"Found {data['resultCount']} verses")

# Reverse search: Find verses about forgiveness in English
response = requests.get(f"{API_BASE}/search/translation", params={
    "q": "forgiveness",
    "lang": "en",
    "limit": 10
})
data = response.json()
print(f"Found {data['resultCount']} verses about forgiveness")
for result in data['results']:
    print(f"{result['chapterNumber']}:{result['verseNumber']} - {result['translation']['text']}")

# Get verse with translations
response = requests.get(f"{API_BASE}/compare/1/1")
data = response.json()
print(f"Arabic: {data['arabic']['text']}")
print(f"English: {data['translations']['en.hilali']['text']}")
print(f"Malay: {data['translations']['ms.basmeih']['text']}")
```

## 📁 Project Structure

```
├── src/
│   ├── index.js          # Main Worker script
│   ├── quran-data.json   # Complete Quran data
│   └── translations/     # Translation files
│       ├── en.hilali.json    # English (Hilali-Khan)
│       └── ms.basmeih.json   # Malay (Basmeih)
├── scripts/
│   └── parse-xml-translations.js  # Translation parser
├── deploy.sh             # One-click deployment script
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

### Deploy API
```bash
npm install
wrangler deploy
```

## 💰 Cost Breakdown

### **Free Tier (Perfect for Most Users)**
- **Cloudflare Workers**: 100,000 requests/day
- **Custom Domain**: Free with Cloudflare
- **Total Cost: $0/month** 🎉

### **Paid Tier (High Traffic)**
- **Workers**: $5/month for 10M requests
- **Enterprise**: Custom pricing available

## 🔒 Security & Best Practices

- ✅ HTTPS by default
- ✅ CORS properly configured
- ✅ Rate limiting ready (optional)
- ✅ Environment variables support
- ✅ No sensitive data in code

## 📊 Data Source & Attribution

### **Quran Text**
- **Source**: [Tanzil.net](http://tanzil.net/) - Uthmani text
- **License**: [Creative Commons Attribution-NoDerivs 3.0 Unported (CC BY-ND 3.0)](https://creativecommons.org/licenses/by-nd/3.0/)
- **Attribution**: Quran text courtesy of Tanzil.net

### **Translations**
- **English**: Dr. Muhammad Taqi-ud-Din Al-Hilali and Dr. Muhammad Muhsin Khan
- **Malay**: Abdullah Muhammad Basmeih
- **Chinese**: Ma Jian
- **Tamil**: Jan Turst Foundation
- **Source**: [Tanzil.net](http://tanzil.net/)
- **License**: Non-commercial use with attribution
- **Coverage**: Complete 114 chapters, 6,236 verses each

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
- 🔧 Deployment optimizations

## 🔧 Development

Originally converted from the Java JQuranTree library to JavaScript for Cloudflare Workers deployment.

### Key Technologies
- **Cloudflare Workers**: Serverless API hosting
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
