/* Code School: the TEACHING for each skill on My path (Claude, for Dilan). Plain words, one idea per screen,
   an everyday comparison, the common mistakes, a "just try it" step with no grading, and a Remember card that
   stays on screen during every question about that skill. Nothing is tested that isn't on the card. */
"use strict";
window.PATH_TEACH = {
print: {
 card: {title: "Showing things on the screen", code: 'print("Hello")       # text goes in quotes\nprint(42)            # numbers don\'t\nprint("Age:", 19)    # a comma adds a space\nprint("Go" + "al")   # + glues text together', note: "Every print starts a new line."},
 teach: [
  {h: "Code is a list of instructions", t: "A program is like a recipe: a list of steps the computer follows, top to bottom, exactly as written.\n\nThe computer is extremely fast but has zero imagination. If a step is spelled a little wrong, it stops and tells you. That's normal. Professional developers see error messages all day long."},
  {h: "print() means \"show this\"", t: "The very first instruction everyone learns is `print`. It shows something on the screen.\n\nYou write the word print, then round brackets, and inside the brackets goes the thing you want to show.", code: 'print("Hello")'},
  {h: "Why the quotes?", t: "Quotes tell Python \"this is text, show it exactly as written\".\n\nWithout quotes, Python thinks `Hello` is the name of something it should already know about, can't find it, and shows an error.\n\nNumbers don't need quotes: `print(42)` works fine.\n\nCommon mistakes: forgetting a quote on one side, or writing Print with a capital P."},
  {h: "Two handy extras", t: "A comma between things shows them with a space in between: `print(\"Age:\", 19)` shows Age: 19.\n\nA plus sign between two pieces of text glues them together with no space: `print(\"Go\" + \"al\")` shows Goal.", code: 'print("Age:", 19)\nprint("Go" + "al")'},
 ],
 try: {q: "Just try it (no grading). Change the words inside the quotes to anything you like, then press Run. Try adding a third print line too.", start: 'print("Hello")\nprint("My name is Dilan")\n'},
},
math: {
 card: {title: "Maths symbols", code: "print(7 + 2)    # 9   add\nprint(7 - 2)    # 5   subtract\nprint(7 * 2)    # 14  multiply\nprint(7 / 2)    # 3.5 divide\nprint(7 // 2)   # 3   whole times it fits\nprint(7 % 2)    # 1   what's left over\nprint(2 ** 3)   # 8   power", note: "Brackets go first, then * and /, then + and -."},
 teach: [
  {h: "Python is a calculator", t: "Put maths inside print and Python shows the answer.\n\n`*` means multiply (there's no × key on a keyboard) and `/` means divide.", code: "print(3 + 4)\nprint(6 * 7)"},
  {h: "Dividing three ways", t: "Picture 7 slices of pizza shared by 2 people.\n\n`7 / 2` is 3.5: the exact answer, as a decimal.\n`7 // 2` is 3: how many WHOLE slices each person gets.\n`7 % 2` is 1: how many slices are LEFT OVER.\n\n// and % come up all the time: minutes into hours, splitting teams, checking if a number is even.", code: "print(7 / 2)\nprint(7 // 2)\nprint(7 % 2)"},
  {h: "Order matters", t: "Python does maths in the same order you learned at school: brackets first, then multiply and divide, then add and subtract.\n\n`2 + 3 * 4` is 14, not 20, because 3 * 4 happens first. If you want the adding first, use brackets: `(2 + 3) * 4` is 20."},
 ],
 try: {q: "Just try it (no grading). Work out how many minutes are in a week, then change the numbers and Run again.", start: "print(7 * 24 * 60)\nprint(100 // 60)\nprint(100 % 60)\n"},
},
vars: {
 card: {title: "Variables", code: 'score = 10            # make a box called score, put 10 in it\nscore = score + 5     # read it, add 5, store it back (now 15)\nname = "Dilan"\nprint(f"{name} has {score} points")   # f before the quotes, names in { }', note: "One = means store. The right side happens first."},
 teach: [
  {h: "A variable is a labelled box", t: "A variable is a name that remembers a value, like a labelled box.\n\n`score = 10` means: make a box labelled score, put 10 in it. Later, writing `score` gives you back 10.\n\nThe `=` sign here doesn't mean \"equals\" like in maths. It means \"store this\"."},
  {h: "Changing what's in the box", t: "`score = score + 5` looks strange at first. Read it from the right side:\n\n1. Python works out `score + 5` using the old value (10 + 5 = 15).\n2. Then it puts 15 back into the score box.\n\nThis is how games keep score, apps count steps, and shops add up a total.", code: "score = 10\nscore = score + 5\nprint(score)"},
  {h: "Putting variables inside text", t: "To use a variable inside a sentence, put an `f` right before the opening quote, and the variable's name inside curly brackets `{ }`.\n\nPython swaps `{name}` for whatever is in that box.\n\nCommon mistake: forgetting the f. Then Python shows the curly brackets literally.", code: 'name = "Dilan"\nwins = 3\nprint(f"{name} has {wins} wins")'},
 ],
 try: {q: "Just try it (no grading). Change the values in the boxes, Run, and watch the sentence change.", start: 'team = "Heat"\nwins = 11\nwins = wins + 1\nprint(f"The {team} now have {wins} wins")\n'},
},
if: {
 card: {title: "Making decisions", code: 'if score >= 85:          # colon at the end\n    print("A")           # 4 spaces in = belongs to the if\nelif score >= 70:        # only checked if the first was False\n    print("B")\nelse:                    # everything else\n    print("Try again")', note: "Only ONE of the blocks runs: the first one that's True."},
 teach: [
  {h: "Code that chooses", t: "Real programs make choices: if the password is right, let them in; if the score is high, show a trophy.\n\n`if` checks a question. If the answer is yes (True), it runs the lines underneath it. If not, it skips them."},
  {h: "The colon and the indent", t: "Two small but important rules:\n\n1. The if line ends with a colon `:`.\n2. The lines that belong to it are pushed in by 4 spaces (press Tab).\n\nThe indent is how Python knows which lines are \"inside\" the if. In the editor, pressing Enter after a colon indents for you.", code: 'temp = 30\nif temp > 25:\n    print("It\'s hot")\nprint("This line always runs")'},
  {h: "elif and else", t: "`elif` (short for \"else if\") asks another question, but only if the first one was False.\n\n`else` catches everything that's left.\n\nPython checks top to bottom and runs only the FIRST block that's True, then skips the rest. That's why you put the strictest check first: check for an A (85+) before a B (70+)."},
 ],
 try: {q: "Just try it (no grading). Change temp to different numbers (5, 18, 31) and Run each time. Watch which line shows.", start: 'temp = 18\nif temp > 25:\n    print("Hot")\nelif temp > 15:\n    print("Nice")\nelse:\n    print("Cold")\n'},
},
bool: {
 card: {title: "True, False, and, or, not", code: "5 > 3          # True\n5 == 5         # True   (two = means \"is it equal?\")\n5 != 4         # True   (not equal)\nTrue and False # False  (both must be True)\nTrue or False  # True   (one is enough)\nnot True       # False  (flips it)", note: "Comparisons: ==  !=  <  >  <=  >="},
 teach: [
  {h: "Yes or no questions", t: "A comparison asks a yes/no question, and Python answers `True` or `False`.\n\n`age >= 18` asks: is age 18 or more?\n\nTwo equals signs `==` ask \"are these the same?\". One equals sign `=` stores. Mixing them up is the most common beginner bug in every language."},
  {h: "and, or", t: "Like everyday speech:\n\n\"I'll go if it's sunny AND I'm free\": both must be true.\n\"I'll stay in if it's raining OR I'm tired\": one is enough.\n\nIn code: `age >= 13 and has_permission`.", code: "age = 15\nhas_permission = True\nprint(age >= 13 and has_permission)"},
  {h: "not, and a shortcut", t: "`not` flips True to False and back.\n\nPython also lets you check a range in one go, like in maths: `13 <= age <= 19` means age is between 13 and 19, including both ends."},
 ],
 try: {q: "Just try it (no grading). Change age and has_ticket, Run, and see which lines say True.", start: "age = 17\nhas_ticket = True\nprint(age >= 18)\nprint(age >= 13 and has_ticket)\nprint(13 <= age <= 19)\n"},
},
while: {
 card: {title: "while loops", code: "n = 3\nwhile n > 0:        # keep going while this is True\n    print(n)\n    n = n - 1       # change something, or it never ends!\nprint(\"Done\")", note: "Something inside the loop must move it toward stopping."},
 teach: [
  {h: "Repeating without retyping", t: "A loop repeats lines for you. `while` means \"keep doing this as long as the question is True\".\n\nEach time round, Python asks the question again. When the answer becomes False, it stops and carries on below the loop."},
  {h: "Watch out: loops that never end", t: "If nothing inside the loop changes, the question stays True forever, and the program never stops. That's called an infinite loop.\n\nSo every while loop needs a line that moves it toward the end, like `n = n - 1` in a countdown.\n\n(If it happens here, Code School stops it after 10 seconds. No harm done.)"},
  {h: "A running total", t: "Loops are great for adding things up. Start a total at 0 before the loop, then add to it each time round.", code: "total = 0\ni = 1\nwhile i <= 5:\n    total = total + i\n    i = i + 1\nprint(total)"},
 ],
 try: {q: "Just try it (no grading). Change the starting number or the step, then Run.", start: 'n = 5\nwhile n > 0:\n    print(n)\n    n = n - 1\nprint("Liftoff!")\n'},
},
for: {
 card: {title: "for loops and range", code: "for i in range(1, 4):     # 1, 2, 3 (stops BEFORE 4)\n    print(i)\nfor name in [\"Ana\", \"Ben\"]:\n    print(\"Hi\", name)\nfor i in range(0, 10, 2): # 0, 2, 4, 6, 8 (count in 2s)\n    print(i)", note: "range(5) is 0, 1, 2, 3, 4."},
 teach: [
  {h: "for: go through each one", t: "`for` takes things one at a time. \"For each name in this list, say hi.\"\n\nThe word after `for` is a new variable that holds the current item each time round.", code: 'for name in ["Ana", "Ben", "Cy"]:\n    print("Hi", name)'},
  {h: "range: counting", t: "`range` makes a list of numbers to count through.\n\n`range(1, 6)` gives 1, 2, 3, 4, 5. It stops BEFORE the second number. That trips everyone up at first.\n\n`range(5)` starts at 0: 0, 1, 2, 3, 4.\n\nA third number is the step: `range(0, 10, 2)` counts in 2s."},
  {h: "for or while?", t: "Use `for` when you know what you're going through: a list, or a set count.\n\nUse `while` when you don't know how many times: \"keep doubling until it's over 100\".\n\nMost loops you'll write are for loops."},
 ],
 try: {q: "Just try it (no grading). Change the range numbers and the list, then Run.", start: "for i in range(1, 6):\n    print(i * 10)\nfor fruit in [\"apple\", \"mango\"]:\n    print(fruit.upper())\n"},
},
lists: {
 card: {title: "Lists", code: "nums = [12, 9, 15]\nnums[0]          # 12  first (counting starts at 0!)\nnums[-1]         # 15  last\nnums.append(7)   # add to the end\nlen(nums)        # 4   how many\nsorted(nums)     # a sorted copy\nmax(nums), min(nums), sum(nums)\nnums[1:3]        # a slice: items 1 and 2", note: "Indexes start at 0."},
 teach: [
  {h: "One name, many things", t: "A list keeps many values in order, in square brackets: `scores = [12, 9, 15]`.\n\nThink of a numbered row of lockers. You can add lockers, look in one, or count them."},
  {h: "Counting starts at 0", t: "The first item is `scores[0]`, not `scores[1]`. Programmers count from 0.\n\n`scores[-1]` is a handy trick for the last item, however long the list is.\n\nAsking for an item that isn't there (like [3] in a 3-item list) gives an IndexError.", code: "scores = [12, 9, 15]\nprint(scores[0])\nprint(scores[-1])"},
  {h: "Useful list tools", t: "`.append(x)` adds x to the end. `len()` counts. `max()`, `min()` and `sum()` do what they say. `sorted()` gives you a sorted copy.", code: "scores = [12, 9, 15]\nscores.append(20)\nprint(len(scores), max(scores), sum(scores))\nprint(sorted(scores))"},
 ],
 try: {q: "Just try it (no grading). Add your own numbers, then Run.", start: "scores = [12, 9, 15]\nscores.append(30)\nprint(scores)\nprint(scores[0], scores[-1])\nprint(len(scores), max(scores))\n"},
},
patterns: {
 card: {title: "Three loop patterns", code: "count = 0                 # COUNT matches\nfor t in temps:\n    if t > 25:\n        count += 1\ntotal = 0                 # ADD UP\nfor t in temps:\n    total += t\nbest = temps[0]           # KEEP THE BEST (start with the first item!)\nfor t in temps:\n    if t > best:\n        best = t", note: "x += 1 is short for x = x + 1."},
 teach: [
  {h: "Most loops do one of three jobs", t: "1. Count things that match (\"how many days were hot?\")\n2. Add things up (\"what's the total?\")\n3. Keep the best so far (\"what was the hottest day?\")\n\nAll three follow the same shape: make a variable BEFORE the loop, then update it inside."},
  {h: "Keeping the best", t: "To find the biggest, keep the best you've seen so far. Look at each item; if it beats the best, it becomes the new best.\n\nStart `best` with the first item, not 0. Otherwise, a list of all negative numbers would wrongly say 0 is the biggest.", code: "temps = [21, 30, 18]\nbest = temps[0]\nfor t in temps:\n    if t > best:\n        best = t\nprint(best)"},
 ],
 try: {q: "Just try it (no grading). Change the temperatures and Run. Can you also print the coldest?", start: "temps = [21, 30, 18, 33]\ncount = 0\nfor t in temps:\n    if t > 25:\n        count += 1\nprint(count, \"hot days\")\n"},
},
dicts: {
 card: {title: "Dictionaries", code: 'ages = {"Ana": 20, "Ben": 22}   # key: value\nages["Ana"]                     # 20   read\nages["Cy"] = 19                 # add or change\nages.get("Zed", 0)              # 0    safe read with a default\nfor name, age in ages.items():  # loop over pairs\n    print(name, age)', note: "Keys are like words in a dictionary; values are their meanings."},
 teach: [
  {h: "Look things up by name", t: "A list finds things by position (0, 1, 2…). A dictionary finds things by NAME.\n\nLike a real dictionary: look up a word (the key), get its meaning (the value).\n\n`wins = {\"Heat\": 2, \"Bulls\": 1}`. Then `wins[\"Heat\"]` gives 2."},
  {h: "Adding and changing", t: "`wins[\"Knicks\"] = 3` adds a new key, or changes it if it's already there.\n\nReading a key that doesn't exist crashes with KeyError. `.get(key, default)` is the safe way: it gives the default instead of crashing.", code: 'wins = {"Heat": 2}\nwins["Bulls"] = 1\nprint(wins.get("Knicks", 0))'},
  {h: "Counting with a dictionary", t: "A very common trick: count how many times each thing appears. For each item, take its count so far (0 if new) and add 1.", code: 'counts = {}\nfor fruit in ["apple", "pear", "apple"]:\n    counts[fruit] = counts.get(fruit, 0) + 1\nprint(counts)'},
 ],
 try: {q: "Just try it (no grading). Add another team, then Run.", start: 'wins = {"Heat": 2, "Bulls": 1}\nwins["Knicks"] = 4\nfor team, w in wins.items():\n    print(team, w)\n'},
},
funcs: {
 card: {title: "Functions", code: "def area(w, h):        # def, a name, inputs in brackets, colon\n    return w * h       # hand the answer back\n\nroom = area(3, 4)      # call it: room is now 12\nprint(room)", note: "print SHOWS a value. return HANDS IT BACK so other code can use it."},
 teach: [
  {h: "Make your own tool", t: "A function is a mini-program with a name. You write it once and use it as often as you like.\n\nLike a kitchen blender: you put things in (the inputs), it does its job, and gives you something back."},
  {h: "def and return", t: "`def` starts a function. Then the name, the inputs in brackets, and a colon.\n\n`return` hands an answer back to whoever used the function. The function stops right there.", code: "def double(n):\n    return n * 2\n\nprint(double(5))\nprint(double(21))"},
  {h: "print vs return", t: "This confuses almost everyone at first.\n\n`print` shows something on the screen, for a human to read.\n`return` hands a value back to the code, so it can be stored or used in more maths.\n\nA function without return hands back `None` (Python's word for \"nothing\")."},
 ],
 try: {q: "Just try it (no grading). Call the function with other numbers, or write a second one.", start: "def area(w, h):\n    return w * h\n\nprint(area(3, 4))\nprint(area(10, 2) + area(1, 1))\n"},
},
strings: {
 card: {title: "Text tools", code: 's = "  Hello World  "\ns.strip()          # "Hello World"   trims spaces at the ends\ns.lower()          # "  hello world  "\ns.split()          # ["Hello", "World"]  words\n"-".join(["a","b"])  # "a-b"\ns.replace("o", "0")\nword[0], word[-1], word[1:3], word[::-1]   # first, last, slice, reversed', note: "Text tools return a NEW string; they don't change the old one."},
 teach: [
  {h: "Text is messy", t: "Text from people is messy: extra spaces, random capitals, commas everywhere. Python has tools to clean it up.\n\n`.strip()` trims spaces off the ends. `.lower()` makes it all lowercase. Chain them: `answer.strip().lower()`."},
  {h: "Splitting and joining", t: "`.split()` breaks text into a list of words. `\" \".join(words)` glues a list back together, with whatever's in the quotes between them.", code: 'words = "the quick brown fox".split()\nprint(words)\nprint("-".join(words))'},
  {h: "Slicing", t: "Text works like a list of letters. `word[0]` is the first letter, `word[-1]` the last, and `word[0:3]` the first three.\n\n`word[::-1]` is the whole word backwards. That's a neat trick for checking palindromes."},
 ],
 try: {q: "Just try it (no grading). Put in your own messy text and Run.", start: 'raw = "   PIZZA, pasta,Salad  "\nclean = raw.strip().lower()\nprint(clean.split(","))\nprint("racecar"[::-1])\n'},
},
comps: {
 card: {title: "List comprehensions", code: "nums = [1, 2, 3, 4]\n[x * 2 for x in nums]              # [2, 4, 6, 8]   change each\n[x for x in nums if x > 2]         # [3, 4]         keep some\n[x * 2 for x in nums if x > 2]     # [6, 8]         both", note: "Read it as: (what to put in) for (each item) in (list) if (condition)."},
 teach: [
  {h: "A loop in one line", t: "You've built lists with a loop and append many times. A list comprehension does the same in one line.\n\nThese two make the same list:", code: "squares = []\nfor x in range(5):\n    squares.append(x * x)\n\nsquares = [x * x for x in range(5)]\nprint(squares)"},
  {h: "How to read it", t: "`[x * x for x in range(5)]` reads as: \"x times x, for each x in range(5)\".\n\nAdd `if` at the end to keep only some: `[n for n in nums if n > 0]` means \"each n, but only if it's above 0\".\n\nDon't cram too much into one. If it's hard to read, a normal loop is better."},
 ],
 try: {q: "Just try it (no grading). Change the condition or what goes in, then Run.", start: 'names = ["al", "bella", "chris"]\nprint([n.upper() for n in names])\nprint([n for n in names if len(n) > 3])\n'},
},
errors: {
 card: {title: "Errors and try/except", code: 'try:\n    n = int(text)          # risky: text might not be a number\nexcept ValueError:         # if THAT error happens...\n    n = 0                  # ...do this instead of crashing', note: "Read an error from the LAST line: it names the error and why. ValueError: bad value. KeyError: missing key. IndexError: no item there. ZeroDivisionError: dividing by 0."},
 teach: [
  {h: "Errors are messages, not failures", t: "When Python crashes, it prints a message called a traceback. It looks scary, but it's trying to help.\n\nRead it from the BOTTOM. The last line says what went wrong, like `ValueError: invalid literal for int()`. The lines above it say where."},
  {h: "try and except", t: "Some code can fail for reasons outside your control, like a user typing letters where you wanted a number.\n\n`try:` runs the risky code. If a particular error happens, the `except` block runs instead of crashing.", code: 'for text in ["12", "abc"]:\n    try:\n        print(int(text) * 2)\n    except ValueError:\n        print(text, "is not a number")'},
 ],
 try: {q: "Just try it (no grading). Add your own bad inputs to the list and Run.", start: 'for text in ["12", "abc", "7"]:\n    try:\n        print("Got", int(text))\n    except ValueError:\n        print("Skipped", text)\n'},
},
nested: {
 card: {title: "Nested data", code: 'data = {"games": [{"home": {"name": "Heat", "score": 101}}]}\ndata["games"]                       # the list of games\ndata["games"][0]                    # the first game (a dict)\ndata["games"][0]["home"]["name"]    # "Heat"\ngame.get("odds")                    # None if there is no "odds" key', note: "Go one level at a time: [\"key\"] for a dict, [number] for a list."},
 teach: [
  {h: "Boxes inside boxes", t: "Real data from websites (it's called JSON) is dictionaries and lists inside each other.\n\nTo get something deep inside, go one step at a time, like opening boxes inside boxes."},
  {h: "One step at a time", t: "`data[\"games\"]` is a list. `[0]` is its first game. `[\"home\"]` is that game's home team. `[\"name\"]` is the team's name.\n\nWhen you're unsure, print each level to see what's there before going deeper.", code: 'data = {"games": [{"home": {"name": "Heat", "score": 101}}]}\nprint(data["games"])\nprint(data["games"][0]["home"]["name"])'},
  {h: "Missing pieces", t: "Real data often has missing keys: a game with no odds yet, for example. Use `.get(\"odds\")`, which gives None instead of crashing.\n\nYou can also chain them safely: `user.get(\"address\", {}).get(\"city\")`."},
 ],
 try: {q: "Just try it (no grading). Print different parts of the data.", start: 'data = {"games": [{"home": {"name": "Heat", "score": 101}, "away": {"name": "Bulls", "score": 98}}]}\ngame = data["games"][0]\nprint(game["home"]["name"], game["home"]["score"])\nprint(game.get("odds"))\n'},
},
sorting: {
 card: {title: "Sorting", code: 'sorted([3, 1, 2])                       # [1, 2, 3]\nsorted([3, 1, 2], reverse=True)         # [3, 2, 1]\nsorted(words, key=len)                  # shortest first\nsorted(players, key=lambda p: p["pts"]) # by a field\nnums.sort()   # sorts the list itself and returns None!', note: "key= says WHAT to sort by. lambda p: p[\"pts\"] is a tiny one-line function."},
 teach: [
  {h: "sorted() gives a sorted copy", t: "`sorted(list)` gives a new list, smallest to largest. Add `reverse=True` for largest first.\n\nCareful: `list.sort()` sorts the list itself and gives back None. Writing `x = nums.sort()` is a classic bug."},
  {h: "Sorting by something else", t: "`key=` tells sorted WHAT to compare. `key=len` sorts words by length.\n\nFor dictionaries, use a lambda, a tiny one-line function: `key=lambda p: p[\"pts\"]` means \"for each player p, sort by their pts\".", code: 'players = [{"name": "Ana", "pts": 21}, {"name": "Ben", "pts": 34}]\nfor p in sorted(players, key=lambda p: p["pts"], reverse=True):\n    print(p["name"], p["pts"])'},
 ],
 try: {q: "Just try it (no grading). Sort the words different ways.", start: 'words = ["banana", "fig", "apple"]\nprint(sorted(words))\nprint(sorted(words, key=len))\nprint(sorted(words, reverse=True))\n'},
},
debug: {
 card: {title: "How developers debug", code: "1. Read the LAST line of the error\n2. Find the line it points to\n3. Guess what's wrong\n4. print() the values to test your guess\n5. Change ONE thing and run again", note: "Even experts debug like this. Guess, check, fix one thing."},
 teach: [
  {h: "Debugging is a skill", t: "Developers spend a huge part of their day fixing bugs. It's not a sign you're bad at coding. It IS coding.\n\nThe secret isn't being smart. It's being systematic."},
  {h: "Print to see inside", t: "Your best tool is `print`. Put it in the middle of your code to see what values really are, instead of what you think they are.\n\nMost bugs are a variable holding something different from what you expected.", code: 'orders = [{"amt": 20, "paid": True}, {"amt": 15, "paid": False}]\ntotal = 0\nfor o in orders:\n    print("checking", o)\n    if o["paid"]:\n        total += o["amt"]\nprint(total)'},
  {h: "Change one thing at a time", t: "If you change five things and it works, you don't know which one fixed it. If it breaks, you don't know which one broke it.\n\nOne change, run, look. Repeat."},
 ],
 try: {q: "Just try it (no grading). Add your own print lines to watch what happens inside the loop.", start: "nums = [4, 8, 15]\ntotal = 0\nfor n in nums:\n    total += n\n    print(\"after\", n, \"the total is\", total)\n"},
},
};
