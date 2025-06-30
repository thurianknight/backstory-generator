// File: scripts/character-backstory.js

Hooks.once("init", async () => {
    game.settings.register("backstory-generator", "openaiKey", {
        name: "OpenAI API Key",
        hint: "Enter your personal OpenAI API key",
        scope: "world",
        config: true,
        type: String,
        default: "sk-...",
        ...(foundry?.utils?.hasProperty ? { isSecret: true } : {})
    });
    game.settings.register("backstory-generator", "openaiModel", {
        name: "OpenAI Model",
        hint: "Model to use with the OpenAI API (e.g., gpt-3.5-turbo, gpt-4o-mini, gpt-4.1-nano)",
        scope: "world",
        config: true,
        type: String,
        choices: {
            "gpt-3.5-turbo": "gpt-3.5-turbo (Fast, Low Cost)",
            "gpt-4o-mini": "gpt-4o-mini (Faster GPT-4, Recommended)",
            "gpt-4.1-nano": "gpt-4.1 (Fastest, most cost-effective GPT-4.1 model)"
        },
        default: "gpt-3.5-turbo"
    });

    game.settings.register("backstory-generator", "path.age", {
        name: "Character Age Path",
        hint: "Data path to the character's age (e.g., system.details.age)",
        scope: "world",
        config: true,
        type: String,
        default: "system.details.age"
    });
    game.settings.register("backstory-generator", "path.gender", {
        name: "Character Gender Path",
        hint: "Data path to the character's sex/gender (e.g., system.details.gender)",
        scope: "world",
        config: true,
        type: String,
        default: "system.details.gender"
    });
    game.settings.register("backstory-generator", "path.origin", {
        name: "Character Race/Ancestry Path",
        hint: "Data path to the character's racial origin or ancestry (e.g., system.details.race)",
        scope: "world",
        config: true,
        type: String,
        default: "system.details.race"
    });
    game.settings.register("backstory-generator", "path.charClass", {
        name: "Character Class Path",
        hint: "Data path to the character's class or profession (e.g., system.details.class)",
        scope: "world",
        config: true,
        type: String,
        default: "system.details.class"
    });
    game.settings.register("backstory-generator", "path.biography", {
        name: "Actor Biography Path",
        hint: "Data path to the actor's biography field (e.g., system.biography).",
        scope: "world",
        config: true,
        type: String,
        default: "system.biography"
    });

    game.settings.register("backstory-generator", "genrePreset", {
        name: "Default Genre Preset",
        hint: "Genre tone to guide the backstory style.",
        scope: "world",
        config: true,
        type: String,
        choices: {
            sword_sorcery: "Sword & Sorcery",
            high_fantasy: "High Fantasy",
            grimdark: "Grimdark",
            noble_bright: "Noblebright",
            weird_fantasy: "Weird Fantasy",
            science_fantasy: "Science Fantasy",
            custom: "Custom / Manual"
        },
        default: "sword_sorcery"
    });
    game.settings.register("backstory-generator", "worldContext", {
        name: "World / Region Lore",
        hint: "Optional world or regional lore that provides context for all character backstories.",
        scope: "world",
        config: true,
        type: String,
        default: "",
        multiline: true
    });

    await loadTemplates(["modules/backstory-generator/templates/character-form.html"]);

});

Hooks.once("ready", () => {
    game.hyp3eBackstoryGenerator = {
        showForm: (actor = null) => new BackstoryForm(actor).render(true)
    };

    // Optional: add to UI
    game.settings.registerMenu("backstory-generator", "openForm", {
        name: "Character Backstory Generator",
        label: "Test Backstory Generator",
        icon: "fas fa-feather-alt",
        type: BackstoryForm,
        restricted: false
    });

});

Hooks.on("renderActorSheet", (sheet, html, data) => {
    // Only for type "character"
    if (sheet.actor?.type !== "character") return;

    // Avoid adding the button multiple times
    const existing = html.closest('.app').find('.backstory-generator');
    if (existing.length) return;

    // Create the button
    const button = $(
        `<a class="backstory-generator" title="Generate Character Backstory">
        <i class="fas fa-feather-alt"></i> Backstory
        </a>`
    );

    // Handle button click
    button.on("click", () => {
        game.hyp3eBackstoryGenerator?.showForm(sheet.actor);
    });
    // button.click(async () => await openBackstoryDialog(app.object));
    // html.closest(".app").find(".backstory-generator").remove();
    // html.closest(".app").find(".window-header .window-title").after(button);

    // Insert into sheet header
    const titleElement = html.closest('.app').find('.window-title');
    if (titleElement.length) {
        titleElement.after(button);
    }
});

class BackstoryForm extends FormApplication {
    constructor(actor) {
        super();
        this.actor = actor;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "backstory-form",
            title: "Character Backstory Generator",
            template: "modules/backstory-generator/templates/character-form.html",
            width: 400
        });
    }

    getValueAtPath(obj, path) {
        return path?.split('.').reduce((o, key) => o?.[key], obj);
    }

    async getData() {
        const data = await super.getData();
        const actor = this.actor;

        const path = (name) => game.settings.get("backstory-generator", `path.${name}`);

        if (actor) {
            data.genre = game.settings.get("backstory-generator", "genrePreset");
            data.customGenre = data.genre === "custom" ? "" : null;  // show blank if custom
            data.genreIsCustom = data.genre === "custom";
            data.name = actor.name;
            data.age = this.getValueAtPath(actor, path("age")) ?? "";
            data.gender = this.getValueAtPath(actor, path("gender")) ?? "";
            data.origin = this.getValueAtPath(actor, path("origin")) ?? "";
            data.charClass = this.getValueAtPath(actor, path("charClass")) ?? "";
            data.biography = this.getValueAtPath(actor, path("biography")) ?? "";
            data.tone = "";
        }
        // Include world context from settings as default
        data.worldContext = game.settings.get("backstory-generator", "worldContext") ?? "";
        // Set the checkbox to false by default
        data.saveToBio = false;
        return data;
    }

    async _updateObject(event, formData) {
        // Ask the user to be patient
        const overlay = this.element.find(".backstory-wait-overlay");
        overlay.show();

        try {
            // OpenAI API call
            const openaiKey = game.settings.get("backstory-generator", "openaiKey");
            const model = game.settings.get("backstory-generator", "openaiModel");

            // Format the prompt
            const prompt = this.buildPrompt(formData);

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
                    model: model,
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.8
                })
            });

            const json = await response.json();
            if (!response.ok) {
                console.error("OpenAI API error:", json);
                ui.notifications.error(`OpenAI API Error: ${json.error?.message}`);
                return;
            }
            const result = json.choices?.[0]?.message?.content || "Error getting response.";
            const formatted = `<h3>The Story So Far...</h3><p>${result.replace(/\n/g, "<br/>")}</p>`;

            new Dialog({
                title: "Character Backstory",
                content: `<div style="white-space: normal;">${formatted}</div>`,
                buttons: { ok: { label: "OK" } }
            }).render(true);

            // Save to actor biography if requested
            if (formData.saveToBio && this.actor) {
                const biographyPath = game.settings.get("backstory-generator", "path.biography");
                const current = foundry.utils.getProperty(this.actor, biographyPath) ?? "";
                const separator = `<hr><p><em>Generated on ${new Date().toLocaleDateString()}</em></p>`;
                const newBio = `${current}${separator}${formatted}`;
                const updateData = {};
                foundry.utils.setProperty(updateData, biographyPath, newBio);
                await this.actor.update(updateData);
                ui.notifications.info("Backstory added to biography.");
            }
        } catch (err) {
            ui.notifications.error("Error querying ChatGPT.");
            console.error(err);
        } finally {
            overlay.hide();
        }
    }

    buildPrompt(data) {
        const genreDescription = data.genre === "custom" ? data.customGenre : data.genre;
        const worldContext = data.worldContext?.trim() || game.settings.get("backstory-generator", "worldContext")?.trim();

        return `
You are a creative writing assistant for tabletop RPG players.
Generate a vivid, short character backstory (2-4 paragraphs) based on the following:

${worldContext ? `World Context:\n${worldContext}\n\n` : ""}
- Genre: ${data.genre}
- Name: ${data.name}
- Sex: ${data.gender}
- Age: ${data.age}
- Ancestry: ${data.origin}
- Class: ${data.charClass}
- Personality Tone or Theme: ${data.tone}

Avoid generic tropes, use a story-like tone, and return only the backstory text.`;
    }
}
