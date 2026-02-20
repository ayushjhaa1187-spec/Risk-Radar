/**
 * Entity Resolver Service
 *
 * Matches local facility/organization names from news articles to known entities
 * Uses fuzzy matching, address matching, and ownership chains
 */

import logger from '../utils/logger.js';

/**
 * Simple Levenshtein distance for fuzzy string matching
 */
const levenshteinDistance = (str1, str2) => {
  const track = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(0));

  for (let i = 0; i <= str1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j += 1) {
    track[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // insertion
        track[j - 1][i] + 1, // deletion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return track[str2.length][str1.length];
};

/**
 * Calculate string similarity (0-1)
 */
const stringSimilarity = (str1, str2) => {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  return 1 - distance / maxLength;
};

/**
 * Resolve facility/organization name to known entity
 * Used when extracting entities from news articles
 */
export const resolveEntity = async (sourceName, entityType, knownEntities, geoData = null) => {
  try {
    const cleanedName = sourceName.trim().toLowerCase();
    const matches = [];

    // 1. Exact name match
    for (const entity of knownEntities) {
      if (entity.name.toLowerCase() === cleanedName) {
        matches.push({
          entity_id: entity.id,
          entity_type: entityType,
          match_method: 'exact_name',
          match_score: 1.0,
          matched_entity: entity,
        });
      }

      // 2. Alias match
      if (entity.aliases && entity.aliases.includes(cleanedName)) {
        matches.push({
          entity_id: entity.id,
          entity_type: entityType,
          match_method: 'alias',
          match_score: 0.95,
          matched_entity: entity,
        });
      }

      // 3. Fuzzy string match
      const similarity = stringSimilarity(sourceName, entity.name);
      if (similarity > 0.7) {
        matches.push({
          entity_id: entity.id,
          entity_type: entityType,
          match_method: 'fuzzy_string',
          match_score: similarity,
          matched_entity: entity,
        });
      }

      // 4. Address/geographic proximity match
      if (geoData && entity.latitude && entity.longitude) {
        const distance = calculateDistance(
          geoData.latitude,
          geoData.longitude,
          entity.latitude,
          entity.longitude
        );
        if (distance < 50) { // Within 50km
          matches.push({
            entity_id: entity.id,
            entity_type: entityType,
            match_method: 'geo_proximity',
            match_score: 0.8 - distance / 250, // Decay with distance
            matched_entity: entity,
          });
        }
      }
    }

    // Return best match
    if (matches.length > 0) {
      const bestMatch = matches.reduce((best, current) =>
        current.match_score > best.match_score ? current : best
      );

      logger.debug('Entity resolved', {
        source_name: sourceName,
        resolved_to: bestMatch.matched_entity.name,
        match_method: bestMatch.match_method,
        score: bestMatch.match_score.toFixed(3),
      });

      return {
        resolved: true,
        entity_id: bestMatch.entity_id,
        entity_type: bestMatch.entity_type,
        matched_name: bestMatch.matched_entity.name,
        match_method: bestMatch.match_method,
        confidence: bestMatch.match_score,
      };
    }

    // No match found
    logger.warn('Entity not resolved', {
      source_name: sourceName,
      entity_type: entityType,
    });

    return {
      resolved: false,
      source_name: sourceName,
      entity_type: entityType,
      confidence: 0,
    };
  } catch (err) {
    logger.error('Error resolving entity', { error: err.message });
    return {
      resolved: false,
      error: err.message,
    };
  }
};

/**
 * Extract and resolve multiple entities from event text
 */
export const extractEntities = async (eventText, knownEntities, language = 'en') => {
  try {
    const entities = [];

    // TODO: Implement proper NLP entity extraction
    // For MVP, use simple pattern matching

    // Pattern: mine/facility name + region indicators
    const facilityPatterns = [
      /(?:mine|mining|minera|mina|smelter|plant|factory|facility)[\s:]*([a-zA-Z\s]+)(?:\s+(?:in|located in|near)\s+)?([a-zA-Z]+)?/gi,
    ];

    for (const pattern of facilityPatterns) {
      let match;
      while ((match = pattern.exec(eventText)) !== null) {
        const facilityName = match[1].trim();
        const region = match[2] ? match[2].trim() : null;

        const resolved = await resolveEntity(facilityName, 'facility', knownEntities, {
          region,
        });

        entities.push({
          source_text: match[0],
          entity: resolved.matched_name || facilityName,
          entity_type: 'facility',
          resolved: resolved.resolved,
          entity_id: resolved.entity_id,
          confidence: resolved.confidence,
          region,
        });
      }
    }

    // Pattern: commodity names
    const commoditiesList = ['copper', 'lithium', 'semiconductor', 'cobalt', 'nickel'];
    for (const commodity of commoditiesList) {
      const regex = new RegExp(`\\b${commodity}\\b`, 'gi');
      let match;
      while ((match = regex.exec(eventText)) !== null) {
        entities.push({
          source_text: match[0],
          entity: commodity,
          entity_type: 'commodity',
          resolved: true,
          confidence: 1.0,
        });
      }
    }

    return {
      event_text: eventText,
      entities_extracted: entities.length,
      entities: entities,
    };
  } catch (err) {
    logger.error('Error extracting entities', { error: err.message });
    return {
      event_text: eventText,
      entities_extracted: 0,
      entities: [],
      error: err.message,
    };
  }
};

/**
 * Calculate geographic distance (in km) between two coordinates
 * Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Resolve ownership chain
 * Find who owns a facility
 */
export const resolveOwnership = async (facilityId, organizationHierarchy) => {
  try {
    const owners = [];
    let currentId = facilityId;

    for (let i = 0; i < 5; i++) { // Max 5 levels up
      const parent = organizationHierarchy[currentId];
      if (!parent) break;

      owners.push({
        level: i + 1,
        org_id: parent.id,
        org_name: parent.name,
        ownership_percentage: parent.ownership_pct || 100,
      });

      currentId = parent.parent_id;
      if (!currentId) break;
    }

    return {
      facility_id: facilityId,
      ownership_chain: owners,
      ultimate_owner: owners[owners.length - 1] || null,
    };
  } catch (err) {
    logger.error('Error resolving ownership', { error: err.message });
    return {
      facility_id: facilityId,
      ownership_chain: [],
      error: err.message,
    };
  }
};

/**
 * Batch resolve multiple entities
 */
export const resolveEntitiesBatch = async (sourceNames, entityType, knownEntities, geoDataMap = {}) => {
  try {
    const results = [];

    for (const sourceName of sourceNames) {
      const resolved = await resolveEntity(
        sourceName,
        entityType,
        knownEntities,
        geoDataMap[sourceName]
      );
      results.push(resolved);
    }

    const successCount = results.filter((r) => r.resolved).length;
    logger.info('Batch entity resolution completed', {
      total: sourceNames.length,
      resolved: successCount,
      success_rate: ((successCount / sourceNames.length) * 100).toFixed(1) + '%',
    });

    return {
      total: sourceNames.length,
      resolved: successCount,
      results: results,
    };
  } catch (err) {
    logger.error('Error in batch entity resolution', { error: err.message });
    return {
      total: sourceNames.length,
      resolved: 0,
      results: [],
      error: err.message,
    };
  }
};

export default {
  resolveEntity,
  extractEntities,
  resolveOwnership,
  resolveEntitiesBatch,
  stringSimilarity,
};
