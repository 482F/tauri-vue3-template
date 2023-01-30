#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri::{
  CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem, Window,
};
use window_shadows::set_shadow;

mod commands;

#[derive(Clone, serde::Serialize)]
struct Payload {
  argv: Vec<String>,
  cwd: String,
}

fn gen_system_tray() -> SystemTray {
  let tray_menu = SystemTrayMenu::new()
    .add_item(CustomMenuItem::new("show".to_string(), "Show"))
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(CustomMenuItem::new("quit".to_string(), "Quit"));

  let system_tray = SystemTray::new().with_menu(tray_menu);
  return system_tray;
}

#[allow(unused_must_use)]
fn focus(win: &Window) {
  win.show();
  win.unminimize();
  win.set_focus();
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

      focus(&main_window);

      main_window
        .emit("second-instance", Payload { argv, cwd })
        .unwrap();
    }))
    .invoke_handler(tauri::generate_handler![commands::update_msg])
    .system_tray(gen_system_tray())
    .on_system_tray_event(|app, event| {
      let main_window = app.get_window("main").unwrap();
      match event {
        SystemTrayEvent::DoubleClick { .. } => {
          focus(&main_window);
        }
        SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
          "quit" => {
            std::process::exit(0);
          }
          "show" => {
            focus(&main_window);
          }
          _ => {}
        },
        _ => {}
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
