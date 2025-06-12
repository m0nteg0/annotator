# Annotator

Simple web application for drawing bounding boxes on images.

## Setup

```
pip install -r requirements.txt
```

Place images you want to annotate in `static/images` and then run:

```
python app.py
```

Open `http://localhost:5000/` in your browser to start annotating. Bounding
boxes are saved as JSON in the `annotations` folder.
