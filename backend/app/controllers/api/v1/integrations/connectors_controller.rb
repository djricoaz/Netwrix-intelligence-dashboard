module Api
  module V1
    module Integrations
      class ConnectorsController < ApplicationController
        # GET /api/v1/integrations/connectors
        # Returns full catalog of available connectors with enabled state
        def index
          render json: Integrations::Registry.catalog
        end

        # GET /api/v1/integrations/connectors/:name
        def show
          config = IntegrationConfig.find_by(connector_name: params[:name])
          render json: config || { connector_name: params[:name], enabled: false }
        end

        # PUT /api/v1/integrations/connectors/:name
        # Enable/configure a connector
        def update
          config = IntegrationConfig.find_or_initialize_by(connector_name: params[:name])
          config.assign_attributes(
            enabled:  params[:enabled],
            settings: params[:settings]&.permit!.to_h
          )
          config.save!
          render json: { status: "ok", connector: params[:name] }
        rescue => e
          render json: { error: e.message }, status: :unprocessable_entity
        end

        # POST /api/v1/integrations/connectors/:name/test
        # Test connector connectivity
        def test
          config  = IntegrationConfig.find_by!(connector_name: params[:name])
          meta    = Integrations::Registry.outbound(params[:name]) || Integrations::Registry.inbound(params[:name])
          return render json: { error: "Unknown connector" }, status: 404 unless meta

          connector = meta[:klass].new(config.settings)
          result    = connector.respond_to?(:test_connection) ? connector.test_connection : { reachable: true }
          render json: { status: "ok", result: result }
        rescue => e
          render json: { status: "error", message: e.message }, status: :unprocessable_entity
        end
      end
    end
  end
end
