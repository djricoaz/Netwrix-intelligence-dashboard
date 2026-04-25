class OllamaService
  OLLAMA_URL = ENV["OLLAMA_URL"] || "http://localhost:11434"
  MODEL = "llama3.2"

  def initialize
    @conn = Faraday.new(url: OLLAMA_URL) do |f|
      f.request :json
      f.response :json
      f.adapter Faraday.default_adapter
      f.options.timeout = 120
    end
  end

  def predict_user_risk(user_data)
    prompt = <<~PROMPT
      You are a cybersecurity analyst. Based on the following Netwrix audit data for a user,
      provide a risk assessment with a score from 0-100 and key risk indicators.

      User Activity Data:
      - Username: #{user_data[:username]}
      - Total events (7d): #{user_data[:event_count]}
      - Failed logins: #{user_data[:failed_logins]}
      - Sensitive data accesses: #{user_data[:sensitive_accesses]}
      - Unusual hours activity: #{user_data[:off_hours_events]}
      - Unique shares accessed: #{user_data[:unique_shares]}
      - Data moved/copied: #{user_data[:data_moved_gb]}GB

      Respond in JSON: { "risk_score": 0-100, "risk_level": "low|medium|high|critical",
      "indicators": ["..."], "recommendation": "..." }
    PROMPT

    response = @conn.post("/api/generate", {
      model: MODEL,
      prompt: prompt,
      stream: false,
      format: "json"
    })

    JSON.parse(response.body["response"])
  rescue => e
    { risk_score: 0, risk_level: "unknown", indicators: [], recommendation: "AI unavailable: #{e.message}" }
  end

  def analyze_sensitive_data_trend(trend_data)
    prompt = <<~PROMPT
      You are a data security analyst. Analyze this sensitive data trend from Netwrix Data Classification
      and provide insights and predictions.

      Trend Data (last 30 days):
      #{trend_data.to_json}

      Respond in JSON: { "trend": "increasing|stable|decreasing", "prediction_7d": "...",
      "top_risk_areas": ["..."], "recommended_actions": ["..."] }
    PROMPT

    response = @conn.post("/api/generate", {
      model: MODEL,
      prompt: prompt,
      stream: false,
      format: "json"
    })

    JSON.parse(response.body["response"])
  rescue => e
    { trend: "unknown", prediction_7d: "AI unavailable", top_risk_areas: [], recommended_actions: [] }
  end

  def free_query(question, context_data = {})
    prompt = <<~PROMPT
      You are a Netwrix security dashboard AI assistant. You have access to audit and data classification data.

      Context: #{context_data.to_json}

      Question: #{question}

      Give a concise, actionable answer focused on security insights.
    PROMPT

    response = @conn.post("/api/generate", {
      model: MODEL,
      prompt: prompt,
      stream: false
    })

    response.body["response"]
  rescue => e
    "AI unavailable: #{e.message}"
  end
end
