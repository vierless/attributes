// Function to create a signature pad instance
function createSignaturePad(wrapper) {
	const canvas = wrapper.querySelector('canvas');
	let hiddenInput = wrapper.querySelector('input[type="hidden"]');
	const clearButton = wrapper.querySelector('[data-pad="clear"]');
	const ctx = canvas.getContext('2d');
	let writingMode = false;
	let lastX, lastY;
	let hasSignature = false;
	let initialWidth, initialHeight;
	const scaleFactor = 2; // Increase this for even higher resolution
	let aspectRatio;

	// Get customizable attributes from canvas
	const lineColor = canvas.dataset.padColor || 'black';
	const lineThickness = parseInt(canvas.dataset.padThickness) || 3;
	const lineJoin = canvas.dataset.padLineJoin || 'round';
	const lineCap = canvas.dataset.padLineCap || 'round';

	function resizeCanvas() {
		const tempCanvas = document.createElement('canvas');
		const tempCtx = tempCanvas.getContext('2d');
		tempCanvas.width = canvas.width;
		tempCanvas.height = canvas.height;
		tempCtx.drawImage(canvas, 0, 0);

		const rect = wrapper.getBoundingClientRect();
		let newWidth = rect.width;
		let newHeight;

		if (!aspectRatio) {
			// Initialize aspect ratio if not set
			aspectRatio = initialHeight / initialWidth;
		}

		// Calculate new height based on aspect ratio
		newHeight = newWidth * aspectRatio;

		// Adjust if new height exceeds wrapper height
		if (newHeight > rect.height) {
			newHeight = rect.height;
			newWidth = newHeight / aspectRatio;
		}

		// Update initial dimensions
		initialWidth = newWidth;
		initialHeight = newHeight;

		// Set the canvas size to scaleFactor times the display size
		canvas.width = newWidth * scaleFactor;
		canvas.height = newHeight * scaleFactor;

		// Set the CSS size to match the display size
		canvas.style.width = `${newWidth}px`;
		canvas.style.height = `${newHeight}px`;

		ctx.scale(scaleFactor, scaleFactor);

		ctx.lineWidth = lineThickness;
		ctx.lineJoin = lineJoin;
		ctx.lineCap = lineCap;
		ctx.strokeStyle = lineColor;
		ctx.fillStyle = lineColor;

		// Draw the existing content scaled to the new size
		ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, newWidth, newHeight);
	}

	function clearPad() {
		ctx.clearRect(0, 0, canvas.width / scaleFactor, canvas.height / scaleFactor);
		hiddenInput.value = '';
		hasSignature = false;
	}

	function getTargetPosition(event) {
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width / scaleFactor;
		const scaleY = canvas.height / rect.height / scaleFactor;
		return [(event.clientX - rect.left) * scaleX, (event.clientY - rect.top) * scaleY];
	}

	function handlePointerMove(event) {
		if (!writingMode) return;
		const [positionX, positionY] = getTargetPosition(event);
		ctx.beginPath();
		ctx.moveTo(lastX, lastY);
		ctx.lineTo(positionX, positionY);
		ctx.stroke();
		[lastX, lastY] = [positionX, positionY];
		hasSignature = true;
	}

	function handlePointerUp() {
		writingMode = false;
		if (hasSignature) {
			const imageURL = canvas.toDataURL();
			if (!hiddenInput) {
				hiddenInput = document.createElement('input');
				hiddenInput.type = 'hidden';
				wrapper.appendChild(hiddenInput);
			}
			hiddenInput.name = 'signaturePad_' + canvas.id;
			hiddenInput.value = imageURL;
		}
	}

	function handlePointerDown(event) {
		writingMode = true;
		[lastX, lastY] = getTargetPosition(event);

		// Draw a dot for single taps/clicks
		ctx.beginPath();
		ctx.arc(lastX, lastY, lineThickness / 2, 0, Math.PI * 2);
		ctx.fill();
		hasSignature = true;
	}

	function preventDefault(event) {
		event.preventDefault();
	}

	function initializePad() {
		if (isElementVisible(wrapper)) {
			const rect = wrapper.getBoundingClientRect();
			initialWidth = rect.width;
			initialHeight = rect.height;
			aspectRatio = initialHeight / initialWidth;
			resizeCanvas();
			attachEventListeners();
		}
	}

	function attachEventListeners() {
		clearButton.addEventListener('click', (event) => {
			event.preventDefault();
			clearPad();
		});
		canvas.addEventListener('pointerdown', handlePointerDown, { passive: true });
		canvas.addEventListener('pointerup', handlePointerUp, { passive: true });
		canvas.addEventListener('pointermove', handlePointerMove, { passive: true });
		canvas.addEventListener('pointercancel', handlePointerUp, { passive: true });
		canvas.addEventListener('pointerleave', handlePointerUp, { passive: true });
		canvas.addEventListener('touchstart', preventDefault, { passive: false });
		canvas.addEventListener('touchmove', preventDefault, { passive: false });
		canvas.addEventListener('touchend', preventDefault, { passive: false });
		canvas.addEventListener('touchcancel', preventDefault, { passive: false });
	}

	function isElementVisible(element) {
		return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
	}

	initializePad();
	wrapper.initializeSignaturePad = initializePad;

	window.addEventListener('resize', throttle(initializePad, 250));

	return initializePad;
}

// Throttle function
function throttle(func, limit) {
	let inThrottle;
	return function () {
		const args = arguments;
		const context = this;
		if (!inThrottle) {
			func.apply(context, args);
			inThrottle = true;
			setTimeout(() => (inThrottle = false), limit);
		}
	};
}

function initializeAllSignaturePads() {
	const signaturePads = document.querySelectorAll('[data-pad="wrapper"]');
	signaturePads.forEach(createSignaturePad);
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initializeAllSignaturePads);
} else {
	window.addEventListener('load', initializeAllSignaturePads);
}

// Initialize a specific signature pad
function initializeSignaturePad(wrapperId) {
	const wrapper = document.getElementById(wrapperId);
	if (wrapper && wrapper.initializeSignaturePad) {
		wrapper.initializeSignaturePad();
	}
}

window.initializeAllSignaturePads = initializeAllSignaturePads;
window.initializeSignaturePad = initializeSignaturePad;
