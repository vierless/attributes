// Function to create a signature pad instance
function createSignaturePad(wrapper) {
	const canvas = wrapper.querySelector('canvas');
	let hiddenInput = wrapper.querySelector('input[type="hidden"]');
	const clearButton = wrapper.querySelector('[data-pad="clear"]');
	const ctx = canvas.getContext('2d');
	let writingMode = false;
	let lastX, lastY;
	let hasSignature = false;
	let lastWidth = 0;
	let lastHeight = 0;

	// Get customizable attributes from canvas
	const lineColor = canvas.dataset.padColor || 'black';
	const lineThickness = parseInt(canvas.dataset.padThickness) || 3;
	const lineJoin = canvas.dataset.padLineJoin || 'round';
	const lineCap = canvas.dataset.padLineCap || 'round';

	function resizeCanvas() {
		const rect = canvas.getBoundingClientRect();
		const newWidth = rect.width;
		const newHeight = rect.height;

		if (newWidth === lastWidth && newHeight === lastHeight) {
			return; // No need to resize
		}

		const tempCanvas = document.createElement('canvas');
		const tempCtx = tempCanvas.getContext('2d');
		tempCanvas.width = canvas.width;
		tempCanvas.height = canvas.height;
		tempCtx.drawImage(canvas, 0, 0);

		canvas.width = newWidth;
		canvas.height = newHeight;

		ctx.lineWidth = lineThickness;
		ctx.lineJoin = lineJoin;
		ctx.lineCap = lineCap;
		ctx.strokeStyle = lineColor;
		ctx.fillStyle = lineColor;

		if (lastWidth > 0 && lastHeight > 0) {
			// Only scale if we have previous dimensions
			const scaleX = newWidth / lastWidth;
			const scaleY = newHeight / lastHeight;
			ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
			ctx.drawImage(tempCanvas, 0, 0);
			ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
		}

		lastWidth = newWidth;
		lastHeight = newHeight;
	}

	function clearPad() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		hiddenInput.value = '';
		hasSignature = false;
	}

	function getTargetPosition(event) {
		const rect = canvas.getBoundingClientRect();
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
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

	const debouncedResize = debounce(() => {
		if (isElementVisible(wrapper)) {
			resizeCanvas();
		}
	}, 250);

	window.addEventListener('resize', debouncedResize);

	return initializePad;
}

function debounce(func, wait) {
	let timeout;
	return function executedFunction(...args) {
		const later = () => {
			clearTimeout(timeout);
			func(...args);
		};
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
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

function initializeSignaturePad(wrapperId) {
	const wrapper = document.getElementById(wrapperId);
	if (wrapper && wrapper.initializeSignaturePad) {
		wrapper.initializeSignaturePad();
	}
}

window.initializeAllSignaturePads = initializeAllSignaturePads;
window.initializeSignaturePad = initializeSignaturePad;
