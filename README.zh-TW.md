# Amazon 裝置維護指南

[English](README.md) · [繁體中文](README.zh-TW.md)

這個專案整理 Amazon Echo 與 Fire 裝置的維護指南。下方五個步驟目前以已驗證的 Echo Show 機型為準。

| 機型 | 代號 | 狀態 |
|---|---|---|
| Echo Show 5 第 2 代 | `cronos` | 已驗證 Fire OS `NS65751/8851N` |
| Echo Show 8 第 1 代 | `crown` | 已驗證 Fire OS `NS65751/8851N` |
| Echo Dot 第 2 代 | `biscuit` | 待實機測試 |
| Fire HD 8 / Fire HD 10 | 依世代而異 | 待核對機型與實測 |

Echo Show 的步驟使用 Magisk `30.7` 和 Paladin `1.0.2003176674`。

準備 [Android Platform-Tools](https://developer.android.com/tools/releases/platform-tools)、可用且已授權的 USB ADB，以及裝置相符的備份。以下以 `SERIAL` 代表 `adb devices -l` 列出的目標序號，以 `DEVICE_IP` 代表裝置在區域網路上的 IP。只操作已確認的裝置。

## 1. 更新韌體

- 原廠裝置可以從「設定 → 關於此裝置 → 檢查軟體更新」更新。這會安裝 Amazon 目前提供的版本，版本可能高於本文驗證過的版本。[Amazon 更新說明](https://digprjsurvey.amazon.com/csad/help/node/GYB55PBLWG8A6FJ8)
- 已解鎖且裝有相容 TWRP 的裝置，若已取得與機型相符的原廠更新檔，可在核對 recovery 相容性並備份後，用 TWRP 的 ADB Sideload 安裝。兩個機型的 `8851N` 不是同一個套件。TWRP 上游不保證廠商 OTA 相容。先確認更新後仍能回到 recovery 或使用 USB ADB，並保留清除資料選項未勾選。[TWRP Sideload 說明](https://twrp.me/faq/ADBSideload.html) · [TWRP 對廠商 OTA 的說明](https://twrp.me/faq/officialota.html)

```sh
adb -s SERIAL shell getprop ro.product.device
adb -s SERIAL shell getprop ro.build.fingerprint
# 已進入並確認為目標裝置的 TWRP Sideload 模式後執行：
adb -s SERIAL sideload FIRE_OS_UPDATE
```

以 recovery 的安裝結果為準。開機後再次查 build fingerprint，確認系統版本。Windows 也可用 `Get-FileHash -Algorithm SHA256` 核對更新包，下列是兩份實測套件的雜湊。

| 套件目標 | SHA-256 |
|---|---|
| [Cronos 8851N 完整韌體](https://d1s31zyz7dcc2d.cloudfront.net/2026/11/12/c155f085-0ef9-4fc9-b6ec-0776f4cebf9b/update-kindle-cronos-NS65751_user_8851_0013524702084.bin) | `216282efaa846fcfb12baaf3766cc4d090202a7bd35e05bd87e94e7e3e8039f4` |
| [Crown 8851N 完整韌體](https://d1s31zyz7dcc2d.cloudfront.net/2026/11/12/ca75dc10-f865-46a1-9d66-50295cc560c9/update-kindle-crown-NS65751_user_8851_0013524702084.bin) | `2e6db9835fbb0d89428e396542cf17d348c6a15f915e0fb856d5d0b8e252e90c` |

### 更新後恢復 USB ADB

`8851N` OTA 會寫入原廠 `boot.img`，覆蓋原有的 Magisk 修補映像。原廠 boot 開機後可能沒有 USB ADB。若更新後已可使用授權的 USB ADB，直接進入 Magisk 步驟。若 ADB 無法使用，請透過裝置既有的 recovery 或 bootloader，使用來源可信、已驗證適用於該機型和目標韌體的 boot-root 映像。

| 機型 | boot-root 安裝方式 |
|---|---|
| Cronos | 在 TWRP 以 ZIP 套件方式安裝相容的 `boot-root.zip`。 |
| Crown | 從相容的 `boot-root.zip` 取出 `boot-root.img`。在已解鎖的 fastboot 核對裝置後，只刷入 `boot` 分割區。 |

寫入前核對裝置、映像和復原方式。進入 Fire OS 後，以 `adb devices -l` 和 `adb -s SERIAL shell id` 驗證。Root ADB shell 可能已顯示 `uid=0`，Magisk 的 `su` 仍要在第 2 步另行確認。若 USB ADB 仍不可用，先停下確認 recovery 能否進入。

## 2. 安裝 Magisk 並驗證 root

用於已解鎖且可寫入 `boot` 的裝置。可從對應的完整韌體用 `tar -xf FIRE_OS_UPDATE boot.img` 取出原廠映像。保存備份後，使用[官方 Magisk 30.7 APK](https://github.com/topjohnwu/Magisk/releases/tag/v30.7)，在同一台 Echo Show 的 Magisk App 選擇 **Select and Patch a File**，修補適用於該台裝置的 boot。若前一步靠 boot-root 恢復 USB ADB，請先備份這份已驗證可開機的 boot，再用它作為修補來源。若尚無 App，可在已授權的 USB ADB 上用 `adb -s SERIAL install -r Magisk-v30.7.apk` 安裝。依裝置已驗證的寫入方式刷入修補映像，然後重開機。Cronos 可用已確認的 TWRP **Install Image → Boot**，Crown 可用已解鎖的 fastboot `flash boot`。遇到原廠 boot 無法提供 USB ADB 時，先確認該機型的復原及重新連線方式。[Magisk 30.7 安裝說明](https://github.com/topjohnwu/Magisk/blob/v30.7/docs/install.md#patching-images)

```sh
adb -s SERIAL shell getprop sys.boot_completed
adb -s SERIAL shell "su -c 'magisk -V'"
adb -s SERIAL shell su -c id
```

預期依序為 `1`、`30700`、`uid=0`。原本 ADB shell 若已是 root，另核對 `su` 回傳的 Magisk context `u:r:magisk:s0`。

## 3. 開啟網路 ADB（Ethernet 或 Wi-Fi）

保留 USB，先確認 `adb -s SERIAL shell getprop ro.adb.secure` 回傳 `1`，再用已授權的 USB 偵錯開啟 TCP ADB。若目前的 boot 未啟用 ADB 驗證，使用 USB 完成後續步驟。接上有線轉接器時，用裝置的網路設定或 `adb -s SERIAL shell ip addr show` 找到**有線介面**的位址。有線網路尚未在本專案實測，已確認的 LAN 連線是 Wi-Fi。[Android ADB 說明](https://developer.android.com/tools/adb#connect-to-a-device-over-wi-fi)

```sh
adb -s SERIAL tcpip 5555
adb connect DEVICE_IP:5555
adb -s DEVICE_IP:5555 shell getprop ro.serialno
```

確認回傳原裝置序號。若重開機後需要自動啟用，而且該 build 的 adbd 支援持久屬性，可用 `adb -s SERIAL shell "su -c 'setprop persist.adb.tcp.port 5555'"`，重開後重新連線實測。只在可信任的區域網路使用 TCP ADB。[Android 7.1.2 adbd 實作](https://raw.githubusercontent.com/aosp-mirror/platform_system_core/android-7.1.2_r39/adb/daemon/main.cpp)

## 4. 過濾首頁 Sponsored 卡片

這兩支腳本只過濾 Paladin 的 `JunoAd` 卡片。從 [Frida 16.5.9](https://github.com/frida/frida/releases/tag/16.5.9) 下載並解壓 `frida-inject-16.5.9-android-arm.xz`，將執行檔命名為 `frida-inject`。從本目錄執行以下指令。Cronos 使用 [cronos.js](nojunoad/cronos.js)，Crown 使用 [crown.js](nojunoad/crown.js)。一個 Paladin 程序只啟動一個 injector。

```sh
adb -s SERIAL push frida-inject /data/local/tmp/frida-inject
adb -s SERIAL push nojunoad/cronos.js /data/local/tmp/echo-nojunoad.js
# Crown 請改用上一行的 nojunoad/crown.js。
adb -s SERIAL shell
```

在裝置 shell 內，若 `id -u` 不是 `0`，先執行 `su`。查出 Paladin PID 後，執行最後一行，把 `PALADIN_PID` 換成剛查到的唯一數字。

```sh
chmod 700 /data/local/tmp/frida-inject
pidof com.amazon.paladin
/data/local/tmp/frida-inject -p PALADIN_PID -s /data/local/tmp/echo-nojunoad.js
```

另一個終端可用 `adb -s SERIAL logcat -s NOJUNOAD:I` 觀察。`HOOKED` 表示掛鉤成功，`DROP JunoAd` 表示確實攔截。這是手動執行方式。Launcher 或裝置重啟後，用新的 PID 重新執行。

## 5. 停用系統 OTA

在裝置的 root shell 執行下面指令。停用後需自行安排系統更新。

```sh
pm disable-user --user 0 com.amazon.device.software.ota
pm disable-user --user 0 com.amazon.device.software.ota.override
pm list packages -d --user 0 com.amazon.device.software.ota
```

兩條停用指令都應回報 `disabled-user`，最後的清單應包含兩個套件。各套件的 `dumpsys package 套件名稱` 也可用來確認 `User 0` 的 `enabled=3`。
