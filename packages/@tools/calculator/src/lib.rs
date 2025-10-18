use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Serialize)]
struct Metadata {
    name: String,
    version: String,
    description: String,
}

#[derive(Deserialize)]
struct ExecuteInput {
    parameters: serde_json::Value,
}

#[derive(Serialize)]
struct ExecuteOutput {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

/// Returns metadata about the calculator tool
#[wasm_bindgen]
pub fn metadata() -> String {
    let metadata = Metadata {
        name: "calculator".to_string(),
        version: "1.0.0".to_string(),
        description: "Performs basic arithmetic operations (add, subtract, multiply, divide)".to_string(),
    };

    serde_json::to_string(&metadata).unwrap_or_else(|e| {
        format!(r#"{{"error":"Failed to serialize metadata: {}"}}"#, e)
    })
}

/// Executes the calculator tool with given parameters
///
/// Expected parameters:
/// - operation: "add" | "subtract" | "multiply" | "divide"
/// - a: number
/// - b: number
#[wasm_bindgen]
pub fn execute(input: &str) -> String {
    // Parse input
    let parsed_input: ExecuteInput = match serde_json::from_str(input) {
        Ok(v) => v,
        Err(e) => {
            return serde_json::to_string(&ExecuteOutput {
                success: false,
                data: None,
                error: Some(format!("Failed to parse input: {}", e)),
            }).unwrap();
        }
    };

    // Extract parameters
    let params = &parsed_input.parameters;
    let operation = match params.get("operation").and_then(|v| v.as_str()) {
        Some(op) => op,
        None => {
            return serde_json::to_string(&ExecuteOutput {
                success: false,
                data: None,
                error: Some("Missing 'operation' parameter".to_string()),
            }).unwrap();
        }
    };

    let a = match params.get("a").and_then(|v| v.as_f64()) {
        Some(n) => n,
        None => {
            return serde_json::to_string(&ExecuteOutput {
                success: false,
                data: None,
                error: Some("Missing or invalid 'a' parameter (must be a number)".to_string()),
            }).unwrap();
        }
    };

    let b = match params.get("b").and_then(|v| v.as_f64()) {
        Some(n) => n,
        None => {
            return serde_json::to_string(&ExecuteOutput {
                success: false,
                data: None,
                error: Some("Missing or invalid 'b' parameter (must be a number)".to_string()),
            }).unwrap();
        }
    };

    // Perform operation
    let result = match operation {
        "add" => a + b,
        "subtract" => a - b,
        "multiply" => a * b,
        "divide" => {
            if b == 0.0 {
                return serde_json::to_string(&ExecuteOutput {
                    success: false,
                    data: None,
                    error: Some("Cannot divide by zero".to_string()),
                }).unwrap();
            }
            a / b
        }
        _ => {
            return serde_json::to_string(&ExecuteOutput {
                success: false,
                data: None,
                error: Some(format!("Unknown operation: {}. Supported: add, subtract, multiply, divide", operation)),
            }).unwrap();
        }
    };

    // Return success
    serde_json::to_string(&ExecuteOutput {
        success: true,
        data: Some(serde_json::json!({ "result": result })),
        error: None,
    }).unwrap()
}
