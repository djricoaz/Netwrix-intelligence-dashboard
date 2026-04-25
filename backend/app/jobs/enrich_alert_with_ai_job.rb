class EnrichAlertWithAiJob < ApplicationJob
  queue_as :ai
  sidekiq_options retry: 2

  def perform(alert_id)
    alert = Alert.find(alert_id)
    return if alert.ai_recommendation.present?

    context = {
      module:      alert.module,
      severity:    alert.severity,
      title:       alert.title,
      description: alert.description,
      who:         alert.who,
      what:        alert.what,
      where:       alert.where
    }

    prompt = <<~PROMPT
      You are a SOC analyst. Provide a concise (2-3 sentence) actionable recommendation
      for this security alert. Focus on immediate actions.

      Alert: #{alert.title}
      Details: #{alert.description}
      Severity: #{alert.severity}
      Module: #{alert.module}
      User: #{alert.who}

      Respond with only the recommendation text, no preamble.
    PROMPT

    recommendation = OllamaService.new.free_query(prompt, context)
    alert.update!(ai_recommendation: recommendation)
  rescue => e
    Rails.logger.warn("[EnrichAlertJob] #{e.message}")
  end
end
