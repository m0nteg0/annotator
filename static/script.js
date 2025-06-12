let images = [];
let currentIndex = 0;
let boxes = [];
let canvas, ctx, img;
let startX, startY, isDrawing = false;

function fetchImages(){
  fetch('/images').then(r => r.json()).then(list => {
    images = list;
    if(images.length > 0){
      loadImage(0);
    }
  });
}

function loadImage(index){
  currentIndex = index;
  boxes = [];
  img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    draw();
    fetch('/annotations/' + images[currentIndex])
      .then(r => r.json())
      .then(data => { boxes = data; draw(); });
  };
  img.src = 'static/images/' + images[currentIndex];
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(img) ctx.drawImage(img,0,0);
  ctx.strokeStyle = 'red';
  boxes.forEach(b => {
    ctx.strokeRect(b.x, b.y, b.w, b.h);
  });
}

function prevImage(){
  if(currentIndex > 0){
    loadImage(currentIndex - 1);
  }
}

function nextImage(){
  if(currentIndex < images.length -1){
    loadImage(currentIndex + 1);
  }
}

function save(){
  fetch('/annotations/' + images[currentIndex], {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(boxes)
  });
}

window.onload = () => {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  canvas.onmousedown = (e) => {
    startX = e.offsetX;
    startY = e.offsetY;
    isDrawing = true;
  };

  canvas.onmousemove = (e) => {
    if(!isDrawing) return;
    draw();
    ctx.strokeStyle = 'lime';
    ctx.strokeRect(startX, startY, e.offsetX - startX, e.offsetY - startY);
  };

  canvas.onmouseup = (e) => {
    if(!isDrawing) return;
    isDrawing = false;
    boxes.push({x:startX, y:startY, w:e.offsetX - startX, h:e.offsetY - startY});
    draw();
  };

  fetchImages();
};
