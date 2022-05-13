#!/usr/bin/python3
import emoji

known_operations = {
        "⌭" : {"name" : "rotate", "operand" : "int"},
        "⨳" : {"name" : "compose", "operand" : "emoji"},
}


def clean(code: str) -> str:
    code.replace(" ", "")
    parts = code.split("⩼") 
    return parts


def tokenize(parts: list) -> list:
    print(parts)
    tokenlist = []
    for part in parts:
        operations = []
        
        newsection = emoji.is_emoji(part[0])  # If the part starts with an emoji, it defines a new section
        operations.append(("base", part[0] if newsection else "PREVIOUS"))
        
        i = int(newsection)   # Iterate through part, ignoring the first emoji
        while i < len(part):  # Not pythonic, but seems to be the most efficient method 
            operation = part[i]
            if not operation in known_operations:
                raise SyntaxError("Invalid operation " + operation)

            if known_operations[operation]["operand"] == "emoji":
                operand = part[i+1]
                i += 2
            elif known_operations[operation]["operand"] == "int":
                    j = i+1
                    while j < len(part) and part[j] in "-1234567890":
                        j += 1
                    operand = int(part[i+1:j])
                    i = j
            else:
                raise NotImplementedError

            operations.append((operation, operand))

        tokenlist.append(operations)
    
    print(tokenlist)
    return tokenlist


def main():
    code = input("Values to parse: ")
    code = clean(code)
    tokens = tokenize(code)


if __name__ == "__main__":
    main()
