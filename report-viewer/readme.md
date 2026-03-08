# Rare Disease BD Reviewer Dashboard 🧬

A lightweight, local-first web dashboard designed specifically for Pharmaceutical Business Development (BD) professionals to evaluate rare disease indications and candidate assets. 

By transforming standardized JSON evaluation reports into an interactive, high-contrast visual interface, this tool helps BD teams quickly digest complex scientific rationales, compare competitive assets, and trace evidence back to its source—all without compromising data privacy.

## ✨ Key Features

* **Dual-Mode Evaluation (Indication & Asset)**
    * Seamlessly toggle between evaluating the disease landscape (Pathophysiology, Biomarkers, Unmet Needs) and the therapeutic solution (Mechanism of Action, Target Validity, Clinical PoC).
* **Side-by-Side Asset Comparison**
    * Evaluate multiple drug candidates for the same indication. The "Compare" tab automatically calculates score deltas and highlights net variances to identify the strongest asset at a glance.
* **Interactive Source Traceability (Anti-Hallucination)**
    * Every scientific claim matters. Hover over citation tags (e.g., `[1]`) within the core rationale to instantly view the source literature, clinical trial data, or registry reports via smart tooltips.
* **Executive-Ready PDF Export**
    * One-click "Print PDF" optimized for management reviews. Generates a clean, paginated report without cutting off critical charts or rationale boxes.
* **100% Local & Secure**
    * Built with Vanilla HTML/CSS/JS. Zero dependencies and **no server-side data collection**. All JSON files are parsed directly in your browser's memory, ensuring highly confidential BD assessments remain strictly on your local machine.

## 🚀 Quick Start

1.  **Clone or Download** this repository to your local machine.
2.  **Open** `index.html` in any modern web browser (Chrome, Edge, Safari, Firefox). *No local server installation required.*
3.  **Upload JSON Reports**: Click "Choose Files" in the Library panel to upload your structured `.json` evaluation files.
4.  **Analyze**: Use the dropdown menus to select your Target Indication and Candidate Asset, then use the tabs to navigate through the views.

## 📂 Project Structure

```text
├── index.html               # Main dashboard layout
└── assets/
    ├── app.js               # State management & logic
    ├── render.js            # Dynamic JSON parsing & UI rendering
    ├── diff.js              # Comparative analysis engine
    ├── radar.js             # Canvas-based radar charts
    ├── styles.css           # Core styling & tooltips
    ├── theme.default.css    # Color variables
    └── print.css            # PDF export layout rules