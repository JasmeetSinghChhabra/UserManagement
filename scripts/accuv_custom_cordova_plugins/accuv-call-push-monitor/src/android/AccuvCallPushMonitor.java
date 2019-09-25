/*
Created By Angel Robles
*/
package com.accuv.callpushmonitor;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.Manifest;
import org.json.JSONArray;
import org.json.JSONException;
import android.util.Log;
import android.telecom.TelecomManager;
import android.content.Intent;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.HashMap;
import android.graphics.drawable.Icon;


public class AccuvCallPushMonitor extends CordovaPlugin {

    private static String TAG = AccuvCallPushMonitor.class.getSimpleName();
    CallbackContext callbackContext = null;
    Context context;
    Intent newIntent;
    static HashMap<String, ArrayList<CallbackContext>> callbackContextMap = new HashMap<String, ArrayList<CallbackContext>>();
    static CordovaInterface cordovaInterface;
    public static final int CALL_PHONE_REQ_CODE = 0;
    public static final int REAL_PHONE_CALL = 1;
    String realCallTo;
    public static HashMap<String, ArrayList<CallbackContext>> getCallbackContexts() {
        return callbackContextMap;
    }
    public static CordovaInterface getCordova() {
        return cordovaInterface;
    }

    @Override
    public void initialize(CordovaInterface cordova, CordovaWebView webView) {
        super.initialize(cordova, webView);
        cordovaInterface = cordova;
        this.context = this.cordova.getActivity().getApplicationContext();
        callbackContextMap.put("answer",new ArrayList<CallbackContext>());
        callbackContextMap.put("reject",new ArrayList<CallbackContext>());
        callbackContextMap.put("hangup",new ArrayList<CallbackContext>());
        callbackContextMap.put("sendCall",new ArrayList<CallbackContext>());
        callbackContextMap.put("receiveCall",new ArrayList<CallbackContext>());
        AccuvCallConnectionManager.setContext(context);
        AccuvCallConnectionManager.registerPhoneAcc();
         Log.i(TAG, "initialized!!!");
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // getIntent() should always return the most recent
        newIntent = intent;
    }

    @Override
    public void onResume(boolean multitasking) {
        super.onResume(multitasking);
        Log.i(TAG, "RESUMING!!");
        foreground = true;
        
    }

     @Override
  public void onPause(boolean multitasking) {
    super.onPause(multitasking);
    foreground = false;

  }
  @Override
  public void onDestroy() {
    super.onDestroy();
    foreground = false;
  }

    static boolean foreground = false;
    public static boolean isForeground(){
        return foreground;
    }

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        this.callbackContext = callbackContext;
        if(action.equals("checkPermissions")){
            this.checkCallPerm();
        }else if(action.equals("askPermissions")){
            this.showPermissionsIntent();
        }else if(action.equals("endCall")){
            this.endApiTelecomCall();
        }else if (action.equals("on")) {
            String eventType = args.getString(0);
            ArrayList<CallbackContext> callbackContextList = callbackContextMap.get(eventType);
            if(callbackContextList != null) callbackContextList.add(callbackContext);
            return true;
        }else if(action.equals("checkAnswerQueue")){
            doTryToAnswer();
            callbackContext.success("Success");
            return true;
        }else if (action.equals("receiveCall")) {
            if(!AccuvCallConnectionManager.isConnectionNull()) {
                    callbackContext.error("You can't receive a call right now");
            } else {
                String from = args.getString(0);

                AccuvCallConnectionManager.setContext(this.context);
                if(args.length() > 1) AccuvCallConnectionManager.receiveCall(from, args.getJSONObject(1));
                else  AccuvCallConnectionManager.receiveCall(from);
            }
            return true;
        }else if(action.equals("configCallLog")){
            AccuvCallConnectionManager.setContext(this.context);
            AccuvCallConnectionManager.configCallLog(args.getString(0), args.getString(1), args.getString(2));
            return true;
        }else if (action.equals("sendCall")) {
            if(!AccuvCallConnectionManager.isConnectionNull()){
                 callbackContext.error("You can't send a call right now");
            } else {
                String to = args.getString(0);
                try{
                    AccuvCallConnectionManager.setContext(this.context);
                    AccuvCallConnectionManager.sendCall(to);
                    callbackContext.success("Success");
                }catch(Exception err){
                    Log.e(TAG, err.getMessage());
                     callbackContext.error("There was an error trying to send a call");
                }
                
            }
            return true;
        }else if (action.equals("mute")) {
            AccuvCallConnectionManager.mute();
            callbackContext.success("Muted Successfully");
            return true;
        } else if (action.equals("unmute")) {
            AccuvCallConnectionManager.unmute();
            callbackContext.success("Unmuted Successfully");
            return true;
        } else if (action.equals("speakerOn")) {
            AccuvCallConnectionManager.speakerOn();
            callbackContext.success("Speakerphone is on");
            return true;
        } else if (action.equals("speakerOff")) {
            AccuvCallConnectionManager.speakerOff();
            callbackContext.success("Speakerphone is off");
            return true;
        } else if (action.equals("callNumber")) {
            realCallTo = args.getString(0);
            if(realCallTo != null) {
              cordovaInterface.getThreadPool().execute(new Runnable() {
                  public void run() {
                      callNumberPhonePermission();
                  }
              });
              callbackContext.success("Call Successful");
            } else {
              callbackContext.error("Call Failed. You need to enter a phone number.");
            }
            return true;
        }else if (action.equals("setIcon")) {
            String iconName = args.getString(0);
            int iconId = this.context.getResources().getIdentifier(iconName, "drawable", cordovaInterface.getActivity().getPackageName());
            if(iconId != 0) {
                AccuvCallConnectionManager.setIcon( Icon.createWithResource(cordovaInterface.getActivity(), iconId));
                this.callbackContext.success("Icon Changed Successfully");
            } else {
                this.callbackContext.error("This icon does not exist. Make sure to add it to the res/drawable folder the right way.");
            }
            return true;
        }else if (action.equals("setAppName")) {
            String appName = args.getString(0);
            AccuvCallConnectionManager.setContext(this.context);
             AccuvCallConnectionManager.setAppName(appName);
              AccuvCallConnectionManager.registerPhoneAcc();
            this.callbackContext.success("App Name Changed Successfully");
            return true;
        }
        return false;
    }

    //answering without sending any data
    public void doTryToAnswer(){
        if(newIntent != null && newIntent.getBooleanExtra("waiting-for-call-answer", false)){
            Log.i(TAG, "Call has been answered, now runing the answer callback from the js side!");
            newIntent = null;
            for (CallbackContext ccx : callbackContextMap.get("answer")) {
                       cordovaInterface.getThreadPool().execute(new Runnable() {
                            public void run() {
                                PluginResult result = new PluginResult(PluginResult.Status.OK, "success");
                                result.setKeepCallback(true);
                                try{
                                ccx.sendPluginResult(result);
                                }catch(Exception err ){
                                    Log.e(TAG, err.getMessage());
                                }
                            }
                        });
            }
        }
    }
    public boolean checkCallPerm(){
        boolean bresult =false;
        JSONObject result = new JSONObject();
        try{
             AccuvCallConnectionManager.setContext(this.context);
             bresult = AccuvCallConnectionManager.checkCallPermission();
        }catch(Exception err){
            Log.e(TAG,err.getMessage());
        }
        try{
            result.put("result",bresult);
        }catch(Exception err){
            Log.e(TAG,err.getMessage());
        }
        
        if(this.callbackContext != null){
            PluginResult presult = new PluginResult(PluginResult.Status.OK, result);
            presult.setKeepCallback(true);
            this.callbackContext.sendPluginResult(presult);
        }
        return bresult;
    }
    public void showPermissionsIntent(){
            Log.i(TAG, "showing phone accounts permissions");
            boolean bresult =false;
            JSONObject result = new JSONObject();
            try{
                Intent phoneIntent = new Intent(TelecomManager.ACTION_CHANGE_PHONE_ACCOUNTS);
                phoneIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                this.context.startActivity(phoneIntent);
                bresult = true;
            }catch(Exception err){
                Log.e(TAG,err.getMessage());
            }
            try{
                result.put("result",bresult);
            }catch(Exception err){
                Log.e(TAG, err.getMessage());
            }
            this.callbackContext.success(result);       
       
    }
     public boolean endApiTelecomCall(){
        boolean bresult =false;
        JSONObject result = new JSONObject();
        try{
             AccuvCallConnectionManager.setContext(this.context);
             bresult = AccuvCallConnectionManager.endApiCall(VideoChatActivity.END_API_CALL_REASON_CLIENT);
        }catch(Exception err){
            Log.e(TAG, err.getMessage());
        }
        try{
            result.put("result",bresult);
        }catch(Exception err){
            Log.e(TAG, err.getMessage());
        }
        
        if(this.callbackContext != null) this.callbackContext.success(result);
        return bresult;
    }
    protected void callNumberPhonePermission() {
        cordovaInterface.requestPermission(this, REAL_PHONE_CALL, Manifest.permission.CALL_PHONE);
    }

    private void callNumber() {
        try {
          Intent intent = new Intent(Intent.ACTION_CALL, Uri.fromParts("tel", realCallTo, null));
          cordovaInterface.getActivity().getApplicationContext().startActivity(intent);
        } catch(Exception e) {
            Log.e(TAG, e.getMessage());
          callbackContext.error("Call Failed");
        }
       callbackContext.success("Call Successful");
    }

    @Override
    public void onRequestPermissionResult(int requestCode, String[] permissions, int[] grantResults) throws JSONException
    {
        for(int r:grantResults)
        {
            if(r == PackageManager.PERMISSION_DENIED)
            {
                callbackContext.sendPluginResult(new PluginResult(PluginResult.Status.ERROR, "CALL_PHONE Permission Denied"));
                return;
            }
        }
        switch(requestCode)
        {
            case CALL_PHONE_REQ_CODE:
                break;
            case REAL_PHONE_CALL:
                this.callNumber();
                break;
        }
    }

   

}
