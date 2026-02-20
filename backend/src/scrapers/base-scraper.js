/**
 * Base Scraper Class
 *
 * Common functionality for all regional news scrapers
 * Handles: fetching, caching, rate limiting, retry logic
 */

import logger from '../utils/logger.js';

export class BaseScraper {
  constructor(config = {}) {
    this.name = config.name || 'BaseScraper';
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.userAgent =
      config.userAgent ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
    this.cache = new Map(); // Simple in-memory cache
    this.cacheTTL = config.cacheTTL || 3600000; // 1 hour
  }

  /**
   * Fetch URL with retry logic and caching
   */
  async fetch(url, options = {}) {
    const cacheKey = `fetch:${url}`;

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      logger.debug('Cache hit', { url });
      return cached.data;
    }

    // Fetch with retries
    let lastError;
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await this.fetchWithTimeout(url, options);
        const text = await response.text();

        // Cache successful response
        this.cache.set(cacheKey, {
          data: text,
          timestamp: Date.now(),
        });

        logger.debug('Fetch successful', { url, attempt });
        return text;
      } catch (err) {
        lastError = err;
        logger.warn('Fetch failed', {
          url,
          attempt,
          error: err.message,
        });

        // Exponential backoff
        if (attempt < this.retryAttempts) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Fetch with timeout
   */
  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'User-Agent': this.userAgent,
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Parse HTML using regex or simple DOM-like logic
   * (In production, use cheerio or jsdom)
   */
  extractText(html) {
    // Remove script and style tags
    let text = html.replace(/<script[^>]*>.*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>.*?<\/style>/gi, '');
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    return text;
  }

  /**
   * Extract dates from text
   */
  extractDates(text) {
    const datePatterns = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g, // DD/MM/YYYY or MM/DD/YYYY
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g, // YYYY-MM-DD
      /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/gi, // Full month name
    ];

    const dates = [];
    for (const pattern of datePatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        dates.push(match[0]);
      }
    }

    return dates;
  }

  /**
   * Simple sleep utility
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Rate limiting helper
   */
  async rateLimitDelay(requestsPerSecond = 1) {
    const delay = (1000 / requestsPerSecond) * Math.random();
    await this.sleep(delay);
  }

  /**
   * Scrape a list of URLs
   */
  async scrapeMultiple(urls, parser) {
    const results = [];

    for (const url of urls) {
      try {
        const html = await this.fetch(url);
        const parsed = await parser(html, url);
        results.push(parsed);
        await this.rateLimitDelay(2); // 2 requests per second
      } catch (err) {
        logger.error('Error scraping URL', { url, error: err.message });
      }
    }

    logger.info('Scraping completed', {
      scraper: this.name,
      total: urls.length,
      successful: results.length,
      failed: urls.length - results.length,
    });

    return results;
  }

  /**
   * Format article for storage
   */
  formatArticle(data) {
    return {
      title: data.title || 'Untitled',
      description: data.description || '',
      source_url: data.url || '',
      source: data.source || this.name,
      published_date: data.date || new Date(),
      raw_text: data.text || '',
      language: data.language || 'es', // Default Spanish for MVP
    };
  }
}

export default BaseScraper;
