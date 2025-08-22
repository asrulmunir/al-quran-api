// JQuranTree API for Cloudflare Workers
import quranData from './quran-data.json';
import enHilali from './translations/en.hilali.json';
import msBasmeih from './translations/ms.basmeih.json';

// Available translations
const translations = {
  'en.hilali': enHilali,
  'ms.basmeih': msBasmeih
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