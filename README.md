# Character Backstory Generator

**A richly descriptive backstory generator, powered by OpenAI.**

This Foundry VTT module uses ChatGPT to create evocative, immersive backstories for player characters based on basic character information. Originally inspired by the Hyperborea RPG setting, it is fully configurable and works with nearly any game system. Whether your world is sword & sorcery, grimdark, or mythic science fantasy, this module generates context-sensitive origin stories that enhance immersion and character depth.

---

## Features

- 🧠 Uses OpenAI to generate compelling, multi-paragraph character backstories.
- ⚙️ Supports configurable data paths for gender, age, ancestry, class, and biography.
- ✍️ Includes tone/theme field to suggest personality flavor and background voice.
- 🌍 Includes a GM-defined "world context" setting that informs story tone and setting details.
- 🧩 Works with any game system, not just Hyperborea.
- 📜 Optional: Automatically save generated backstory to the character’s biography.
- 🪶 UI overlay with feedback while querying the oracle.

---

## Requirements

- Foundry VTT v12 or v13.
- An [OpenAI](https://platform.openai.com/) API key (you must supply your own, available [here](https://platform.openai.com/account/api-keys)).
- Internet connection (for API calls).

---

## Installation

To install manually:

1. Install from the Foundry VTT module browser (search: `backstory generator`).
2. Or install via manifest URL:
https://github.com/thurianknight/backstory-generator/releases/latest/download/module.json
3. Or download from:
[https://github.com/thurianknight/backstory-generator/releases/latest](https://github.com/thurianknight/backstory-generator/releases/latest)  
and extract it into your Foundry `modules/` directory.

---

## Configuration

In **Module Settings**, you can:

- Set your OpenAI API key.
- Choose the OpenAI model (`gpt-3.5-turbo`, `gpt-4o-mini`, etc.).
- Configure data paths to actor fields like age, gender, class, ancestry, and biography.
- Set a default **genre preset** (e.g., Sword & Sorcery, Weird Fantasy).
- Define a **world context** to inform the tone and content of all generated backstories.

> 🗂 See [System Configurations](./system-configurations.md) for working examples in Hyperborea, PF2E, OSE, and more.
---

## Usage

1. Open a character sheet (actor).
2. Click the **“Backstory”** button in the sheet’s header.
3. Verify or fill in the character details:
- Name, gender, age, ancestry, class
- Optional tone/theme for personality flavor
- (If “Custom” genre is selected, enter a custom description)
4. Check **“Save result to biography”** if desired.
5. Click **Generate Backstory**.

Within a few seconds, a vivid, multi-paragraph character history will be revealed—rooted in your world, written in your tone.

---

## Development Status

- ✅ Core features complete.
- 🔄 Designed for multi-system compatibility.
- 🌐 World context support included.
- 💡 Future ideas: NPC batch mode, optional GM-only use, and localization support.

---

## Credits

Created by **@thurianknight**  
Built for use in [Hyperborea](https://hyperborea.tv), but adaptable to any setting where characters have a past worth discovering.

---

## License

[MIT License](/LICENSE)
