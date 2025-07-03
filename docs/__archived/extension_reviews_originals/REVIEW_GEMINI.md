# **Firefox Extension Re-Architecture & Refactoring Specification**

## **Section 1: Foundational Refactoring: Project Structure and Development Tooling**

### **Introduction**

The current project structure and development workflow lack the formal organization and tooling required for a scalable, secure, and maintainable application. A professional development environment is not a matter of convenience; it is the bedrock upon which code quality, consistency, and security are built. An ad-hoc approach, where files are created without a clear organizational principle and the extension is manually reloaded for testing, is inefficient and highly prone to error.1 This initial phase of refactoring will establish a robust foundation by implementing a standardized directory structure, an automated build process, and rigorous quality gates for code. These changes are prerequisites for all subsequent architectural improvements.  
The integration of these tools creates a powerful and immediate development feedback loop. When a developer saves a file, it can be automatically formatted, linted for errors and potential security vulnerabilities, and the extension can be reloaded in the browser. This process dramatically accelerates development by catching errors at the earliest possible moment—the moment they are typed—preventing them from cascading into larger, more complex architectural problems. The tooling is not merely a set of passive rules; it becomes an active participant in the development process, enforcing quality and security by default.

### **1.1 Standardized Project Directory Structure**

A flat or disorganized file structure is a significant impediment to maintainability and scalability. As a project grows, locating specific components, understanding the relationships between different parts of the code, and onboarding new developers becomes increasingly difficult. The absence of a clear structure leads to tightly coupled code and makes it challenging to implement modular, reusable components.  
To rectify this, the project must be reorganized into a standardized directory structure. While feature-based structures are common in larger web applications, a role-based structure provides an excellent and clear starting point for a WebExtension, as the roles (background, content script, popup) are well-defined by the extension platform itself.2 This structure separates concerns logically, making the codebase intuitive to navigate.  
The following directory structure must be adopted. All new development must adhere to this organization.

/project-root  
├── dist/                 \# (Generated) Build output for the unpacked extension  
├── scripts/              \# Build/utility scripts (e.g., for packaging/zipping for release)  
├── src/                  \# All development source code  
│   ├── assets/           \# Static assets (icons, images, fonts)  
│   ├── background/       \# Logic for the background script  
│   │   └── index.js  
│   ├── content-scripts/  \# Logic for content scripts  
│   │   └── main.js  
│   ├── popup/            \# UI components for the browser action popup  
│   │   ├── popup.html  
│   │   ├── popup.css  
│   │   └── popup.js  
│   ├── options/          \# UI components for the extension's options page  
│   │   ├── options.html  
│   │   └── options.js  
│   ├── shared/           \# Reusable modules shared across the extension  
│   │   └── storage.js    \# Example: a module for interacting with storage API  
│   └── manifest.json     \# The core extension manifest file  
├──.eslintrc.cjs         \# Configuration for ESLint  
├──.prettierrc           \# Configuration for Prettier  
├──.gitignore            \# Git ignore file for ignoring node\_modules, dist, etc.  
├── package.json          \# Project metadata, dependencies, and scripts  
└── webpack.config.js     \# Webpack build process configuration

This structure is a well-established pattern in professional web development and is reflected in numerous WebExtension boilerplates and examples.4 It provides a clean separation between source code (  
src), generated output (dist), and configuration files, which is essential for a clean and manageable build process.

### **1.2 Build Process Automation with Webpack**

Manually managing script dependencies, especially without the use of modern JavaScript modules, is an obsolete and fragile practice. It prevents the use of modern language features like TypeScript, code splitting, and minification, all of which are critical for building a performant and maintainable application. To modernize the development workflow, the integration of a module bundler is non-negotiable. Webpack is the industry standard for this task.  
The project must integrate Webpack to automate the entire build process. This will involve several steps:

1. **Install Dependencies:** Add Webpack and its essential loaders and plugins as development dependencies in package.json. This includes webpack, webpack-cli, babel-loader (for transpiling modern JavaScript), css-loader (for handling CSS), html-webpack-plugin (for generating HTML files in the build), and copy-webpack-plugin (for copying static assets like manifest.json and icons).  
2. **Configure Webpack:** A webpack.config.js file must be created in the project root. This file will define the entry points for the extension—such as background/index.js, content-scripts/main.js, and popup/popup.js. It will also configure rules for how different file types are processed and specify how the final output is placed into the dist directory. This configuration ensures that all dependencies are correctly resolved and bundled.4  
3. **Define NPM Scripts:** The package.json file must be updated with scripts to run the build process. This standardizes how developers interact with the build system.  
   JSON  
   "scripts": {  
     "dev": "webpack \--watch \--mode=development",  
     "build": "webpack \--mode=production",  
     "package": "node./scripts/package.js"  
   }

   The dev script starts Webpack in watch mode, which automatically recompiles the extension whenever a source file is changed, providing instant feedback during development. The build script creates a production-ready, optimized version of the extension with minified code for better performance.7

The use of a bundler like Webpack is a foundational element of modern web development demonstrated by nearly all professional boilerplates.4 It offloads the complexity of dependency management, enables the use of modern JavaScript modules (  
import/export), and optimizes the final code for distribution.

### **1.3 Enforcing Code Quality with ESLint and Prettier**

Inconsistent code style, formatting, and a lack of automated checks for common errors result in a codebase that is difficult to read, maintain, and debug. To ensure a high standard of quality and consistency, a strict linting and formatting regimen must be implemented.

1. **ESLint for Code Analysis:** ESLint is a static analysis tool that identifies problematic patterns in JavaScript code.9 It must be configured to enforce a strict set of rules.  
   * Initialize ESLint in the project using npm init @eslint/config.9  
   * Adopt a widely-used, comprehensive style guide. The eslint-config-airbnb-base package is an excellent choice as it enforces many best practices for modern JavaScript.10  
   * Add the eslint-plugin-mozilla to the configuration. This plugin includes rules specifically for WebExtension development, helping to prevent incorrect usage of the browser.\* APIs.  
   * **Critically, the eslint-plugin-no-unsanitized plugin must be added and configured.** This plugin automatically detects potential security vulnerabilities, such as using innerHTML with untrusted data, which can lead to Cross-Site Scripting (XSS) attacks. This recommendation comes directly from Mozilla's security best practices and is a crucial, non-negotiable security enhancement.11  
2. **Prettier for Code Formatting:** While ESLint checks for code quality and potential errors, Prettier is an opinionated code formatter that handles all stylistic concerns. It ensures consistent indentation, spacing, quote style, and line wrapping across the entire project. Integrating Prettier removes all arguments about code style and allows the team to focus on logic. It should be configured to run automatically, for instance, via a pre-commit hook or on save in the code editor.

This combination of tools creates an automated quality gate. Code that does not meet the established standards will be flagged immediately, preventing low-quality or insecure code from ever being committed to the repository.

### **1.4 Version Control Discipline**

A project's version control history is a vital piece of documentation. Uninformative or inconsistent commit messages render this history useless for debugging, understanding the evolution of features, or identifying when a regression was introduced.  
To ensure a valuable and legible project history, the **Conventional Commits** specification must be adopted. This is a lightweight convention on top of commit messages that provides a clear and explicit structure. All commit messages must adhere to this format.

* **Format:** \<type\>\[optional scope\]: \<description\>  
* **Example Types:**  
  * feat: A new feature for the user.  
  * fix: A bug fix for the user.  
  * chore: Changes to the build process or auxiliary tools.  
  * docs: Documentation only changes.  
  * style: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc.).  
  * refactor: A code change that neither fixes a bug nor adds a feature.  
* **Rules:**  
  * The subject line must be capitalized.  
  * The subject line must not end with a period.  
  * The subject line must be written in the imperative mood (e.g., "Add feature" not "Added feature" or "Adds feature").  
  * The subject line should be limited to 50 characters to ensure readability in git logs.  
  * A blank line must separate the subject from the body.  
  * The body should be used to explain the *what* and *why* of the change, not the *how*.

This discipline, as outlined in professional project guidelines, transforms the Git log from a simple chronological list into a searchable, meaningful documentation of the project's history.6

## **Section 2: Core Architectural Redesign: Manifest V3 and Permissions Model**

### **Introduction**

The extension is currently built on Manifest V2, an outdated specification. The single most important architectural change that must be undertaken is the migration to Manifest V3 (MV3). This is not an optional upgrade; it is a mandatory step for building a modern, secure, and performant extension that aligns with the future direction of all major browser platforms.12 This migration is more than a version bump; it forces a fundamental rethinking of how the extension handles background processing, security policies, and, most importantly, its relationship with user permissions.  
The transition to MV3 represents a philosophical shift in extension design. The V2 model was "extension-first," where the extension was granted broad, often permanent, permissions and was trusted to manage its environment. The V3 model is "user-first," where the user is given explicit, granular control over the extension's access, and the extension must operate defensively, assuming minimal privilege. This shift requires re-architecting the application to be a respectful guest in the user's browser, rather than an owner. It must always ask for permission, be prepared to have that permission revoked at any moment, and function gracefully in a more restrictive environment. This mindset leads to safer, more trustworthy, and ultimately better software.

### **2.1 Mandatory Migration to Manifest V3**

Manifest V2 is a legacy platform. While Firefox currently maintains support for V2 to a greater extent than Chromium-based browsers, all new development must target MV3.13 Building on V2 is accruing technical debt from day one. The migration is a straightforward but critical first step.

* **Implementation:**  
  * In manifest.json, the manifest\_version key must be changed from 2 to 3\.12  
    JSON  
    "manifest\_version": 3,

  * To prepare for publishing on the Firefox Add-on Marketplace (AMO), an extension ID must be specified. This is done via the browser\_specific\_settings key, which is ignored by other browsers.1  
    JSON  
    "browser\_specific\_settings": {  
      "gecko": {  
        "id": "your-extension-name@your-domain.com"  
      }  
    }

  * This ID ensures that the extension's identity remains consistent across updates, which is essential for managing storage and other browser features tied to the extension's origin.12

### **2.2 Refactoring Host Permissions**

A core security flaw in the MV2 model is its handling of permissions. Declaring a website pattern (e.g., "\*://\*.mozilla.org/\*") in the permissions key grants the extension broad, permanent access to those sites upon installation. This violates the principle of least privilege, a foundational concept in security engineering.16  
MV3 introduces a much-needed separation between API permissions (like storage) and host permissions (access to websites).

* **Implementation:**  
  * All host permission strings (URL match patterns) must be moved from the permissions array to the new host\_permissions array in manifest.json.  
  * The permissions array should now only contain strings for API permissions (e.g., "tabs", "storage", "notifications", "scripting").

**Manifest V2 (Incorrect for MV3):**JSON  
"permissions":  
**Manifest V3 (Correct):**JSON  
"permissions":,  
"host\_permissions": \[  
  "\*://\*.example.org/\*"  
\]

This change is central to MV3's user-centric security model, as it allows the browser to treat these two types of permissions differently and give users more granular control over what the extension can access.12

### **2.3 Implementing Dynamic Permission Checks**

The most significant consequence of the new host\_permissions model is that users can revoke these permissions at any time through the browser's UI, without disabling the entire extension. The current codebase likely assumes that once a permission is granted, it is permanent. This assumption will lead to critical runtime errors in an MV3 environment.  
The extension's architecture must be updated to operate defensively, never assuming a permission is present.

* **Implementation:**  
  * Before executing any code that relies on a host permission (such as injecting a content script or making a cross-origin request), the code must first verify that the permission is still granted. This is done using the browser.permissions.contains() API.  
  * If the permission is not present, the extension must handle this gracefully. The appropriate response depends on the feature. It could involve disabling the UI element that triggers the feature, or it could involve programmatically requesting the permission from the user via browser.permissions.request(). The request API can only be called in response to a direct user action, such as a button click.

**Example Logic (in a background script):**JavaScript  
browser.action.onClicked.addListener(async (tab) \=\> {  
  const permissionsToRequest \= {  
    origins: \["\*://\*.mozilla.org/\*"\]  
  };

  // Check if the extension already has permission for the site.  
  const hasPermission \= await browser.permissions.contains(permissionsToRequest);

  if (hasPermission) {  
    // Permission exists, execute the core logic.  
    injectContentScript(tab.id);  
  } else {  
    // Permission does not exist, request it from the user.  
    try {  
      const granted \= await browser.permissions.request(permissionsToRequest);  
      if (granted) {  
        // Permission was granted, now execute the core logic.  
        injectContentScript(tab.id);  
      } else {  
        // Permission was denied. Inform the user or fail silently.  
        console.log("Permission denied by the user.");  
      }  
    } catch (error) {  
      console.error("Error requesting permission:", error);  
    }  
  }  
});

Failing to implement these checks will result in a brittle and unreliable user experience, as features will randomly fail when users manage their permissions.12

### **2.4 Consolidating Browser Actions to the action API**

Manifest V2 maintained a distinction between a browser\_action (a button always present on the toolbar) and a page\_action (a button in the address bar that appears only on specific pages). This distinction has been a source of cross-browser incompatibility, as Chrome unified these concepts long ago. MV3 formalizes this unification with the action API.

* **Implementation:**  
  * In manifest.json, the browser\_action key must be renamed to action. All its properties (default\_popup, default\_icon, etc.) remain the same.  
  * In all JavaScript files, every call to the browser.browserAction API must be refactored to use browser.action. For example, browser.browserAction.onClicked becomes browser.action.onClicked.  
  * In Firefox, the page\_action API is retained for backward compatibility, but for new, cross-browser-focused development, all primary UI entry points should be consolidated under the unified action API.12

This change simplifies the manifest and the codebase, improving maintainability and making it easier to port the extension to other browsers.

### **Table: Manifest V2 vs. Manifest V3 Architectural Changes**

This table serves as a quick-reference guide to crystallize the key syntactic and conceptual shifts required for the migration. It transforms abstract documentation into a concrete, comparative format, providing a clear map for the refactoring effort.

| Feature | Manifest V2 Syntax | Manifest V3 Syntax | Rationale for Change |
| :---- | :---- | :---- | :---- |
| **Manifest Version** | "manifest\_version": 2 | "manifest\_version": 3 | Adopts the modern, more secure extension platform.14 |
| **Host Permissions** | "permissions": \["\*://\*.mozilla.org/\*"\] | "host\_permissions": \["\*://\*.mozilla.org/\*"\] | Granular control for users; enhances security and privacy by separating site access from API access.12 |
| **Background Scripts** | "background": {"scripts": \[...\], "persistent": true} | "background": {"scripts": \[...\]} (non-persistent by default in Firefox) | Massive performance improvement by eliminating constantly running scripts and reducing memory usage.12 |
| **Toolbar Icon** | "browser\_action": {...} | "action": {...} | Unifies browser\_action and page\_action for better cross-browser consistency and a simpler API surface.12 |
| **Script Execution** | tabs.executeScript({code: "..."}) | scripting.executeScript({target:..., files:\[...\]}) | Disallows arbitrary string execution (code property), a major security vulnerability, forcing code into files.12 |
| **Content Security** | "content\_security\_policy": "..." | "content\_security\_policy": {"extension\_pages": "..."} | Provides a more structured policy definition and enforces stricter defaults, such as disallowing remote scripts.12 |

## **Section 3: Service Layer Refactoring: Scripts and Communication**

### **Introduction**

A critical architectural flaw common in junior-level projects is the blurring of responsibilities between different application layers. In a WebExtension, the background script, content scripts, and UI components (like the popup) each have a distinct and separate role defined by the security model of the browser.2 When logic is mixed—for example, a content script attempting to manage global state or a background script directly manipulating a webpage's DOM (which is impossible)—the result is a tightly coupled, insecure, and unmaintainable codebase.  
This section details the refactoring required to enforce a strict separation of concerns and to build a robust, modern communication layer between these components. This refactoring is not merely about code organization; it is about aligning the application's architecture with the fundamental principles of the WebExtensions platform. The combination of these changes—non-persistent scripts and promise-based messaging—forces the adoption of a fully asynchronous and stateless architecture. This is a powerful, scalable design pattern often seen in modern cloud and serverless computing. The background script transforms from a single, long-running process into a collection of small, independent, stateless event handlers. Each handler is triggered by a message, performs its task (which may involve asynchronous I/O to storage), and returns a result via a Promise. This makes the system more resilient to errors and significantly more performant, as code only runs when it is absolutely needed.

### **3.1 Decoupling Logic: The Role of Background and Content Scripts**

The core of the service layer refactor is to establish and enforce the distinct responsibilities of background and content scripts. Their capabilities and limitations are not arbitrary; they are defined by their security contexts.2

* Background Script (background/index.js): The Central Controller  
  The background script operates in a privileged environment with access to the full suite of WebExtension APIs.18 However, it has no direct access to the content of web pages (the DOM). Its responsibilities must be strictly limited to:  
  1. **State Management:** Acting as the single source of truth for the extension's state. It must use the browser.storage API to persist data.  
  2. **Event Listening:** Listening for browser-level events, such as tab updates (browser.tabs.onUpdated), window creation, or the extension being installed (browser.runtime.onInstalled).  
  3. **Communication Hub:** Receiving messages from content scripts and UI components, processing them, and dispatching messages with instructions or data.  
  4. **Privileged Operations:** Executing any API call that a content script cannot, such as creating notifications, managing tabs, or making cross-origin network requests (subject to host permissions).  
* Content Scripts (content-scripts/main.js): The DOM Manipulator  
  Content scripts are injected into web pages and operate in a less-privileged, sandboxed environment.20 They can access and manipulate the page's DOM, but they only have access to a very small subset of the WebExtension APIs (primarily for messaging).2 Their responsibilities must be strictly limited to:  
  1. **DOM Interaction:** Reading data from the page (e.g., scraping content) or writing to the page (e.g., highlighting text, adding UI elements).  
  2. **Data Transmission:** Sending messages *to* the background script, containing data extracted from the page.  
  3. **Instruction Reception:** Listening for messages *from* the background script and using the data in those messages to modify the page.

Any logic currently in a content script that attempts to manage persistent state or use privileged APIs must be moved to the background script. Conversely, any attempt by the background script to directly reference document or window of a web page must be refactored into a message sent to a content script.

### **3.2 Transition to Event-Driven Background Scripts**

A persistent background script, the default in many older Manifest V2 examples, is a significant performance liability. It consumes memory and CPU resources constantly, from the moment the browser starts until it closes, regardless of whether the user is interacting with the extension.21 This is inefficient and unacceptable for a modern extension.  
Manifest V3 mandates a non-persistent, event-driven model.12 In Firefox, these are called "Event Pages".18 The script is loaded only when an event it has registered a listener for is fired (e.g., a message is received, or an alarm goes off). After a short period of inactivity, the script is unloaded, freeing all its resources.

* **Implementation:**  
  1. **Ensure Non-Persistence:** The manifest.json background key must not contain "persistent": true. In MV3, this is the default and only behavior.18  
  2. **Eliminate Global State:** Because the script can be terminated at any time, storing state in global variables is not viable. All state that must persist between events or across browser restarts must be written to and read from the browser.storage API (local for persistence, session for session-only data).18  
  3. **Synchronous, Top-Level Listeners:** All event listeners (browser.runtime.onMessage.addListener, browser.tabs.onUpdated.addListener, etc.) must be registered in the top-level scope of the script. They cannot be placed inside asynchronous callbacks. The browser scans for these listeners at startup to know which events should wake the script. If a listener is registered asynchronously, the browser may miss it, and the script will fail to wake up.18  
  4. **Use the Alarms API:** Any functionality that relies on setTimeout or setInterval will fail in a non-persistent script, as the timer will be destroyed when the script unloads. These must be replaced with the browser.alarms API, which is designed to persist across script terminations and wake the script when the alarm fires.

### **3.3 Implementing a Robust Message-Passing System**

Communication between the decoupled components must be handled through a well-defined and robust messaging system. Ad-hoc messaging without a clear protocol, or relying on outdated callback patterns, leads to race conditions, unreadable "callback hell," and code that is difficult to debug.  
The system must be standardized on a modern, Promise-based approach, which is explicitly recommended by Mozilla's documentation.22

* **Implementation:**  
  1. **Standardized Message Format:** All messages must be JavaScript objects containing a command or type property. This allows the receiving listener to easily determine how to handle the message. Additional data should be passed in other properties of the message object.  
     * Example: { command: 'update-settings', settings: { theme: 'dark' } }  
  2. **Correct API Usage:**  
     * To send a message from a background or UI script to a content script in a specific tab, use browser.tabs.sendMessage(tabId, message).23  
     * To send a message from a content script or UI script to the background script, use browser.runtime.sendMessage(message).24  
  3. **Promise-Based Responses:** The sendResponse callback mechanism is obsolete and error-prone. All onMessage listeners that need to send a response asynchronously **must return a Promise**. This allows the sending function to use the clean and modern async/await syntax to wait for the response.

**Example Implementation:Background Script (Listener):**JavaScript  
// src/background/index.js

// This listener handles messages from other parts of the extension.  
browser.runtime.onMessage.addListener((message, sender) \=\> {  
  // Use a switch statement for a clean, scalable message router.  
  switch (message.command) {  
    case 'get-user-settings':  
      // Return the Promise from the storage API directly.  
      // The sender will receive the resolved value of this promise.  
      return browser.storage.local.get('settings');

    case 'save-user-settings':  
      // Return the Promise to ensure the sender knows when the operation is complete.  
      return browser.storage.local.set({ settings: message.settings });

    default:  
      // It's good practice to handle unknown commands.  
      return Promise.reject(new Error(\`Unknown command: ${message.command}\`));  
  }  
});  
**Popup Script (Sender):**JavaScript  
// src/popup/popup.js

const settingsForm \= document.getElementById('settings-form');

// Function to load settings when the popup opens.  
async function loadSettings() {  
  try {  
    const data \= await browser.runtime.sendMessage({ command: 'get-user-settings' });  
    // Populate the form with the loaded settings...  
    if (data.settings) {  
      document.getElementById('theme-select').value \= data.settings.theme;  
    }  
  } catch (error) {  
    console.error('Failed to load settings:', error);  
  }  
}

// Function to save settings when the form is submitted.  
settingsForm.addEventListener('submit', async (event) \=\> {  
  event.preventDefault();  
  const newSettings \= {  
    theme: document.getElementById('theme-select').value,  
  };  
  try {  
    await browser.runtime.sendMessage({ command: 'save-user-settings', settings: newSettings });  
    // Optionally, show a success message to the user.  
    window.close(); // Close the popup after saving.  
  } catch (error) {  
    console.error('Failed to save settings:', error);  
  }  
});

// Load settings when the popup is displayed.  
document.addEventListener('DOMContentLoaded', loadSettings);

This architecture creates a clear, unidirectional data flow for many interactions: the UI sends a command to the background, the background updates its state (in storage), and if necessary, sends a new message to the content script to update the view. This is a robust and scalable pattern.

## **Section 4: Hardening the Extension: Security Enhancements**

### **Introduction**

Security is not a feature to be added later; it is a fundamental, non-negotiable requirement of professional software development. This is especially true for browser extensions, which operate in a privileged environment and can, if compromised, have severe consequences for a user's privacy and security.25 A single vulnerability can be used to access sensitive data, impersonate the user, or install further malware. The following measures must be implemented to create a layered defense strategy, hardening the extension against common web-based attacks.  
This layered approach, often called "defense-in-depth," is a core principle of security engineering.16 It ensures that if one security control fails or is bypassed by an attacker, other layers are in place to mitigate or prevent the attack. The Content Security Policy acts as the outermost wall, blocking entire classes of attacks. The use of safe DOM APIs acts as the guards at the gate, inspecting data to ensure it is not treated as executable code. Finally, explicit input sanitization acts as the specialist in the inner sanctum, meticulously inspecting any data that  
*must* be treated as rich content to neutralize hidden threats. An attacker must successfully defeat all of these layers to compromise the extension.

### **4.1 Configuring a Strict Content Security Policy (CSP)**

A Content Security Policy (CSP) is a critical security layer that instructs the browser to block certain types of potentially malicious operations.26 By default, Firefox applies a restrictive CSP to extensions, but this must be explicitly defined and hardened in the manifest to ensure maximum protection.26 The primary goal of the extension's CSP is to prevent Cross-Site Scripting (XSS) by strictly controlling the sources from which scripts can be executed.

* Implementation:  
  The content\_security\_policy key in manifest.json must be configured for a Manifest V3 extension as follows. This policy should be considered the absolute minimum, and should only be relaxed with extreme caution and justification.  
  JSON  
  "content\_security\_policy": {  
    "extension\_pages": "script-src 'self'; object-src 'self';"  
  }

  * **script-src 'self'**: This is the most important directive in the policy. It instructs the browser that the extension is only permitted to execute JavaScript files that are packaged locally within the extension's own directory. It explicitly blocks the execution of inline scripts (e.g., \<script\>alert(1)\</script\>) and scripts loaded from any remote domain, including CDNs. This single directive mitigates the vast majority of XSS attack vectors.11  
  * **object-src 'self'**: This directive restricts the sources for plugins like \<object\>, \<embed\>, and \<applet\> to the extension's own packaged files, preventing the embedding of potentially malicious plugin content.  
  * **Forbidden Directives**: Under no circumstances should the script-src directive be weakened with values like 'unsafe-inline' or 'unsafe-eval'. These directives effectively disable the core protections of CSP and are explicitly disallowed by AMO's add-on policies for security reasons.11 If the extension requires the use of WebAssembly,  
    'wasm-unsafe-eval' may be added to script-src, but this should be the only exception.26

### **4.2 Eliminating DOM-based XSS Vulnerabilities**

The most common way that XSS vulnerabilities are introduced into an application is through the improper handling of data when inserting it into the DOM. Using properties like element.innerHTML to insert a string that originated from an external source (such as an API response or content scraped from a web page) is exceptionally dangerous, as the browser will parse and execute any script tags contained within that string.

* Implementation:  
  A systematic audit of the entire codebase must be performed to identify and replace all unsafe DOM manipulation methods. The eslint-plugin-no-unsanitized configured in Section 1 will automate much of this detection.  
  * **For inserting plain text:** Always use the element.textContent property. This property treats the assigned string as raw text and does not parse it as HTML, rendering any embedded HTML or script tags inert.  
    * **Incorrect (Vulnerable):** myDiv.innerHTML \= "Welcome, " \+ userName;  
    * **Correct (Safe):** myDiv.textContent \= "Welcome, " \+ userName;  
  * **For creating HTML structure:** Always use safe, programmatic DOM creation methods like document.createElement(), element.setAttribute(), and element.appendChild(). While more verbose, this approach is inherently safe as it clearly separates structure from content.  
    * **Incorrect (Vulnerable):** container.innerHTML \= '\<a href="' \+ userUrl \+ '"\>Click here\</a\>';  
    * **Correct (Safe):**  
      JavaScript  
      const link \= document.createElement('a');  
      link.href \= userUrl; // Note: URL sanitization is still important  
      link.textContent \= 'Click here';  
      container.appendChild(link);

This practice is a fundamental principle of secure web development and is a primary line of defense against DOM-based XSS.16

### **4.3 Sanitizing All External and User-Provided Input**

Even when using safe DOM insertion methods like textContent, it is a critical security principle to treat all data originating from outside the extension's trusted code as potentially malicious. If the extension has a legitimate need to render rich HTML content from an external source (e.g., displaying a formatted message from an API), that content **must** be sanitized before it is inserted into the DOM.

* Implementation:  
  The project must integrate a well-vetted and actively maintained HTML sanitization library. DOMPurify is the industry standard and is explicitly recommended by Mozilla for this purpose.11  
  * Install DOMPurify as a project dependency.  
  * Before using innerHTML to render any string that contains HTML from an untrusted source, pass it through DOMPurify.sanitize(). This function will parse the HTML, strip out any dangerous elements (like \<script\>) and attributes (like onerror), and return a string of "clean" HTML that is safe to render.

**Example:**JavaScript  
import DOMPurify from 'dompurify';

// externalHtmlString is from an untrusted source, like an API call.  
const cleanHtml \= DOMPurify.sanitize(externalHtmlString);

// It is now safe to use innerHTML with the sanitized string.  
const contentArea \= document.getElementById('content-area');  
contentArea.innerHTML \= cleanHtml;

Failing to sanitize untrusted HTML is a critical security oversight that leaves the extension and its users vulnerable to attack.

### **Table: Security Hardening Checklist**

This checklist provides a concrete, actionable set of tasks to guide the security refactoring process. It transforms abstract security principles into tangible implementation steps that can be methodically verified.

| Status | Security Control | Implementation Details | Rationale |
| :---- | :---- | :---- | :---- |
| **\[ \]** | **Strict CSP** | Define content\_security\_policy in manifest.json with script-src 'self'. Forbid remote scripts and unsafe-eval. | Prevents the execution of unauthorized or malicious scripts (XSS) loaded from external sources.11 |
| **\[ \]** | **No innerHTML** | Systematically replace all assignments to innerHTML with textContent for plain text or createElement for structure. | Prevents DOM-based XSS by ensuring that untrusted strings are not parsed as executable HTML.16 |
| **\[ \]** | **Input Sanitization** | Integrate the DOMPurify library and use DOMPurify.sanitize() on any external HTML content before rendering it. | Provides a critical defense-in-depth layer against sophisticated XSS attacks hidden within seemingly legitimate HTML.11 |
| **\[ \]** | **Least Privilege** | Audit manifest.json to ensure only the absolute minimum necessary permissions are requested in permissions and host\_permissions. | Minimizes the extension's potential attack surface. If a vulnerability is found, its impact is limited by the permissions granted.16 |
| **\[ \]** | **No Remote Scripts** | All third-party libraries (e.g., jQuery, moment.js) must be downloaded and bundled with the extension via Webpack. Do not load from a CDN. | Prevents supply-chain attacks where a third-party CDN is compromised and serves a malicious version of the library.11 |

## **Section 5: Performance Tuning and Optimization**

### **Introduction**

A high-quality extension must feel like a native part of the browser—fast, responsive, and lightweight. Poor performance, characterized by high memory or CPU consumption, slow UI responsiveness, or noticeable delays, is one of the primary reasons users disable or uninstall extensions.21 While the migration to event-driven background scripts detailed in Section 3 provides the most significant performance improvement, further optimizations are necessary to ensure a truly seamless user experience.  
The guiding principle for extension performance optimization is to **reduce the extension's "presence"** within the browser, both in terms of memory (its static footprint) and execution time (its dynamic footprint). The goal is to make the extension functionally invisible to the user until the exact moment its features are invoked. The ideal extension behaves like a ghost in the machine: it materializes instantly to perform its task and then vanishes without a trace. This is achieved by minimizing resource consumption when idle and ensuring that active operations are computationally efficient.

### **5.1 On-Demand Script Injection with the scripting API**

A common but inefficient pattern is to declare content scripts in the content\_scripts section of manifest.json. This causes the browser to inject the specified scripts into every web page whose URL matches the defined pattern, every time such a page loads. If a user has many tabs open, this results in dozens or even hundreds of copies of the content script residing in memory, even if the user never interacts with the extension on those pages.21 This is a significant and unnecessary drain on system resources.  
A much more performant approach is to inject scripts programmatically and on-demand.

* **Implementation:**  
  1. **Modify Manifest:** Remove the content\_scripts key from manifest.json, or reduce it to a minimal "loader" script if some initial, lightweight presence on the page is absolutely necessary.  
  2. **Request Permission:** Add the "scripting" permission to the permissions array in manifest.json. This permission is required to use the scripting API.  
  3. **Inject Programmatically:** In the background script, within the event listener for a user action (e.g., browser.action.onClicked), use the browser.scripting.executeScript() API to inject the content script into the currently active tab.

**Example (Background Script):**JavaScript  
// src/background/index.js

browser.action.onClicked.addListener((tab) \=\> {  
  // This function is called when the user clicks the toolbar icon.  
  // We inject the content script only at this moment.  
  browser.scripting.executeScript({  
    target: { tabId: tab.id },  
    files: \['content-scripts/main.js'\] // Path relative to extension root  
  }).catch(err \=\> console.error("Failed to inject script: ", err));  
});

This "just-in-time" injection pattern ensures that the content script's code is only loaded into memory for the specific tab where the user wants to use it, and only for the duration that it is needed. This dramatically reduces the extension's overall memory footprint and startup impact on the browser.12

### **5.2 Efficient State Management**

With the move to non-persistent background scripts, all state must be managed through the storage API. However, frequent or inefficient use of this API can itself become a performance bottleneck, as it involves asynchronous operations and potentially disk I/O.

* **Implementation:**  
  1. **Choose the Right Storage Area:**  
     * Use browser.storage.local for data that must persist indefinitely across browser sessions, such as user-configured settings.  
     * Use browser.storage.session for data that is only needed for the duration of a single browsing session. This storage is often held in memory by the browser, making it faster for frequent reads and writes, and is automatically cleared when the browser closes.18  
  2. **Minimize Storage Calls:** Avoid reading from storage inside loops or frequently called functions. Instead, read the necessary data once, perform all required operations in memory, and then write the final state back to storage in a single operation.  
  3. **Implement Caching for Hot Data:** For data that is read frequently but changes rarely (e.g., a complex configuration object), a simple in-memory cache can be effective. When the background script is activated, it can check a global variable for the data. If the variable is empty, it loads the data from storage.local and populates the variable. Subsequent accesses can use the in-memory copy. This cache will be automatically cleared when the event page becomes inactive, which is the desired behavior as it prevents stale data.

### **5.3 Minimizing DOM Access in Content Scripts**

Interacting with the DOM is computationally expensive. Frequent, unbatched reads and writes from a content script can trigger a condition known as "layout thrashing" or "reflow." This occurs when the script alternates between reading a geometric property from the DOM (e.g., element.offsetWidth, which requires the browser to compute the layout) and then writing to the DOM (which invalidates the layout and forces a future re-computation). This cycle can severely degrade the responsiveness of the web page, making it feel sluggish or frozen.

* Implementation:  
  All content script logic that interacts with the DOM must be refactored to batch read and write operations.  
  * **Phase 1: Read.** Perform all necessary DOM reads first. Query for all the elements you need, get their dimensions, text content, or attributes, and store these values in local variables.  
  * **Phase 2: Write.** After all reads are complete, perform all DOM writes in a single batch. Update styles, change text content, and append new elements without interleaving any more read operations.

**Example:Incorrect (Causes Layout Thrashing):**JavaScript  
const elements \= document.querySelectorAll('.item');  
for (let i \= 0; i \< elements.length; i++) {  
  // This forces a reflow on every iteration to get the width.  
  const width \= elements\[i\].offsetWidth;  
  // This invalidates the layout.  
  elements\[i\].style.height \= (width \* 0.5) \+ 'px';  
}  
**Correct (Batched Operations):**JavaScript  
const elements \= document.querySelectorAll('.item');  
const widths \=;

// Phase 1: Read all widths first.  
for (let i \= 0; i \< elements.length; i++) {  
  widths.push(elements\[i\].offsetWidth);  
}

// Phase 2: Write all heights.  
for (let i \= 0; i \< elements.length; i++) {  
  elements\[i\].style.height \= (widths\[i\] \* 0.5) \+ 'px';  
}

This simple change in structure can lead to dramatic performance improvements on complex web pages by allowing the browser's rendering engine to perform its work much more efficiently.

## **Section 6: Codebase Modernization and Style Guide Adherence**

### **Introduction**

The final layer of a professional-grade project is the quality of the code itself. The code must be clean, consistent, readable, and robust. This is not about aesthetic preference; it is about long-term maintainability, reducing bugs, and making the codebase easy for any developer to understand and extend. Enforcing a strict style guide and adopting modern JavaScript patterns is essential.  
Adherence to these standards is fundamentally about **reducing cognitive load**. When a codebase has inconsistent formatting and uses a mix of outdated and modern patterns, a developer must mentally parse each line to understand its specific syntax and potential quirks (e.g., "Is this var subject to hoisting? What is the context of this in this traditional function?"). This constant mental translation consumes energy that should be spent on solving the actual problem. When the entire codebase looks and feels the same, developers can make safe assumptions about how the code behaves. This consistency frees up significant mental bandwidth, leading to faster development, fewer bugs, and a deeper understanding of the application's architecture. Clean code is efficient code, not just for the computer, but for the human brain that must maintain it.

### **6.1 Adopting a Modern JavaScript (ES6+) Style Guide**

The current codebase likely contains a mix of JavaScript patterns from different eras. To create a modern, consistent, and less error-prone codebase, all JavaScript must be refactored to adhere to the current ECMAScript (ES6+) standards.

* Implementation:  
  The ESLint configuration from Section 1 will enforce many of these rules automatically. The entire codebase must be updated to comply.  
  1. **Variable Declarations:** The var keyword is obsolete and must be eliminated from the project. Its function-scoping and hoisting behavior are common sources of bugs.  
     * Use const by default for all variable declarations. This signals that the variable's reference will not be reassigned, which makes the code easier to reason about.10  
     * Only use let in the rare cases where a variable's value must be reassigned, such as a counter in a loop.  
  2. **Functions:**  
     * Prefer arrow functions (=\>) for all anonymous functions and callbacks (e.g., in .then(), .map(), addListener()). Arrow functions lexically bind the this context, which eliminates a large class of common bugs related to this being rebound unexpectedly.29  
     * Use the traditional function keyword for top-level, named functions to improve stack trace readability and to clearly denote major functional units of the code.  
  3. **String Manipulation:**  
     * Use template literals (\`) for any string that involves variable interpolation. This is more readable and less error-prone than traditional string concatenation with the \+ operator.  
     * **Incorrect:** const greeting \= 'Hello, ' \+ name \+ '\!';  
     * **Correct:** const greeting \= \\Hello, ${name}\!\`;\`  
  4. **Modules:** All code must be organized into modules using ES6 import and export statements. This enables the Webpack bundler to perform dependency analysis and tree-shaking, and it creates a clear, explicit dependency graph for the application.30

These patterns are not merely stylistic; they are endorsed by major style guides from Airbnb, Google, and Mozilla because they lead to more robust and maintainable code.10

### **6.2 Comprehensive Error Handling**

A common trait of hobbyist projects is the "happy path" assumption, where code is written as if asynchronous operations will never fail. In reality, network requests time out, APIs return errors, and storage operations can fail. A lack of proper error handling makes an extension brittle and prone to silent failures that are difficult for users to report and for developers to debug.

* Implementation:  
  Every asynchronous operation, especially those involving WebExtension APIs that return a Promise, must be wrapped in a try...catch block.  
  * All WebExtension APIs that return a Promise (e.g., browser.storage.local.get(), browser.runtime.sendMessage()) will reject that promise if an error occurs. An async function allows these rejections to be caught cleanly using try...catch.  
  * The catch block is not optional. At a minimum, it must log the error to the console with console.error(). This provides crucial diagnostic information during development and for advanced users who check the console. In user-facing functions, the catch block should also handle updating the UI to inform the user that an operation failed.

**Example:**JavaScript  
async function fetchAndDisplayData() {  
  const displayElement \= document.getElementById('data-display');  
  try {  
    // The 'await' keyword will throw an error if the promise rejects.  
    const response \= await browser.runtime.sendMessage({ command: 'fetch-data' });  
    displayElement.textContent \= response.data;  
  } catch (error) {  
    // This block is executed if sendMessage fails or the listener throws an error.  
    console.error(\`Failed to fetch and display data: ${error}\`);  
    displayElement.textContent \= 'Error: Could not load data. Please try again later.';  
  }  
}

Failing to handle promise rejections results in "Uncaught (in promise)" errors in the console and a broken user experience.

### **6.3 Improving Readability and Documentation**

Code is read far more often than it is written. Code that is difficult to understand is difficult to maintain, debug, and extend. The project must be improved with clear documentation and the elimination of "magic values."

* **Implementation:**  
  1. **Code Comments:** All non-trivial functions must be documented using a standard format like JSDoc. The comment should explain what the function does, what its parameters are (@param), and what it returns (@return). This allows other developers (and future you) to understand the function's purpose without having to read its entire implementation. It also enables better tooling support in code editors.  
  2. **Eliminate Magic Values:** "Magic values" are raw strings or numbers used directly in the code without explanation. They make the code hard to understand and brittle to change. All such values must be replaced with named constants.  
     * **Incorrect:**  
       JavaScript  
       if (message.type \=== 'FETCH\_COMPLETE') {  
         //...  
       }  
       element.style.color \= '\#FF0000';

     * **Correct:**  
       JavaScript  
       const MESSAGE\_TYPES \= {  
         FETCH\_START: 'FETCH\_START',  
         FETCH\_COMPLETE: 'FETCH\_COMPLETE',  
       };

       const COLORS \= {  
         ERROR\_RED: '\#FF0000',  
       };

       if (message.type \=== MESSAGE\_TYPES.FETCH\_COMPLETE) {  
         //...  
       }  
       element.style.color \= COLORS.ERROR\_RED;

This practice makes the code self-documenting and ensures that if a value needs to change, it only needs to be updated in one place. These principles of clarity and documentation are hallmarks of professional code and are consistently applied in high-quality examples, such as those provided by MDN.31

## **Conclusion and Recommendations**

The analysis of the web extension project reveals foundational weaknesses common in early-stage development. The current architecture lacks the structure, security, and performance characteristics required of a professional-grade application. The path forward involves a comprehensive re-architecture and refactoring effort centered on five key pillars:

1. **Professional Tooling:** The immediate adoption of a standardized project structure, an automated build process with Webpack, and strict code quality enforcement with ESLint and Prettier is paramount. This foundation is not optional; it is the prerequisite for building maintainable and secure software.  
2. **Manifest V3 Migration:** The extension must be migrated to Manifest V3. This is more than a technical update; it represents a fundamental shift towards a more secure, performant, and user-centric design philosophy. This involves adopting non-persistent background scripts and the granular host\_permissions model, which requires implementing defensive, dynamic permission checks throughout the codebase.  
3. **Decoupled Service Layer:** A strict separation of concerns must be enforced between the background script (the central controller), content scripts (the DOM manipulators), and UI components. Communication between these layers must be standardized on a robust, Promise-based messaging system, moving away from outdated callback patterns.  
4. **Defense-in-Depth Security:** Security must be hardened through a layered approach. This includes implementing a strict Content Security Policy (CSP) to prevent code injection, systematically eliminating unsafe DOM manipulation in favor of textContent and createElement, and sanitizing all external HTML with a library like DOMPurify.  
5. **Performance by Design:** The extension's performance must be optimized by reducing its resource footprint. This is achieved by moving from manifest-declared to on-demand, programmatic script injection using the scripting API, and by batching DOM read/write operations in content scripts to prevent layout thrashing.

Executing this refactoring plan will transform the project from a hobbyist-level proof-of-concept into a robust, secure, and maintainable WebExtension that adheres to modern engineering standards. Each recommendation is designed not only to fix an immediate flaw but also to instill best practices that are essential for any professional software developer. The process will be a significant learning experience, bridging the gap between writing code that works and engineering software that lasts.

#### **Works cited**

1. Your first extension \- Mozilla \- MDN Web Docs, accessed July 2, 2025, [https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your\_first\_WebExtension](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension)  
2. Anatomy of an extension \- Mozilla | MDN, accessed July 2, 2025, [https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Anatomy\_of\_a\_WebExtension](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Anatomy_of_a_WebExtension)  
3. JavaScript Workshop: Build your first Chrome Extension \- GitHub, accessed July 2, 2025, [https://github.com/trouni/workshop-chrome-extension](https://github.com/trouni/workshop-chrome-extension)  
4. Browser Extension Webpack Boilerplate \- GitHub, accessed July 2, 2025, [https://github.com/fstanis/webextensions-webpack-boilerplate](https://github.com/fstanis/webextensions-webpack-boilerplate)  
5. AndersonMamede/minimalistic-webextension-boilerplate: A minimalistic template for building web extensions for Chrome and Firefox \- GitHub, accessed July 2, 2025, [https://github.com/AndersonMamede/minimalistic-webextension-boilerplate](https://github.com/AndersonMamede/minimalistic-webextension-boilerplate)  
6. elsewhencode/project-guidelines: A set of best practices for JavaScript projects \- GitHub, accessed July 2, 2025, [https://github.com/elsewhencode/project-guidelines](https://github.com/elsewhencode/project-guidelines)  
7. abhijithvijayan/web-extension-starter: Web Extension starter to build "Write Once Run on Any Browser" extension \- GitHub, accessed July 2, 2025, [https://github.com/abhijithvijayan/web-extension-starter](https://github.com/abhijithvijayan/web-extension-starter)  
8. oe/web-extension-boilerplate \- GitHub, accessed July 2, 2025, [https://github.com/oe/web-extension-boilerplate](https://github.com/oe/web-extension-boilerplate)  
9. Getting Started with ESLint \- ESLint \- Pluggable JavaScript Linter, accessed July 2, 2025, [https://eslint.org/docs/latest/use/getting-started](https://eslint.org/docs/latest/use/getting-started)  
10. airbnb/javascript: JavaScript Style Guide \- GitHub, accessed July 2, 2025, [https://github.com/airbnb/javascript](https://github.com/airbnb/javascript)  
11. Build a secure extension | Firefox Extension Workshop, accessed July 2, 2025, [https://extensionworkshop.com/documentation/develop/build-a-secure-extension/](https://extensionworkshop.com/documentation/develop/build-a-secure-extension/)  
12. Manifest V3 migration guide | Firefox Extension Workshop, accessed July 2, 2025, [https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/](https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/)  
13. Manifest V3 & Manifest V2 (March 2024 update) \- Mozilla Add-ons Community Blog, accessed July 2, 2025, [https://blog.mozilla.org/addons/2024/03/13/manifest-v3-manifest-v2-march-2024-update/](https://blog.mozilla.org/addons/2024/03/13/manifest-v3-manifest-v2-march-2024-update/)  
14. manifest\_version \- Mozilla \- MDN Web Docs, accessed July 2, 2025, [https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/manifest\_version](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/manifest_version)  
15. manifest.json \- Mozilla \- MDN Web Docs, accessed July 2, 2025, [https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json)  
16. Firefox security guidelines \- MDN Web Docs, accessed July 2, 2025, [https://developer.mozilla.org/en-US/docs/Web/Security/Firefox\_Security\_Guidelines](https://developer.mozilla.org/en-US/docs/Web/Security/Firefox_Security_Guidelines)  
17. Can someone explain the point of Manifest v3 and why its being implemented \- Reddit, accessed July 2, 2025, [https://www.reddit.com/r/firefox/comments/1kypa7i/can\_someone\_explain\_the\_point\_of\_manifest\_v3\_and/](https://www.reddit.com/r/firefox/comments/1kypa7i/can_someone_explain_the_point_of_manifest_v3_and/)  
18. Background scripts \- Mozilla \- MDN Web Docs, accessed July 2, 2025, [https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Background\_scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Background_scripts)  
19. content\_security\_policy \- Mozilla \- MDN Web Docs, accessed July 2, 2025, [https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content\_security\_policy](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/content_security_policy)  
20. Content scripts \- Mozilla \- MDN Web Docs, accessed July 2, 2025, [https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content\_scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts)  
21. Firefox uses too much memory or CPU resources \- How to fix, accessed July 2, 2025, [https://support.mozilla.org/en-US/kb/firefox-uses-too-much-memory-or-cpu-resources](https://support.mozilla.org/en-US/kb/firefox-uses-too-much-memory-or-cpu-resources)  
22. runtime.onMessage \- Mozilla | MDN \- MDN Web Docs, accessed July 2, 2025, [https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/onMessage)  
23. tabs.sendMessage() \- Mozilla \- MDN Web Docs, accessed July 2, 2025, [https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/sendMessage](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/sendMessage)  
24. runtime.sendMessage() \- Mozilla \- MDN Web Docs, accessed July 2, 2025, [https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/sendMessage](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime/sendMessage)  
25. Security Best Practices for Browser Extensions | Office of Cybersecurity, accessed July 2, 2025, [https://www.vanderbilt.edu/cybersecurity/guidelines/browser-extensions/](https://www.vanderbilt.edu/cybersecurity/guidelines/browser-extensions/)  
26. Content Security Policy \- Mozilla \- MDN Web Docs, accessed July 2, 2025, [https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content\_Security\_Policy](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_Security_Policy)  
27. Content Security Policy (CSP) \- HTTP \- MDN Web Docs, accessed July 2, 2025, [https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)  
28. i6mi6/es6-style-guide: JavaScript Style Guide \- GitHub, accessed July 2, 2025, [https://github.com/i6mi6/es6-style-guide](https://github.com/i6mi6/es6-style-guide)  
29. Code style guide (3.x/ES6) | LoopBack Documentation, accessed July 2, 2025, [https://loopback.io/doc/en/contrib/style-guide-es6.html](https://loopback.io/doc/en/contrib/style-guide-es6.html)  
30. Google JavaScript Style Guide, accessed July 2, 2025, [https://google.github.io/styleguide/jsguide.html](https://google.github.io/styleguide/jsguide.html)  
31. Guidelines for writing JavaScript code examples \- MDN Web Docs, accessed July 2, 2025, [https://developer.mozilla.org/en-US/docs/MDN/Writing\_guidelines/Code\_style\_guide/JavaScript](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Code_style_guide/JavaScript)
