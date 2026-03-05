
/**
 * Handles the 'commercial.deal.won' domain event.
 * @param {Object} dealPayload - The full deal object with relations.
 */
export const emitDealWon = (dealPayload) => {
  console.log(`[EVENT] commercial.deal.won emitted for Deal ${dealPayload.id}`);
  
  const eventPayload = {
    eventName: 'commercial.deal.won',
    occurredAt: new Date(),
    tenantId: dealPayload.tenantId,
    data: {
        dealId: dealPayload.id,
        value: dealPayload.estimatedValue,
        clientId: dealPayload.leadId,
        clientName: dealPayload.lead.name,
        technicalKit: dealPayload.technicalProposal?.kitData,
        payback: dealPayload.technicalProposal?.paybackData
    }
  };

  // Here we would dispatch to a real Event Bus (RabbitMQ, Redis, or internal EventEmitter)
  // For now, we log it as per the skeleton requirement.
  console.log("Payload:", JSON.stringify(eventPayload, null, 2));
  
  // Future Integration:
  // EventBus.publish('commercial.deal.won', eventPayload);
};
