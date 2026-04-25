class ApplicationController < ActionController::API
  before_action :require_setup_complete, except: [:health]

  rescue_from Mongoid::Errors::DocumentNotFound, with: -> { render json: { error: "Not found" }, status: 404 }
  rescue_from ActionController::ParameterMissing, with: ->(e) { render json: { error: e.message }, status: 422 }

  private

  def require_setup_complete
    return if SetupState.completed?
    return if request.path.start_with?("/api/v1/setup")
    render json: { setup_required: true, redirect: "/setup" }, status: 503
  end
end
