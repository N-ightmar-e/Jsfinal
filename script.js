let model;
const imageUpload = document.getElementById('imageUpload');
const imagePreview = document.getElementById('imagePreview');
const result = document.getElementById('result');
const autoAdjust = document.getElementById('autoAdjust');

// 모델 로드 함수에 에러 핸들링 추가
async function loadModel() {
  try {
    // 절대 경로로 변경하고 에러 로깅 추가
    model = await tf.loadLayersModel('/my_model/model.json');
    console.log('모델이 성공적으로 로드되었습니다.');
  } catch (error) {
    console.error('모델 로딩 중 에러 발생:', error);
    result.textContent = '모델 로딩에 실패했습니다. 콘솔을 확인해주세요.';
  }
}

// 페이지 로드 시 모델 로딩
document.addEventListener('DOMContentLoaded', loadModel);

// 이미지 처리 함수에 에러 핸들링 추가
imageUpload.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.innerHTML = `<img src="${e.target.result}" id="uploadedImage" alt="업로드된 이미지">`;
    };
    reader.readAsDataURL(file);

    const image = document.createElement('img');
    image.src = URL.createObjectURL(file);
    image.onload = async () => {
      try {
        // 텐서 변환 전에 모델 체크
        if (!model) {
          throw new Error('모델이 아직 로드되지 않았습니다.');
        }

        const tensor = tf.tidy(() => {
          const img = tf.browser.fromPixels(image)
            .resizeNearestNeighbor([224, 224])
            .toFloat()
            .expandDims();
          return img;
        });

        const predictions = await model.predict(tensor).data();
        tensor.dispose(); // 메모리 해제
        displayResult(predictions);
      } catch (error) {
        console.error('이미지 처리 중 에러 발생:', error);
        result.textContent = '이미지 처리 중 에러가 발생했습니다.';
      }
    };
  } catch (error) {
    console.error('파일 처리 중 에러 발생:', error);
    result.textContent = '파일 처리 중 에러가 발생했습니다.';
  }
});

function displayResult(predictions) {
  const labels = ["밝게", "어둡게", "대비 강하게", "대비 부드럽게", "따뜻하게", "차갑게"];
  const highestPrediction = predictions.indexOf(Math.max(...predictions));
  result.textContent = `추천 보정: ${labels[highestPrediction]}`;
}

autoAdjust.addEventListener('click', () => {
  const uploadedImage = document.getElementById('uploadedImage');
  if (!uploadedImage || !result.textContent) {
    alert('이미지를 먼저 업로드하고 분석해주세요.');
    return;
  }

  const recommendation = result.textContent.split(": ")[1];
  applyAdjustment(uploadedImage, recommendation);
});

function applyAdjustment(image, recommendation) {
  switch (recommendation) {
    case '밝게':
      image.style.filter = 'brightness(1.3)';
      break;
    case '어둡게':
      image.style.filter = 'brightness(0.7)';
      break;
    case '대비 강하게':
      image.style.filter = 'contrast(1.5)';
      break;
    case '대비 부드럽게':
      image.style.filter = 'contrast(0.8)';
      break;
    case '따뜻하게':
      image.style.filter = 'sepia(0.3)';
      break;
    case '차갑게':
      image.style.filter = 'hue-rotate(200deg)';
      break;
    default:
      alert('알 수 없는 추천입니다.');
  }
}
