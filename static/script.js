let qrCount = 1;

function showMessage(text, type = 'info') {
    const msg = document.getElementById('message');
    msg.className = `alert alert-${type}`;
    msg.textContent = text;
    msg.style.display = 'block';
    setTimeout(() => msg.style.display = 'none', 4000);
}

async function getAccurateLocation(timeout = 10000) {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            showMessage('GPS not supported.', 'warning');
            return reject('GPS not supported');
        }

        const timer = setTimeout(() => {
            showMessage('GPS timeout. Try again outdoors.', 'danger');
            reject('Timeout');
        }, timeout);

        navigator.geolocation.getCurrentPosition(
            async pos => {
                clearTimeout(timer);
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
                        headers: {
                            'User-Agent': 'QR-WalkTracker-App/1.0'
                        }
                    });
                    const data = await response.json();
                    resolve({ coords: `${lat}, ${lon}`, address: data.display_name });
                } catch (e) {
                    resolve({ coords: `${lat}, ${lon}`, address: `${lat}, ${lon}` });
                }
            },
            err => {
                clearTimeout(timer);
                console.error('GPS error:', err);
                showMessage('Unable to get GPS location.', 'danger');
                reject(err);
            },
            { enableHighAccuracy: true, timeout: timeout, maximumAge: 0 }
        );
    });
}

async function startWalk() {
    const res = await fetch('/start', { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.status === 'started') {
        showMessage(`Walk started at: ${data.start_time}`, 'success');
    } else {
        showMessage(data.message || 'Failed to start walk.', 'danger');
    }
}

async function scanQR() {
    try {
        const html5QrCode = new Html5Qrcode("reader");
        document.getElementById("reader").style.display = "block";

        await html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: 250 },
            async (decodedText) => {
                await html5QrCode.stop();
                document.getElementById("reader").style.display = "none";

                const { coords, address } = await getAccurateLocation();
                const scan_time = new Date().toLocaleString();

                const response = await fetch('/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        scan_time,
                        gps: coords,
                        address,
                        qr_text: decodedText
                    })
                });

                const result = await response.json();
                if (response.ok && result.status === 'success') {
                    showMessage(`QR ${qrCount++} scanned.`, 'success');
                } else {
                    showMessage('Failed to save scan.', 'danger');
                }
            }
        );
    } catch (err) {
        console.error('QR scan failed:', err);
        showMessage('Error during QR scan.', 'danger');
    }
}

async function submitWalk() {
    const res = await fetch('/submit', { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.status === 'submitted') {
        showMessage('Walk submitted and emailed.', 'success');
        qrCount = 1;
    } else {
        showMessage('Submission failed.', 'danger');
    }
}
