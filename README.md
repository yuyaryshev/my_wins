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

***my_wins*** was tested only on Windows 10 and may have issues on other OSes*

### All options

You can also create "my_wins_personal.json" which can partially or fully overrides my_wins.

It's recommended to gitignore "my_wins_personal.json".

```json
    {
        startTimeout: 700,
        x: 0,           
        y: 0,         
        height: 120,    
        width: 500,     
        wins:{          
            foo:"my command line 1",
            baz:{no_run:true, cmd:"my command line 2"}
        }
    }
```
**x,y,height,width** - is first cmd window's position and size

**y** gets incremented by **height** for each next window

**wins** - your windows

- if you enter a string it resolves to {cmd:"string"}
- **cmd** - your command
- **no_run** - types in the command, but won't hit "Enter".

*Author - Yuri Yaryshev*, 2020

*Unlicensed*

