class ForwardEventJob < ApplicationJob
  queue_as :integrations
  sidekiq_options retry: 3

  def perform(connector_name, event_json)
    cfg = IntegrationConfig.find_by(connector_name: connector_name)
    return unless cfg&.enabled?

    event     = JSON.parse(event_json).with_indifferent_access
    connector = cfg.connector_instance
    success   = connector.dispatch(event)

    success ? cfg.record_success : cfg.record_error("dispatch returned false")
  rescue => e
    IntegrationConfig.find_by(connector_name: connector_name)&.record_error(e.message)
    raise
  end
end
