const { spawn, execFile, exec } = require("child_process");
const fs = require("fs");
const JSON5 = require("json5");
const keysender = require("keysender");
const defaultSettings = {
    x: 0,
    y: 0,
    height: 120,
    width: 500,
};

const randSuffix = ()=>("_"+Math.ceil(Math.random()*999999999).toString()+Math.ceil(Math.random()*999999999).toString()).substr(0,20);

function awaitDelay(delay) {
	return new Promise((resolve)=>{
		setTimeout(resolve, delay);
	});
}

module.exports.defaultSettings = defaultSettings;
module.exports.run = async ()=>{
	console.log("Screen size:", keysender.getScreenSize());

	let settings;
	try {
		settings = Object.assign({}, defaultSettings, JSON5.parse(fs.readFileSync("my_wins.json")));
	} catch (e) {
		console.log(`Usage:
		create 'my_wins.json' with optional contents
		{
			startTimeout: 700,
			x: 0,           
			y: 0,         
			height: 120,    
			width: 500,     
			wins:{          
				foo:"my command line 1",
				baz:{no_run:true, cmd:"my command line 2"},
			}
		}
		
		optionally create my_wins_personal.json to override any settings    
		`);
		process.exit(1);
	}

	if (!settings.wins) settings.wins = {};

	for(let k in settings.wins)
		if(typeof settings.wins[k] === "string")
			settings.wins[k] = {cmd:settings.wins[k]};

	for(let k in settings.wins) {
		const w = settings.wins[k];
		w.name = k;
		w.title = w.name+randSuffix()
	}

	try {
		let personal_settings = JSON5.parse(fs.readFileSync("my_wins_personal.json"));
		for (let k in personal_settings) if (k !== "wins") settings[k] = personal_settings[k];

		for (let name in personal_settings.wins)
			if (!settings.wins[name]) settings.wins[name] = personal_settings.wins[name];
			else Object.assign(settings.wins[name], personal_settings.wins[name]);
	} catch (e) {}

	let wins = keysender.getAllWindows();

	for(let k in settings.wins) {
		const w = settings.wins[k];
		const {name, title} = w;
		exec(`start cmd.exe @cmd /k "title ${title}"`);
	}

	await awaitDelay(settings.startTimeout || 700);
	
	wins = keysender.getAllWindows();
	let y = settings.y;
	for(let k in settings.wins) {
		const w = settings.wins[k];
		const {name, title} = w;
		let win_info_candidates = wins.filter(c => c.title.includes(title));
		const win_info = win_info_candidates[0];

		if (!win_info) console.warn(`CODE00000000 Couldn't find window ${title}`);
		else if (win_info_candidates.length > 1)
			console.warn(`CODE00000000 There are ${win_info_candidates.length} windows with title '${title}'. Only one window expected!`);
		else {
			const win = new keysender.Hardware(win_info.handle);
			win.workwindow.setView({ x: settings.x, y, width: settings.width, height: settings.height });
			y += settings.height;
			win.workwindow.setForeground();

			win.keyboard.printText(w.cmd);
			if(!w.no_run)
				win.keyboard.sendKey(13);
			await awaitDelay(50);
		}
	}

	await awaitDelay(100);
	console.log(`my_wins finished successfully!`);
	process.exit(0);
};

