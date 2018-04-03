package app.billion.com;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.app.Activity;
import  android.view.KeyEvent;
import android.webkit.WebView;

public class MainActivity extends AppCompatActivity {
    private WebView webview;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
//        setContentView(R.layout.activity_main);
        //实例化WebView对象
        webview = new WebView(this);
        //设置WebView属性，能够执行Javascript脚本
        webview.getSettings().setJavaScriptEnabled(true);
        //加载需要显示的网页
        webview.loadUrl("file:///android_asset/index.html");//显示本地网页
//        webview.loadUrl("https://www.baidu.com");//显示远程网页
        //设置Web视图
        setContentView(webview);
    }
    @Override//设置回退
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if ((keyCode == KeyEvent.KEYCODE_BACK) && webview.canGoBack()) {
            webview.goBack(); //goBack()表示返回WebView的上一页面
            return true;
        }
        return false;
    }
}