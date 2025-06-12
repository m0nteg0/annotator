let images = [];
let currentIndex = 0;
let boxes = [];
let canvas, ctx, img;
let startX, startY;
let isDragging = false;
let action = null; // 'draw', 'move', 'resize'
let selected = -1;
let dragOffsetX = 0, dragOffsetY = 0;
let startBox = null;
let resizeHandle = null;
const handleSize = 6;

function pointInBox(x, y, b){
  return x >= b.x && y >= b.y && x <= b.x + b.w && y <= b.y + b.h;
}

function handleAt(x, y, b){
  const handles = {
    nw: [b.x, b.y],
    ne: [b.x + b.w, b.y],
    sw: [b.x, b.y + b.h],
    se: [b.x + b.w, b.y + b.h]
  };
  for(let h in handles){
    const [hx, hy] = handles[h];
    if(Math.abs(x - hx) <= handleSize && Math.abs(y - hy) <= handleSize)
      return h;
  }
  return null;
}

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
  boxes.forEach((b, i) => {
    ctx.strokeStyle = i === selected ? 'blue' : 'red';
    ctx.strokeRect(b.x, b.y, b.w, b.h);
    if(i === selected){
      ctx.fillStyle = 'blue';
      const corners = [
        [b.x, b.y],
        [b.x + b.w, b.y],
        [b.x, b.y + b.h],
        [b.x + b.w, b.y + b.h]
      ];
      corners.forEach(c => {
        ctx.fillRect(c[0] - handleSize/2, c[1] - handleSize/2, handleSize, handleSize);
      });
    }
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

    // check existing boxes from topmost
    selected = -1;
    for(let i = boxes.length - 1; i >= 0; i--){
      if(pointInBox(startX, startY, boxes[i])){
        selected = i;
        break;
      }
    }

    if(selected !== -1){
      const handle = handleAt(startX, startY, boxes[selected]);
      startBox = {...boxes[selected]};
      if(handle){
        action = 'resize';
        dragOffsetX = startX;
        dragOffsetY = startY;
        resizeHandle = handle;
      }else{
        action = 'move';
        dragOffsetX = startX - boxes[selected].x;
        dragOffsetY = startY - boxes[selected].y;
      }
      isDragging = true;
    }else{
      action = 'draw';
      isDragging = true;
      boxes.push({x:startX, y:startY, w:0, h:0});
      selected = boxes.length - 1;
    }
    draw();
  };

  canvas.onmousemove = (e) => {
    if(!isDragging) return;
    const box = boxes[selected];
    if(action === 'draw'){
      box.w = e.offsetX - startX;
      box.h = e.offsetY - startY;
    }else if(action === 'move'){
      box.x = e.offsetX - dragOffsetX;
      box.y = e.offsetY - dragOffsetY;
    }else if(action === 'resize'){
      switch(resizeHandle){
        case 'nw':
          box.x = e.offsetX;
          box.y = e.offsetY;
          box.w = startBox.w + (startBox.x - e.offsetX);
          box.h = startBox.h + (startBox.y - e.offsetY);
          break;
        case 'ne':
          box.y = e.offsetY;
          box.w = e.offsetX - startBox.x;
          box.h = startBox.h + (startBox.y - e.offsetY);
          break;
        case 'sw':
          box.x = e.offsetX;
          box.w = startBox.w + (startBox.x - e.offsetX);
          box.h = e.offsetY - startBox.y;
          break;
        case 'se':
          box.w = e.offsetX - startBox.x;
          box.h = e.offsetY - startBox.y;
          break;
      }
    }
    draw();
  };

  canvas.onmouseup = () => {
    isDragging = false;
    action = null;
    startBox = null;
  };

  window.addEventListener('keydown', (e) => {
    if((e.key === 'Delete' || e.key === 'Backspace') && selected !== -1){
      boxes.splice(selected,1);
      selected = -1;
      draw();
    }
  });

  fetchImages();
};
