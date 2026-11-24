# Amazon Device Maintenance

[English](README.md) · [繁體中文](README.zh-TW.md)

Maintenance guides for Amazon Echo and Fire devices. The five steps below document the verified Echo Show setup.

| Device | Codename | Status |
|---|---|---|
| Echo Show 5 (2nd gen) | `cronos` | Verified on Fire OS `NS65751/8851N` |
| Echo Show 8 (1st gen) | `crown` | Verified on Fire OS `NS65751/8851N` |
| Echo Dot (2nd gen) | `biscuit` | Pending device testing |
| Fire HD 8 / Fire HD 10 | Varies by generation | Pending model identification and testing |

The Echo Show steps use Magisk `30.7` and Paladin `1.0.2003176674`. Use your own device, an authorized USB ADB connection, [Android Platform-Tools](https://developer.android.com/tools/releases/platform-tools), and a device-specific backup. Replace `SERIAL` with the target from `adb devices -l` and `DEVICE_IP` with its LAN address.

## 1. Update the firmware

- On a stock device, open **Settings → About This Device → Check for Software Updates**. Amazon may offer a newer build than the one verified here. [Amazon's update instructions](https://digprjsurvey.amazon.com/csad/help/node/GYB55PBLWG8A6FJ8)
- On an already-unlocked Echo Show with a verified compatible TWRP installation, back up the device and use **ADB Sideload** with the full package for its codename. Confirm you can return to recovery or USB ADB afterward. Leave the wipe options unchecked. TWRP upstream does not support manufacturer OTAs. [TWRP Sideload](https://twrp.me/faq/ADBSideload.html) · [TWRP OTA support](https://twrp.me/faq/officialota.html)

```sh
adb -s SERIAL shell getprop ro.product.device
adb -s SERIAL shell getprop ro.build.fingerprint
# Run after the target enters TWRP Sideload mode.
adb -s SERIAL sideload FIRE_OS_UPDATE
```

Verify SHA-256 before installing. On Windows, use `Get-FileHash -Algorithm SHA256`. Check the recovery installation result, then recheck the build fingerprint after boot.

| Full firmware package | SHA-256 |
|---|---|
| [Cronos 8851N](https://d1s31zyz7dcc2d.cloudfront.net/2026/11/12/c155f085-0ef9-4fc9-b6ec-0776f4cebf9b/update-kindle-cronos-NS65751_user_8851_0013524702084.bin) | `216282efaa846fcfb12baaf3766cc4d090202a7bd35e05bd87e94e7e3e8039f4` |
| [Crown 8851N](https://d1s31zyz7dcc2d.cloudfront.net/2026/11/12/ca75dc10-f865-46a1-9d66-50295cc560c9/update-kindle-crown-NS65751_user_8851_0013524702084.bin) | `2e6db9835fbb0d89428e396542cf17d348c6a15f915e0fb856d5d0b8e252e90c` |

### Restore USB ADB after the update

The `8851N` OTA writes the stock `boot.img` and replaces any existing Magisk-patched boot. Stock boot may leave USB ADB unavailable. If authorized USB ADB works after the update, proceed to Magisk. Otherwise, use a recovery or bootloader interface you already have and a trusted boot-root image verified for your device and target firmware.

| Model | Boot-root installation |
|---|---|
| Cronos | Install the compatible `boot-root.zip` as a ZIP in TWRP. |
| Crown | Extract `boot-root.img` from the compatible `boot-root.zip`. Confirm the device in unlocked fastboot before flashing only the `boot` partition. |

Verify the device, image and recovery path before writing. Boot into Fire OS, then check `adb devices -l` and `adb -s SERIAL shell id`. A root ADB shell may already report `uid=0`. Verify Magisk `su` separately in step 2. If USB ADB is still unavailable, stop and check recovery access.

## 2. Install Magisk and verify root

On an already-unlocked device with a confirmed boot write and recovery path, back up `boot`. Extract the matching stock image with `tar -xf FIRE_OS_UPDATE boot.img`. Install the [official Magisk 30.7 APK](https://github.com/topjohnwu/Magisk/releases/tag/v30.7) using `adb -s SERIAL install -r Magisk-v30.7.apk` if needed. In Magisk on that same Echo Show, use **Select and Patch a File** with a device-appropriate boot image. If you needed boot-root to restore USB ADB, back up that known-working boot and use it as the patch input. Flash only the patched `boot` using the verified write path for that device, then reboot. Cronos can use TWRP **Install Image → Boot** when available. Crown uses unlocked fastboot `flash boot`. The stock boot may leave USB ADB unavailable, so verify recovery access before flashing. [Magisk 30.7 installation guide](https://github.com/topjohnwu/Magisk/blob/v30.7/docs/install.md#patching-images)

```sh
adb -s SERIAL shell getprop sys.boot_completed
adb -s SERIAL shell "su -c 'magisk -V'"
adb -s SERIAL shell su -c id
```

Expect `1`, `30700`, and `uid=0`, respectively. If ADB already runs as root, also look for the Magisk context `u:r:magisk:s0` in the `su` output.

## 3. Enable ADB over Ethernet or Wi-Fi

Keep USB connected and check that `adb -s SERIAL shell getprop ro.adb.secure` returns `1`. Use USB for the remaining steps if the boot image lacks ADB authentication. For Ethernet, use the wired interface's address from the device's network settings or `adb -s SERIAL shell ip addr show`. Wi-Fi ADB was verified on this project. Wired Ethernet is untested. [Android ADB documentation](https://developer.android.com/tools/adb#connect-to-a-device-over-wi-fi)

```sh
adb -s SERIAL tcpip 5555
adb connect DEVICE_IP:5555
adb -s DEVICE_IP:5555 shell getprop ro.serialno
```

Verify the returned device serial. For builds that honor the persistent property, run `adb -s SERIAL shell "su -c 'setprop persist.adb.tcp.port 5555'"` and test again after a reboot. Use TCP ADB on a trusted LAN. [Android 7.1.2 adbd source](https://raw.githubusercontent.com/aosp-mirror/platform_system_core/android-7.1.2_r39/adb/daemon/main.cpp)

## 4. Filter sponsored home cards

Download `frida-inject-16.5.9-android-arm.xz` from [Frida 16.5.9](https://github.com/frida/frida/releases/tag/16.5.9), extract it, and name the executable `frida-inject`. Use [cronos.js](nojunoad/cronos.js) for Cronos or [crown.js](nojunoad/crown.js) for Crown. These scripts filter Paladin's `JunoAd` cards. Use one injector per Paladin process.

```sh
adb -s SERIAL push frida-inject /data/local/tmp/frida-inject
adb -s SERIAL push nojunoad/cronos.js /data/local/tmp/echo-nojunoad.js
# For Crown, use nojunoad/crown.js in the preceding command.
adb -s SERIAL shell
```

In the device shell, run `su` if `id -u` returns a value other than `0`. Replace `PALADIN_PID` with the single PID reported by `pidof`.

```sh
chmod 700 /data/local/tmp/frida-inject
pidof com.amazon.paladin
/data/local/tmp/frida-inject -p PALADIN_PID -s /data/local/tmp/echo-nojunoad.js
```

From another terminal, run `adb -s SERIAL logcat -s NOJUNOAD:I`. `HOOKED` confirms that the filter is active. `DROP JunoAd` confirms a blocked card. Restart the injector with the new PID after Paladin or the device restarts.

## 5. Disable system OTA

Run these commands in the device's root shell. After disabling OTA, plan future system updates manually.

```sh
pm disable-user --user 0 com.amazon.device.software.ota
pm disable-user --user 0 com.amazon.device.software.ota.override
pm list packages -d --user 0 com.amazon.device.software.ota
```

Both disable commands should report `disabled-user`, and the final list should contain both packages. To verify separately, run `dumpsys package PACKAGE` for each and check for `enabled=3` under `User 0`.
