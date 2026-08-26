import Cocoa
import WebKit

private let appName = "Everstory 주문 보드"
private let bookmarkKey = "EverstoryWorkspaceBookmark"
private let pathKey = "EverstoryWorkspacePath"

final class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate, WKNavigationDelegate {
    private var window: NSWindow!
    private var webView: WKWebView?
    private var backend: Process?
    private var workspaceURL: URL?
    private var hasSecurityScope = false
    private var outputBuffer = ""
    private var errorOutput = ""
    private var didLoadBoard = false

    func applicationDidFinishLaunching(_ notification: Notification) {
        installMenu()
        showStatus("Everstory 주문 보드를 준비하는 중…")
        NSApp.activate(ignoringOtherApps: true)

        DispatchQueue.main.async { [weak self] in
            self?.openBoard()
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        true
    }

    func applicationWillTerminate(_ notification: Notification) {
        stopBackend()
        if hasSecurityScope {
            workspaceURL?.stopAccessingSecurityScopedResource()
        }
    }

    private func installMenu() {
        let mainMenu = NSMenu()
        let appMenuItem = NSMenuItem()
        mainMenu.addItem(appMenuItem)

        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "\(appName) 종료", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appMenuItem.submenu = appMenu
        NSApp.mainMenu = mainMenu
    }

    private func makeWindowIfNeeded() {
        guard window == nil else { return }
        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1180, height: 780),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.title = appName
        window.minSize = NSSize(width: 820, height: 560)
        window.center()
        window.delegate = self
        window.makeKeyAndOrderFront(nil)
    }

    private func showStatus(_ message: String, detail: String? = nil, retry: Bool = false) {
        makeWindowIfNeeded()

        let title = NSTextField(labelWithString: message)
        title.font = .systemFont(ofSize: 18, weight: .semibold)
        title.alignment = .center

        let spinner = NSProgressIndicator()
        spinner.style = .spinning
        spinner.controlSize = .regular
        spinner.startAnimation(nil)

        let stack = NSStackView()
        stack.orientation = .vertical
        stack.alignment = .centerX
        stack.spacing = 14
        stack.addArrangedSubview(spinner)
        stack.addArrangedSubview(title)

        if let detail, !detail.isEmpty {
            let detailLabel = NSTextField(wrappingLabelWithString: detail)
            detailLabel.textColor = .secondaryLabelColor
            detailLabel.alignment = .center
            detailLabel.maximumNumberOfLines = 8
            detailLabel.preferredMaxLayoutWidth = 640
            stack.addArrangedSubview(detailLabel)
        }

        if retry {
            spinner.stopAnimation(nil)
            spinner.isHidden = true
            let button = NSButton(title: "작업 폴더 다시 선택", target: self, action: #selector(selectWorkspaceAgain))
            stack.addArrangedSubview(button)
        }

        let container = NSView()
        container.addSubview(stack)
        stack.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            stack.centerXAnchor.constraint(equalTo: container.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: container.centerYAnchor),
            stack.leadingAnchor.constraint(greaterThanOrEqualTo: container.leadingAnchor, constant: 40),
            stack.trailingAnchor.constraint(lessThanOrEqualTo: container.trailingAnchor, constant: -40)
        ])
        window.contentView = container
    }

    private func openBoard() {
        guard let root = restoreWorkspace() ?? chooseWorkspace() else {
            showStatus("작업 폴더가 필요합니다.", detail: "앱을 실행하려면 포토샵누끼 폴더를 다시 선택해 주세요.", retry: true)
            return
        }
        startBackend(in: root)
    }

    @objc private func selectWorkspaceAgain() {
        stopBackend()
        UserDefaults.standard.removeObject(forKey: bookmarkKey)
        UserDefaults.standard.removeObject(forKey: pathKey)
        if hasSecurityScope {
            workspaceURL?.stopAccessingSecurityScopedResource()
            hasSecurityScope = false
        }
        workspaceURL = nil
        didLoadBoard = false
        outputBuffer = ""
        errorOutput = ""
        openBoard()
    }

    private func isValidWorkspace(_ url: URL) -> Bool {
        let webUI = url.appendingPathComponent("scripts/order_intake/webui.py").path
        let intake = url.appendingPathComponent("scripts/order_intake/intake.py").path
        return FileManager.default.fileExists(atPath: webUI) && FileManager.default.fileExists(atPath: intake)
    }

    private func restoreWorkspace() -> URL? {
        if let data = UserDefaults.standard.data(forKey: bookmarkKey) {
            var stale = false
            if let url = try? URL(
                resolvingBookmarkData: data,
                options: [.withSecurityScope],
                relativeTo: nil,
                bookmarkDataIsStale: &stale
            ), isValidWorkspace(url) {
                hasSecurityScope = url.startAccessingSecurityScopedResource()
                workspaceURL = url
                if stale { saveWorkspace(url) }
                return url
            }
        }

        if let path = UserDefaults.standard.string(forKey: pathKey) {
            let url = URL(fileURLWithPath: path, isDirectory: true)
            if isValidWorkspace(url) {
                workspaceURL = url
                return url
            }
        }
        return nil
    }

    private func chooseWorkspace() -> URL? {
        let panel = NSOpenPanel()
        panel.title = "Everstory 작업 폴더 선택"
        panel.message = "SHOPIFY_ORDER_DOWNLOAD.command가 있는 '포토샵누끼' 폴더를 선택하세요."
        panel.prompt = "이 폴더 사용"
        panel.canChooseFiles = false
        panel.canChooseDirectories = true
        panel.allowsMultipleSelection = false

        if let savedPath = UserDefaults.standard.string(forKey: pathKey) {
            panel.directoryURL = URL(fileURLWithPath: savedPath, isDirectory: true)
        } else {
            panel.directoryURL = FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent("Desktop")
        }

        while panel.runModal() == .OK {
            guard let url = panel.url else { return nil }
            if isValidWorkspace(url) {
                hasSecurityScope = url.startAccessingSecurityScopedResource()
                workspaceURL = url
                saveWorkspace(url)
                return url
            }

            let alert = NSAlert()
            alert.alertStyle = .warning
            alert.messageText = "Everstory 작업 폴더가 아닙니다."
            alert.informativeText = "scripts/order_intake/webui.py와 intake.py가 모두 있는 상위 폴더를 선택해 주세요."
            alert.runModal()
        }
        return nil
    }

    private func saveWorkspace(_ url: URL) {
        UserDefaults.standard.set(url.path, forKey: pathKey)
        if let data = try? url.bookmarkData(options: [.withSecurityScope], includingResourceValuesForKeys: nil, relativeTo: nil) {
            UserDefaults.standard.set(data, forKey: bookmarkKey)
        }
    }

    private func startBackend(in root: URL) {
        guard let bridge = Bundle.main.url(forResource: "order_board_backend", withExtension: "py") else {
            showStatus("앱 내부 브리지 파일을 찾지 못했습니다.", retry: true)
            return
        }

        showStatus("주문 보드 서버 시작 중…", detail: root.path)

        let process = Process()
        let stdoutPipe = Pipe()
        let stderrPipe = Pipe()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/python3")
        process.arguments = [bridge.path, root.path]
        process.currentDirectoryURL = root
        process.standardOutput = stdoutPipe
        process.standardError = stderrPipe
        var environment = ProcessInfo.processInfo.environment
        environment["PYTHONUNBUFFERED"] = "1"
        process.environment = environment

        stdoutPipe.fileHandleForReading.readabilityHandler = { [weak self] handle in
            let data = handle.availableData
            guard !data.isEmpty, let text = String(data: data, encoding: .utf8) else { return }
            DispatchQueue.main.async { self?.consumeOutput(text) }
        }
        stderrPipe.fileHandleForReading.readabilityHandler = { [weak self] handle in
            let data = handle.availableData
            guard !data.isEmpty, let text = String(data: data, encoding: .utf8) else { return }
            DispatchQueue.main.async { self?.errorOutput += text }
        }
        process.terminationHandler = { [weak self] process in
            DispatchQueue.main.async {
                guard let self, !self.didLoadBoard else { return }
                let detail = self.errorOutput.isEmpty ? "Python 종료 코드: \(process.terminationStatus)" : self.errorOutput
                self.showStatus("주문 보드 서버를 시작하지 못했습니다.", detail: detail, retry: true)
            }
        }

        do {
            try process.run()
            backend = process
        } catch {
            showStatus("주문 보드를 시작하지 못했습니다.", detail: error.localizedDescription, retry: true)
        }
    }

    private func consumeOutput(_ text: String) {
        outputBuffer += text
        while let newline = outputBuffer.firstIndex(of: "\n") {
            let line = String(outputBuffer[..<newline])
            outputBuffer.removeSubrange(...newline)
            let prefix = "EVERSTORY_URL="
            if line.hasPrefix(prefix), let url = URL(string: String(line.dropFirst(prefix.count))) {
                loadBoard(url)
            }
        }
    }

    private func loadBoard(_ url: URL) {
        guard !didLoadBoard else { return }
        didLoadBoard = true

        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = self
        view.allowsMagnification = true
        webView = view
        window.contentView = view
        view.load(URLRequest(url: url))
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        showStatus("주문 보드 화면을 불러오지 못했습니다.", detail: error.localizedDescription, retry: true)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        showStatus("로컬 서버에 연결하지 못했습니다.", detail: error.localizedDescription, retry: true)
    }

    private func stopBackend() {
        guard let process = backend else { return }
        if process.isRunning {
            process.terminate()
            process.waitUntilExit()
        }
        backend = nil
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
