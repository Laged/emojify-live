#!/usr/bin/python3
import emoji
import json
from http.server import BaseHTTPRequestHandler
from urllib import parse


known_operations = {
        "⌭" : {"name" : "rotate", "operand" : "int"},
        "⦞" : {"name" : "speed", "operand" : "int"},
        "⩐" : {"name" : "opacity", "operand" : "int"}
}

# 0: Phase number, 1: duration, 2: opacity from, 3: opacity to, 4: rotation from, 5: rotation to
csstemplate = "@keyframes phase{0} {{from {{opacity: {2}; transform: rotate({4}deg);}} to {{opacity: {3}; transform:rotate({5}deg);}}}} .phase{0} {{animation-name: phase{0}; animation-duration: {1}s; opacity: {3}; transform:rotate({5}deg);}} "


def clean(code: str) -> str:
    code.replace(" ", "")
    parts = code.split("⩼") 
    return parts


def tokenize(parts: list) -> list:
    #print(parts)
    tokenlist = []
    for part in parts:
        operations = {}
        
        newsection = emoji.is_emoji(part[0])  # If the part starts with an emoji, it defines a new section
        if newsection: operations["emoji"] = part[0]
        
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

            operations[known_operations[operation]["name"]] = operand

        tokenlist.append(operations)
    
    #print(tokenlist)
    return tokenlist


def cssify(tokens: list) -> str:
    opacity = 1
    rotation = 0
    
    phases = []   # List of phases for JS logic
    css = """"""  # Multiline CSS string

    for i, part in enumerate(tokens):
        phase = {"phase":f"phase{i}"}
        
        duration = int(part["speed"])/1000 if "speed" in part else 1
        newrotation = int(part["rotate"]) if "rotate" in part else rotation
        newopacity = int(part["opacity"])/100 if "opacity" in part else opacity
        
        if "emoji" in part:
            phase["emoji"] = part["emoji"]
            duration = 0
            newrotation = 0
            rotation = 0
            newopacity = 1
            opacity = 1
        
        phase["duration"] = duration*1000        
        css += csstemplate.format(i, duration, opacity, newopacity, rotation, newrotation)
        
        rotation = newrotation
        opacity = newopacity

        phases.append(phase)

    return json.dumps({"phases":phases, "css":css})


def process(code: str) -> str:
    code = clean(code)
    tokens = tokenize(code)
    payload = cssify(tokens)
    return payload


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parameters = dict(parse.parse_qsl(parse.urlsplit(self.path).query))
        if not "code" in parameters:
            self.send_response(400)
            return
        
        charvals = parse.unquote(parameters["code"]).split(",")
        code = "".join([chr(int(charval)) for charval in charvals])
        payload = process(code)

        self.send_response(200)
        self.send_header('Content-Type','application/json')
        self.end_headers()
        return self.wfile.write(payload.encode())



def main():
    code = input("Values to parse: ")
    payload = process(code)
    print(payload)


if __name__ == "__main__":
    main()


