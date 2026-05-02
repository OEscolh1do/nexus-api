export const SCORING_RULES = {
  WEIGHTS: {
    WORKSHOP_ENROLLMENT: 30,
    COURSE_COMPLETION: 100,
    webinar_attendance: 10 // Example of extensibility
  },
  THRESHOLDS: {
    HOT_LEAD: 150
  }
};

export class ScoringService {
  /**
   * Calculates the score delta based on event type.
   * @param {String} eventType 
   * @returns {Number} scoreDelta
   */
  getScoreDelta(eventType) {
    switch (eventType) {
      case 'ACADEMY_ENROLLMENT':
        return SCORING_RULES.WEIGHTS.WORKSHOP_ENROLLMENT;
      case 'ACADEMY_COMPLETION':
        return SCORING_RULES.WEIGHTS.COURSE_COMPLETION;
      default:
        return 0;
    }
  }

  /**
   * Determines if a lead qualifies for auto-promotion.
   * @param {Number} currentScore 
   * @param {String} currentStatus 
   * @returns {Boolean}
   */
  shouldPromoteToHot(currentScore, currentStatus) {
    return (
      currentScore >= SCORING_RULES.THRESHOLDS.HOT_LEAD &&
      currentStatus !== 'HOT' &&
      currentStatus !== 'WON'
    );
  }
}
