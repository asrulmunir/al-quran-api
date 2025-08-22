#!/usr/bin/env node

/**
 * Parse XML translation files from Tanzil.net and convert to JSON
 * Input: en.hilali.xml, ms.basmeih.xml
 * Output: Complete JSON translation files
 */

const fs = require('fs');
const path = require('path');

// Chapter names mapping
const chapterNames = {
  1: { arabic: 'الفاتحة', english: 'Al-Fatihah', translation: 'The Opening' },
  2: { arabic: 'البقرة', english: 'Al-Baqarah', translation: 'The Cow' },
  3: { arabic: 'آل عمران', english: 'Ali \'Imran', translation: 'Family of Imran' },
  4: { arabic: 'النساء', english: 'An-Nisa', translation: 'The Women' },
  5: { arabic: 'المائدة', english: 'Al-Ma\'idah', translation: 'The Table Spread' },
  6: { arabic: 'الأنعام', english: 'Al-An\'am', translation: 'The Cattle' },
  7: { arabic: 'الأعراف', english: 'Al-A\'raf', translation: 'The Heights' },
  8: { arabic: 'الأنفال', english: 'Al-Anfal', translation: 'The Spoils of War' },
  9: { arabic: 'التوبة', english: 'At-Tawbah', translation: 'The Repentance' },
  10: { arabic: 'يونس', english: 'Yunus', translation: 'Jonah' },
  // Add more as needed - this covers the most common ones
};

function parseXmlTranslation(xmlContent, translationInfo) {
  const lines = xmlContent.split('\n');
  const chapters = {};
  
  let currentChapter = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and metadata
    if (trimmed.startsWith('<!--') || trimmed.startsWith('#') || trimmed.startsWith('<?xml')) {
      continue;
    }
    
    // Look for sura (chapter) entries
    const suraMatch = trimmed.match(/<sura index="(\d+)"[^>]*>/);
    if (suraMatch) {
      const chapterNum = parseInt(suraMatch[1]);
      currentChapter = chapterNum;
      
      if (!chapters[chapterNum]) {
        chapters[chapterNum] = {
          number: chapterNum,
          name: chapterNames[chapterNum]?.english || `Chapter ${chapterNum}`,
          name_arabic: chapterNames[chapterNum]?.arabic || '',
          name_translation: chapterNames[chapterNum]?.translation || '',
          verses: []
        };
      }
      continue;
    }
    
    // Look for aya (verse) entries
    const ayaMatch = trimmed.match(/<aya index="(\d+)" text="([^"]*)"\/>/);
    if (ayaMatch && currentChapter) {
      const verseNum = parseInt(ayaMatch[1]);
      const text = ayaMatch[2];
      
      chapters[currentChapter].verses.push({
        number: verseNum,
        text: text
      });
    }
  }
  
  // Convert to array and sort
  const chaptersArray = Object.values(chapters).sort((a, b) => a.number - b.number);
  
  return {
    ...translationInfo,
    chapters: chaptersArray
  };
}

async function main() {
  try {
    const projectRoot = path.join(__dirname, '..');
    const translationsDir = path.join(projectRoot, 'src', 'translations');
    
    // Parse English (Hilali-Khan) translation
    console.log('📖 Parsing English (Hilali-Khan) translation...');
    const enXmlPath = path.join(projectRoot, 'en.hilali.xml');
    const enXmlContent = fs.readFileSync(enXmlPath, 'utf8');
    
    const enTranslation = parseXmlTranslation(enXmlContent, {
      name: 'The Noble Quran - English Translation',
      translator: 'Dr. Muhammad Taqi-ud-Din Al-Hilali and Dr. Muhammad Muhsin Khan',
      language: 'en',
      language_name: 'English',
      source: 'Tanzil.net'
    });
    
    const enJsonPath = path.join(translationsDir, 'en.hilali.json');
    fs.writeFileSync(enJsonPath, JSON.stringify(enTranslation, null, 2));
    console.log(`✅ English translation saved to ${enJsonPath}`);
    console.log(`📊 Chapters: ${enTranslation.chapters.length}`);
    console.log(`📊 Total verses: ${enTranslation.chapters.reduce((sum, ch) => sum + ch.verses.length, 0)}`);
    
    // Parse Malay (Basmeih) translation
    console.log('\n📖 Parsing Malay (Basmeih) translation...');
    const msXmlPath = path.join(projectRoot, 'ms.basmeih.xml');
    const msXmlContent = fs.readFileSync(msXmlPath, 'utf8');
    
    const msTranslation = parseXmlTranslation(msXmlContent, {
      name: 'Al-Quran - Terjemahan Bahasa Melayu',
      translator: 'Abdullah Muhammad Basmeih',
      language: 'ms',
      language_name: 'Bahasa Melayu',
      source: 'Tanzil.net'
    });
    
    const msJsonPath = path.join(translationsDir, 'ms.basmeih.json');
    fs.writeFileSync(msJsonPath, JSON.stringify(msTranslation, null, 2));
    console.log(`✅ Malay translation saved to ${msJsonPath}`);
    console.log(`📊 Chapters: ${msTranslation.chapters.length}`);
    console.log(`📊 Total verses: ${msTranslation.chapters.reduce((sum, ch) => sum + ch.verses.length, 0)}`);
    
    console.log('\n🎉 Complete translations converted successfully!');
    console.log('\n📝 Attribution: Translations courtesy of Tanzil.net');
    console.log('📄 License: Non-commercial use with attribution');
    console.log('🕌 Source: http://tanzil.net/');
    
  } catch (error) {
    console.error('❌ Error parsing translations:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseXmlTranslation };
