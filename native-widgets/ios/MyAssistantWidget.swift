// Reference implementation: add this file to a Widget Extension after `expo prebuild`.
import SwiftUI
import WidgetKit

private let appGroup = "group.com.example.myassistant"
struct WidgetPayload: Codable { let greeting: String; let updatedAt: String }
struct BriefEntry: TimelineEntry { let date: Date; let payload: WidgetPayload? }
struct BriefProvider: TimelineProvider {
  func placeholder(in context: Context) -> BriefEntry { BriefEntry(date: .now, payload: nil) }
  func getSnapshot(in context: Context, completion: @escaping (BriefEntry)->Void) { completion(read()) }
  func getTimeline(in context: Context, completion: @escaping (Timeline<BriefEntry>)->Void) {
    completion(Timeline(entries: [read()], policy: .after(Date().addingTimeInterval(30 * 60))))
  }
  private func read() -> BriefEntry {
    let json = UserDefaults(suiteName: appGroup)?.string(forKey: "widget:data:v1")
    let payload = json.flatMap { try? JSONDecoder().decode(WidgetPayload.self, from: Data($0.utf8)) }
    return BriefEntry(date: .now, payload: payload)
  }
}
// Build the SwiftUI view from the complete normalized JSON contract in src/types.ts.
// Use Link(destination: URL(string: "app://money")!) for section interactions.
