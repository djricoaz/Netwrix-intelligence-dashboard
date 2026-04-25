class AppConfig
  include Mongoid::Document
  include Mongoid::Timestamps

  # Netwrix Auditor
  field :na_url,        type: String
  field :na_username,   type: String
  field :na_password,   type: String   # stored encrypted via attr_encrypted
  field :na_verify_ssl, type: Boolean, default: false
  field :na_connected,  type: Boolean, default: false
  field :na_last_test,  type: Time

  # Netwrix Data Classification
  field :ndc_url,       type: String
  field :ndc_username,  type: String
  field :ndc_password,  type: String
  field :ndc_connected, type: Boolean, default: false
  field :ndc_last_test, type: Time

  # Ollama AI
  field :ollama_url,    type: String,  default: "http://ollama:11434"
  field :ollama_model,  type: String,  default: "llama3.2"
  field :ai_enabled,    type: Boolean, default: true

  # Sync
  field :sync_interval_minutes, type: Integer, default: 15
  field :sync_enabled,          type: Boolean, default: true

  # Setup
  field :setup_completed, type: Boolean, default: false
  field :setup_step,      type: String,  default: "na"

  index({}, { unique: true })

  def self.instance
    first_or_create!
  end

  def self.setup_completed?
    instance.setup_completed
  end

  # Test NA connection with current or provided credentials
  def test_na(url: nil, username: nil, password: nil)
    client = Netwrix::AuditorClient.new(
      base_url: url || na_url,
      username: username || na_username,
      password: password || na_password
    )
    ok = client.health_check
    update!(na_connected: ok, na_last_test: Time.current, na_url: url || na_url,
            na_username: username || na_username,
            na_password: password || na_password) if ok
    ok
  rescue => e
    update!(na_connected: false, na_last_test: Time.current)
    false
  end

  def test_ndc(url: nil, username: nil, password: nil)
    client = Netwrix::DataClassificationClient.new(
      base_url: url || ndc_url,
      username: username || ndc_username,
      password: password || ndc_password
    )
    ok = client.health_check
    update!(ndc_connected: ok, ndc_last_test: Time.current, ndc_url: url || ndc_url,
            ndc_username: username || ndc_username,
            ndc_password: password || ndc_password) if ok
    ok
  rescue => e
    update!(ndc_connected: false, ndc_last_test: Time.current)
    false
  end

  def to_safe_json
    as_document.except("na_password", "ndc_password").merge(
      "na_password_set"  => na_password.present?,
      "ndc_password_set" => ndc_password.present?
    )
  end
end
