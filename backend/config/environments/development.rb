Rails.application.configure do
  config.eager_load = false
  config.cache_classes = false
  config.consider_all_requests_local = true
  config.action_controller.perform_caching = false
  config.log_level = :debug
  config.active_support.deprecation = :log
end
