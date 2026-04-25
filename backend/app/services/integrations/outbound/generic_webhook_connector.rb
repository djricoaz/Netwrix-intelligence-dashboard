module Integrations
  module Outbound
    # Generic HTTP webhook — works for QRadar, Elastic, Datadog, XSOAR,
    # ServiceNow, PagerDuty, or any system accepting JSON over HTTP.
    class GenericWebhookConnector < BaseConnector
      connector_name        :generic_webhook
      connector_label       "Generic Webhook"
      connector_description "POST normalized events as JSON to any HTTP endpoint (QRadar, Elastic, Datadog, ServiceNow, etc.)"
      connector_direction   :outbound
      connector_schema({
        url:           { type: "string",   label: "Webhook URL" },
        method:        { type: "select",   label: "HTTP Method", options: %w[POST PUT PATCH], default: "POST" },
        auth_type:     { type: "select",   label: "Auth Type", options: %w[none bearer basic api_key], default: "none" },
        auth_value:    { type: "password", label: "Token / Password / API Key" },
        auth_header:   { type: "string",   label: "Header name (for api_key)", default: "X-Api-Key" },
        severity_filter: { type: "select", label: "Minimum severity", options: %w[info low medium high critical], default: "medium" }
      })

      register!

      SEVERITY_RANK = { "info" => 0, "low" => 1, "medium" => 2, "high" => 3, "critical" => 4 }.freeze

      def dispatch(normalized_event)
        min_rank = SEVERITY_RANK[config[:severity_filter] || "medium"] || 2
        return true if SEVERITY_RANK[normalized_event[:severity].to_s] < min_rank

        conn = build_connection
        method = (config[:method] || "POST").downcase.to_sym
        response = conn.public_send(method, config[:url], normalized_event.to_json)
        response.success?
      rescue => e
        err("Webhook dispatch failed: #{e.message}")
        false
      end

      private

      def build_connection
        Faraday.new do |f|
          f.headers["Content-Type"] = "application/json"
          apply_auth(f)
          f.options.timeout = 10
          f.adapter Faraday.default_adapter
        end
      end

      def apply_auth(conn)
        case config[:auth_type]
        when "bearer"
          conn.headers["Authorization"] = "Bearer #{config[:auth_value]}"
        when "basic"
          parts = config[:auth_value].to_s.split(":")
          conn.request :authorization, :basic, parts[0], parts[1]
        when "api_key"
          conn.headers[config[:auth_header] || "X-Api-Key"] = config[:auth_value]
        end
      end
    end
  end
end
