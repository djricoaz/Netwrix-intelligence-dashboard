module Pipeline
  # Central ingest pipeline. Every event — from NA, NDC, SIEM, webhook — passes through here.
  # 1. Stores in MongoDB (ActivityRecord) for querying
  # 2. Writes to InfluxDB for time-series / charts
  # 3. Runs alert rules
  # 4. Broadcasts to SOC live feed (ActionCable)
  # 5. Forwards to outbound SIEM integrations if configured
  class IngestPipeline
    class << self
      def ingest(normalized_event)
        return if normalized_event.blank?

        record = store_mongodb(normalized_event)
        store_influxdb(normalized_event)
        evaluate_alert_rules(normalized_event, record)
        broadcast_soc(normalized_event)
        forward_to_siems(normalized_event)

        record
      rescue => e
        Rails.logger.error("[IngestPipeline] #{e.message}\n#{e.backtrace.first(3).join("\n")}")
        nil
      end

      def ingest_batch(events)
        events.each { |e| ingest(e) }
      end

      private

      def store_mongodb(evt)
        ActivityRecord.create!(
          source:         evt[:source],
          module:         evt[:module] || "unknown",
          event_id:       evt[:event_id],
          event_name:     evt[:event_name],
          severity:       evt[:severity],
          severity_score: evt[:severity_score],
          timestamp:      evt[:timestamp] || Time.current,
          who:            evt[:who],
          what:           evt[:what],
          where:          evt[:where],
          source_ip:      evt[:source_ip],
          dest_ip:        evt[:dest_ip],
          action:         evt[:action],
          object_name:    evt[:object_name],
          object_type:    evt[:object_type],
          outcome:        evt[:outcome],
          extensions:     evt[:extensions] || {},
          raw:            evt[:raw]
        )
      end

      def store_influxdb(evt)
        InfluxService.new.write_event(evt)
      end

      def evaluate_alert_rules(evt, record)
        AlertRulesEngine.evaluate(evt, record)
      end

      def broadcast_soc(evt)
        ActionCable.server.broadcast("events_channel", evt)
      rescue => e
        Rails.logger.warn("[IngestPipeline] ActionCable broadcast failed: #{e.message}")
      end

      def forward_to_siems(evt)
        enabled_outbound = IntegrationConfig.where(enabled: true, :connector_name.nin => ["cef_tcp"])
        enabled_outbound.each do |cfg|
          ForwardEventJob.perform_later(cfg.connector_name, evt.to_json)
        end
      end
    end
  end
end
