module Api
  module V1
    module Setup
      # First-run setup wizard API.
      # Once setup is complete (SetupState.completed?), all endpoints redirect to normal app.
      class WizardController < ApplicationController
        skip_before_action :require_setup_complete

        # GET /api/v1/setup/status
        def status
          render json: {
            completed:      SetupState.completed?,
            current_step:   SetupState.current_step,
            steps:          SetupState::STEPS
          }
        end

        # POST /api/v1/setup/step/credentials
        # Validates NA + NDC connectivity and saves credentials
        def credentials
          na_ok  = test_na_connection(params[:na_url], params[:na_username], params[:na_password])
          ndc_ok = test_ndc_connection(params[:ndc_url], params[:ndc_username], params[:ndc_password])

          if na_ok
            SetupState.save_credentials(:na, params.slice(:na_url, :na_username, :na_password))
          end
          if ndc_ok
            SetupState.save_credentials(:ndc, params.slice(:ndc_url, :ndc_username, :ndc_password))
          end

          render json: {
            na_connected:  na_ok,
            ndc_connected: ndc_ok,
            step_ok:       na_ok  # NDC is optional
          }
        end

        # POST /api/v1/setup/step/sources
        # Runs source discovery and shows which modules will be enabled
        def sources
          discovery = Netwrix::SourceDiscovery.new.discover
          SetupState.advance_to("integrations")
          render json: discovery
        end

        # POST /api/v1/setup/step/integrations
        # User selects which SIEM integrations to enable (optional step)
        def integrations
          (params[:connectors] || []).each do |connector_cfg|
            IntegrationConfig.find_or_initialize_by(connector_name: connector_cfg[:name])
                             .update!(enabled: true, settings: connector_cfg[:settings])
          end
          SetupState.advance_to("ai")
          render json: { ok: true }
        end

        # POST /api/v1/setup/step/ai
        # Tests Ollama connectivity and pulls model if needed
        def ai
          ollama_ok = OllamaService.new.health_check
          if ollama_ok && params[:pull_model]
            PullOllamaModelJob.perform_later("llama3.2")
          end
          SetupState.advance_to("sync")
          render json: { ollama_ready: ollama_ok }
        end

        # POST /api/v1/setup/step/sync
        # Runs initial full data sync
        def sync
          config = Netwrix::SourceDiscovery.cached
          config[:modules].select { |_, v| v }.each_key do |mod|
            "Sync#{mod.to_s.camelize}Job".constantize.perform_later
          end
          SetupState.advance_to("complete")
          SetupState.complete!
          render json: { status: "syncing", message: "Initial sync started in background" }
        end

        private

        def test_na_connection(url, username, password)
          client = Netwrix::AuditorClient.new(base_url: url, username: username, password: password)
          client.health_check
        rescue
          false
        end

        def test_ndc_connection(url, username, password)
          client = Netwrix::DataClassificationClient.new(base_url: url, username: username, password: password)
          client.health_check
        rescue
          false
        end
      end
    end
  end
end
