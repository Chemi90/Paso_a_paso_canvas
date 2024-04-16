const canvas = document.getElementById('appCanvas');
const ctx = canvas.getContext('2d');
const detectionCanvas = document.createElement('canvas');
const detectionCtx = detectionCanvas.getContext('2d');

const steps = [
    {
        mainImage: 'imagen1.png',
        overlayImage: 'imagen_superposicion1.png',
        detectionImage: 'imagen_superposicion1_no_transparente.png',
        description: "Instrucciones para la imagen 1"
    },
    {
        mainImage: 'imagen2.png',
        overlayImage: 'imagen_superposicion2.png',
        detectionImage: 'imagen_superposicion2_no_transparente.png',
        description: "Instrucciones para la imagen 2"
    },
    {
        mainImage: 'imagen3.png',
        overlayImage: 'imagen_superposicion3.png',
        detectionImage: 'imagen_superposicion3_no_transparente.png',
        description: "Instrucciones para la imagen 3"
    },
    {
        mainImage: 'imagen4.png',
        overlayImage: 'imagen_superposicion4.png',
        detectionImage: 'imagen_superposicion4_no_transparente.png',
        description: "Instrucciones para la imagen 4"
    },
    {
        mainImage: 'imagen5.png',
        overlayImage: 'imagen_superposicion5.png',
        detectionImage: 'imagen_superposicion5_no_transparente.png',
        description: "Instrucciones para la imagen 5"
    },
    {
        mainImage: 'imagen6.png',
        overlayImage: 'imagen_superposicion6.png',
        detectionImage: 'imagen_superposicion6_no_transparente.png',
        description: "Instrucciones para la imagen 6"
    }
];

let currentStep = 0;
let failCount = 0; // Contador de intentos fallidos
let touchHandled = false; // Bandera para controlar eventos de toque

function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    canvas.width = displayWidth * ratio;
    canvas.height = displayHeight * ratio;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    detectionCanvas.width = canvas.width;
    detectionCanvas.height = canvas.height;

    drawStep(currentStep); // Redibujar el contenido del canvas
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

async function drawStep(stepIndex) {
    const step = steps[stepIndex];
    document.getElementById('description').textContent = step.description;
    const mainImage = await loadImage(step.mainImage);
    const overlayImage = await loadImage(step.overlayImage);
    const detectionImage = await loadImage(step.detectionImage);

    const scaleFactor = Math.min(canvas.width / mainImage.width, canvas.height / mainImage.height);
    const scaledWidth = mainImage.width * scaleFactor;
    const scaledHeight = mainImage.height * scaleFactor;

    const centerX = (canvas.width - scaledWidth) / 2;
    const centerY = (canvas.height - scaledHeight) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(mainImage, centerX, centerY, scaledWidth, scaledHeight);
    
    ctx.globalAlpha = 0; // La overlayImage es completamente transparente inicialmente
    ctx.drawImage(overlayImage, centerX, centerY, scaledWidth, scaledHeight);
    ctx.globalAlpha = 1; // Restablecer la opacidad para otras operaciones

    detectionCtx.clearRect(0, 0, detectionCanvas.width, detectionCanvas.height);
    detectionCtx.drawImage(detectionImage, centerX, centerY, scaledWidth, scaledHeight);
}

function getCanvasCoords(event) {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    let x, y;
    if (event.type.includes('touch')) {
        x = (event.touches[0].clientX - rect.left) * ratio;
        y = (event.touches[0].clientY - rect.top) * ratio;
    } else {
        x = (event.clientX - rect.left) * ratio;
        y = (event.clientY - rect.top) * ratio;
    }
    return { x, y };
}

function handleInteraction(event) {
    if (event.type === 'click' && touchHandled) {
        touchHandled = false; // Reset the flag after the click is handled
        return;
    }

    const { x, y } = getCanvasCoords(event);
    const pixelData = detectionCtx.getImageData(x, y, 1, 1).data;

    if (pixelData[0] > 100 && pixelData[1] < 50 && pixelData[2] < 50) {
        failCount = 0;
        currentStep = (currentStep + 1) % steps.length;
        drawStep(currentStep);
    } else {
        failCount++;
        if (failCount >= 5) {
            flashTarget();
        }
    }
}

function flashTarget() {
    let opacity = 0;
    let flashes = 0;
    const maxFlashes = 4;
    const flashing = setInterval(async () => {
        ctx.globalAlpha = opacity;  // Ajusta la opacidad del overlayImage
        await drawOverlayOnly(currentStep);  // Dibuja solo la overlayImage
        opacity = (opacity === 0 ? 0.1 : 0);  // Cambia la opacidad entre 0 y 0.1
        if (++flashes >= maxFlashes * 2) {
            clearInterval(flashing);
            ctx.globalAlpha = 1;
            drawStep(currentStep);  // Vuelve a dibujar todo normalmente
        }
    }, 250); // Intervalo de 250 ms para un parpadeo rápido
}

async function drawOverlayOnly(stepIndex) {
    const step = steps[stepIndex];
    const overlayImage = await loadImage(step.overlayImage);

    const scaleFactor = Math.min(canvas.width / overlayImage.width, canvas.height / overlayImage.height);
    const scaledWidth = overlayImage.width * scaleFactor;
    const scaledHeight = overlayImage.height * scaleFactor;

    const centerX = (canvas.width - scaledWidth) / 2;
    const centerY = (canvas.height - scaledHeight) / 2;

    ctx.drawImage(overlayImage, centerX, centerY, scaledWidth, scaledHeight);
}

canvas.addEventListener('click', handleInteraction);
canvas.addEventListener('touchstart', function(event) {
    touchHandled = true;  // Set the flag when touchstart is handled
    handleInteraction(event);
});

drawStep(currentStep);
