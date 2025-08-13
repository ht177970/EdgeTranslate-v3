//
//  SafariWebExtensionHandler.swift
//  EdgeTranslate Extension
//
//  Created by 리지 on 2025. 8. 13..
//

import SafariServices
import AVFoundation
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

    // 공유 합성기 (요청 간 유지)
    static let synthesizer = AVSpeechSynthesizer()

    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems.first as? NSExtensionItem

        let profile: UUID?
        if #available(iOS 17.0, macOS 14.0, *) {
            profile = request?.userInfo?[SFExtensionProfileKey] as? UUID
        } else {
            profile = request?.userInfo?["profile"] as? UUID
        }

        let message: Any?
        if #available(iOS 15.0, macOS 11.0, *) {
            message = request?.userInfo?[SFExtensionMessageKey]
        } else {
            message = request?.userInfo?["message"]
        }

        os_log(.default, "[EdgeTranslate] Native message: %@ (profile: %@)", String(describing: message), profile?.uuidString ?? "none")

        var payload: [String: Any] = [:]
        if let dict = message as? [String: Any] {
            payload = dict
        }

        let action = (payload["action"] as? String) ?? ""
        switch action {
        case "tts":
            let text = (payload["text"] as? String) ?? ""
            let lang = (payload["language"] as? String) ?? ""
            let rate = (payload["rate"] as? Double) ?? 1.0

            let utter = AVSpeechUtterance(string: text)
            if !lang.isEmpty {
                utter.voice = AVSpeechSynthesisVoice(language: lang)
            }
            // Web rate(0.8~1.0) -> AVSpeechUtterance rate 맵핑(대략적인 기본값)
            let base: Float = AVSpeechUtteranceDefaultSpeechRate
            utter.rate = base + Float((rate - 1.0) * 0.1)
            utter.pitchMultiplier = 1.0

            SafariWebExtensionHandler.synthesizer.speak(utter)

            let response = NSExtensionItem()
            if #available(iOS 15.0, macOS 11.0, *) {
                response.userInfo = [ SFExtensionMessageKey: [ "ok": true ] ]
            } else {
                response.userInfo = [ "message": [ "ok": true ] ]
            }
            context.completeRequest(returningItems: [ response ], completionHandler: nil)

        case "tts_stop":
            SafariWebExtensionHandler.synthesizer.stopSpeaking(at: .immediate)
            let response = NSExtensionItem()
            if #available(iOS 15.0, macOS 11.0, *) {
                response.userInfo = [ SFExtensionMessageKey: [ "ok": true ] ]
            } else {
                response.userInfo = [ "message": [ "ok": true ] ]
            }
            context.completeRequest(returningItems: [ response ], completionHandler: nil)

        default:
            let response = NSExtensionItem()
            if #available(iOS 15.0, macOS 11.0, *) {
                response.userInfo = [ SFExtensionMessageKey: [ "echo": message ?? [:] ] ]
            } else {
                response.userInfo = [ "message": [ "echo": message ?? [:] ] ]
            }
            context.completeRequest(returningItems: [ response ], completionHandler: nil)
        }
    }

}
