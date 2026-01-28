/**
 * Universal actor sheet render hook for both ApplicationV1 and ApplicationV2.
 *
 * @param {Function} callback - Function that receives (app, html)
 *                              when an actor sheet finishes rendering.
 */
function onAnyActorSheetRendered(callback) {
    // For legacy (Application V1)
    Hooks.on("renderActorSheet", (app, html) => {
        callback(app, html);
    });

    // For new (Application V2)
    Hooks.on("renderActorSheetV2", (app, html) => {
        callback(app, html);
    });
}

Hooks.once("init", async () => {
    console.log("[Backstory Generator] Initializing module...");

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
    game.settings.register("backstory-generator", "showWelcomeMessage", {
        name: "Show Welcome Message on World Load",
        hint: "Show a quick-start guide in the chat log each time the world loads.",
        scope: "world",
        config: true,
        default: true,
        type: Boolean
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
    game.settings.register("backstory-generator", "path.homeland", {
      name: "Character Homeland Path",
      hint: "Data path to the character's homeland (e.g., system.details.homeland)",
      scope: "world",
      config: true,
      type: String,
      default: "system.details.homeland"
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
});

Hooks.once("ready", () => {
    console.log("[Backstory Generator] Ready and waiting for actor sheets...");

    game.hyp3eBackstoryGenerator = {
        showBackstoryForm: (actor = null) => new BackstoryForm(actor).render(true)
    };

    // NEW (works for both V1 and V2)
    onAnyActorSheetRendered(async (app, html) => {
        if (app.actor?.type !== "character") return;
        await insertBackstoryButton(app, html);
    });

    // Optional: add to UI
    game.settings.registerMenu("backstory-generator", "openForm", {
        name: "Character Backstory Generator",
        label: "Test Backstory Generator",
        icon: "fas fa-feather-alt",
        type: BackstoryForm,
        restricted: false
    });

    // Show welcome message in chat, if enabled
    const shouldShow = game.settings.get("backstory-generator", "showWelcomeMessage");
    if (!shouldShow) return;

    let gm_content = ""
    let all_content = "<h2>📜 Character Backstory Generator</h2>";

    if (game.user.isGM) {
        gm_content = `
            <p><strong>Configuration:</strong><br>
            In <em>Module Settings</em>, you can:
            <ul>
            <li>Set your OpenAI API key.</li>
            <li>Choose which model to use (e.g., <code>gpt-3.5-turbo</code>, <code>gpt-4o-mini</code>).</li>
            <li>Update the data paths to character info fields.</li>
            <li>Refer to <a href='https://github.com/thurianknight/backstory-generator/blob/main/system-configurations.md'>system-configurations.md</a> for known system mappings.</li>
            </ul></p>`
    }
    all_content += gm_content + `
        <p><strong>Usage:</strong><br>
        <ul>
        <li>Open a character sheet (Actor).</li>
        <li>Click the <strong>“Backstory”</strong> button in the title bar.</li>
        <li>Verify or fill in basic details (age, gender, ancestry, class, tone).</li>
        <li>Click <strong>Generate Backstory</strong>.</li>
        </ul>
        <p>The result is a vivid, multi-paragraph character history, rooted in your world, written in your tone.</p>
    `;

    ChatMessage.create({
        user: game.user.id,
        whisper: [game.user.id],
        content: all_content
    });
});

async function insertBackstoryButton(app, html) {
    console.log("[Backstory Generator] Actor sheet rendering...", app, html)
    // Only for type "character"
    if (app.actor?.type !== "character") return;

    // Avoid adding a button multiple times
    const titleBar = html.closest('.app') || html.closest('.application')
    if (!titleBar) return;
    const existing = $(titleBar).find('.backstory-generator');
    if (existing.length) return;

    // Add the generator button to the title bar
    await this.addGeneratorButton(app, html);
}

function addGeneratorButton(app, html) {
    console.log("[Backstory Generator] Adding Backstory Generator button to character sheet");

    let button;

    if (app instanceof foundry.applications.api.ApplicationV2) {
        // Configure the button for AppV2
        button = document.createElement('button');
        button.type = "button";
        button.classList.add('header-control', 'fas', 'fa-feather-alt', 'backstory-generator', 'icon');
        button.dataset.tooltip = "Generate character backstory";
        // Handle the button click event
        button.dataset.action = "showBackstoryForm";
        console.log("[Backstory Generator] App V2 button:", button);
        app.options.actions.showBackstoryForm ??= function (_event, _el) {
            game.hyp3eBackstoryGenerator?.showBackstoryForm(app.actor);
        };
    } else {
        // Configure the button for AppV1
        button = document.createElement('a');
        // button.classList.add('header-button', 'control', 'backstory-generator', 'icon');
        button.classList.add('control', 'backstory-generator', 'icon');
        button.dataset.tooltip = "Generate character backstory";
        // Add a Font-Awesome icon to the button
        const i = document.createElement('i');
        i.classList.add('fas', 'fa-feather-alt');
        i.inert = true;
        button.append(i);
        // Handle the button click event
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            game.hyp3eBackstoryGenerator?.showBackstoryForm(app.actor);
        });
    }

    // Insert into sheet header
    const titleBar = html.closest('.app') || html.closest('.application');
    if (!titleBar) return;
    const titleElement = $(titleBar).find('.window-title');
    if (titleElement.length) {
        titleElement.after(button);
    }
}

class BackstoryForm extends FormApplication {
    constructor(actor) {
        super();
        this.actor = actor;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
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
            data.homeland = this.getValueAtPath(actor, path("homeland")) ?? "";
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
                console.error("[Backstory Generator] OpenAI API error:", json);
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

            // Mark the Generator as used
            await this.actor?.setFlag("backstory-generator", "generatorUsed", true);

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
            console.error("[Backstory Generator]", err);
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
- Homeland: ${data.homeland}
- Class: ${data.charClass}
- Personality Tone or Theme: ${data.tone}

Avoid generic tropes, use a story-like tone, and return only the backstory text.`;

    }
}
