#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use window_shadows::set_shadow;
use tauri::Manager;

mod commands;

#[derive(Clone, serde::Serialize)]
struct Payload {
  argv: Vec<String>,
  cwd: String,
}

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      let main_window = app.get_window("main").unwrap();
      set_shadow(&main_window, true).unwrap();
      Ok(())
    })
    .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
      let main_window = app.get_window("main").unwrap();
      main_window.show();
      main_window.unminimize();
      main_window.set_focus();

      main_window.emit("second-instance", Payload { argv, cwd }).unwrap();
    }))
    .invoke_handler(tauri::generate_handler![commands::update_msg])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
