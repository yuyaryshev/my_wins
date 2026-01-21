const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const tempDir = path.join(repoRoot, "temp");
const testFile = path.join(tempDir, "my_wins_test.txt");

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForFile(filePath, timeoutMs) {
	const started = Date.now();
	while (Date.now() - started < timeoutMs) {
		if (fs.existsSync(filePath)) return true;
		await sleep(250);
	}
	return false;
}

async function run() {
	fs.mkdirSync(tempDir, { recursive: true });
	if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
	if (fs.existsSync(testFile)) {
		throw new Error(`Expected test file to be deleted: ${testFile}`);
	}

	const child = spawn("node", ["index.js", "--run", "test_file"], {
		cwd: repoRoot,
		stdio: "inherit",
	});

	const exitCode = await new Promise((resolve, reject) => {
		child.on("error", reject);
		child.on("close", resolve);
	});

	if (exitCode !== 0) {
		throw new Error(`my_wins exited with code ${exitCode}`);
	}

	const created = await waitForFile(testFile, 8000);
	if (!created) {
		throw new Error(`Expected test file to exist: ${testFile}`);
	}
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
