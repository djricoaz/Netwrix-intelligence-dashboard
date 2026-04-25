require "influxdb-client"

class InfluxService
  BUCKET = ENV["INFLUXDB_BUCKET"] || "audit_events"
  ORG    = ENV["INFLUXDB_ORG"]    || "netwrix"

  def initialize
    @client = InfluxDB2::Client.new(
      ENV["INFLUXDB_URL"] || "http://influxdb:8086",
      ENV["INFLUXDB_TOKEN"],
      org: ORG, bucket: BUCKET, precision: InfluxDB2::WritePrecision::SECOND
    )
    @write_api = @client.create_write_api
    @query_api = @client.create_query_api
  end

  # Write a normalized event as a time-series point
  def write_event(event)
    point = InfluxDB2::Point.new(name: "security_event")
      .add_tag("module",   event[:module]   || "unknown")
      .add_tag("source",   event[:source]   || "unknown")
      .add_tag("severity", event[:severity] || "info")
      .add_tag("who",      event[:who]      || "unknown")
      .add_field("event_name",    event[:event_name])
      .add_field("severity_score",event[:severity_score].to_i)
      .add_field("outcome",       event[:outcome])
      .add_field("object_name",   event[:object_name])
      .time(event[:timestamp] || Time.current, InfluxDB2::WritePrecision::SECOND)

    @write_api.write(data: point)
  rescue => e
    Rails.logger.error("[InfluxDB] write_event failed: #{e.message}")
  end

  # Write KPI snapshot for a module (called by KpiAggregators periodically)
  def write_kpi(module_name, kpis = {})
    point = InfluxDB2::Point.new(name: "module_kpi")
      .add_tag("module", module_name)

    kpis.each do |k, v|
      point.add_field(k.to_s, v.to_f) if v.is_a?(Numeric)
    end
    point.time(Time.current, InfluxDB2::WritePrecision::SECOND)

    @write_api.write(data: point)
  rescue => e
    Rails.logger.error("[InfluxDB] write_kpi failed: #{e.message}")
  end

  # Query events over a time range, grouped by day
  def query_events_by_day(module_name: nil, days: 30, severity: nil)
    filters = []
    filters << %Q(r["module"] == "#{module_name}") if module_name
    filters << %Q(r["severity"] == "#{severity}")  if severity
    filter_clause = filters.any? ? "  |> filter(fn: (r) => #{filters.join(' and ')})\n" : ""

    flux = <<~FLUX
      from(bucket: "#{BUCKET}")
        |> range(start: -#{days}d)
        |> filter(fn: (r) => r["_measurement"] == "security_event")
      #{filter_clause}  |> aggregateWindow(every: 1d, fn: count, createEmpty: true)
        |> yield(name: "events_per_day")
    FLUX

    parse_table(@query_api.query(query: flux))
  rescue => e
    Rails.logger.error("[InfluxDB] query failed: #{e.message}")
    []
  end

  # Query KPI time-series for forecast input
  def query_module_kpis(module_name, days: 90)
    flux = <<~FLUX
      from(bucket: "#{BUCKET}")
        |> range(start: -#{days}d)
        |> filter(fn: (r) => r["_measurement"] == "module_kpi" and r["module"] == "#{module_name}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
    FLUX

    rows = parse_table(@query_api.query(query: flux))
    { module: module_name, period_days: days, data_points: rows }
  rescue => e
    Rails.logger.error("[InfluxDB] kpi query failed: #{e.message}")
    { module: module_name, period_days: days, data_points: [] }
  end

  # Severity trend over time (for breach score chart)
  def severity_trend(days: 30)
    flux = <<~FLUX
      from(bucket: "#{BUCKET}")
        |> range(start: -#{days}d)
        |> filter(fn: (r) => r["_measurement"] == "security_event")
        |> filter(fn: (r) => r["severity"] == "critical" or r["severity"] == "high")
        |> aggregateWindow(every: 1d, fn: count, createEmpty: true)
        |> yield(name: "severity_trend")
    FLUX

    parse_table(@query_api.query(query: flux))
  rescue => e
    []
  end

  def close = @client.close!

  private

  def parse_table(tables)
    tables.flat_map do |table|
      table.records.map do |r|
        { time: r.time, value: r.value, field: r.field, tags: r.values.slice("module", "source", "severity", "who") }
      end
    end
  end
end
