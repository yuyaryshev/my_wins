# my_wins

Automates starting your console windows for tsc, babel, tests, verdaccio, etc...

my_wins opens **cmd** promts for you, position them nicely and types-in your commands into them.

## Why?

Why this is better than just running cmd/bat files?

Because you can

- [Ctrl+C] - to stop your command

- [UP] -> [Enter] - to restart your command
- But still you don't need to type in the command for the very first time
- And you don't have to open those consoles manually
- And you don't have to position them ether

## Installation

```shell
npm i my_wins
```

or

```shell
npm i my_wins -g
```

## Usage

Create "my_wins.json" in your project with contents:

```json
{
	"wins": {
		"cmd1": "echo cm1",
		"cmd2": "echo cmd2"
	}
}
```

and run

```shell
npm run my_wins
```

This will

* Open command line windows for each command
* Set titles of this windows
* Position windows on your screen
* Execute commands in them

Now if you need to restart or pause/resume any of your cmd just do

* [Ctrl+C] - to stop

* [UP] -> [Enter] - to restart

***my_wins*** was tested only on Windows 10 and may have issues on other OSes

***my_wins*** uses json5 to parse it's settings, so you can leave trailing commas or remove quotes around json-keys (see json5 package for details).

### Menu mode

Use menu mode to pick multiple commands interactively:

```shell
my_wins -m
```

or

```shell
my_wins --menu
```

### Run a single command

Run a single win by name:

```shell
my_wins --run cmd1
```

### Version

Print current version:

```shell
my_wins --version
```

### All options

You can also create "my_wins_personal.json" which can partially or fully overrides my_wins.

It's recommended to gitignore "my_wins_personal.json".

```json
    {
        "startTimeout": 700,
        "x": 0,           
        "y": 0,         
        "height": 120,    
        "width": 500,     
        "wins": {          
            "foo":"my command line 1",
            "baz":{"no_run":true, "cmd":"my command line 2"},
            "webstorm": {"app":true, "cmd":"\"C:\\Program Files\\JetBrains\\WebStorm 2019.2\\bin\\webstorm64.exe\""} // notice escaped quotes !
            // "commented": "Comments and trailing commas are supported!",
        },
    }
```
**x,y,height,width** *number* - is first cmd window's position and size

**y** gets incremented by **height** for each next window

**wins** *object*- your windows

- if you enter a string it resolves to `{"cmd":"string"}`
- **cmd** *string* - your command
- **no_run** *boolean* - types in the command, but won't hit "Enter".
- **app** *boolean* - runs yours command as Windows application, not as console. (Incompartible with "no_run").

*Author - Yuri Yaryshev*, 2020

*Unlicensed*

## Changelog

1.0.13
- Fixed webstorm example in readme 

1.0.12
- Fixed JSON5 parsing errors was silently ignored. 

1.0.11
- Added "app" flag to run applications instead of console windows. 
