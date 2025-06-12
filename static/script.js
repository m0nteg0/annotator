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
const handleSize = 6;      // visible corner square
const handleHitSize = 12;  // larger area for easier grabbing

function pointInBox(x, y, b){
  const x1 = Math.min(b.x, b.x + b.w);
  const y1 = Math.min(b.y, b.y + b.h);
  const x2 = Math.max(b.x, b.x + b.w);
  const y2 = Math.max(b.y, b.y + b.h);
  return x >= x1 && y >= y1 && x <= x2 && y <= y2;
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
    if(Math.abs(x - hx) <= handleHitSize/2 && Math.abs(y - hy) <= handleHitSize/2)
      return h;
  }
  return null;
}

function cursorForHandle(h){
  switch(h){
    case 'nw':
    case 'se':
      return 'nwse-resize';
    case 'ne':
    case 'sw':
      return 'nesw-resize';
    default:
      return 'default';
  }
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
        canvas.style.cursor = cursorForHandle(handle);
      }else{
        action = 'move';
        dragOffsetX = startX - boxes[selected].x;
        dragOffsetY = startY - boxes[selected].y;
        canvas.style.cursor = 'move';
      }
      isDragging = true;
    }else{
      action = 'draw';
      isDragging = true;
      canvas.style.cursor = 'crosshair';
      boxes.push({x:startX, y:startY, w:0, h:0});
      selected = boxes.length - 1;
    }
    draw();
  };

  canvas.onmousemove = (e) => {
    if(isDragging){
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
    }else{
      let cur = 'crosshair';
      for(let i = boxes.length - 1; i >= 0; i--){
        const handle = handleAt(e.offsetX, e.offsetY, boxes[i]);
        if(handle){
          cur = cursorForHandle(handle);
          break;
        }
        if(pointInBox(e.offsetX, e.offsetY, boxes[i])){
          cur = 'move';
          break;
        }
      }
      canvas.style.cursor = cur;
    }
  };

  canvas.onmouseup = () => {
    if((action === 'draw' || action === 'resize') && boxes[selected]){
      const b = boxes[selected];
      if(b.w < 0){ b.x += b.w; b.w = Math.abs(b.w); }
      if(b.h < 0){ b.y += b.h; b.h = Math.abs(b.h); }
    }
    isDragging = false;
    action = null;
    startBox = null;
    canvas.style.cursor = 'crosshair';
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
