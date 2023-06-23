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

const loadLabels = () => {
    const labels = ['Patrick Augusto'];

    return Promise.all(labels.map(async label => {
        const descriptions = []
        
        // quantidade de imagens da pasta, colocar mais depois
        for(let i = 1; i <= 2; i++) {
            const img = await faceapi.fetchImage(`/assets/lib/face-api/labels/${label}/${i}.jpg`);

            const detections = await faceapi
                .detectSingleFace(img)
                .withFaceLandmarks()
                .withFaceDescriptor()

            descriptions.push(detections.descriptor)
        }

        return new faceapi.LabeledFaceDescriptors(label, descriptions)
    }))
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

    const labels = await loadLabels();

    faceapi.matchDimensions(canvas, canvasSize)
    document.body.appendChild(canvas);

    setInterval( async () => {
        const detections = await faceapi
            .detectAllFaces(
                cam, 
                new faceapi.TinyFaceDetectorOptions()
            )
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender()
            .withFaceDescriptors()

        const resizeDetections = faceapi.resizeResults(detections, canvasSize);
        const faceMatcher = new faceapi.FaceMatcher(labels, 0.6)

        const results = resizeDetections.map(d => {
            faceMatcher.findBestMatch(d.descriptor)
        })
        
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        faceapi.draw.drawDetections(canvas, resizeDetections)
        faceapi.draw.drawFaceLandmarks(canvas, resizeDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizeDetections);

        resizeDetections.forEach(detection => {
            const { age, gender, genderProbability} = detection
            new faceapi.draw.DrawTextField([
                `${parseInt(age,10)} years`,
                `${gender} (${parseInt(genderProbability * 100, 10)})`
            ], detection.detection.box.topRight).draw(canvas)
        });

        results.forEach((result, index) => {
            const box = resizeDetections[index].detection.box
            const { label, distance } = result

            new faceapi.draw.DrawTextField([
                `${label} (${distance})`
            ], box.bottomRight).draw(canvas)
        });

    }, 100)
});
