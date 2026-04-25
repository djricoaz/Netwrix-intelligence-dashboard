require "influxdb-client"

INFLUX_CLIENT = InfluxDB2::Client.new(
  ENV.fetch("INFLUXDB_URL", "http://influxdb:8086"),
  ENV.fetch("INFLUXDB_TOKEN", ""),
  org:       ENV.fetch("INFLUXDB_ORG",    "netwrix"),
  bucket:    ENV.fetch("INFLUXDB_BUCKET", "audit_events"),
  precision: InfluxDB2::WritePrecision::SECOND,
  use_ssl:   false
)

Rails.logger.info("[InfluxDB] Client initialized → #{ENV.fetch("INFLUXDB_URL", "http://influxdb:8086")}")
