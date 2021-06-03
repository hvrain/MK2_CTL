import sys
import json

if __name__ == '__main__': 
    result = json.loads(sys.argv[1])
    print(json.dumps(result))