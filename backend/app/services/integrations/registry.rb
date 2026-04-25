module Integrations
  # Central registry for all inbound and outbound connectors.
  # New integrations self-register by calling Registry.register.
  # Stored config (credentials, enabled state) lives in MongoDB IntegrationConfig.
  class Registry
    CONNECTORS = {
      inbound: {},
      outbound: {}
    }.freeze

    class << self
      def register(direction:, name:, klass:, label:, description:, schema:)
        CONNECTORS[direction][name.to_sym] = {
          klass: klass,
          label: label,
          description: description,
          schema: schema  # JSON Schema for config fields shown in UI
        }
      end

      def inbound(name)  = CONNECTORS[:inbound][name.to_sym]
      def outbound(name) = CONNECTORS[:outbound][name.to_sym]

      def all_inbound    = CONNECTORS[:inbound]
      def all_outbound   = CONNECTORS[:outbound]

      # Returns all connectors with their enabled state from DB
      def catalog
        configs = IntegrationConfig.all.index_by(&:connector_name)
        {
          inbound:  enrich(CONNECTORS[:inbound],  configs),
          outbound: enrich(CONNECTORS[:outbound], configs)
        }
      end

      private

      def enrich(connectors, configs)
        connectors.map do |name, meta|
          cfg = configs[name.to_s]
          {
            name: name,
            label: meta[:label],
            description: meta[:description],
            schema: meta[:schema],
            enabled: cfg&.enabled? || false,
            configured: cfg.present?,
            last_sync: cfg&.last_sync_at
          }
        end
      end
    end
  end
end
