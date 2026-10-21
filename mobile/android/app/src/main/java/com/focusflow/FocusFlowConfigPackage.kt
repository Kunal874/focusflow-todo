package com.focusflow

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.uimanager.ViewManager

class FocusFlowConfigModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "FocusFlowConfig"
  override fun getConstants(): Map<String, Any> = mapOf(
    "apiBaseUrl" to BuildConfig.API_BASE_URL,
    "allowHttp" to BuildConfig.LOCAL_NETWORK,
  )
}

class FocusFlowConfigPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
    listOf(FocusFlowConfigModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
