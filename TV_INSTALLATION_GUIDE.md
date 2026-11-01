# Iconic 32" Smart TV Installation Guide (Cloud TV OS / Android)

This guide explains how to safely install and test **KP TV – Smart TV Launcher** on your **Iconic 32-inch Smart TV** without risking your stock launcher or firmware.

---

## 1. Pre-Installation Hardware & OS Verification

Before setting any launcher as default, verify your Iconic TV's environment:

1. **Via USB Drive (Simplest Method — No PC ADB Required)**:
   - Format a USB flash drive to **FAT32**.
   - Copy `app-debug.apk` (or `app-release.apk`) to the root of the USB drive.
   - Plug the USB drive into your Iconic TV's USB port.
   - Open the built-in **File Manager** / **Media Browser** on your TV.
   - Select the APK file and choose **Install** (if prompted, allow *Install from Unknown Sources* in Security Settings).

2. **Via ADB over Wi-Fi from Windows PC**:
   - On your TV, go to **Settings** → **About TV** and press **OK** on **Build Number** 7 times to unlock **Developer Options**.
   - Enable **ADB Debugging** / **Network Debugging**.
   - Find your TV's IP address in **Settings** → **Network / Wi-Fi** (e.g., `192.168.1.150`).
   - On your Windows PC, run:
     ```powershell
     adb connect 192.168.1.150:5555
     ```
   - Run the hardware inspection commands to check your TV's exact specs:
     ```powershell
     adb shell getprop ro.build.version.release
     adb shell getprop ro.build.version.sdk
     adb shell getprop ro.product.cpu.abi
     adb shell wm size
     adb shell cat /proc/meminfo | findstr MemTotal
     ```
   - Install the APK:
     ```powershell
     adb install -r app\build\outputs\apk\release\app-release.apk
     ```

---

## 2. Safe Testing Before Setting as Default HOME

**IMPORTANT**: Never disable or uninstall your stock launcher!

1. First launch KP TV manually as a regular app from your TV's existing Apps list or via ADB:
   ```powershell
   adb shell am start -n com.kptv.launcher/.MainActivity
   ```
2. Test all D-pad remote keys (`UP`, `DOWN`, `LEFT`, `RIGHT`, `OK`, `BACK`).
3. Click **More Apps** to confirm that KP TV detects and launches your installed TV apps (YouTube, JioHotstar, Netflix, Prime Video, etc.).
4. Only after verifying everything works smoothly, press the **HOME** button on your TV remote. If your TV OS prompts *"Complete action using..."*, select **KP TV** → **Just Once** first to test, and **Always** only when satisfied.
