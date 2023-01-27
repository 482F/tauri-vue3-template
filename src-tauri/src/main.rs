#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use window_shadows::set_shadow;
use tauri::Manager;

mod commands;

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      let main_window = app.get_window("main").unwrap();
      set_shadow(&main_window, true).unwrap();
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![commands::update_msg])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
