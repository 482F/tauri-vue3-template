#[derive(Clone, serde::Serialize)]
pub struct CommandlinePayload {
  pub argv: Vec<String>,
  pub cwd: String,
}

#[tauri::command]
pub fn update_msg(now: i64) -> String {
  format!("Hello, {}!", now)
}

#[tauri::command]
pub fn get_commandline() -> CommandlinePayload {
  return CommandlinePayload {
    argv: std::env::args().collect(),
    cwd: std::env::current_dir()
      .unwrap()
      .into_os_string()
      .into_string()
      .unwrap(),
  };
}
