module Integrations
  # All connectors inherit from this. Inbound connectors implement #ingest,
  # outbound connectors implement #dispatch.
  class BaseConnector
    attr_reader :config

    def initialize(config = {})
      @config = config.with_indifferent_access
    end

    def self.inherited(subclass)
      subclass.instance_variable_set(:@meta, {})
    end

    # DSL for connector metadata
    def self.connector_name(name)       = @meta[:name] = name
    def self.connector_label(label)     = @meta[:label] = label
    def self.connector_description(d)   = @meta[:description] = d
    def self.connector_direction(d)     = @meta[:direction] = d
    def self.connector_schema(schema)   = @meta[:schema] = schema
    def self.meta                       = @meta

    def self.register!
      Registry.register(
        direction:   @meta[:direction],
        name:        @meta[:name],
        klass:       self,
        label:       @meta[:label],
        description: @meta[:description],
        schema:      @meta[:schema] || {}
      )
    end

    protected

    def log(msg) = Rails.logger.info("[#{self.class.name}] #{msg}")
    def err(msg) = Rails.logger.error("[#{self.class.name}] #{msg}")
  end
end
