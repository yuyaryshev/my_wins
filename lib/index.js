const { spawn, execFile, exec } = require("child_process");
const fs = require("fs");
const JSON5 = require("json5");
const inquirer = require("inquirer");
const keysender = require("@sumbat/keysender");
const defaultSettings = {
    x: 0,
    y: 0,
    height: 120,
    width: 500,
	screenWidth:1920,
	screenHeight:1080,
	wx_total : 3,
	wy_total : 12,
};

function makeWinsArray(settings) {
	let winsArray = settings.winsArray || [];
	let {x,y,width, height, screenWidth, screenHeight, wy_total, wx_total} = settings;
	const scr_sz = keysender.getScreenSize();
	if(!screenWidth) screenWidth = scr_sz.width;
	if(!screenHeight) screenHeight = scr_sz.height;

	const wy_step = Math.round(	screenHeight*1.0/wy_total);
	const wx_step = Math.round(screenWidth*1.0/wx_total);
	for(let wy = 0; wy<wy_total;wy++ ) {
		for(let wx = 0; wx<wx_total;wx++ ) {
			const nx = (x||0)+wx_step*wx;
			const ny = (y||0)+wy_step*wy;
			winsArray.push({x:nx,y:ny, width:wx_step-1, height:wy_step-1});
		}
	}

	return winsArray;
}

const randSuffix = ()=>("_"+Math.ceil(Math.random()*999999999).toString()+Math.ceil(Math.random()*999999999).toString()).substr(0,20);

function awaitDelay(delay) {
	return new Promise((resolve)=>{
		setTimeout(resolve, delay);
	});
}

function parseArgs(argv) {
	const raw = argv.slice(2);
	let menu = false;
	let version = false;
	let runName;
	const positional = [];
	for (let i = 0; i < raw.length; i++) {
		const arg = raw[i];
		if (arg === "-m" || arg === "--menu") {
			menu = true;
			continue;
		}
		if (arg === "-r" || arg === "--run") {
			runName = raw[i + 1];
			i += 1;
			continue;
		}
		if (arg.startsWith("--run=")) {
			runName = arg.slice("--run=".length);
			continue;
		}
		if (arg === "-v" || arg === "--version") {
			version = true;
			continue;
		}
		positional.push(arg);
	}
	return {
		menu,
		version,
		single: runName || positional[0],
	};
}

function loadSettings() {
	let settings;
	try {
		settings = Object.assign({}, defaultSettings, JSON5.parse(fs.readFileSync("my_wins.json")));
	} catch (e) {
		if(!e.message.startsWith("ENOENT")) {
			console.error(`Error reading 'my_wins.json' ${e.message}`);
			return null;
		} else
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
				webstorm: {app:true, cmd:"C:\\Program Files\\JetBrains\\WebStorm 2019.2\\bin\\webstorm64.exe"},
			}
			delay:0,
		}
		
		optionally create my_wins_personal.json to override any settings    
		`);
		process.exit(1);
	}

	if (!settings.wins) settings.wins = {};

	try {
		let personal_settings ;
		try {
			personal_settings = JSON5.parse(fs.readFileSync("my_wins_personal.json"));
		} catch (e) {
			if (!e.message.startsWith("ENOENT")) {
				console.error(`Error reading 'my_wins_personal.json' ${e.message}`);
				return null;
			}
		}
		if (personal_settings) {
			for (let k in personal_settings) if (k !== "wins") settings[k] = personal_settings[k];

			if (personal_settings.wins) {
				for (let name in personal_settings.wins)
					if (!settings.wins[name]) settings.wins[name] = personal_settings.wins[name];
					else Object.assign(settings.wins[name], personal_settings.wins[name]);
			}
		}
	} catch (e) {}

	return settings;
}

function buildRunSettings(baseSettings, filterNames) {
	const settings = JSON.parse(JSON.stringify(baseSettings));
	const hasFilter = Array.isArray(filterNames) && filterNames.length > 0;
	if (hasFilter) {
		for(let k in settings.wins) {
			if(!filterNames.includes(k)) {
				delete settings.wins[k];
			}
		}
	}

	for(let k in settings.wins)
		if(typeof settings.wins[k] === "string")
			settings.wins[k] = {cmd:settings.wins[k]};

	for(let k in settings.wins) {
		const w = settings.wins[k];
		w.name = k;
		w.title = w.name+randSuffix()
	}

	return settings;
}

async function runOnce(baseSettings, filterNames) {
	const settings = buildRunSettings(baseSettings, filterNames);
	if (!Object.keys(settings.wins).length) return;

	let wins = keysender.getAllWindows();

	for(let k in settings.wins) {
		const w = settings.wins[k];
		const {name, title, app, no_run, cmd} = w;
		if(app && !no_run) {
			exec(cmd);
			delete settings.wins[k];
		} else
			exec(`start cmd.exe @cmd /k "title ${title}"`);
	}

	await awaitDelay(settings.startTimeout || 1500);
	
	wins = keysender.getAllWindows();
	let winsArray = makeWinsArray(settings);

	const myWins = {};
	let winIndex = 0;
	for(let k in settings.wins) {
		const w = settings.wins[k];
		const {name, title, app, cmd, no_run, delay} = w;

		let win_info_candidates = wins.filter(c => c.title.includes(title));
		const win_info = win_info_candidates[0];

		if (!win_info) console.warn(`CODE00000000 Couldn't find window ${title}`);
		else if (win_info_candidates.length > 1)
			console.warn(`CODE00000000 There are ${win_info_candidates.length} windows with title '${title}'. Only one window expected!`);
		else {
			const win = new keysender.Hardware(win_info.handle);
			w.win = win;
			w.winIndex = winIndex;
			w.view = winsArray[winIndex];
			win.workwindow.setView(w.view);

			w.activate = async ()=>{
				win.workwindow.setForeground();
				await awaitDelay(200);
			}

			w.print = async (cmd) => {
				await w.activate();
				win.keyboard.printText(cmd);
				await awaitDelay(200);
			}

			w.pressEnter = async  () => {
				await w.activate();
				win.keyboard.sendKey(13);
				await awaitDelay(200);
			}

			await w.print(cmd);
			// await awaitDelay(200);
			// if(!no_run) {
			// 	if(delay) {
			// 		await awaitDelay(delay);
			// 	}
			// 	w.pressEnter();
			// }
			// await awaitDelay(300);
		}
		winIndex++;
	}

	for(let k in settings.wins) {
		const w = settings.wins[k];
		const {name, title, app, cmd, no_run, delay} = w;
			if(!no_run) {
				if(delay) {
					await awaitDelay(delay);
				}
				await w.pressEnter();
			}
		}


	await awaitDelay(700);
	console.log(`my_wins finished successfully!`);
}

async function promptMenu(winNames) {
	const choices = winNames.map((name)=>({ name, value: name }));
	choices.push({ name: "exit", value: "__exit__", checked: true });
	const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
	if (!prompt) {
		throw new Error("Inquirer prompt API is unavailable. Please use a compatible inquirer version.");
	}
	const { selections } = await prompt([
		{
			type: "checkbox",
			name: "selections",
			message: "Select commands to run",
			choices,
		},
	]);
	return selections;
}

module.exports.defaultSettings = defaultSettings;
module.exports.run = async ()=>{
	const args = parseArgs(process.argv);
	if (args.version) {
		const pkgPath = require("path").join(__dirname, "..", "package.json");
		const pkg = JSON.parse(fs.readFileSync(pkgPath));
		console.log(pkg.version || "0.0.0");
		process.exit(0);
	}

	const settings = loadSettings();
	if (!settings) return;

	console.log("Screen size:", keysender.getScreenSize());
	const winNames = Object.keys(settings.wins || {});

	if (args.menu) {
		if (!winNames.length) {
			console.log("No wins configured.");
			process.exit(0);
		}
		while (true) {
			const selections = await promptMenu(winNames);
			const exitSelected = selections.includes("__exit__");
			const selectedNames = selections.filter((item)=>item !== "__exit__");
			if (selectedNames.length) {
				await runOnce(settings, selectedNames);
			}
			if (exitSelected) break;
		}
		process.exit(0);
	}

	if (args.single && settings.wins[args.single]) {
		await runOnce(settings, [args.single]);
	} else {
		await runOnce(settings);
	}

	process.exit(0);
};
