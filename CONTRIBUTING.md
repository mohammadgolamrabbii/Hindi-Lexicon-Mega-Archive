# 🤝 Contributing to Hindi Lexicon Mega-Archive

Thank you for helping preserve and enrich the open-source Hindi (हिन्दी) language dataset!

## 📜 Core Rules
1. **Unicode NFC Compliance:** Every Devanagari entry MUST be strictly Unicode NFC normalized.
2. **Schema Compliance:** All entries must conform to `schema/lexicon.schema.json`.
3. **No Duplicates:** Check `dist/hindi_lexicon_rich_part1.jsonl` & `part2.jsonl` before submitting.
4. **Automated Validation:** Always run the validator before committing:
   ```bash
   node scripts/validate_lexicon.js
   ```

## 🌟 Easy Contribution (No Coding Required)
Use the **GitHub Issues** tab and select **"✨ Add New Word"** or **"🔧 Fix Spelling or Meaning"**.
