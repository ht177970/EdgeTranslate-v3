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
