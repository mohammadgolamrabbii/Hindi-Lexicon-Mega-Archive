# 🇮🇳 Hindi Lexicon Mega-Archive (हिन्दी महा-शब्दकोश)

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-amber.svg)](LICENSE)
[![Verified Words](https://img.shields.io/badge/Verified_Hindi_Words-411%2C241-blue.svg)](#dataset-metrics)
[![Rich Entries](https://img.shields.io/badge/WordNet_Rich_Entries-102%2C720-indigo.svg)](#dataset-metrics)
[![Unicode NFC](https://img.shields.io/badge/Unicode-Strict_NFC-emerald.svg)](#unicode-normalization)
[![Live Explorer](https://img.shields.io/badge/Web_Explorer-Live_on_GitHub_Pages-success.svg)](https://mohammadgolamrabbii.github.io/Hindi-Lexicon-Mega-Archive/)

An open-source, Unicode NFC-normalized, multi-format **Hindi (हिन्दी) Lexicon, WordNet Dictionary & Verified Wordlist Archive** built for NLP researchers, AI/LLM datasets, spellcheckers, educational platforms, and software developers.

👉 **Live Interactive Web Dictionary:** [https://mohammadgolamrabbii.github.io/Hindi-Lexicon-Mega-Archive/](https://mohammadgolamrabbii.github.io/Hindi-Lexicon-Mega-Archive/)  
🔤 **Companion Hindi Fonts Archive (6,519+ Free Fonts):** [Open Typography Hub](https://mohammadgolamrabbii.github.io/typography/)

---

## 📊 Dataset Metrics

| Metric | Verified Count | Details |
| :--- | :--- | :--- |
| **Total Verified Hindi Words** | **411,241** | Deduplicated, strict NFC Devanagari wordlist |
| **Rich Lexicon Entries** | **102,720** | Full IndoWordNet entries (`noun`, `verb`, `adjective`, `adverb`) |
| **With Definitions** | **102,720** | Detailed Hindi definitions |
| **With Synonyms** | **96,073** | Synset-linked Hindi synonyms (पर्यायवाची) |
| **With Antonyms** | **6,814** | Pointer-resolved Hindi antonyms (विलोम) |
| **With Example Sentences** | **102,646** | Real Hindi usage sentences |
| **Web Alphabet Chunks** | **54** | Devanagari-indexed JSON chunks (`dist/chunks/`) for 0ms search |

---

## 📁 Export Formats (`dist/`)

| File | Format | Use Case |
| :--- | :--- | :--- |
| `dist/hindi_lexicon_rich_part1.jsonl` & `part2.jsonl` | JSON Lines | Streaming ingestion, LLM fine-tuning, Python/Node pipelines |
| `dist/hindi_lexicon_rich_part1.json` & `part2.json` | Compact JSON | Full structured database (<31 MB per file) |
| `dist/by_pos/hindi_{noun,verb,adjective,adverb}.jsonl` | POS Split JSONL | Targeted grammatical datasets |
| `dist/hindi_lexicon_core_part1.csv` & `part2.csv` | UTF-8 BOM CSV | Excel, Google Sheets, Pandas, SQL import |
| `dist/hindi_wordlist_verified.txt` | Plain Text | NLP tokenizers & spellcheck corpora |
| `dist/hi_IN.dic` & `dist/hi_IN.aff` | Hunspell | LibreOffice, VS Code, Firefox spellcheckers |
| `dist/chunks/hi_*.json` | Chunked JSON | Zero-backend web & mobile dictionary apps |

---

## 🧬 Unified Entry Schema

```json
{
  "id": "hi-000108",
  "word": "अजन्मा",
  "pos": ["adjective"],
  "def": ["जिसने जन्म न लिया हो"],
  "synonyms": ["अजात", "अनुत्पन्न", "अज", "अयोनि"],
  "antonyms": ["जन्मा", "उत्पन्न", "जात"],
  "examples": ["देवकी के अजन्मे बालकों के विषय में भविष्यवाणी हुई थी ।"],
  "sources": ["IndoWordNet"]
}
```

---

## 🛠️ Unicode Normalization & Quality Assurance

Every Devanagari entry is strictly normalized to **Unicode NFC**, cleaned of stray zero-width formatting marks, deduplicated, and continuously validated by GitHub Actions (`scripts/validate_lexicon.js`).

### Quick Usage (Python)

```python
import json, glob

lexicon = []
for path in sorted(glob.glob("dist/hindi_lexicon_rich_part*.jsonl")):
    with open(path, "r", encoding="utf-8") as f:
        lexicon.extend(json.loads(line) for line in f)

print(f"Loaded {len(lexicon)} Hindi entries!")
```

---

## ⚖️ Attribution & License

This archive builds upon and unifies open-source community efforts with full respect for upstream licenses:
* **IndoWordNet (`wordnet-hi`)** (GNU GPL)
* **`Shreeshrii/hindi-hunspell`** (GPL / LGPL / MPL)

Released under the **[GNU General Public License v3.0 (GPL-3.0)](LICENSE)**.

---

*Curated & maintained by **[Mohammad Golamrabbii](https://github.com/mohammadgolamrabbii)** • Companion Project: **[Bangla Lexicon Mega-Archive](https://github.com/mohammadgolamrabbii/Bangla-Lexicon-Mega-Archive)***
