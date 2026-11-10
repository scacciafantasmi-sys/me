#!/usr/bin/env bash
# Compila l'APK di Politis-IT con gli strumenti dell'Android SDK già presenti sui runner di GitHub
# Actions (aapt2, javac, d8, zipalign, apksigner), senza Gradle. Uso: android/build.sh <file-di-uscita.apk>
# Firma: se ci sono i segreti ANDROID_KEYSTORE_B64 e ANDROID_KEYSTORE_PASS usa sempre la stessa chiave
# (così gli aggiornamenti si installano sopra la versione precedente); altrimenti crea una chiave
# temporanea a ogni compilazione.
set -euo pipefail
OUT="$(realpath -m "$1")"
cd "$(dirname "$0")"
SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-}}"
[ -n "$SDK" ] || { echo "Android SDK non trovato"; exit 1; }
BT="$(ls -d "$SDK"/build-tools/* | sort -V | tail -1)"
PLAT="$(ls -d "$SDK"/platforms/android-* | sort -V | tail -1)"
JAR="$PLAT/android.jar"
echo "build-tools: $BT"; echo "platform: $PLAT"
W=build
rm -rf "$W"; mkdir -p "$W/gen" "$W/obj" "$W/dex"
"$BT/aapt2" compile --dir res -o "$W/res.zip"
"$BT/aapt2" link -o "$W/base.apk" -I "$JAR" --manifest AndroidManifest.xml --java "$W/gen" "$W/res.zip"
javac -source 8 -target 8 -nowarn -encoding UTF-8 -bootclasspath "$JAR" -classpath "$JAR" -d "$W/obj" \
  "$W/gen/it/politis/app/R.java" src/it/politis/app/MainActivity.java
"$BT/d8" --release --min-api 24 --lib "$JAR" --output "$W/dex" $(find "$W/obj" -name '*.class')
cp "$W/base.apk" "$W/unsigned.apk"
(cd "$W/dex" && zip -q -u ../unsigned.apk classes.dex)
"$BT/zipalign" -f -p 4 "$W/unsigned.apk" "$W/aligned.apk"
if [ -n "${ANDROID_KEYSTORE_B64:-}" ] && [ -n "${ANDROID_KEYSTORE_PASS:-}" ]; then
  echo "$ANDROID_KEYSTORE_B64" | base64 -d > "$W/release.jks"
  PASS="$ANDROID_KEYSTORE_PASS"
else
  echo "Nessuna chiave salvata nei segreti: uso una chiave temporanea"
  keytool -genkeypair -keystore "$W/release.jks" -alias politis -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass politis-temp -keypass politis-temp -dname "CN=Politis-IT, O=Politis-IT, C=IT" >/dev/null
  PASS="politis-temp"
fi
mkdir -p "$(dirname "$OUT")"
"$BT/apksigner" sign --ks "$W/release.jks" --ks-key-alias politis --ks-pass "pass:$PASS" --key-pass "pass:$PASS" --v4-signing-enabled false --out "$OUT" "$W/aligned.apk"
"$BT/apksigner" verify --print-certs "$OUT" | head -3
rm -rf "$W"
echo "APK pronto: $OUT ($(du -h "$OUT" | cut -f1))"
