module Integrations
  module Outbound
    # Forwards normalized events to Splunk via HTTP Event Collector (HEC).
    class SplunkHecConnector < BaseConnector
      connector_name        :splunk_hec
      connector_label       "Splunk HEC"
      connector_description "Forward alerts and events to Splunk via HTTP Event Collector"
      connector_direction   :outbound
      connector_schema({
        hec_url:   { type: "string",   label: "HEC URL (e.g. https://splunk:8088/services/collector)" },
        hec_token: { type: "password", label: "HEC Token" },
        index:     { type: "string",   label: "Splunk Index", default: "netwrix" },
        sourcetype:{ type: "string",   label: "Sourcetype",   default: "netwrix:intelligence" }
      })

      register!

      def dispatch(normalized_event)
        conn = build_connection
        payload = {
          time:       normalized_event[:timestamp].to_i,
          sourcetype: config[:sourcetype] || "netwrix:intelligence",
          index:      config[:index] || "netwrix",
          source:     normalized_event[:source],
          event:      normalized_event
        }

        response = conn.post("/services/collector/event", payload.to_json)
        unless response.success?
          err("Splunk HEC rejected event: #{response.status} #{response.body}")
        end
        response.success?
      rescue => e
        err("Splunk dispatch failed: #{e.message}")
        false
      end

      def dispatch_batch(events)
        conn = build_connection
        body = events.map do |evt|
          { time: evt[:timestamp].to_i, sourcetype: config[:sourcetype], index: config[:index], source: evt[:source], event: evt }.to_json
        end.join("\n")

        response = conn.post("/services/collector/event", body)
        response.success?
      end

      private

      def build_connection
        Faraday.new(url: config[:hec_url], ssl: { verify: false }) do |f|
          f.headers["Authorization"] = "Splunk #{config[:hec_token]}"
          f.headers["Content-Type"]  = "application/json"
          f.adapter Faraday.default_adapter
          f.options.timeout = 10
        end
      end
    end
  end
end
