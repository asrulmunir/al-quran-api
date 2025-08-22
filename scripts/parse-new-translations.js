#!/usr/bin/env node

/**
 * Parse Chinese and Tamil XML translation files to JSON
 */

const fs = require('fs');
const path = require('path');

// Chapter names mapping (basic set)
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
  10: { arabic: 'يونس', english: 'Yunus', translation: 'Jonah' }
  // Will auto-generate for others
};

function parseXmlTranslation(xmlContent, translationKey) {
  const lines = xmlContent.split('\n');
  const chapters = {};
  let translationInfo = {};

  // Set translation info based on key
  if (translationKey === 'zh.jian') {
    translationInfo = {
      name: 'The Noble Quran - Chinese Translation',
      translator: 'Ma Jian',
      language: 'zh',
      language_name: '中文 (简体)',
      source: 'Tanzil.net'
    };
  } else if (translationKey === 'ta.tamil') {
    translationInfo = {
      name: 'The Noble Quran - Tamil Translation', 
      translator: 'Jan Turst Foundation',
      language: 'ta',
      language_name: 'தமிழ்',
      source: 'Tanzil.net'
    };
  }

  let currentChapter = null;

  // Parse verses using sura/aya structure
  for (const line of lines) {
    // Check for sura (chapter) start
    if (line.includes('<sura ')) {
      const indexMatch = line.match(/index="(\d+)"/);
      if (indexMatch) {
        const chapterNum = parseInt(indexMatch[1]);
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
      }
    }
    
    // Check for aya (verse)
    if (line.includes('<aya ') && currentChapter) {
      const indexMatch = line.match(/index="(\d+)"/);
      const textMatch = line.match(/text="([^"]+)"/);

      if (indexMatch && textMatch) {
        const verseNum = parseInt(indexMatch[1]);
        const text = textMatch[1].trim();

        chapters[currentChapter].verses.push({
          number: verseNum,
          text: text
        });
      }
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
    // Create translations directory if it doesn't exist
    const translationsDir = path.join(__dirname, '..', 'src', 'translations');
    if (!fs.existsSync(translationsDir)) {
      fs.mkdirSync(translationsDir, { recursive: true });
    }

    // Parse Chinese translation
    console.log('📖 Parsing Chinese (Ma Jian) translation...');
    const chineseXml = fs.readFileSync('zh.jian.xml', 'utf8');
    const chineseTranslation = parseXmlTranslation(chineseXml, 'zh.jian');
    
    const chinesePath = path.join(translationsDir, 'zh.jian.json');
    fs.writeFileSync(chinesePath, JSON.stringify(chineseTranslation, null, 2));
    console.log(`✅ Saved Chinese translation to ${chinesePath}`);
    console.log(`📊 Chapters: ${chineseTranslation.chapters.length}`);
    console.log(`📊 Total verses: ${chineseTranslation.chapters.reduce((sum, ch) => sum + ch.verses.length, 0)}`);

    // Parse Tamil translation
    console.log('\n📖 Parsing Tamil (Jan Turst Foundation) translation...');
    const tamilXml = fs.readFileSync('ta.tamil.xml', 'utf8');
    const tamilTranslation = parseXmlTranslation(tamilXml, 'ta.tamil');
    
    const tamilPath = path.join(translationsDir, 'ta.tamil.json');
    fs.writeFileSync(tamilPath, JSON.stringify(tamilTranslation, null, 2));
    console.log(`✅ Saved Tamil translation to ${tamilPath}`);
    console.log(`📊 Chapters: ${tamilTranslation.chapters.length}`);
    console.log(`📊 Total verses: ${tamilTranslation.chapters.reduce((sum, ch) => sum + ch.verses.length, 0)}`);

    console.log('\n🎉 All translations parsed successfully!');
    console.log('\n🇲🇾 Malaysian Language Coverage Complete:');
    console.log('✅ English (Hilali-Khan)');
    console.log('✅ Bahasa Melayu (Basmeih)');
    console.log('✅ 中文 简体 (Ma Jian)');
    console.log('✅ தமிழ் (Jan Turst Foundation)');
    
  } catch (error) {
    console.error('❌ Error parsing translations:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseXmlTranslation };
