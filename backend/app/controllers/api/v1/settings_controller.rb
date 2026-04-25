module Api
  module V1
    class SettingsController < ApplicationController
      skip_before_action :require_setup_complete

      # GET /api/v1/settings
      def show
        render json: AppConfig.instance.to_safe_json
      end

      # PUT /api/v1/settings/na
      def update_na
        cfg = AppConfig.instance
        ok  = cfg.test_na(
          url:      params[:na_url],
          username: params[:na_username],
          password: params[:na_password].presence || cfg.na_password
        )
        render json: { connected: ok, na: cfg.reload.to_safe_json.slice("na_url","na_username","na_connected","na_last_test") }
      end

      # PUT /api/v1/settings/ndc
      def update_ndc
        cfg = AppConfig.instance
        ok  = cfg.test_ndc(
          url:      params[:ndc_url],
          username: params[:ndc_username],
          password: params[:ndc_password].presence || cfg.ndc_password
        )
        render json: { connected: ok, ndc: cfg.reload.to_safe_json.slice("ndc_url","ndc_username","ndc_connected","ndc_last_test") }
      end

      # PUT /api/v1/settings/ai
      def update_ai
        AppConfig.instance.update!(
          ollama_url:   params[:ollama_url],
          ollama_model: params[:ollama_model],
          ai_enabled:   params[:ai_enabled]
        )
        render json: { ok: true }
      end

      # PUT /api/v1/settings/sync
      def update_sync
        AppConfig.instance.update!(
          sync_interval_minutes: params[:sync_interval_minutes],
          sync_enabled:          params[:sync_enabled]
        )
        render json: { ok: true }
      end

      # POST /api/v1/settings/test_na
      def test_na
        ok = AppConfig.instance.test_na(
          url:      params[:na_url],
          username: params[:na_username],
          password: params[:na_password]
        )
        render json: { connected: ok }
      end

      # POST /api/v1/settings/test_ndc
      def test_ndc
        ok = AppConfig.instance.test_ndc(
          url:      params[:ndc_url],
          username: params[:ndc_username],
          password: params[:ndc_password]
        )
        render json: { connected: ok }
      end

      # POST /api/v1/settings/complete_setup
      def complete_setup
        AppConfig.instance.update!(setup_completed: true)
        SyncModuleJob.perform_later("ad")
        render json: { ok: true }
      end
    end
  end
end
