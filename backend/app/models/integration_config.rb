class IntegrationConfig
  include Mongoid::Document
  include Mongoid::Timestamps

  field :connector_name, type: String
  field :enabled,        type: Boolean, default: false
  field :settings,       type: Hash,    default: {}
  field :last_sync_at,   type: Time
  field :last_error,     type: String
  field :stats,          type: Hash,    default: { events_sent: 0, events_received: 0, errors: 0 }

  index({ connector_name: 1 }, { unique: true })

  def enabled? = enabled == true

  def connector_instance
    meta = Integrations::Registry.outbound(connector_name) ||
           Integrations::Registry.inbound(connector_name)
    raise "Unknown connector: #{connector_name}" unless meta
    meta[:klass].new(settings)
  end

  def record_success(direction: :out)
    key = direction == :out ? "events_sent" : "events_received"
    inc("stats.#{key}" => 1)
    update!(last_sync_at: Time.current, last_error: nil)
  end

  def record_error(msg)
    inc("stats.errors" => 1)
    update!(last_error: msg)
  end
end
