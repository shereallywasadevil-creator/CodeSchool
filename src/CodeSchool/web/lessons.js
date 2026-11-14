/* Code School course content. Written by hand for a complete beginner, units 1-6 and three projects;
   later units are written live by the coach in the same step format.
   Step kinds:
     L learn        {h, t, code?}          t: short paragraphs; `inline code`; blank line = new paragraph
     V watch it run {h, t, code}           the visualizer steps through code showing variables change
     P pick         {q, opts, a, why, code?}
     F fill blank   {q, code, a: [accepted], why}
     W write code   {q, start, test, hint, carry?}   test: Python asserts; OUT = what was printed
                                                      carry: start from the code of the previous W step */
"use strict";
const L = (h, t, code) => ({k: "L", h, t, code});
const V = (h, t, code) => ({k: "V", h, t, code});
const P = (q, opts, a, why, code) => ({k: "P", q, opts, a, why, code});
const F = (q, code, a, why) => ({k: "F", q, code, a, why});
const W = (q, start, test, hint, carry) => ({k: "W", q, start, test, hint, carry});

window.COURSE = [
{id: "u1", name: "First steps", color: "#ff5a4e", sub: "Talk to the computer", lessons: [
 {t: "Hello, computer", steps: [
  L("What code actually is", "A computer is incredibly fast and incredibly literal. It does exactly what it's told, in order, and nothing else.\n\nA program is a list of instructions, written in a language the computer understands. You'll learn Python: it reads almost like English, and it runs everything from Instagram's servers to NASA's data tools.\n\nThink of it like a recipe. The computer is the cook who follows every step exactly, even if the recipe has a typo."),
  L("Your first instruction", "`print()` tells Python: show this on the screen.\n\nWhatever goes inside the round brackets gets shown. Text has to be inside quotes, so Python knows where the text starts and stops.", 'print("Hello, Dilan")'),
  V("Watch it run", "Press Next to run one line at a time. The arrow shows which line Python is on, and the output fills in as each print happens.", 'print("Line one runs first")\nprint("Then line two")\nprint("Top to bottom, every time")'),
  P("What will this show?", ["Hello, world", "\"Hello, world\"", "print Hello, world", "Nothing"], 0, "The quotes mark where the text starts and ends. They aren't shown.", 'print("Hello, world")'),
  P("Which one is correct Python?", ['print("hi")', 'print(hi")', 'Print("hi")', 'print "hi"'], 0, "Python is picky: lowercase print, round brackets, and a quote on both sides of the text."),
  F("Fill the blank so it shows: Let's go", '____("Let\'s go")', ["print"], "print is the instruction that shows things."),
  W("Your turn. Make the program show the word Ready.\n\nType it in the editor, press Run to try it, then Check when you think it's right.", "# type your code below\n", "assert 'Ready' in OUT, 'show the word Ready with print(\"Ready\")'", "Copy the shape from before: print(\"…\")"),
  W("Now make it show two lines: first Get set, then Go", "", "lines = [l.strip() for l in OUT.strip().splitlines()]\nassert lines == ['Get set', 'Go'], 'two prints, in order: Get set, then Go'", "Two print lines, one after the other."),
 ]},
 {t: "Text and numbers", steps: [
  L("Two kinds of values", "Python treats text and numbers differently.\n\nText is called a string (a string of characters). It always lives in quotes: `\"23\"`. Numbers don't use quotes: `23`.\n\nWhy it matters: Python can do maths with numbers, but text in quotes is just characters, even if they look like digits."),
  V("See the difference", "Watch what each line prints. The first adds two numbers. The second glues two pieces of text together.", 'print(10 + 5)\nprint("10" + "5")'),
  P("The second line printed…", ["105", "15", "An error", "10 + 5"], 0, "Adding two strings joins them. \"10\" + \"5\" becomes \"105\"."),
  L("Maths symbols", "`+` add, `-` subtract, `*` multiply, `/` divide.\n\nTwo extras you'll use a lot: `//` divides and throws away the remainder, and `%` gives you only the remainder. `17 // 5` is 3 and `17 % 5` is 2, like 17 sweets shared by 5 people: 3 each, 2 left over.", "print(7 * 6)\nprint(9 / 2)\nprint(17 // 5)\nprint(17 % 5)"),
  P("What does print(9 / 2) show?", ["4.5", "4", "4 r1", "Error"], 0, "/ always gives a decimal answer."),
  P("What is 20 % 6?", ["2", "3", "3.33", "0"], 0, "6 goes into 20 three times (18), leaving 2."),
  F("Fill the blank so this shows 12", "print(3 ___ 4)", ["*"], "* means multiply."),
  W("Show the number of hours in a year: 365 times 24.", "", "assert '8760' in OUT, 'print(365 * 24) should show 8760'", "Put the maths inside print( )."),
  W("A season has 82 games. Show how many full weeks of 7 days fit into 82 days, then on the next line how many days are left over.", "", "assert OUT.split() == ['11', '5'], 'first 82 // 7 (11), then 82 % 7 (5)'", "Use // for full weeks and % for the leftover days."),
 ]},
 {t: "Variables", steps: [
  L("Names that remember", "A variable is a name that holds a value, like a labelled box.\n\n`points = 31` means: make a box labelled points and put 31 in it. From then on, writing `points` gives you 31.\n\nThe `=` sign means store, not equals. That trips everyone up at first.", 'player = "Tatum"\npoints = 31\nprint(player, points)'),
  V("Watch the boxes fill", "Step through and watch the Variables panel. Each line puts a value into a box, and the last line changes one.", 'score = 10\nbonus = 5\nscore = score + bonus\nprint(score)'),
  P("After these lines, what is score?", ["15", "10", "5", "score"], 0, "Lines run in order: score starts at 10, then becomes 10 + 5.", "score = 10\nscore = score + 5"),
  L("f-strings: values inside text", "To put a variable inside a sentence, write `f` before the quotes and put the variable in curly braces.\n\nPython swaps `{name}` for whatever is in the name box when that line runs.", 'name = "Dilan"\nwins = 3\nprint(f"{name} has {wins} wins")'),
  F("Fill the blank so it shows: 3 wins", 'wins = 3\nprint(___"{wins} wins")', ["f"], "The f before the quotes turns on the {} slots."),
  P("Which is a good variable name?", ["total_points", "total points", "2points", "print"], 0, "Names can't contain spaces, can't start with a digit, and shouldn't reuse Python's own words."),
  W("Make a variable `team` holding your favourite team's name and `wins` holding a number. Print a sentence that uses both, with an f-string.", "team = \nwins = \n", "assert isinstance(team, str) and team.strip(), 'team should be text in quotes'\nassert isinstance(wins, int), 'wins should be a whole number without quotes'\nassert team in OUT and str(wins) in OUT, 'print a sentence with both, like print(f\"{team} have {wins} wins\")'", "f\"{team} have {wins} wins\""),
 ]}]},
{id: "u2", name: "Decisions", color: "#4aa3df", sub: "Make your code choose", lessons: [
 {t: "True or false", steps: [
  L("Yes or no questions", "Programs constantly ask yes/no questions: is the score over 100? Is the password right?\n\nA comparison gives back `True` or `False` (capital T and F). `==` asks \"are these equal?\". It's two signs because one `=` already means store.", "print(5 > 3)\nprint(2 == 3)\nprint(7 != 7)"),
  L("All the comparisons", "`==` equal, `!=` not equal, `<` less than, `>` greater than, `<=` less or equal, `>=` greater or equal."),
  P("What does print(10 >= 10) show?", ["True", "False", "10", "Error"], 0, ">= means greater than OR equal, and 10 equals 10."),
  P("Which line checks if age is exactly 18?", ["age == 18", "age = 18", "age => 18", "age is equal 18"], 0, "One = stores, two == compares."),
  L("and, or, not", "`and` is True only when both sides are True. `or` is True when at least one side is. `not` flips True and False.\n\nLike real life: \"I'll go out if it's sunny and I'm free\" needs both; \"I'll stay in if it's raining or I'm tired\" needs either one.", "rain = True\ntired = False\nprint(rain and tired)\nprint(rain or tired)\nprint(not rain)"),
  F("Fill the blank so it prints True when x is between 5 and 10", "x = 7\nprint(x > 5 ___ x < 10)", ["and"], "Both have to be true for x to be in the range, so and."),
  P("What does print(not (3 > 1)) show?", ["False", "True", "3", "Error"], 0, "3 > 1 is True, and not flips it to False."),
 ]},
 {t: "Making decisions with if", steps: [
  L("if", "`if` runs some lines only when its condition is True.\n\nThe rules: a colon at the end of the if line, and the lines that belong to it indented by 4 spaces. The indentation is how Python knows what's inside.", 'odds = -150\nif odds < 0:\n    print("favourite")\nprint("done")'),
  V("Watch which lines run", "Step through: the arrow skips the indented line when the condition is False. Try it on this one, where temp is 15.", 'temp = 15\nif temp > 25:\n    print("hot")\nelif temp > 10:\n    print("mild")\nelse:\n    print("cold")\nprint("checked")'),
  L("elif and else", "`elif` (else-if) checks another condition when the first was False. `else` catches everything left over.\n\nOnly one branch of an if/elif/else ever runs: Python takes the first one that's True and skips the rest."),
  P("With temp = 30, what prints?", ["hot", "hot then mild", "mild", "cold"], 0, "30 > 25 is True, so the first branch runs and the rest are skipped."),
  P("What's wrong here?", ["The print isn't indented", "Missing quotes", "Should be ==", "Nothing"], 0, "Lines inside an if must be indented 4 spaces.", 'if 5 > 3:\nprint("yes")'),
  W("Write `grade(score)` that returns \"A\" for 90 and up, \"B\" for 80 to 89, \"C\" for 70 to 79 and \"F\" below 70.\n\n`return` hands the answer back (you'll learn more about it in Functions).", "def grade(score):\n    pass\n", "assert grade(95) == 'A' and grade(90) == 'A', '90 and up is A'\nassert grade(89) == 'B' and grade(80) == 'B', '80 to 89 is B'\nassert grade(70) == 'C' and grade(79) == 'C', '70 to 79 is C'\nassert grade(69) == 'F', 'below 70 is F'", "if score >= 90: return \"A\", then elif score >= 80: … Order matters: check the biggest first."),
  W("Write `who_wins(home, away)` that returns \"home\", \"away\" or \"tie\" for a final score.", "def who_wins(home, away):\n    pass\n", "assert who_wins(110, 102) == 'home'\nassert who_wins(99, 104) == 'away'\nassert who_wins(3, 3) == 'tie', 'equal scores are a tie'", "Three branches: if home > away, elif away > home, else."),
 ]}]},
{id: "u3", name: "Loops", color: "#3ecf8e", sub: "Repeat without retyping", lessons: [
 {t: "for loops", steps: [
  L("Do it for each one", "Imagine printing 1 to 100 with 100 print lines. A loop does it in two.\n\n`for n in range(5):` runs the indented lines once for each number, and `n` holds the current number. `range(5)` gives 0, 1, 2, 3, 4: five numbers, starting at 0."),
  V("Watch the loop go round", "Watch `n` in the Variables panel change on each trip round the loop, and the output grow.", "for n in range(1, 4):\n    print(\"rep\", n)\nprint(\"set done\")"),
  P("How many times does this print?", ["4", "5", "3", "Forever"], 0, "range(1, 5) is 1, 2, 3, 4. It stops before the end number.", "for n in range(1, 5):\n    print(n)"),
  L("The adding-up pattern", "One of the most common patterns in all of programming: start a total at 0, then add to it inside the loop."),
  V("Watch the total grow", "Step through and watch total climb on every pass.", "total = 0\nfor n in range(1, 6):\n    total = total + n\nprint(total)"),
  F("Fill the blank to loop over 1 to 10, including 10", "for n in range(1, ___):", ["11"], "range stops one before the end, so 11."),
  W("Write `count_evens(n)` returning how many even numbers there are from 1 to n, including n.\n\n`x % 2 == 0` is True when x is even.", "def count_evens(n):\n    count = 0\n    # loop here\n    return count\n", "assert count_evens(10) == 5, 'from 1 to 10 there are 5 evens'\nassert count_evens(1) == 0\nassert count_evens(8) == 4, 'include n itself: range(1, n + 1)'", "for x in range(1, n + 1): if x % 2 == 0: count = count + 1"),
  W("Write `total_points(games)` that adds up a list of game scores with a loop (don't use sum()).", "def total_points(games):\n    total = 0\n    return total\n", "assert total_points([20, 31, 18]) == 69\nassert total_points([]) == 0", "for g in games: total = total + g"),
 ]},
 {t: "while loops", steps: [
  L("Repeat while it's true", "A `while` loop repeats as long as its condition stays True. Use it when you don't know in advance how many repeats you need.\n\nSomething inside must change the condition eventually, or it never stops. That's called an infinite loop, and every programmer writes one sooner or later."),
  V("Countdown", "Watch n shrink each time round until the condition is False.", "n = 3\nwhile n > 0:\n    print(n)\n    n = n - 1\nprint(\"liftoff\")"),
  P("What's the bug?", ["n never changes, so it never ends", "Wrong indentation", "while needs range", "Nothing"], 0, "If nothing changes the condition, the loop runs forever.", "n = 1\nwhile n < 5:\n    print(n)"),
  W("Write `doublings(start, goal)` that returns how many times you must double start until it reaches at least goal. doublings(1, 10) is 4, because 1 → 2 → 4 → 8 → 16.", "def doublings(start, goal):\n    pass\n", "assert doublings(1, 10) == 4\nassert doublings(5, 5) == 0, 'already there: 0 doublings'\nassert doublings(3, 100) == 6", "count = 0, then while start < goal: double start and add 1 to count."),
 ]}]},
{id: "u4", name: "Collections", color: "#ff9f43", sub: "Lists and dictionaries", lessons: [
 {t: "Lists", steps: [
  L("Many values in one place", "A list holds many values in order, inside square brackets: `scores = [88, 92, 75]`.\n\nEach item has a position called an index, and indexes start at 0, not 1. So `scores[0]` is the first item. `scores[-1]` is a handy shortcut for the last one."),
  V("Watch a list change", "Step through: append adds to the end, and len counts the items.", "scores = [88, 92, 75]\nfirst = scores[0]\nscores.append(100)\ncount = len(scores)\nprint(first, count)"),
  P("What's names[1]?", ["Bo", "Al", "Cy", "Error"], 0, "Index 0 is the first item, so index 1 is the second.", 'names = ["Al", "Bo", "Cy"]'),
  L("Loop over a list", "`for item in my_list:` hands you each item in turn. Built-in helpers do common jobs: `sum()`, `max()`, `min()`, `sorted()`."),
  F("Fill the blank to get how many items are in team", "team = [\"a\", \"b\", \"c\"]\nprint(___(team))", ["len"], "len() gives the length."),
  W("Write `above_average(nums)` returning a new list of the numbers greater than the average, in their original order. An empty list gives [].", "def above_average(nums):\n    pass\n", "assert above_average([1, 2, 3, 4]) == [3, 4]\nassert above_average([5, 5, 5]) == [], 'equal to the average is not above it'\nassert above_average([]) == [], 'empty list: return [] before dividing by zero'", "Return [] first if the list is empty. Then avg = sum(nums) / len(nums), loop, and append the bigger ones to a new list."),
  W("Write `best_game(scores)` returning the index (position) of the highest score.", "def best_game(scores):\n    pass\n", "assert best_game([12, 40, 33]) == 1\nassert best_game([7]) == 0", "scores.index(max(scores)) does it in one line, or track the best index in a loop."),
 ]},
 {t: "Dictionaries", steps: [
  L("Look things up by name", "A dictionary stores pairs: a key and its value. It's like a contacts app: you look up a name (the key) to get the number (the value).\n\n`player = {\"name\": \"Brown\", \"points\": 27}`. Read a value with `player[\"points\"]`, and add or change one with `player[\"assists\"] = 6`."),
  V("Watch a dictionary fill", "Watch the dictionary in the Variables panel as keys are added and changed.", 'wins = {"Bulls": 9}\nwins["Heat"] = 11\nwins["Bulls"] = wins["Bulls"] + 1\nprint(wins)'),
  P("What does stats.get(\"steals\", 0) give?", ["0", "Error", "None", "steals"], 0, ".get gives back a default when the key is missing, instead of crashing.", 'stats = {"points": 20}'),
  L("Counting with a dictionary", "A pattern you'll use forever: count how often things appear. `.get(key, 0)` gives 0 the first time a key is seen."),
  V("Watch the counting", "Each pass adds 1 to that word's count.", 'counts = {}\nfor w in ["go", "stop", "go"]:\n    counts[w] = counts.get(w, 0) + 1\nprint(counts)'),
  W("Write `word_counts(text)` returning how many times each word appears, ignoring upper and lower case. `.split()` breaks text into words and `.lower()` makes it lowercase.", "def word_counts(text):\n    counts = {}\n    return counts\n", "assert word_counts('Go go GO stop') == {'go': 3, 'stop': 1}, 'lowercase each word with .lower()'\nassert word_counts('') == {}", "for w in text.lower().split(): counts[w] = counts.get(w, 0) + 1"),
 ]}]},
{id: "u5", name: "Functions", color: "#a78bfa", sub: "Build your own tools", lessons: [
 {t: "Your first function", steps: [
  L("A reusable mini-program", "A function is a named block of code you can use again and again, like a blender: put ingredients in, get a smoothie out.\n\n`def` starts it, the inputs (parameters) go in brackets, the body is indented, and `return` hands the result back."),
  V("Watch a function get called", "Notice the arrow jump into the function when it's called, x take the value 21, and the result come back.", "def double(x):\n    result = x * 2\n    return result\n\nanswer = double(21)\nprint(answer)"),
  P("print shows a value. What does return do?", ["Hands the value back to the code that called the function", "Shows it on screen", "Ends Python", "Saves it to a file"], 0, "Other code (and the checker) uses what you return. print only displays it."),
  F("Fill the blank to start a function called greet", "___ greet(name):\n    return f\"Hi {name}\"", ["def"], "def is short for define."),
  W("Write `fair_chance(odds)` that turns American betting odds into a win chance:\n\nnegative odds: -odds / (-odds + 100)\npositive odds: 100 / (odds + 100)\n\nRound to 3 decimals with round(x, 3).", "def fair_chance(odds):\n    pass\n", "assert fair_chance(-150) == 0.6, '-150 -> 150 / 250 = 0.6'\nassert fair_chance(150) == 0.4, '+150 -> 100 / 250 = 0.4'\nassert fair_chance(-110) == 0.524", "if odds < 0: return round(-odds / (-odds + 100), 3), else return the other formula."),
 ]},
 {t: "Functions working together", steps: [
  L("Small pieces, combined", "Good programs are made of many small functions, each doing one job and calling each other. It's like a team: each player has one role.\n\nSmall functions are easier to read, test and fix."),
  V("Watch functions call functions", "Step through and see total_area call area once per room.", "def area(w, h):\n    return w * h\n\ndef total_area(rooms):\n    total = 0\n    for w, h in rooms:\n        total = total + area(w, h)\n    return total\n\nprint(total_area([(3, 4), (2, 5)]))"),
  P("Why split code into functions?", ["Easier to read, test and reuse", "It runs faster", "Python requires it", "It uses less memory"], 0, "Each function can be understood and tested on its own."),
  W("Using fair_chance, write `no_vig(a, b)` that returns both chances with the bookmaker's cut removed: divide each chance by their sum, and round each to 3.", "def fair_chance(odds):\n    return -odds / (-odds + 100) if odds < 0 else 100 / (odds + 100)\n\ndef no_vig(a, b):\n    pass\n", "assert no_vig(-110, -110) == (0.5, 0.5)\nassert no_vig(-200, 170) == (0.643, 0.357), 'x = fair_chance(a), y = fair_chance(b), then (round(x/(x+y),3), round(y/(x+y),3))'", "Get x and y first, then return (… , …)"),
 ]}]},
{id: "u6", name: "Bugs", color: "#f6c343", sub: "Read errors, fix them calmly", lessons: [
 {t: "Reading errors", steps: [
  L("Errors are clues, not failures", "Every programmer sees errors all day. The skill isn't avoiding them, it's reading them.\n\nWhen code breaks, Python prints a message. Read the last line first: it names the kind of error and what went wrong. The app also tells you which line of your code it happened on."),
  P("NameError: name 'scroe' is not defined. What most likely caused it?", ["A typo in a variable name", "The computer is broken", "Python isn't installed", "No internet"], 0, "scroe vs score. NameError means Python never saw a variable with that name."),
  P("Which error does int(\"abc\") give?", ["ValueError", "NameError", "SyntaxError", "No error"], 0, "It's text, which int() accepts, but that text can't become a number: a bad value."),
  L("The debugging loop", "Professionals fix bugs with the same four steps every day:\n\n1. Make the bug happen again.\n2. Look at the real values right before it (print them, or watch the code run).\n3. Change one thing.\n4. Run again."),
  V("Find the bug by watching", "This should add up to 6 but prints something else. Step through and watch total: where does it go wrong?", "nums = [1, 2, 3]\ntotal = 0\nfor n in nums:\n    total = n\nprint(total)"),
  W("Fix the code above so it prints 6.", "nums = [1, 2, 3]\ntotal = 0\nfor n in nums:\n    total = n\nprint(total)\n", "assert OUT.strip() == '6', 'total should grow each time: total = total + n'", "total = n replaces the total. You want to add n to it."),
  W("This code crashes. Read the error, then fix it so it prints 10.", "points = [4, 6]\ntotal = 0\nfor p in points:\n    total = totl + p\nprint(total)\n", "assert OUT.strip() == '10', 'check the spelling of every variable name'", "Read the last line of the error: which name isn't defined?"),
 ]},
 {t: "try and except", steps: [
  L("Plan for problems", "Some errors you can see coming: a user types \"n/a\" where you expected a number. `try:` runs risky code, and if a specific error happens, `except` runs instead of crashing.\n\nCatch only the errors you expect. Catching everything hides real bugs."),
  V("Watch except catch an error", "Step through: when int(\"n/a\") fails, Python jumps to the except line.", 'def safe_int(text):\n    try:\n        return int(text)\n    except ValueError:\n        return None\n\nprint(safe_int("7"))\nprint(safe_int("n/a"))'),
  P("What does safe_int(\"7\") return?", ["7", "None", "\"7\"", "Error"], 0, "int(\"7\") works, so the try part returns 7."),
  W("Write `parse_scores(items)` that turns a list of strings into ints, skipping anything that isn't a whole number (like \"n/a\" or \"\").", "def parse_scores(items):\n    pass\n", "assert parse_scores(['10', 'n/a', '7', '', ' 3 ']) == [10, 7, 3], 'int(\" 3 \") works; skip the rest with try/except ValueError'\nassert parse_scores([]) == []", "out = [], then for x in items: try: out.append(int(x)) except ValueError: pass"),
 ]}]},
];

window.PROJECTS = [
 {id: "p1", t: "League scoreboard", after: "u4", color: "#ff9f43", blurb: "Track wins and build live standings, like a sports app's table.", steps: [
  L("What you're building", "A scoreboard that records wins and shows the standings. You'll build it in four milestones, and each one adds to the code you already wrote, the way real apps grow.\n\nYour code carries over from milestone to milestone, so build carefully."),
  W("Milestone 1. Write `new_board(teams)` that returns a dictionary with every team at 0 wins.", "def new_board(teams):\n    pass\n", "b = new_board(['Bulls', 'Heat'])\nassert b == {'Bulls': 0, 'Heat': 0}, 'every team starts at 0'\nassert new_board([]) == {}", "board = {}, then for t in teams: board[t] = 0"),
  W("Milestone 2. Add `add_win(board, team)` that adds one win. A team that isn't on the board yet gets added with 1 win.", null, "b = {'Bulls': 0}\nadd_win(b, 'Bulls'); add_win(b, 'Bulls'); add_win(b, 'Knicks')\nassert b == {'Bulls': 2, 'Knicks': 1}, 'use .get(team, 0) + 1'", "board[team] = board.get(team, 0) + 1", true),
  W("Milestone 3. Add `leader(board)` that returns the team with the most wins (None for an empty board).", null, "assert leader({'Bulls': 2, 'Heat': 5, 'Knicks': 1}) == 'Heat'\nassert leader({}) is None", "max(board, key=board.get) finds the key with the biggest value.", true),
  W("Milestone 4. Add `standings(board)` that returns a list of (team, wins) pairs, most wins first; ties sorted A to Z by name.", null, "s = standings({'Bulls': 2, 'Heat': 5, 'Knicks': 2})\nassert s == [('Heat', 5), ('Bulls', 2), ('Knicks', 2)], 'sort by wins high to low, then name A to Z'", "sorted(board.items(), key=lambda kv: (-kv[1], kv[0])). The minus sign flips the order to high-to-low.", true),
 ]},
 {id: "p2", t: "Odds calculator", after: "u5", color: "#a78bfa", blurb: "Turn betting odds into real chances and spot the bookmaker's cut.", steps: [
  L("What you're building", "Sportsbooks show odds like -150 or +200. Your calculator turns them into percentages, removes the bookmaker's built-in cut, and converts back."),
  W("Milestone 1. `to_chance(odds)`: American odds to a chance between 0 and 1, rounded to 4 decimals.", "def to_chance(odds):\n    pass\n", "assert to_chance(-150) == 0.6 and to_chance(200) == 0.3333 and to_chance(100) == 0.5", "negative: -odds / (-odds + 100); positive: 100 / (odds + 100)"),
  W("Milestone 2. `book_cut(a, b)`: how much over 100% the two sides add up to, as a percent rounded to 1 decimal. That extra is the bookmaker's profit.", null, "assert book_cut(-110, -110) == 4.8, '0.5238 + 0.5238 = 1.0476 -> 4.8%'\nassert book_cut(100, 100) == 0.0", "round((to_chance(a) + to_chance(b) - 1) * 100, 1)", true),
  W("Milestone 3. `to_odds(chance)`: back to American odds, rounded to a whole number. 0.5 and above gives negative odds.", null, "assert to_odds(0.6) == -150 and to_odds(0.25) == 300 and to_odds(0.5) == -100", "chance >= 0.5: round(-100 * chance / (1 - chance)); else round(100 * (1 - chance) / chance)", true),
 ]},
 {id: "p3", t: "Text adventure engine", after: "u6", color: "#f6c343", blurb: "The engine behind a game: rooms, moves and a story log.", steps: [
  L("What you're building", "Every text adventure has the same engine underneath: a map of rooms, a player position, and commands that move you. You'll write the engine and test it with a tiny map."),
  W("Milestone 1. `ROOMS` is given. Write `move(room, direction)` that returns the room you end up in, or the same room if there's no exit that way.", "ROOMS = {\n    \"hall\": {\"north\": \"library\", \"east\": \"kitchen\"},\n    \"library\": {\"south\": \"hall\"},\n    \"kitchen\": {\"west\": \"hall\"},\n}\n\ndef move(room, direction):\n    pass\n", "assert move('hall', 'north') == 'library'\nassert move('library', 'south') == 'hall'\nassert move('kitchen', 'north') == 'kitchen', 'no exit that way: stay put'", "ROOMS[room].get(direction, room)"),
  W("Milestone 2. Write `play(start, commands)` that applies each command in turn and returns the final room.", null, "assert play('hall', ['north', 'south', 'east']) == 'kitchen'\nassert play('hall', []) == 'hall'", "room = start; for c in commands: room = move(room, c); return room", true),
  W("Milestone 3. Write `play_log(start, commands)` that returns a list of sentences, one per command: \"You go north to the library.\" or \"You can't go north.\"", null, "log = play_log('hall', ['north', 'north', 'south'])\nassert log == ['You go north to the library.', \"You can't go north.\", 'You go south to the hall.'], log", "Compare move(room, c) with room: if it changed, you moved.", true),
 ]},
];

window.LATER = [
 ["u7", "Python power-ups", "#22b8cf", ["Strings in depth", "Tuples and sets", "List comprehensions", "Files: reading and writing", "Modules and imports", "Working with JSON", "Classes and objects", "Inheritance", "Dates and times", "Writing your own tests"]],
 ["u8", "Developer tools", "#94a3b8", ["The terminal", "Files and folders from the terminal", "Git: saving history", "Git: branches", "GitHub and pull requests", "VS Code like a pro", "Virtual environments and pip"]],
 ["u9", "How computers work", "#f472b6", ["Bits, bytes and binary", "Memory and the CPU", "How programs run", "Operating systems", "Networks and the internet", "How a website reaches you"]],
 ["u10", "Data structures and algorithms", "#60a5fa", ["Big-O in plain words", "Arrays and strings", "Hash maps", "Stacks and queues", "Linked lists", "Recursion", "Sorting", "Binary search", "Two pointers and sliding window", "Trees", "Graphs and BFS/DFS", "Dynamic programming basics"]],
 ["u11", "The web: front end", "#fb7185", ["HTML structure", "CSS styling", "Layout with flexbox and grid", "Responsive design", "JavaScript basics", "The DOM and events", "fetch and async code", "React basics", "Accessibility"]],
 ["u12", "Back ends and APIs", "#a3e635", ["How HTTP works", "REST APIs", "Build an API in Python", "Authentication and passwords", "Error handling and logging", "Background jobs and caching"]],
 ["u13", "Databases", "#fbbf24", ["Tables and SQL SELECT", "Filtering and sorting", "JOINs", "GROUP BY and totals", "Designing tables", "Indexes and speed", "NoSQL databases"]],
 ["u14", "Engineering practice", "#2dd4bf", ["Clean code", "Testing strategy", "Code review", "Debugging hard problems", "Security basics", "Performance", "Docs that help"]],
 ["u15", "Cloud and DevOps", "#cbd5e1", ["Linux basics", "Deploying an app", "Docker", "CI/CD pipelines", "Cloud services", "Monitoring"]],
 ["u16", "Data and AI", "#c084fc", ["Data with pandas", "Charts with Python", "Statistics you actually need", "How machine learning works", "How AI models work", "Building with AI APIs", "Using AI coding tools well"]],
 ["u17", "System design", "#38bdf8", ["What system design is", "Scaling a web app", "Load balancers and caches", "Databases at scale", "Queues and events", "Design a URL shortener"]],
 ["u18", "Getting hired", "#fb923c", ["Choosing your tech path", "Portfolio projects that stand out", "Your resume", "GitHub profile", "Coding interview method", "Behavioral interviews", "Your first 90 days"]],
];
