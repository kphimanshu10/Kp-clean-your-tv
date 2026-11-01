# Stock Launcher Recovery & Rollback Guide

**Safety Guarantee**: KP TV is 100% non-destructive. It never deletes, disables, or modifies your Iconic Smart TV's factory launcher, system services, or preinstalled applications (such as Netflix or Prime Video).

If you ever want to switch back to your TV's original factory home screen, use any of the methods below.

---

## Method 1: Using the TV Remote (No PC Required)

1. Open **Settings** on your TV (either via KP TV's **Settings** button or your physical TV remote's **Settings** button).
2. Navigate to **Apps** → **See all apps** → **KP TV – Smart TV Launcher**.
3. Select **Clear defaults** (or **Uninstall** if you wish to remove KP TV completely).
4. Press the **HOME** button on your remote — your original stock launcher will immediately reappear.

---

## Method 2: Via ADB from a Windows PC

If you connected via ADB (`adb connect <TV_IP>:5555`), run either command:

### Option A: Clear KP TV as Default Home (Keep KP TV Installed)
```powershell
adb shell pm clear com.kptv.launcher
```

### Option B: Explicitly Restore Stock Launcher Activity
First list all installed home launchers on your TV:
```powershell
adb shell pm query-activities -a android.intent.action.MAIN -c android.intent.category.HOME
```
Then set your factory launcher back as default (replace with the package/activity shown by the command above):
```powershell
adb shell cmd package set-home-activity com.cloudtv.launcher/.MainActivity
```

### Option C: Uninstall KP TV Completely
```powershell
adb uninstall com.kptv.launcher
```
Once uninstalled, Android automatically reverts to the built-in stock launcher.
