# Annotator

Simple web application for drawing and editing bounding boxes on images.

## Setup

```
pip install -r requirements.txt
```

Place images you want to annotate in `static/images` and then run:

```
python app.py
```

Open `http://localhost:5000/` in your browser to start annotating. Use the
mouse to create, select and resize boxes. Hover near a box corner until the
cursor changes to resize it. Press the <kbd>Delete</kbd> key to remove a
selected box. Bounding boxes are saved as JSON in the `annotations` folder.
