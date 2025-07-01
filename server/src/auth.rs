use axum::{
    extract::{Request, State},
    middleware::Next,
    response::{IntoResponse, Response},
};
use tanaka_server::config::AuthConfig;
use tanaka_server::error::AppError;

const BEARER_PREFIX: &str = "Bearer ";

pub async fn auth_middleware(
    State(auth_config): State<AuthConfig>,
    req: Request,
    next: Next,
) -> Result<Response, Response> {
    let auth_header = req
        .headers()
        .get(&auth_config.token_header)
        .and_then(|value| value.to_str().ok());

    match auth_header {
        Some(auth) if auth.starts_with(BEARER_PREFIX) => {
            let token = &auth[BEARER_PREFIX.len()..];
            if token == auth_config.shared_token {
                Ok(next.run(req).await)
            } else {
                Err(AppError::auth_token_invalid("Invalid authentication token").into_response())
            }
        }
        Some(_) => Err(AppError::auth_token_invalid(
            "Invalid authorization format. Use: Bearer <token>",
        )
        .into_response()),
        None => Err(AppError::auth_token_missing().into_response()),
    }
}
