/**
 * Translation & NLP Classification Pipeline
 *
 * Processes raw articles:
 * 1. Detect language
 * 2. Translate to English
 * 3. Extract entities
 * 4. Classify event type
 * 5. Extract dates and severity indicators
 */

import logger from '../utils/logger.js';

export class NLPPipeline {
  constructor(config = {}) {
    this.name = 'NLPPipeline';
    this.googleTranslateApiKey = config.googleTranslateApiKey;
    this.minConfidenceThreshold = config.minConfidenceThreshold || 0.6;

    // Event classification keywords (Spanish)
    this.keywords = {
      strike: ['huelga', 'paro total', 'paro indefinido', 'votación de huelga'],
      bankruptcy: ['quiebra', 'insolvencia', 'liquidación', 'deuda'],
      environmental: [
        'cierre ambiental',
        'permiso suspendido',
        'contaminación',
        'derrame',
      ],
      regulatory: ['sanción', 'multa', 'permiso denegado', 'regulación'],
      infrastructure: ['accidente', 'daño', 'equipamiento', 'colapso'],
      protest: ['protesta', 'manifestación', 'bloqueo', 'concentración'],
    };

    // Severity indicators
    this.severityIndicators = {
      high: [
        'total',
        'indefinido',
        'nacional',
        'masivo',
        'catastrófico',
        'crítico',
      ],
      medium: ['parcial', 'temporal', 'regional', 'importante'],
      low: ['pequeño', 'limitado', 'local', 'menor'],
    };
  }

  /**
   * Main pipeline: Process article from scraper
   */
  async processArticle(article) {
    try {
      // 1. Detect language
      const language = this.detectLanguage(article.raw_text || article.text);

      // 2. Translate if needed
      let translatedText = article.raw_text || article.text;
      if (language !== 'en') {
        translatedText = await this.translate(translatedText, language, 'en');
      }

      // 3. Classify event type
      const classification = this.classifyEvent(article.text, language);

      // 4. Extract entities
      const entities = this.extractEntities(article.text);

      // 5. Extract dates
      const dates = this.extractDates(article.text);

      // 6. Calculate severity
      const severity = this.calculateSeverity(article.text, classification.type);

      // Skip if confidence too low
      if (classification.confidence < this.minConfidenceThreshold) {
        logger.debug('Article skipped (low confidence)', {
          title: article.title,
          confidence: classification.confidence,
        });
        return null;
      }

      const processed = {
        original_language: language,
        title: article.title,
        raw_text_original: article.text,
        raw_text_translated: translatedText,
        source: article.source,
        source_url: article.source_url,
        published_date: article.date,
        event_type: classification.type,
        event_confidence: classification.confidence,
        entities: entities,
        detected_dates: dates,
        severity_score: severity,
        keywords_matched: classification.keywords_matched,
      };

      logger.info('Article processed', {
        title: processed.title.substring(0, 50),
        type: processed.event_type,
        confidence: processed.event_confidence.toFixed(2),
      });

      return processed;
    } catch (err) {
      logger.error('Error processing article', {
        error: err.message,
        title: article.title,
      });
      return null;
    }
  }

  /**
   * Detect language (simple implementation)
   */
  detectLanguage(text) {
    // Spanish indicators
    const spanishWords = [
      'el',
      'la',
      'de',
      'que',
      'y',
      'es',
      'en',
      'para',
      'huelga',
      'minería',
    ];
    const vietnameseWords = [
      'và',
      'là',
      'của',
      'trong',
      'được',
      'đó',
      'công',
      'ngoài',
    ];

    const lowerText = text.toLowerCase();
    const spanishCount = spanishWords.filter((w) => lowerText.includes(w)).length;
    const vietnameseCount = vietnameseWords.filter((w) =>
      lowerText.includes(w)
    ).length;

    if (vietnameseCount > spanishCount) return 'vi';
    if (spanishCount > 0) return 'es';
    return 'en'; // Default to English
  }

  /**
   * Translate text (placeholder - would use Google Translate API)
   */
  async translate(text, sourceLanguage, targetLanguage) {
    // TODO: Integrate with Google Translate API or LibreTranslate
    // For MVP, return text as-is with a warning
    logger.warn('Translation not yet implemented', {
      from: sourceLanguage,
      to: targetLanguage,
      length: text.length,
    });
    return text; // Placeholder - in production, call translation API
  }

  /**
   * Classify event type from text
   */
  classifyEvent(text) {
    const lowerText = text.toLowerCase();
    const scores = {};

    // Score each event type based on keyword matches
    for (const [eventType, keywords] of Object.entries(this.keywords)) {
      let matchCount = 0;
      const matched = [];

      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = (lowerText.match(regex) || []).length;
        if (matches > 0) {
          matchCount += matches;
          matched.push(keyword);
        }
      }

      // Confidence: matches / total keywords, normalized
      scores[eventType] = {
        matches: matchCount,
        keywords_matched: matched,
        confidence: Math.min(1, matchCount / Math.max(keywords.length, 1)),
      };
    }

    // Find highest scoring event type
    const bestMatch = Object.entries(scores).reduce((best, [type, score]) =>
      score.confidence > best.score.confidence
        ? { type, score }
        : best
    );

    return {
      type: bestMatch.type || 'unknown',
      confidence: bestMatch.score.confidence,
      keywords_matched: bestMatch.score.keywords_matched,
      alternative_types: Object.entries(scores)
        .sort((a, b) => b[1].confidence - a[1].confidence)
        .slice(1, 3)
        .map(([type, score]) => ({ type, confidence: score.confidence })),
    };
  }

  /**
   * Extract entities from text
   */
  extractEntities(text) {
    const entities = [];

    // Facility names (usually capitalized proper nouns)
    const facilityRegex = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
    let match;
    while ((match = facilityRegex.exec(text)) !== null) {
      const potential = match[1];
      if (potential.length > 3) {
        // Filter out common words
        entities.push({
          text: potential,
          type: 'POTENTIAL_FACILITY',
          confidence: 0.6,
        });
      }
    }

    // Commodity names
    const commoditites = ['copper', 'lithium', 'gold', 'silver', 'cobalt'];
    for (const commodity of commoditites) {
      if (text.toLowerCase().includes(commodity)) {
        entities.push({
          text: commodity,
          type: 'COMMODITY',
          confidence: 1.0,
        });
      }
    }

    // Locations (Spanish)
    const locations = ['Perú', 'Cusco', 'Apurímac', 'Arequipa', 'Ancash'];
    for (const location of locations) {
      if (text.includes(location)) {
        entities.push({
          text: location,
          type: 'LOCATION',
          confidence: 1.0,
        });
      }
    }

    return entities;
  }

  /**
   * Extract dates from text
   */
  extractDates(text) {
    const dates = [];

    // Spanish month names
    const months = {
      enero: 1,
      febrero: 2,
      marzo: 3,
      abril: 4,
      mayo: 5,
      junio: 6,
      julio: 7,
      agosto: 8,
      septiembre: 9,
      octubre: 10,
      noviembre: 11,
      diciembre: 12,
    };

    // Pattern: "20 de julio de 2026"
    const spanishDatePattern = /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})/gi;

    let match;
    while ((match = spanishDatePattern.exec(text)) !== null) {
      const day = parseInt(match[1]);
      const month = months[match[2].toLowerCase()];
      const year = parseInt(match[3]);
      dates.push(new Date(year, month - 1, day));
    }

    // ISO format: "2026-07-20"
    const isoPattern = /(\d{4})-(\d{2})-(\d{2})/g;
    while ((match = isoPattern.exec(text)) !== null) {
      dates.push(new Date(match[1], match[2] - 1, match[3]));
    }

    return [...new Set(dates.map((d) => d.toISOString()))]; // Deduplicate
  }

  /**
   * Calculate severity score (1-5) based on text indicators
   */
  calculateSeverity(text, eventType) {
    let severity = 2; // Default

    const lowerText = text.toLowerCase();

    // Check for severity indicators
    for (const [level, indicators] of Object.entries(this.severityIndicators)) {
      const matches = indicators.filter((indicator) =>
        lowerText.includes(indicator)
      ).length;

      if (matches > 0) {
        if (level === 'high') severity = 4;
        if (level === 'medium') severity = 3;
        if (level === 'low') severity = 1;
      }
    }

    // Adjust based on event type
    const baselineByType = {
      strike: 3,
      bankruptcy: 4,
      environmental: 3,
      regulatory: 2,
      infrastructure: 2,
      protest: 2,
    };

    if (baselineByType[eventType]) {
      severity = Math.max(baselineByType[eventType], severity);
    }

    return Math.min(5, Math.max(1, severity));
  }

  /**
   * Batch process multiple articles
   */
  async processBatch(articles) {
    const processed = [];

    for (const article of articles) {
      const result = await this.processArticle(article);
      if (result) {
        processed.push(result);
      }
    }

    logger.info('Batch processing completed', {
      total: articles.length,
      processed: processed.length,
      skipped: articles.length - processed.length,
    });

    return processed;
  }
}

export default NLPPipeline;
