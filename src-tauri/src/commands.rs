#[tauri::command]
pub fn update_msg(now: i64) -> String {
   format!("Hello, {}!", now)
}