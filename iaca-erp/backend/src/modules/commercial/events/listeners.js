import { LeadService } from '../services/LeadService.js';

const leadService = new LeadService();

export function initAcademyListeners(eventBus) {
  
  // Event: academy.student.enrolled
  eventBus.on('academy.student.enrolled', async (payload) => {
    try {
      // payload: { email, tenantId, ... }
      await leadService.processAcademyEvent(payload.email, 'ACADEMY_ENROLLMENT', payload.tenantId);
    } catch (error) {
      console.error(`[Listener Error] academy.student.enrolled:`, error);
    }
  });

  // Event: academy.course.completed
  eventBus.on('academy.course.completed', async (payload) => {
    try {
      await leadService.processAcademyEvent(payload.email, 'ACADEMY_COMPLETION', payload.tenantId);
    } catch (error) {
      console.error(`[Listener Error] academy.course.completed:`, error);
    }
  });
}
