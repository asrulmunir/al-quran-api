#!/usr/bin/env node

/**
 * Parse a single XML translation file to JSON
 * Usage: node parse-single-xml.js <xml-file> <translation-key>
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
  // Add more as needed...
};

function parseXmlTranslation(xmlContent, translationKey) {
  const lines = xmlContent.split('\n');
  const chapters = {};
  let translationInfo = {
    name: '',
    translator: '',
    language: '',
    language_name: ''
  };

  // Extract translation info from header
  for (const line of lines) {
    if (line.includes('Name:')) {
      translationInfo.name = line.split('Name:')[1].trim();
    }
    if (line.includes('Translator:')) {
      translationInfo.translator = line.split('Translator:')[1].trim();
    }
    if (line.includes('Language:')) {
      const lang = line.split('Language:')[1].trim().toLowerCase();
      translationInfo.language = translationKey.split('.')[0];
      translationInfo.language_name = lang.charAt(0).toUpperCase() + lang.slice(1);
    }
  }

  // Set specific language names
  if (translationKey === 'zh.jian') {
    translationInfo.language = 'zh';
    translationInfo.language_name = '中文 (简体)';
    translationInfo.name = 'The Noble Quran - Chinese Translation';
  } else if (translationKey === 'ta.tamil') {
    translationInfo.language = 'ta';
    translationInfo.language_name = 'தமிழ்';
    translationInfo.name = 'The Noble Quran - Tamil Translation';
  }

  // Parse verses
  for (const line of lines) {
    if (line.includes('<verse ')) {
      const chapterMatch = line.match(/chapter="(\d+)"/);
      const verseMatch = line.match(/verse="(\d+)"/);
      const textMatch = line.match(/>([^<]+)</);

      if (chapterMatch && verseMatch && textMatch) {
        const chapterNum = parseInt(chapterMatch[1]);
        const verseNum = parseInt(verseMatch[1]);
        const text = textMatch[1].trim();

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
    }
  }

  // Convert to array and sort
  const chaptersArray = Object.values(chapters).sort((a, b) => a.number - b.number);

  return {
    ...translationInfo,
    source: 'Tanzil.net',
    chapters: chaptersArray
  };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node parse-single-xml.js <xml-file> <translation-key>');
    process.exit(1);
  }

  const xmlFile = args[0];
  const translationKey = args[1];

  try {
    console.log(`📖 Parsing ${translationKey} translation...`);
    
    const xmlContent = fs.readFileSync(xmlFile, 'utf8');
    const translation = parseXmlTranslation(xmlContent, translationKey);
    
    // Create translations directory if it doesn't exist
    const translationsDir = path.join(__dirname, '..', 'src', 'translations');
    if (!fs.existsSync(translationsDir)) {
      fs.mkdirSync(translationsDir, { recursive: true });
    }
    
    // Save to file
    const outputPath = path.join(translationsDir, `${translationKey}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(translation, null, 2));
    
    console.log(`✅ Saved ${translationKey} translation to ${outputPath}`);
    console.log(`📊 Chapters: ${translation.chapters.length}`);
    console.log(`📊 Total verses: ${translation.chapters.reduce((sum, ch) => sum + ch.verses.length, 0)}`);
    console.log(`📝 Translator: ${translation.translator}`);
    console.log(`🌍 Language: ${translation.language_name}`);
    
  } catch (error) {
    console.error('❌ Error parsing translation:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseXmlTranslation };
