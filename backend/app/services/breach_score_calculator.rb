class BreachScoreCalculator
  # Weights per signal (sum = 100)
  WEIGHTS = {
    critical_alerts:       25,
    high_risk_users:       20,
    pingcastle_score:      15,
    sensitive_exposed:     15,
    failed_logins_spike:   10,
    external_sharing:      10,
    off_hours_activity:     5
  }.freeze

  def self.global
    new.calculate
  end

  def self.detailed
    new.detailed_breakdown
  end

  def calculate
    scores = component_scores
    total  = WEIGHTS.sum { |signal, weight| (scores[signal] || 0) * weight / 100.0 }
    total.round
  end

  def detailed_breakdown
    scores    = component_scores
    weighted  = WEIGHTS.transform_values { |w| w }
    breakdown = scores.map do |signal, raw_score|
      weight = weighted[signal] || 0
      contribution = (raw_score * weight / 100.0).round(1)
      { signal: signal, raw_score: raw_score, weight: weight, contribution: contribution }
    end

    global_score = breakdown.sum { |b| b[:contribution] }.round

    {
      global_score:  global_score,
      risk_level:    risk_level(global_score),
      trend:         score_trend,
      breakdown:     breakdown,
      generated_at:  Time.current.iso8601
    }
  end

  private

  def component_scores
    {
      critical_alerts:     normalize(Alert.active.critical.count,          max: 20),
      high_risk_users:     normalize(UserRiskScore.high_risk.count,        max: 50),
      pingcastle_score:    PingcastleReport.latest&.global_score || 0,
      sensitive_exposed:   normalize(SensitiveDataRecord.high_risk.count,  max: 200),
      failed_logins_spike: normalize(ActivityRecord.last_24h.failed.count, max: 100),
      external_sharing:    normalize(SensitiveDataRecord.external.count,   max: 100),
      off_hours_activity:  normalize(ActivityRecord.last_24h.off_hours.count, max: 50)
    }
  end

  # Normalize a raw count to 0-100 given an expected maximum
  def normalize(value, max:)
    [[((value.to_f / max) * 100).round, 100].min, 0].max
  end

  def risk_level(score)
    return "critical" if score >= 80
    return "high"     if score >= 60
    return "medium"   if score >= 40
    return "low"      if score >= 20
    "secure"
  end

  def score_trend
    influx   = InfluxService.new
    points   = influx.severity_trend(days: 14)
    return "stable" if points.size < 3

    first_half  = points.first(points.size / 2).sum { |p| p[:value].to_f }
    second_half = points.last(points.size / 2).sum  { |p| p[:value].to_f }
    return "increasing" if second_half > first_half * 1.1
    return "decreasing" if second_half < first_half * 0.9
    "stable"
  end
end
