const cam = document.getElementById("cam");

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

// 17 min