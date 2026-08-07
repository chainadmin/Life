// Reference implementation: copy into the generated Android app in an EAS build.
// Add Glance dependencies, a receiver in AndroidManifest.xml, and render the JSON
// stored under `widget:data:v1` by MyAssistantWidgetBridge.
package com.example.myassistant.widget

import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver

class MyAssistantWidget : GlanceAppWidget() {
  // Provide Content() with Glance composables using the normalized WidgetData JSON.
  // actionStartActivity deep links sections to app://money, calendar, email, or tasks.
}
class MyAssistantWidgetReceiver : GlanceAppWidgetReceiver() {
  override val glanceAppWidget: GlanceAppWidget = MyAssistantWidget()
}
