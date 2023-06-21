const cam = document.getElementById("cam");

const startVideo = () => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
    if (Array.isArray(devices)) {
        devices.forEach(device => {
            if (device.kind === 'videoinput') {
                navigator.getUserMedia(
                    { video: {
                        deviceId: device.deviceId
                    }},
                    stream => cam.srcObject = stream,
                    error => console.error(error)
                    )
                }
            })
        }
    })
}

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./assets/lib/face-api/models'), // Detecta rostos no vídeo
    faceapi.nets.faceLandmark68Net.loadFromUri('./assets/lib/face-api/models'), // Desenha os traços do rosto
    faceapi.nets.faceRecognitionNet.loadFromUri('./assets/lib/face-api/models'), // Reconhecimento dentro do rosto (quem sou eu) 
    faceapi.nets.faceExpressionNet.loadFromUri('./assets/lib/face-api/models'), // Detecta expressões
    faceapi.nets.ageGenderNet.loadFromUri('./assets/lib/face-api/models'), // Detecta idade e gênero
    faceapi.nets.ssdMobilenetv1.loadFromUri('./assets/lib/face-api/models') // Usada internamente pra detectar o rosto
]).then(startVideo);

cam.addEventListener('play', async () => {
    const canvas = faceapi.createCanvasFromMedia(cam)
    
    const canvasSize = {
        width: cam.width,
        height: cam.height
    }

    faceapi.matchDimensions(canvas, canvasSize)
    document.body.appendChild(canvas);

    setInterval( async () => {
        const detections = await faceapi
            .detectAllFaces(
                cam, 
                new faceapi.TinyFaceDetectorOptions()
            )
            .withFaceLandmarks()

        const resizeDetections = faceapi.resizeResults(detections, canvasSize);

        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        faceapi.draw.drawDetections(canvas, resizeDetections)
        faceapi.draw.drawFaceLandmarks(canvas, resizeDetections);

    }, 100)
});

// 33 min