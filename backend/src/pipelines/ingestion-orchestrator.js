/**
 * Data Ingestion Pipeline Orchestrator
 *
 * Coordinates the full flow:
 * Scrape → Translate → Classify → Store
 *
 * Runs periodically and handles errors gracefully
 */

import PeruScraper from '../scrapers/peru-scraper.js';
import NLPPipeline from './nlp-classifier.js';
import * as riskRepository from '../services/risk-repository.js';
import * as riskScoringService from '../services/risk-scoring.js';
import * as entityResolver from '../services/entity-resolver.js';
import logger from '../utils/logger.js';

export class DataIngestionPipeline {
  constructor(config = {}) {
    this.name = 'DataIngestionPipeline';
    this.scrapers = {
      peru: new PeruScraper(config.scrapers?.peru),
      // TODO: Add Mexico, Vietnam scrapers
    };
    this.nlpPipeline = new NLPPipeline(config.nlp);
    this.processedEventKeys = new Set(); // Prevent duplicates
  }

  /**
   * Main ingestion entry point
   */
  async ingest() {
    try {
      logger.info('Data ingestion started');

      const stats = {
        scraped: 0,
        processed: 0,
        events_created: 0,
        risks_aggregated: 0,
        errors: 0,
      };

      // 1. Scrape data
      const scrapedArticles = await this.scrapeAllSources();
      stats.scraped = scrapedArticles.length;
      logger.info('Scraping completed', {
        total_articles: scrapedArticles.length,
      });

      // 2. Process articles
      const processedArticles = await this.nlpPipeline.processBatch(
        scrapedArticles
      );
      stats.processed = processedArticles.length;

      // 3. Store events and create risks
      for (const article of processedArticles) {
        try {
          const stored = await this.storeProcessedArticle(article);
          if (stored) {
            stats.events_created++;
          }
        } catch (err) {
          logger.error('Error storing article', {
            article: article.title,
            error: err.message,
          });
          stats.errors++;
        }
      }

      // 4. Aggregate related events into risks
      stats.risks_aggregated = await this.aggregateEventsToRisks();

      logger.info('Data ingestion completed', stats);
      return stats;
    } catch (err) {
      logger.error('Data ingestion pipeline error', { error: err.message });
      throw err;
    }
  }

  /**
   * Scrape from all regional sources
   */
  async scrapeAllSources() {
    const allArticles = [];

    // Peru
    try {
      logger.info('Scraping Peru');
      const peruArticles = await this.scrapers.peru.scrape();
      allArticles.push(...peruArticles);
      logger.info('Peru scraping complete', { articles: peruArticles.length });
    } catch (err) {
      logger.error('Peru scraping error', { error: err.message });
    }

    // TODO: Mexico, Vietnam scrapers

    return allArticles;
  }

  /**
   * Store processed article as event
   */
  async storeProcessedArticle(article) {
    try {
      // Generate event key for deduplication
      const eventKey = this.generateEventKey(article);

      if (this.processedEventKeys.has(eventKey)) {
        logger.debug('Event already processed', { event_key: eventKey });
        return null;
      }

      // Get or create region
      const region = this.getRegionFromArticle(article);
      let regionId = null;
      // TODO: Query database for region_id

      // Resolve entities
      const entities = article.entities || [];
      const resolvedEntities = await this.resolveEntities(entities);

      // Get facility ID if found
      const facilityId = resolvedEntities.find((e) => e.type === 'facility')
        ?.entity_id;

      // Create event
      const event = await riskRepository.createEvent({
        event_key: eventKey,
        event_type: article.event_type,
        title: article.title,
        description: article.raw_text_translated,
        raw_text_original: article.raw_text_original,
        raw_text_translated: article.raw_text_translated,
        source: article.source,
        source_url: article.source_url,
        region_id: regionId,
        country: this.getCountryFromArticle(article),
        severity_score: article.severity_score,
        classification_confidence: article.event_confidence,
        entities_json: resolvedEntities,
      });

      // Mark as processed
      this.processedEventKeys.add(eventKey);

      logger.info('Event created', {
        event_id: event.id,
        event_key: eventKey,
        type: article.event_type,
      });

      // Try to aggregate into risk
      await this.tryAggregatToRisk(event, facilityId);

      return event;
    } catch (err) {
      logger.error('Error storing article as event', { error: err.message });
      throw err;
    }
  }

  /**
   * Generate unique event key for deduplication
   */
  generateEventKey(article) {
    // Use title hash + source + date
    const titleHash = article.title.substring(0, 50).replace(/\s+/g, '_');
    const date = article.published_date
      ? new Date(article.published_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    return `${titleHash}_${article.source}_${date}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  }

  /**
   * Get region from article
   */
  getRegionFromArticle(article) {
    // Check entities for location
    const locationEntity = article.entities?.find((e) => e.type === 'LOCATION');
    if (locationEntity) {
      return locationEntity.text.toLowerCase();
    }
    // Default based on scraper
    if (article.source.includes('Peru')) return 'peru';
    if (article.source.includes('Mexico')) return 'mexico';
    if (article.source.includes('Vietnam')) return 'vietnam';
    return null;
  }

  /**
   * Get country from article
   */
  getCountryFromArticle(article) {
    const regionToCoun try = {
      peru: 'PE',
      mexico: 'MX',
      vietnam: 'VN',
    };
    const region = this.getRegionFromArticle(article);
    return regionToCountry[region] || 'XX';
  }

  /**
   * Resolve entities to known database records
   */
  async resolveEntities(entities) {
    const resolved = [];

    for (const entity of entities) {
      try {
        // Skip if already resolved
        if (entity.entity_id) {
          resolved.push(entity);
          continue;
        }

        // Try to resolve (TODO: Query database for known entities)
        // const resolution = await entityResolver.resolveEntity(...);

        resolved.push({
          entity: entity.text,
          type: entity.type,
          entity_id: null, // Would be set after resolution
          confidence: entity.confidence,
        });
      } catch (err) {
        logger.warn('Error resolving entity', {
          entity: entity.text,
          error: err.message,
        });
      }
    }

    return resolved;
  }

  /**
   * Try to aggregate event into existing risk
   */
  async tryAggregatToRisk(event, facilityId) {
    try {
      // TODO: Query for existing risks related to this event
      // If found, link event to risk
      // If not, might create new risk (depends on severity threshold)

      logger.debug('Event aggregation skipped (not yet implemented)');
    } catch (err) {
      logger.error('Error aggregating event to risk', { error: err.message });
    }
  }

  /**
   * Aggregate related events into risks
   */
  async aggregateEventsToRisks() {
    try {
      // TODO: Implement risk aggregation logic
      // Group events by:
      // - Facility
      // - Event type
      // - Time window (e.g., 7 days)
      // Then create/update risks

      logger.info('Risk aggregation skipped (not yet implemented)');
      return 0;
    } catch (err) {
      logger.error('Error aggregating events to risks', { error: err.message });
      return 0;
    }
  }

  /**
   * Schedule periodic ingestion
   */
  scheduleIngestion(intervalMinutes = 360) {
    // Run every 6 hours by default
    const intervalMs = intervalMinutes * 60 * 1000;

    logger.info('Scheduling data ingestion', { interval_minutes: intervalMinutes });

    setInterval(() => {
      this.ingest().catch((err) => {
        logger.error('Scheduled ingestion error', { error: err.message });
      });
    }, intervalMs);

    // Run immediately on startup
    this.ingest().catch((err) => {
      logger.error('Initial ingestion error', { error: err.message });
    });
  }
}

export default DataIngestionPipeline;
