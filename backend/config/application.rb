require_relative "boot"
require "rails"
require "action_controller/railtie"
require "action_cable/engine"
require "active_job/railtie"

Bundler.require(*Rails.groups)

module NetwrixIntelligenceDashboard
  class Application < Rails::Application
    config.load_defaults 7.2
    config.api_only = true

    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins ENV.fetch("CORS_ORIGINS", "*")
        resource "/api/*",
          headers: :any,
          methods: %i[get post put patch delete options head],
          expose:  %w[Authorization]
        resource "/cable",
          headers: :any,
          methods: %i[get post]
      end
    end

    config.active_job.queue_adapter = :sidekiq

    config.cache_store = :redis_cache_store, { url: ENV.fetch("REDIS_URL", "redis://redis:6379/1") }

    config.action_cable.mount_path = "/cable"
    config.action_cable.allowed_request_origins = ["*"]
  end
end
