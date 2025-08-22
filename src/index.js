// JQuranTree API for Cloudflare Workers
import quranData from './quran-data.json';
import enHilali from './translations/en.hilali.json';
import msBasmeih from './translations/ms.basmeih.json';
import zhJian from './translations/zh.jian.json';
import taTamil from './translations/ta.tamil.json';

// Available translations
const translations = {
  'en.hilali': enHilali,
  'ms.basmeih': msBasmeih,
  'zh.jian': zhJian,
  'ta.tamil': taTamil
};

// Unicode normalization utilities for Arabic text
class ArabicTextUtils {
  // Normalize Arabic text for better searching
  static normalize(text) {
    return text
      // Normalize different forms of Alif
      .replace(/[آأإٱ]/g, 'ا')
      // Normalize Teh Marbuta
      .replace(/ة/g, 'ه')
      // Remove diacritics for basic search
      .replace(/[\u064B-\u065F\u0670\u0671]/g, '')
      // Normalize spaces
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }
  
  // Remove all diacritics
  static removeDiacritics(text) {
    return text.replace(/[\u064B-\u065F\u0670]/g, '');
  }
}

// Core classes converted from Java
class Document {
  static getName() {
    return quranData.name;
  }
  
  static getChapterCount() {
    return quranData.chapters.length;
  }
  
  static getVerseCount() {
    return quranData.chapters.reduce((total, chapter) => total + chapter.verses.length, 0);
  }
  
  static getTokenCount() {
    return quranData.chapters.reduce((total, chapter) => {
      return total + chapter.verses.reduce((verseTotal, verse) => {
        return verseTotal + verse.text.split(/\s+/).filter(t => t.length > 0).length;
      }, 0);
    }, 0);
  }
  
  static getChapter(chapterNumber) {
    const chapter = quranData.chapters.find(ch => ch.number === chapterNumber);
    return chapter ? new Chapter(chapter) : null;
  }
  
  static getVerse(chapterNumber, verseNumber) {
    const chapter = this.getChapter(chapterNumber);
    return chapter ? chapter.getVerse(verseNumber) : null;
  }
  
  static getAllChapters() {
    return quranData.chapters.map(ch => new Chapter(ch));
  }
  
  static searchText(query, options = {}) {
    const results = [];
    const normalizedQuery = options.normalize ? ArabicTextUtils.normalize(query) : query;
    const exactMatch = options.exact || false;
    const caseSensitive = options.caseSensitive || false;
    
    for (const chapter of quranData.chapters) {
      for (const verse of chapter.verses) {
        let searchText = verse.text;
        
        if (options.normalize) {
          searchText = ArabicTextUtils.normalize(searchText);
        }
        
        if (!caseSensitive) {
          searchText = searchText.toLowerCase();
          query = query.toLowerCase();
        }
        
        let match = false;
        if (exactMatch) {
          const tokens = searchText.split(/\s+/);
          match = tokens.includes(normalizedQuery);
        } else {
          match = searchText.includes(normalizedQuery);
        }
        
        if (match) {
          results.push({
            chapterNumber: chapter.number,
            chapterName: chapter.name,
            verseNumber: verse.number,
            verseText: verse.text,
            location: `${chapter.number}:${verse.number}`
          });
        }
      }
    }
    
    return results;
  }
}

class Chapter {
  constructor(data) {
    this.data = data;
  }
  
  getNumber() {
    return this.data.number;
  }
  
  getName() {
    return this.data.name;
  }
  
  getVerseCount() {
    return this.data.verses.length;
  }
  
  getVerse(verseNumber) {
    const verse = this.data.verses.find(v => v.number === verseNumber);
    return verse ? new Verse(verse, this.data.number) : null;
  }
  
  getAllVerses() {
    return this.data.verses.map(v => new Verse(v, this.data.number));
  }
  
  getBismillah() {
    const firstVerse = this.data.verses[0];
    return firstVerse && firstVerse.bismillah ? firstVerse.bismillah : null;
  }
  
  getTokenCount() {
    return this.data.verses.reduce((total, verse) => {
      return total + verse.text.split(/\s+/).filter(t => t.length > 0).length;
    }, 0);
  }
}

class Verse {
  constructor(data, chapterNumber) {
    this.data = data;
    this.chapterNumber = chapterNumber;
  }
  
  getNumber() {
    return this.data.number;
  }
  
  getText() {
    return this.data.text;
  }
  
  getChapterNumber() {
    return this.chapterNumber;
  }
  
  getTokens() {
    return this.data.text.split(/\s+/).filter(t => t.length > 0).map((token, index) => new Token(token, this.chapterNumber, this.data.number, index + 1));
  }
  
  getLocation() {
    return `${this.chapterNumber}:${this.data.number}`;
  }
  
  getTokenCount() {
    return this.data.text.split(/\s+/).filter(t => t.length > 0).length;
  }
}

class Token {
  constructor(text, chapterNumber, verseNumber, tokenNumber) {
    this.text = text;
    this.chapterNumber = chapterNumber;
    this.verseNumber = verseNumber;
    this.tokenNumber = tokenNumber;
  }
  
  getText() {
    return this.text;
  }
  
  getChapterNumber() {
    return this.chapterNumber;
  }
  
  getVerseNumber() {
    return this.verseNumber;
  }
  
  getTokenNumber() {
    return this.tokenNumber;
  }
  
  getLocation() {
    return `${this.chapterNumber}:${this.verseNumber}:${this.tokenNumber}`;
  }
}

// Enhanced search functionality
class TokenSearch {
  constructor(options = {}) {
    this.searchTerms = [];
    this.options = options;
  }
  
  findSubstring(text) {
    this.searchTerms.push({ type: 'substring', text });
  }
  
  findToken(text) {
    this.searchTerms.push({ type: 'exact', text });
  }
  
  getResults() {
    const results = [];
    const seenLocations = new Set();
    
    for (const term of this.searchTerms) {
      const searchResults = Document.searchText(term.text, {
        exact: term.type === 'exact',
        normalize: this.options.normalize || false,
        caseSensitive: this.options.caseSensitive || false
      });
      
      for (const result of searchResults) {
        const locationKey = result.location;
        if (!seenLocations.has(locationKey)) {
          seenLocations.add(locationKey);
          
          const verse = Document.getVerse(result.chapterNumber, result.verseNumber);
          const tokens = verse.getTokens();
          
          // Find which token(s) matched
          const matchingTokens = tokens.filter(token => {
            const tokenText = this.options.normalize ? 
              ArabicTextUtils.normalize(token.getText()) : 
              token.getText();
            
            if (term.type === 'exact') {
              return tokenText === term.text;
            } else {
              return tokenText.includes(term.text);
            }
          });
          
          results.push({
            chapterNumber: result.chapterNumber,
            chapterName: result.chapterName,
            verseNumber: result.verseNumber,
            verseText: result.verseText,
            location: result.location,
            matchingTokens: matchingTokens.map(t => ({
              number: t.getTokenNumber(),
              text: t.getText(),
              location: t.getLocation()
            }))
          });
        }
      }
    }
    
    return results;
  }
}

// Main worker handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Cache-Control',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    };
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Helper function to add CORS headers
      const addCorsHeaders = (response) => {
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
        return response;
      };
      
      // GET /api/info - Basic information about the Quran
      if (path === '/api/info') {
        return addCorsHeaders(new Response(JSON.stringify({
          name: Document.getName(),
          chapterCount: Document.getChapterCount(),
          verseCount: Document.getVerseCount(),
          tokenCount: Document.getTokenCount(),
          version: "1.0.0",
          source: "Tanzil.info Uthmani text",
          sourceUrl: "http://tanzil.net/",
          license: "Creative Commons Attribution-NoDerivs 3.0 Unported (CC BY-ND 3.0)",
          licenseUrl: "https://creativecommons.org/licenses/by-nd/3.0/",
          attribution: "Quran text courtesy of Tanzil.net",
          features: ["search", "unicode", "arabic-normalization", "translations"],
          availableTranslations: Object.keys(translations).map(key => ({
            key: key,
            name: translations[key].name,
            translator: translations[key].translator,
            language: translations[key].language,
            language_name: translations[key].language_name
          }))
        }), {
          headers: { 'Content-Type': 'application/json' }
        }));
      }

      // GET /api/translations - List available translations
      if (path === '/api/translations') {
        const translationList = Object.keys(translations).map(key => ({
          key: key,
          name: translations[key].name,
          translator: translations[key].translator,
          language: translations[key].language,
          language_name: translations[key].language_name,
          source: translations[key].source
        }));
        
        return addCorsHeaders(new Response(JSON.stringify(translationList), {
          headers: { 'Content-Type': 'application/json' }
        }));
      }

      // GET /api/translations/{translation_key} - Get translation info
      const translationInfoMatch = path.match(/^\/api\/translations\/([^\/]+)$/);
      if (translationInfoMatch) {
        const translationKey = translationInfoMatch[1];
        const translation = translations[translationKey];
        
        if (!translation) {
          return addCorsHeaders(new Response(JSON.stringify({ 
            error: 'Translation not found',
            available: Object.keys(translations)
          }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        
        return addCorsHeaders(new Response(JSON.stringify({
          key: translationKey,
          name: translation.name,
          translator: translation.translator,
          language: translation.language,
          language_name: translation.language_name,
          source: translation.source,
          chapterCount: translation.chapters.length
        }), {
          headers: { 'Content-Type': 'application/json' }
        }));
      }

      // GET /api/translations/{translation_key}/chapters - Get translated chapters list
      const translationChaptersMatch = path.match(/^\/api\/translations\/([^\/]+)\/chapters$/);
      if (translationChaptersMatch) {
        const translationKey = translationChaptersMatch[1];
        const translation = translations[translationKey];
        
        if (!translation) {
          return addCorsHeaders(new Response(JSON.stringify({ 
            error: 'Translation not found',
            available: Object.keys(translations)
          }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        
        const chapters = translation.chapters.map(ch => ({
          number: ch.number,
          name: ch.name,
          name_arabic: ch.name_arabic,
          name_translation: ch.name_translation,
          verseCount: ch.verses.length
        }));
        
        return addCorsHeaders(new Response(JSON.stringify(chapters), {
          headers: { 'Content-Type': 'application/json' }
        }));
      }

      // GET /api/translations/{translation_key}/chapters/{id} - Get translated chapter
      const translationChapterMatch = path.match(/^\/api\/translations\/([^\/]+)\/chapters\/(\d+)$/);
      if (translationChapterMatch) {
        const translationKey = translationChapterMatch[1];
        const chapterNum = parseInt(translationChapterMatch[2]);
        const translation = translations[translationKey];
        
        if (!translation) {
          return addCorsHeaders(new Response(JSON.stringify({ 
            error: 'Translation not found',
            available: Object.keys(translations)
          }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        
        const chapter = translation.chapters.find(ch => ch.number === chapterNum);
        if (!chapter) {
          return addCorsHeaders(new Response(JSON.stringify({ error: 'Chapter not found' }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        
        return addCorsHeaders(new Response(JSON.stringify({
          translation: translationKey,
          number: chapter.number,
          name: chapter.name,
          name_arabic: chapter.name_arabic,
          name_translation: chapter.name_translation,
          verseCount: chapter.verses.length,
          verses: chapter.verses
        }), {
          headers: { 'Content-Type': 'application/json' }
        }));
      }

      // GET /api/translations/{translation_key}/verses/{chapterNum}/{verseNum} - Get translated verse
      const translationVerseMatch = path.match(/^\/api\/translations\/([^\/]+)\/verses\/(\d+)\/(\d+)$/);
      if (translationVerseMatch) {
        const translationKey = translationVerseMatch[1];
        const chapterNum = parseInt(translationVerseMatch[2]);
        const verseNum = parseInt(translationVerseMatch[3]);
        const translation = translations[translationKey];
        
        if (!translation) {
          return addCorsHeaders(new Response(JSON.stringify({ 
            error: 'Translation not found',
            available: Object.keys(translations)
          }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        
        const chapter = translation.chapters.find(ch => ch.number === chapterNum);
        if (!chapter) {
          return addCorsHeaders(new Response(JSON.stringify({ error: 'Chapter not found' }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        
        const verse = chapter.verses.find(v => v.number === verseNum);
        if (!verse) {
          return addCorsHeaders(new Response(JSON.stringify({ error: 'Verse not found' }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        
        return addCorsHeaders(new Response(JSON.stringify({
          translation: translationKey,
          chapterNumber: chapterNum,
          verseNumber: verseNum,
          text: verse.text,
          chapterName: chapter.name,
          chapterNameArabic: chapter.name_arabic,
          chapterNameTranslation: chapter.name_translation
        }), {
          headers: { 'Content-Type': 'application/json' }
        }));
      }

      // GET /api/compare/{chapterNum}/{verseNum} - Compare Arabic with translations
      const compareMatch = path.match(/^\/api\/compare\/(\d+)\/(\d+)$/);
      if (compareMatch) {
        const chapterNum = parseInt(compareMatch[1]);
        const verseNum = parseInt(compareMatch[2]);
        
        // Get Arabic verse
        const arabicVerse = Document.getVerse(chapterNum, verseNum);
        if (!arabicVerse) {
          return addCorsHeaders(new Response(JSON.stringify({ error: 'Verse not found' }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        
        // Get translations
        const translatedVerses = {};
        Object.keys(translations).forEach(key => {
          const translation = translations[key];
          const chapter = translation.chapters.find(ch => ch.number === chapterNum);
          if (chapter) {
            const verse = chapter.verses.find(v => v.number === verseNum);
            if (verse) {
              translatedVerses[key] = {
                text: verse.text,
                translator: translation.translator,
                language: translation.language,
                language_name: translation.language_name
              };
            }
          }
        });
        
        return addCorsHeaders(new Response(JSON.stringify({
          chapterNumber: chapterNum,
          verseNumber: verseNum,
          arabic: {
            text: arabicVerse.getText(),
            source: "Tanzil.net Uthmani"
          },
          translations: translatedVerses
        }), {
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // GET /api/chapters - List all chapters
      if (path === '/api/chapters') {
        const chapters = Document.getAllChapters().map(ch => ({
          number: ch.getNumber(),
          name: ch.getName(),
          verseCount: ch.getVerseCount(),
          tokenCount: ch.getTokenCount(),
          bismillah: ch.getBismillah()
        }));
        
        return addCorsHeaders(new Response(JSON.stringify(chapters), {
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // GET /api/chapters/{id} - Get specific chapter
      const chapterMatch = path.match(/^\/api\/chapters\/(\d+)$/);
      if (chapterMatch) {
        const chapter = Document.getChapter(parseInt(chapterMatch[1]));
        if (!chapter) {
          return addCorsHeaders(new Response(JSON.stringify({ error: 'Chapter not found' }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        
        return addCorsHeaders(new Response(JSON.stringify({
          number: chapter.getNumber(),
          name: chapter.getName(),
          verseCount: chapter.getVerseCount(),
          tokenCount: chapter.getTokenCount(),
          bismillah: chapter.getBismillah(),
          verses: chapter.getAllVerses().map(v => ({
            number: v.getNumber(),
            text: v.getText(),
            tokenCount: v.getTokenCount()
          }))
        }), {
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // GET /api/verses/{chapterNum}/{verseNum} - Get specific verse
      const verseMatch = path.match(/^\/api\/verses\/(\d+)\/(\d+)$/);
      if (verseMatch) {
        const verse = Document.getVerse(parseInt(verseMatch[1]), parseInt(verseMatch[2]));
        if (!verse) {
          return addCorsHeaders(new Response(JSON.stringify({ error: 'Verse not found' }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        
        return addCorsHeaders(new Response(JSON.stringify({
          chapterNumber: verse.getChapterNumber(),
          verseNumber: verse.getNumber(),
          text: verse.getText(),
          location: verse.getLocation(),
          tokenCount: verse.getTokenCount(),
          tokens: verse.getTokens().map(t => ({
            number: t.getTokenNumber(),
            text: t.getText(),
            location: t.getLocation()
          }))
        }), {
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // GET /api/search - Enhanced search endpoint
      if (path === '/api/search') {
        const query = url.searchParams.get('q');
        const type = url.searchParams.get('type') || 'substring'; // 'exact' or 'substring'
        const normalize = url.searchParams.get('normalize') === 'true';
        const limit = parseInt(url.searchParams.get('limit')) || 50;
        
        if (!query) {
          return addCorsHeaders(new Response(JSON.stringify({ 
            error: 'Query parameter "q" is required',
            usage: 'GET /api/search?q=الله&type=substring&normalize=true&limit=50'
          }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }));
        }
        
        const search = new TokenSearch({ normalize });
        if (type === 'exact') {
          search.findToken(query);
        } else {
          search.findSubstring(query);
        }
        
        const results = search.getResults();
        return addCorsHeaders(new Response(JSON.stringify({
          query,
          type,
          normalize,
          resultCount: results.length,
          results: results.slice(0, limit),
          hasMore: results.length > limit
        }), {
          headers: { 'Content-Type': 'application/json' }
        }));
      }

      // GET /api/search/translation - Search within translations (reverse search)
      if (path === '/api/search/translation') {
        const query = url.searchParams.get('q');
        const lang = url.searchParams.get('lang') || 'en'; // 'en', 'ms', 'zh', or 'ta'
        const type = url.searchParams.get('type') || 'substring'; // 'exact' or 'substring'
        const limit = parseInt(url.searchParams.get('limit')) || 50;
        const includeArabic = url.searchParams.get('include_arabic') !== 'false'; // default true
        
        if (!query) {
          return addCorsHeaders(new Response(JSON.stringify({ 
            error: 'Query parameter "q" is required',
            usage: 'GET /api/search/translation?q=mercy&lang=en&type=substring&limit=20',
            supportedLanguages: ['en', 'ms', 'zh', 'ta'],
            examples: {
              english: '/api/search/translation?q=forgiveness&lang=en',
              malay: '/api/search/translation?q=kasih&lang=ms',
              chinese: '/api/search/translation?q=真主&lang=zh',
              tamil: '/api/search/translation?q=கடவுள்&lang=ta'
            }
          }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }));
        }

        // Validate language
        const supportedLangs = ['en', 'ms', 'zh', 'ta'];
        if (!supportedLangs.includes(lang)) {
          return addCorsHeaders(new Response(JSON.stringify({ 
            error: `Unsupported language: ${lang}`,
            supportedLanguages: supportedLangs
          }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }));
        }

        // Get the appropriate translation key
        const translationKeyMap = {
          'en': 'en.hilali',
          'ms': 'ms.basmeih', 
          'zh': 'zh.jian',
          'ta': 'ta.tamil'
        };
        const translationKey = translationKeyMap[lang];
        const translation = translations[translationKey];
        
        if (!translation) {
          return addCorsHeaders(new Response(JSON.stringify({ 
            error: `Translation not available for language: ${lang}`,
            available: Object.keys(translations)
          }), { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }));
        }

        // Perform search in translation text
        const searchResults = [];
        const queryLower = query.toLowerCase();
        
        translation.chapters.forEach(chapter => {
          chapter.verses.forEach(verse => {
            const verseTextLower = verse.text.toLowerCase();
            let matches = false;
            
            if (type === 'exact') {
              // Split into words and check for exact word match
              const words = verseTextLower.split(/\s+/);
              matches = words.some(word => 
                word.replace(/[.,;:!?()[\]{}'"]/g, '') === queryLower
              );
            } else {
              // Substring search
              matches = verseTextLower.includes(queryLower);
            }
            
            if (matches) {
              const result = {
                chapterNumber: chapter.number,
                verseNumber: verse.number,
                chapterName: chapter.name,
                chapterNameArabic: chapter.name_arabic,
                translation: {
                  text: verse.text,
                  language: lang,
                  languageName: translation.language_name,
                  translator: translation.translator
                }
              };

              // Include Arabic text if requested
              if (includeArabic) {
                const arabicVerse = Document.getVerse(chapter.number, verse.number);
                if (arabicVerse) {
                  result.arabic = {
                    text: arabicVerse.getText(),
                    source: "Tanzil.net Uthmani"
                  };
                }
              }

              searchResults.push(result);
            }
          });
        });

        // Sort by chapter and verse number
        searchResults.sort((a, b) => {
          if (a.chapterNumber !== b.chapterNumber) {
            return a.chapterNumber - b.chapterNumber;
          }
          return a.verseNumber - b.verseNumber;
        });

        return addCorsHeaders(new Response(JSON.stringify({
          query,
          language: lang,
          languageName: translation.language_name,
          translator: translation.translator,
          searchType: type,
          includeArabic,
          resultCount: searchResults.length,
          results: searchResults.slice(0, limit),
          hasMore: searchResults.length > limit,
          searchInfo: {
            totalVerses: translation.chapters.reduce((sum, ch) => sum + ch.verses.length, 0),
            searchedIn: `${translation.name} by ${translation.translator}`
          }
        }), {
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // GET /api/stats - Statistics endpoint
      if (path === '/api/stats') {
        const chapters = Document.getAllChapters();
        const longestChapter = chapters.reduce((longest, current) => 
          current.getVerseCount() > longest.getVerseCount() ? current : longest
        );
        const shortestChapter = chapters.reduce((shortest, current) => 
          current.getVerseCount() < shortest.getVerseCount() ? current : shortest
        );
        
        return addCorsHeaders(new Response(JSON.stringify({
          totalChapters: Document.getChapterCount(),
          totalVerses: Document.getVerseCount(),
          totalTokens: Document.getTokenCount(),
          longestChapter: {
            number: longestChapter.getNumber(),
            name: longestChapter.getName(),
            verses: longestChapter.getVerseCount()
          },
          shortestChapter: {
            number: shortestChapter.getNumber(),
            name: shortestChapter.getName(),
            verses: shortestChapter.getVerseCount()
          },
          averageVersesPerChapter: Math.round(Document.getVerseCount() / Document.getChapterCount()),
          averageTokensPerVerse: Math.round(Document.getTokenCount() / Document.getVerseCount())
        }), {
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      // API documentation
      if (path === '/api' || path === '/' || path === '/api/') {
        const docs = {
          title: "Al-Quran API",
          description: "RESTful API for accessing and analyzing the Holy Quran",
          version: "1.0.0",
          source: "Tanzil.info Uthmani text",
          sourceUrl: "http://tanzil.net/",
          license: "Creative Commons Attribution-NoDerivs 3.0 Unported (CC BY-ND 3.0)",
          licenseUrl: "https://creativecommons.org/licenses/by-nd/3.0/",
          attribution: "Quran text courtesy of Tanzil.net",
          endpoints: {
            "GET /api/info": "Basic information about the Quran",
            "GET /api/stats": "Statistical information",
            "GET /api/chapters": "List all chapters",
            "GET /api/chapters/{id}": "Get specific chapter with all verses",
            "GET /api/verses/{chapterNum}/{verseNum}": "Get specific verse with tokens",
            "GET /api/search": "Search for text in the Quran"
          },
          searchParameters: {
            "q": "Search query (required)",
            "type": "Search type: 'exact' or 'substring' (default: substring)",
            "normalize": "Normalize Arabic text: true/false (default: false)",
            "limit": "Maximum results to return (default: 50)"
          },
          examples: {
            "Get Al-Fatiha": "/api/chapters/1",
            "Get Ayat al-Kursi": "/api/verses/2/255",
            "Search for Allah (normalized)": "/api/search?q=الله&normalize=true",
            "Search for Bismillah": "/api/search?q=بسم&type=substring",
            "Get statistics": "/api/stats"
          }
        };
        
        return addCorsHeaders(new Response(JSON.stringify(docs, null, 2), {
          headers: { 'Content-Type': 'application/json' }
        }));
      }

      // GET /api/LLM - LLM-friendly comprehensive API guide
      if (path === '/api/LLM') {
        const llmGuide = {
          "api_name": "Al-Quran API",
          "description": "Complete RESTful API for accessing the Holy Quran with Arabic text, English and Malay translations, and advanced search capabilities",
          "base_url": "https://quran-api.asrulmunir.workers.dev",
          "version": "1.0.0",
          "authentication": "None required - Public API",
          "rate_limits": "100,000 requests/day on free tier",
          "cors": "Enabled for all origins",
          
          "data_coverage": {
            "arabic_text": {
              "source": "Tanzil.net Uthmani text",
              "chapters": 114,
              "verses": 6236,
              "tokens": "77,430+",
              "license": "Creative Commons Attribution-NoDerivs 3.0"
            },
            "translations": {
              "english": {
                "key": "en.hilali",
                "name": "The Noble Quran - English Translation",
                "translator": "Dr. Muhammad Taqi-ud-Din Al-Hilali and Dr. Muhammad Muhsin Khan",
                "coverage": "Complete - all 114 chapters and 6,236 verses"
              },
              "malay": {
                "key": "ms.basmeih",
                "name": "Al-Quran - Terjemahan Bahasa Melayu",
                "translator": "Abdullah Muhammad Basmeih",
                "coverage": "Complete - all 114 chapters and 6,236 verses"
              },
              "chinese": {
                "key": "zh.jian",
                "name": "The Noble Quran - Chinese Translation",
                "translator": "Ma Jian",
                "coverage": "Complete - all 114 chapters and 6,236 verses"
              },
              "tamil": {
                "key": "ta.tamil",
                "name": "The Noble Quran - Tamil Translation",
                "translator": "Jan Turst Foundation",
                "coverage": "Complete - all 114 chapters and 6,236 verses"
              }
            }
          },

          "endpoints": {
            "basic_info": {
              "endpoint": "GET /api/info",
              "description": "Get basic statistics about the Quran",
              "parameters": "None",
              "example_url": "https://quran-api.asrulmunir.workers.dev/api/info",
              "response_fields": ["name", "chapterCount", "verseCount", "tokenCount", "version", "source", "license"],
              "use_cases": ["Get API overview", "Display Quran statistics", "Verify API availability"]
            },

            "list_chapters": {
              "endpoint": "GET /api/chapters",
              "description": "Get list of all 114 chapters with basic information",
              "parameters": "None",
              "example_url": "https://quran-api.asrulmunir.workers.dev/api/chapters",
              "response_fields": ["number", "name", "verseCount", "tokenCount", "bismillah"],
              "use_cases": ["Display chapter index", "Navigation menus", "Chapter selection interfaces"]
            },

            "get_chapter": {
              "endpoint": "GET /api/chapters/{id}",
              "description": "Get complete chapter with all verses in Arabic",
              "parameters": {
                "id": "Chapter number (1-114)"
              },
              "example_url": "https://quran-api.asrulmunir.workers.dev/api/chapters/1",
              "response_fields": ["number", "name", "verseCount", "tokenCount", "bismillah", "verses"],
              "use_cases": ["Display complete chapter", "Reading interfaces", "Chapter analysis"],
              "popular_chapters": {
                "1": "Al-Fatihah (The Opening)",
                "2": "Al-Baqarah (The Cow)",
                "18": "Al-Kahf (The Cave)",
                "36": "Ya-Sin",
                "67": "Al-Mulk (The Sovereignty)",
                "112": "Al-Ikhlas (The Sincerity)"
              }
            },

            "get_verse": {
              "endpoint": "GET /api/verses/{chapter}/{verse}",
              "description": "Get specific verse in Arabic with detailed information",
              "parameters": {
                "chapter": "Chapter number (1-114)",
                "verse": "Verse number within chapter"
              },
              "example_url": "https://quran-api.asrulmunir.workers.dev/api/verses/2/255",
              "response_fields": ["chapterNumber", "verseNumber", "text", "location", "tokenCount", "tokens"],
              "use_cases": ["Display specific verses", "Verse-by-verse study", "Citation and reference"],
              "famous_verses": {
                "1:1": "Bismillah (In the name of Allah)",
                "2:255": "Ayat al-Kursi (Throne Verse)",
                "112:1": "Qul Huwa Allahu Ahad (Say: He is Allah, the One)"
              }
            },

            "compare_translations": {
              "endpoint": "GET /api/compare/{chapter}/{verse}",
              "description": "Get verse in Arabic with all available translations side-by-side",
              "parameters": {
                "chapter": "Chapter number (1-114)",
                "verse": "Verse number within chapter"
              },
              "example_url": "https://quran-api.asrulmunir.workers.dev/api/compare/1/1",
              "response_structure": {
                "chapterNumber": "number",
                "verseNumber": "number",
                "arabic": {
                  "text": "Arabic text in Uthmani script",
                  "source": "Tanzil.net Uthmani"
                },
                "translations": {
                  "en.hilali": {
                    "text": "English translation text",
                    "translator": "Dr. Muhammad Taqi-ud-Din Al-Hilali and Dr. Muhammad Muhsin Khan",
                    "language": "en",
                    "language_name": "English"
                  },
                  "ms.basmeih": {
                    "text": "Malay translation text",
                    "translator": "Abdullah Muhammad Basmeih",
                    "language": "ms",
                    "language_name": "Bahasa Melayu"
                  }
                }
              },
              "use_cases": ["Multi-language study", "Translation comparison", "Educational content", "Cross-reference analysis"]
            },

            "search_verses": {
              "endpoint": "GET /api/search",
              "description": "Search for verses containing specific Arabic text with advanced options",
              "required_parameters": {
                "q": "Search query in Arabic text"
              },
              "optional_parameters": {
                "type": "Search type: 'exact' or 'substring' (default: substring)",
                "normalize": "Arabic text normalization: true/false (default: false)",
                "limit": "Maximum results to return (default: 50, max: 100)"
              },
              "example_urls": [
                "https://quran-api.asrulmunir.workers.dev/api/search?q=الله",
                "https://quran-api.asrulmunir.workers.dev/api/search?q=الله&normalize=true&limit=10",
                "https://quran-api.asrulmunir.workers.dev/api/search?q=بسم&type=substring&normalize=true"
              ],
              "response_fields": ["query", "type", "normalize", "resultCount", "results", "hasMore"],
              "search_tips": {
                "normalization": "Use normalize=true for better Arabic text matching",
                "common_terms": ["الله (Allah)", "رب (Lord)", "رحمن (Rahman)", "رحيم (Rahim)", "بسم (Bismillah)"],
                "exact_vs_substring": "Use 'exact' for precise word matching, 'substring' for partial matches"
              },
              "use_cases": ["Verse lookup", "Thematic research", "Word frequency analysis", "Content discovery"]
            },

            "search_translations": {
              "endpoint": "GET /api/search/translation",
              "description": "Reverse search - find verses by searching within English, Malay, Chinese, or Tamil translations",
              "required_parameters": {
                "q": "Search query in English, Malay, Chinese, or Tamil"
              },
              "optional_parameters": {
                "lang": "Language: 'en' for English, 'ms' for Malay, 'zh' for Chinese, 'ta' for Tamil (default: en)",
                "type": "Search type: 'exact' or 'substring' (default: substring)",
                "limit": "Maximum results to return (default: 50)",
                "include_arabic": "Include Arabic text in results: true/false (default: true)"
              },
              "example_urls": [
                "https://quran-api.asrulmunir.workers.dev/api/search/translation?q=mercy&lang=en",
                "https://quran-api.asrulmunir.workers.dev/api/search/translation?q=kasih&lang=ms",
                "https://quran-api.asrulmunir.workers.dev/api/search/translation?q=真主&lang=zh",
                "https://quran-api.asrulmunir.workers.dev/api/search/translation?q=கடவுள்&lang=ta"
              ],
              "response_fields": ["query", "language", "languageName", "translator", "searchType", "includeArabic", "resultCount", "results", "hasMore", "searchInfo"],
              "supported_languages": {
                "en": "English (Hilali-Khan translation)",
                "ms": "Bahasa Melayu (Basmeih translation)",
                "zh": "中文 简体 (Ma Jian translation)",
                "ta": "தமிழ் (Jan Turst Foundation translation)"
              },
              "search_examples": {
                "english_terms": ["mercy", "forgiveness", "guidance", "paradise", "prayer", "faith", "charity", "patience"],
                "malay_terms": ["kasih", "ampun", "petunjuk", "syurga", "solat", "iman", "sedekah", "sabar"],
                "chinese_terms": ["真主", "慈悲", "宽恕", "引导", "天堂", "祈祷", "信仰", "施舍"],
                "tamil_terms": ["கடவுள்", "கருணை", "மன்னிப்பு", "வழிகாட்டுதல்", "சொர்க்கம்", "தொழுகை", "நம்பிக்கை", "தர்மம்"]
              },
              "use_cases": ["Find verses by meaning", "Thematic studies in native language", "Educational content", "Concept-based research", "Non-Arabic speaker assistance", "Malaysian multilingual support"]
            },

            "list_translations": {
              "endpoint": "GET /api/translations",
              "description": "Get list of all available translations",
              "parameters": "None",
              "example_url": "https://quran-api.asrulmunir.workers.dev/api/translations",
              "response_fields": ["key", "name", "translator", "language", "language_name", "source"],
              "use_cases": ["Translation selection", "Language support check", "Attribution display"]
            },

            "get_statistics": {
              "endpoint": "GET /api/stats",
              "description": "Get detailed statistics about the Quran",
              "parameters": "None",
              "example_url": "https://quran-api.asrulmunir.workers.dev/api/stats",
              "response_fields": ["totalChapters", "totalVerses", "totalTokens", "longestChapter", "shortestChapter", "averageVersesPerChapter"],
              "use_cases": ["Analytics dashboards", "Educational statistics", "Data visualization"]
            }
          },

          "common_use_cases": {
            "mobile_apps": {
              "description": "Islamic mobile applications",
              "recommended_endpoints": ["/api/chapters", "/api/compare/{ch}/{v}", "/api/search"],
              "example_flow": "1. Load chapters list → 2. User selects chapter → 3. Display with translations using /api/compare"
            },
            "web_interfaces": {
              "description": "Quran study websites",
              "recommended_endpoints": ["/api/chapters", "/api/verses/{ch}/{v}", "/api/search"],
              "example_flow": "1. Search interface using /api/search → 2. Display results → 3. Click verse for details"
            },
            "research_tools": {
              "description": "Academic and linguistic research",
              "recommended_endpoints": ["/api/search", "/api/stats", "/api/verses/{ch}/{v}"],
              "example_flow": "1. Search for terms → 2. Analyze frequency → 3. Get detailed verse data"
            },
            "masjid_systems": {
              "description": "Mosque and Islamic center applications",
              "recommended_endpoints": ["/api/chapters", "/api/compare/{ch}/{v}"],
              "example_flow": "1. Select chapter for khutbah → 2. Display Arabic and local language translation"
            }
          },

          "response_formats": {
            "success": {
              "http_status": 200,
              "content_type": "application/json",
              "structure": "Varies by endpoint - see individual endpoint documentation"
            },
            "error": {
              "http_status": "400, 404, or 500",
              "content_type": "application/json",
              "structure": {
                "error": "Error message description",
                "details": "Additional error context (when available)"
              }
            }
          },

          "best_practices": {
            "caching": "Responses are cached for 1 hour. Implement client-side caching for better performance",
            "error_handling": "Always check HTTP status codes and handle error responses gracefully",
            "rate_limiting": "Respect the 100K daily limit on free tier. Implement exponential backoff for retries",
            "text_encoding": "All Arabic text is UTF-8 encoded. Ensure proper font support for Arabic display",
            "search_optimization": "Use normalize=true for Arabic search queries to improve matching accuracy"
          },

          "integration_examples": {
            "javascript": {
              "basic_fetch": "fetch('https://quran-api.asrulmunir.workers.dev/api/compare/1/1').then(r => r.json()).then(data => console.log(data))",
              "search_with_params": "const url = new URL('https://quran-api.asrulmunir.workers.dev/api/search'); url.searchParams.set('q', 'الله'); url.searchParams.set('normalize', 'true'); fetch(url).then(r => r.json())",
              "error_handling": "fetch(url).then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }).catch(err => console.error('API Error:', err))"
            },
            "python": {
              "basic_request": "import requests; response = requests.get('https://quran-api.asrulmunir.workers.dev/api/compare/1/1'); data = response.json()",
              "search_request": "params = {'q': 'الله', 'normalize': True, 'limit': 10}; response = requests.get('https://quran-api.asrulmunir.workers.dev/api/search', params=params)",
              "error_handling": "response.raise_for_status()  # Raises exception for HTTP errors"
            },
            "curl": {
              "basic_request": "curl 'https://quran-api.asrulmunir.workers.dev/api/info'",
              "search_request": "curl 'https://quran-api.asrulmunir.workers.dev/api/search?q=الله&normalize=true&limit=5'",
              "with_headers": "curl -H 'Accept: application/json' 'https://quran-api.asrulmunir.workers.dev/api/compare/2/255'"
            }
          },

          "llm_assistant_guidance": {
            "when_to_use": [
              "User asks about Quran verses, chapters, or translations",
              "User wants to search for specific Arabic terms in the Quran",
              "User wants to find verses by meaning in English, Malay, Chinese, or Tamil",
              "User needs Islamic content for applications or research",
              "User wants to compare different translations of verses",
              "User asks for Quranic statistics or information",
              "User searches for concepts in their native language (Malaysian multilingual support)"
            ],
            "how_to_help": [
              "Use /api/search to find verses containing specific Arabic terms",
              "Use /api/search/translation to find verses by meaning in English, Malay, Chinese, or Tamil",
              "Use /api/compare to show verses in Arabic with multiple translations",
              "Use /api/chapters to list all chapters for navigation",
              "Use /api/verses for specific verse lookups",
              "Always provide both Arabic text and translations when available",
              "For non-Arabic speakers, use translation search to find verses by concept",
              "Support Malaysian users with their preferred language (English/Malay/Chinese/Tamil)",
              "Explain the context and significance of verses when appropriate",
              "Respect Islamic etiquette when handling Quranic content"
            ],
            "search_strategies": {
              "arabic_speakers": "Use /api/search with Arabic terms and normalization",
              "english_speakers": "Use /api/search/translation with lang=en for concept-based search",
              "malay_speakers": "Use /api/search/translation with lang=ms for concept-based search",
              "chinese_speakers": "Use /api/search/translation with lang=zh for concept-based search",
              "tamil_speakers": "Use /api/search/translation with lang=ta for concept-based search",
              "malaysian_users": "Support all four languages (en/ms/zh/ta) based on user preference",
              "researchers": "Combine both Arabic and translation search for comprehensive results",
              "educators": "Use translation search to help students find verses by familiar concepts"
            },
            "response_formatting": [
              "Display Arabic text in proper RTL format when possible",
              "Include translation attribution (Hilali-Khan for English, Basmeih for Malay)",
              "Provide chapter and verse references (e.g., Al-Fatihah 1:1)",
              "Format search results clearly with verse references",
              "Include relevant context about chapters or verses",
              "When using translation search, explain the original Arabic context"
            ]
          },

          "islamic_etiquette": {
            "handling_quran": "This API provides the Holy Quran text with utmost respect and accuracy",
            "attribution": "Always attribute translations to their respective translators",
            "context": "Provide appropriate Islamic context when discussing verses",
            "respect": "Handle all Quranic content with reverence and respect"
          }
        };

        return addCorsHeaders(new Response(JSON.stringify(llmGuide, null, 2), {
          headers: { 'Content-Type': 'application/json' }
        }));
      }
      
      return addCorsHeaders(new Response(JSON.stringify({ error: 'Not Found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }));
      
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error', 
        message: error.message 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};