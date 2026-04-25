module Api
  module V1
    class SyncController < ApplicationController
      def discover
        result = Netwrix::SourceDiscovery.new.discover
        render json: result
      rescue => e
        Rails.logger.error("[Sync] discover failed: #{e.message}")
        render json: { modules: { ad: false, entra: false, fileserver: false, sharepoint: false, exchange: false, teams: false }, error: e.message }, status: 200
      end

      def ad;         SyncModuleJob.perform_later("ad");         render json: { queued: true } end
      def entra;      SyncModuleJob.perform_later("entra");      render json: { queued: true } end
      def fileserver; SyncModuleJob.perform_later("fileserver"); render json: { queued: true } end
      def sharepoint; SyncModuleJob.perform_later("sharepoint"); render json: { queued: true } end
      def exchange;   SyncModuleJob.perform_later("exchange");   render json: { queued: true } end
      def teams;      SyncModuleJob.perform_later("teams");      render json: { queued: true } end
      def pingcastle; SyncModuleJob.perform_later("pingcastle"); render json: { queued: true } end

      def status
        render json: { status: "idle" }
      end
    end
  end
end
