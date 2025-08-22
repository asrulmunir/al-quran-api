#!/usr/bin/env node

/**
 * Download complete translations from Tanzil.net
 * Terms: Non-commercial use allowed with attribution
 * Source: https://tanzil.net/trans/
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Available translations from Tanzil.net
const translations = {
  'en.hilali': {
    name: 'The Noble Quran - English Translation', 
    translator: 'Dr. Muhammad Taqi-ud-Din Al-Hilali and Dr. Muhammad Muhsin Khan',
    language: 'en',
    language_name: 'English',
    source: 'Tanzil.net'
  }
};

// Chapter names in Arabic and English
const chapterNames = {
  1: { arabic: 'الفاتحة', english: 'Al-Fatihah', translation: 'The Opening' },
  2: { arabic: 'البقرة', english: 'Al-Baqarah', translation: 'The Cow' },
  3: { arabic: 'آل عمران', english: 'Ali \'Imran', translation: 'Family of Imran' },
  // Add more as needed...
};

async function downloadTranslation(translationKey) {
  return new Promise((resolve, reject) => {
    const url = `https://tanzil.net/trans/${translationKey}`;
    console.log(`Downloading ${translationKey} from ${url}...`);
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Downloaded ${data.length} bytes for ${translationKey}`);
        resolve(data);
      });
      
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function parseTranslationData(data, translationKey) {
  const lines = data.trim().split('\n');
  const chapters = {};
  
  lines.forEach(line => {
    const parts = line.split('|');
    if (parts.length >= 3) {
      const chapterNum = parseInt(parts[0]);
      const verseNum = parseInt(parts[1]);
      const text = parts[2];
      
      if (!chapters[chapterNum]) {
        chapters[chapterNum] = {
          number: chapterNum,
          name: chapterNames[chapterNum]?.english || `Chapter ${chapterNum}`,
          name_arabic: chapterNames[chapterNum]?.arabic || '',
          name_translation: chapterNames[chapterNum]?.translation || '',
          verses: []
        };
      }
      
      chapters[chapterNum].verses.push({
        number: verseNum,
        text: text
      });
    }
  });
  
  // Convert to array and sort
  const chaptersArray = Object.values(chapters).sort((a, b) => a.number - b.number);
  
  const translationInfo = translations[translationKey];
  
  return {
    ...translationInfo,
    chapters: chaptersArray
  };
}

async function main() {
  try {
    // Create translations directory if it doesn't exist
    const translationsDir = path.join(__dirname, '..', 'src', 'translations');
    if (!fs.existsSync(translationsDir)) {
      fs.mkdirSync(translationsDir, { recursive: true });
    }
    
    // Download Hilali-Khan translation
    console.log('Downloading Hilali-Khan translation...');
    const hilaliData = await downloadTranslation('en.hilali');
    const hilaliTranslation = parseTranslationData(hilaliData, 'en.hilali');
    
    // Save to file
    const hilaliPath = path.join(translationsDir, 'en.hilali.json');
    fs.writeFileSync(hilaliPath, JSON.stringify(hilaliTranslation, null, 2));
    console.log(`✅ Saved complete English translation to ${hilaliPath}`);
    console.log(`📊 Chapters: ${hilaliTranslation.chapters.length}`);
    console.log(`📊 Total verses: ${hilaliTranslation.chapters.reduce((sum, ch) => sum + ch.verses.length, 0)}`);
    
    console.log('\n🎉 Complete translations downloaded successfully!');
    console.log('\n📝 Attribution: Translations courtesy of Tanzil.net');
    console.log('📄 License: Non-commercial use with attribution');
    
  } catch (error) {
    console.error('❌ Error downloading translations:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { downloadTranslation, parseTranslationData };
