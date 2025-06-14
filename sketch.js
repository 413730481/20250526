let video;
let facemesh;
let predictions = [];

let handpose;
let handPredictions = [];
let gestureLabel = "";

function setup() {
  createCanvas(640, 480).position(
    (windowWidth - 640) / 2,
    (windowHeight - 480) / 2
  );
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  facemesh = ml5.facemesh(video, modelReady);
  facemesh.on('predict', results => {
    predictions = results;
  });

  handpose = ml5.handpose(video, handModelReady);
  handpose.on('predict', results => {
    handPredictions = results;
    if (handPredictions.length > 0) {
      gestureLabel = getGesture(handPredictions[0]);
    } else {
      gestureLabel = "";
    }
  });
}

function modelReady() {
  // 臉部模型載入完成
}

function handModelReady() {
  // 手部模型載入完成
}

function draw() {
  // 鏡像畫面
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0, width, height);

  // 臉部辨識
  if (predictions.length > 0) {
    const keypoints = predictions[0].scaledMesh;

    noFill();
    stroke(255, 0, 0);
    strokeWeight(4);

    if (gestureLabel === "剪刀") {
      // 鼻子 (168)
      const [x, y] = keypoints[168];
      ellipse(width - x, y, 60, 60); // x座標鏡像
    } else if (gestureLabel === "石頭") {
      // 兩眼 (左眼 33, 右眼 263)
      const [lx, ly] = keypoints[33];
      const [rx, ry] = keypoints[263];
      ellipse(width - lx, ly, 40, 40);
      ellipse(width - rx, ry, 40, 40);
    } else if (gestureLabel === "布") {
      // 臉頰 (左臉頰 234, 右臉頰 454)
      const [lx, ly] = keypoints[234];
      const [rx, ry] = keypoints[454];
      ellipse(width - lx, ly, 40, 40);
      ellipse(width - rx, ry, 40, 40);
    }
  }

  // 手部辨識
  if (handPredictions.length > 0) {
    const landmarks = handPredictions[0].landmarks;
    drawHandMirror(landmarks);
    fill(0, 200, 0);
    noStroke();
    textSize(32);
    textAlign(LEFT, TOP);
    text("手勢：" + gestureLabel, 10, 10);
  }
  pop();
}

// 畫出手部關鍵點（鏡像）
function drawHandMirror(landmarks) {
  for (let i = 0; i < landmarks.length; i++) {
    const [x, y] = landmarks[i];
    fill(0, 0, 255);
    noStroke();
    ellipse(width - x, y, 10, 10);
  }
}

// 判斷剪刀石頭布
function getGesture(prediction) {
  const landmarks = prediction.landmarks;
  // 依據手指尖端與掌心距離判斷
  // 0: wrist, 4: thumb tip, 8: index tip, 12: middle tip, 16: ring tip, 20: pinky tip
  const tips = [4, 8, 12, 16, 20];
  const palm = landmarks[0];
  let extended = 0;
  for (let i = 1; i < tips.length; i++) {
    const tip = landmarks[tips[i]];
    // 將 60 改為 45，讓判斷更靈敏
    if (dist(tip[0], tip[1], palm[0], palm[1]) > 45) {
      extended++;
    }
  }
  // 布: 4指都伸直，剪刀: 2指伸直，石頭: 都沒伸直
  if (extended === 4) return "布";
  if (extended === 2) return "剪刀";
  if (extended === 0) return "石頭";
  return "";
}
