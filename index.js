const { spawn, execFile, exec } = require("child_process");
const fs = require("fs-extra");
const JSON5 = require("json5");
const keysender = require("keysender");
const defaultSettings = {
    x: 0,
    y: 0,
    height: 120,
    width: 500,
};

console.log("Screen size:", keysender.getScreenSize());

let settings;
try {
    settings = Object.assign({}, defaultSettings, JSON5.parse(fs.readFileSync("my_wins.json")));
} catch (e) {
    console.log(`Usage:
    create 'my_wins.json' with optional contents
    {
        x: 0,           
        y: 0,         
        height: 120,    
        width: 500,     
        wins:{          
            foo:"my command line 1",
            baz:"my command line 2",
        }
    }
    
    optionally create my_wins_personal.json to override any settings    
    `);
    process.exit(1);
}

if (!settings.wins) settings.wins = {};
try {
    let personal_settings = JSON5.parse(fs.readFileSync("my_wins_personal.json"));
    for (let k in personal_settings) if (k !== "wins") settings[k] = personal_settings[k];

    for (let name in personal_settings.wins)
        if (!settings.wins[name]) settings.wins[name] = personal_settings.wins[name];
        else Object.assign(settings.wins[name], personal_settings.wins[name]);
} catch (e) {}

let wins = keysender.getAllWindows();

for (let name in settings.wins) {
    if (!wins.filter((w) => w.title === name).length) exec(`start cmd.exe @cmd /k "title ${name}"`);
    else delete settings.wins[name];
}

keysender.sleep(500);

wins = keysender.getAllWindows();
let y = settings.y;
for (let name in settings.wins) {
    const win_cmd = settings.wins[name];
    const win_info_candidates = wins.filter((w) => w.title === name);
    const win_info = win_info_candidates[0];

    if (!win_info) console.warn(`CODE00000000 Couldn't find window ${name}`);
    else if (win_info_candidates.length > 1)
        console.warn(`CODE00000000 There are ${win_info_candidates.length} windows with name '${name}'. Only one window expected!`);
    else {
        const win = new keysender.Hardware(win_info.handle);
        win.workwindow.setView({ x: settings.x, y, width: settings.width, height: settings.height });
        y += settings.height;
        win.workwindow.setForeground();
        win.keyboard.printText(win_cmd);
        win.keyboard.sendKey(13);
        keysender.sleep(50);
    }
}

setTimeout(() => {
    process.exit(0);
}, 1000);

/*
bat.stdout.on('data', (data) => {
    console.log(data.toString());
});

bat.stderr.on('data', (data) => {
    console.error(data.toString());
});

bat.on('exit', (code) => {
    console.log(`Child exited with code ${code}`);
});

*/
