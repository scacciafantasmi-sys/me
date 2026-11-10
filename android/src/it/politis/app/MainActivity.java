package it.politis.app;

import android.app.Activity;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

// Politis-IT per Android: apre il gioco online a schermo intero. I salvataggi restano nella memoria
// dell'app (localStorage della WebView); "Esporta partita" salva il file nella cartella Download e
// "Importa partita" apre il selettore di file del telefono.
public class MainActivity extends Activity {
    private static final String HOME = "https://politisit.scacciafantasmi.workers.dev/?source=android";
    private static final int FILE_REQUEST = 7;
    private WebView web;
    private ValueCallback<Uri[]> fileCallback;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        if (Build.VERSION.SDK_INT >= 21) getWindow().setStatusBarColor(Color.parseColor("#0a0c18"));
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0a0c18"));
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setUserAgentString(s.getUserAgentString() + " PolitisITApp/1.0");
        web.addJavascriptInterface(new Bridge(), "PolitisApp");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                String host = u.getHost();
                if (host != null && (host.endsWith("scacciafantasmi.workers.dev") || host.endsWith("github.io"))) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { /* nessuna app per aprire il link */ }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                try {
                    startActivityForResult(Intent.createChooser(i, "Importa partita"), FILE_REQUEST);
                } catch (Exception e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });
        if (saved != null) web.restoreState(saved);
        else web.loadUrl(HOME);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_REQUEST && fileCallback != null) {
            Uri[] result = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null) result = new Uri[] { data.getData() };
            fileCallback.onReceiveValue(result);
            fileCallback = null;
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    private void toast(final String msg) {
        runOnUiThread(new Runnable() {
            @Override
            public void run() { Toast.makeText(MainActivity.this, msg, Toast.LENGTH_LONG).show(); }
        });
    }

    // Ponte chiamato dal gioco (window.PolitisApp) per salvare l'esportazione della partita.
    public class Bridge {
        @JavascriptInterface
        public boolean saveFile(String name, String text) {
            try {
                OutputStream out;
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues cv = new ContentValues();
                    cv.put(MediaStore.Downloads.DISPLAY_NAME, name);
                    cv.put(MediaStore.Downloads.MIME_TYPE, "application/json");
                    cv.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                    Uri u = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                    if (u == null) return false;
                    out = getContentResolver().openOutputStream(u);
                } else {
                    File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    out = new FileOutputStream(new File(dir, name));
                }
                if (out == null) return false;
                out.write(text.getBytes("UTF-8"));
                out.close();
                toast("Partita salvata in Download: " + name);
                return true;
            } catch (Exception e) {
                toast("Impossibile salvare il file: " + e.getMessage());
                return false;
            }
        }

        @JavascriptInterface
        public String version() { return "1.0"; }
    }
}
