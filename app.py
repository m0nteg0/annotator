from flask import Flask, jsonify, request
import os, json

app = Flask(__name__, static_folder='static')

IMAGES_DIR = os.path.join(app.static_folder, 'images')
ANNOTATIONS_DIR = 'annotations'

os.makedirs(ANNOTATIONS_DIR, exist_ok=True)

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/images')
def images():
    files = []
    for f in os.listdir(IMAGES_DIR):
        if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
            files.append(f)
    files.sort()
    return jsonify(files)

@app.route('/annotations/<image>', methods=['GET', 'POST'])
def annotations(image):
    path = os.path.join(ANNOTATIONS_DIR, f'{image}.json')
    if request.method == 'POST':
        data = request.get_json(force=True)
        with open(path, 'w') as f:
            json.dump(data, f)
        return jsonify({'status':'ok'})
    else:
        if os.path.exists(path):
            with open(path) as f:
                return jsonify(json.load(f))
        return jsonify([])

if __name__ == '__main__':
    app.run(debug=True)
