module Predictions
  class KpiForecaster
    HORIZONS = {
      "1m"  => 30,
      "2m"  => 60,
      "3m"  => 90,
      "1y"  => 365,
      "2y"  => 730
    }.freeze

    def initialize(module_name)
      @module_name = module_name
      @ollama = OllamaService.new
      @influx = InfluxService.new
    end

    # Returns forecast for all horizons for a given module
    def forecast_all
      historical = @influx.query_module_kpis(@module_name, days: 90)

      HORIZONS.transform_values do |days|
        generate_forecast(historical, days)
      end
    end

    def forecast(horizon)
      days = HORIZONS[horizon] || 30
      historical = @influx.query_module_kpis(@module_name, days: [days * 2, 90].max)
      generate_forecast(historical, days)
    end

    private

    def generate_forecast(historical_data, horizon_days)
      horizon_label = HORIZONS.key(horizon_days) || "#{horizon_days}d"

      prompt = <<~PROMPT
        You are a cybersecurity KPI analyst. Based on the following historical security metrics
        for the #{@module_name} module over the past #{historical_data[:period_days]} days,
        provide a forecast and recommendations for the next #{horizon_days} days (#{horizon_label}).

        Historical KPIs:
        #{historical_data.to_json}

        Respond in JSON with this exact structure:
        {
          "horizon": "#{horizon_label}",
          "risk_trend": "increasing|stable|decreasing",
          "breach_probability": 0-100,
          "predicted_kpis": {
            "risk_score": 0-100,
            "incident_count": 0,
            "sensitive_exposure_change_pct": -100 to 100
          },
          "key_risks": ["..."],
          "recommended_actions": [
            { "priority": "critical|high|medium", "action": "...", "deadline": "..." }
          ],
          "executive_summary": "2-3 sentence summary for management"
        }
      PROMPT

      result = @ollama.structured_query(prompt)
      result.merge("generated_at" => Time.current.iso8601, "module" => @module_name)
    end
  end
end
