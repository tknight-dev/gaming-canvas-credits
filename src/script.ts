import {
	GamingCanvas,
	GamingCanvasAudioType,
	GamingCanvasConstPI_0_125,
	GamingCanvasConstPI_0_875,
	GamingCanvasConstPI_1_000,
	GamingCanvasCredits,
	GamingCanvasCreditsAsset,
	GamingCanvasCreditsAttach,
	GamingCanvasCreditsContentCollection,
	GamingCanvasCreditsContentCollectionSort,
	GamingCanvasCreditsContentSpacer,
	GamingCanvasCreditsContentText,
	GamingCanvasCreditsContentTextType,
	GamingCanvasCreditsContentType,
	GamingCanvasCreditsPerson,
	GamingCanvasDoubleLinkedList,
	GamingCanvasDoubleLinkedListNode,
	GamingCanvasFIFOQueue,
	GamingCanvasInput,
	GamingCanvasInputMouse,
	GamingCanvasInputMouseAction,
	GamingCanvasInputTouch,
	GamingCanvasInputTouchAction,
	GamingCanvasInputType,
	GamingCanvasOrientation,
	GamingCanvasRenderStyle,
} from './gaming-canvas/main/index.js';

/**
 * @author tknight-dev
 */

// ESBuild live reloader
new EventSource('/esbuild').addEventListener('change', () => location.reload());

enum AssetId {
	EXPLOSION,
	FIRE,
	TRAVEL,
}

class Credits {
	private static canvases: HTMLCanvasElement[];
	private static domControlsPause: HTMLButtonElement;
	private static domControlsPlay: HTMLButtonElement;
	private static domControlsStart: HTMLButtonElement;
	private static domControlsStop: HTMLButtonElement;
	private static domFPS: HTMLElement;
	private static domSettingsDebug: HTMLInputElement;
	private static domSettingsDuration: HTMLInputElement;
	private static domSettingsDurationValue: HTMLInputElement;
	private static domSettingsScrollReverse: HTMLInputElement;
	private static domSettingsScrollStopOnLastElement: HTMLInputElement;
	private static gameLoopRequest: number;
	private static inputs: GamingCanvasFIFOQueue<GamingCanvasInput>;

	private static apply(): void {
		GamingCanvas.creditsApply({
			content: [
				{
					contentType: GamingCanvasCreditsContentType.TEXT,
					// cssFontColor?: string;
					// cssFontFamily?: string;
					// cssFontSize?: string;
					// cssJustifyContent?: 'center' | 'flex-start' | 'flex-end'; // Defaults to center
					// cssPaddingBottom?: string; // 50%, 12px, defaults to 0
					// cssPaddingLeft?: string; // 50%, 12px, defaults to 0
					// cssPaddingRight?: string; // 50%, 12px, defaults to 0
					// cssPaddingTop?: string; // 50%, 12px, defaults to 0
					value: 'Body',
				},
				{
					contentType: GamingCanvasCreditsContentType.TEXT,
					type: GamingCanvasCreditsContentTextType.HEADER_01,
					value: 'HEADER_01',
				},
				{
					contentType: GamingCanvasCreditsContentType.TEXT,
					type: GamingCanvasCreditsContentTextType.HEADER_02,
					value: 'HEADER_02',
				},
				{
					contentType: GamingCanvasCreditsContentType.TEXT,
					type: GamingCanvasCreditsContentTextType.HEADER_03,
					value: 'HEADER_03',
				},
				{
					contentType: GamingCanvasCreditsContentType.TEXT,
					type: GamingCanvasCreditsContentTextType.HEADER_04,
					value: 'HEADER_04',
				},
				{
					contentType: GamingCanvasCreditsContentType.SPACER,
				},
				{
					contentType: GamingCanvasCreditsContentType.TEXT,
					type: GamingCanvasCreditsContentTextType.HEADER_01,
					value: 'Thank You!',
				},
			],
			// cssBackgroundColor?: string;
			// cssDefaultFontColor?: string;
			// cssDefaultFontFamily?: string;
			// cssDefaultFontSize?: string;
			// cssDefaultPaddingBottom?: string;
			// cssDefaultPaddingLeft?: string;
			// cssDefaultPaddingRight?: string;
			// cssDefaultPaddingTop?: string;
			debug: Credits.domSettingsDebug.checked,
			durationInMs: 10000,
			// inputPassthrough?: boolean;
			scrollReverse: Credits.domSettingsScrollReverse.checked,
			scrollStopOnLastElement: Credits.domSettingsScrollStopOnLastElement.checked,
			zIndexBackground: 15,
			zIndexContent: 17,
		});
	}

	private static gameLoop(): void {
		let cacheCanvasCursor: OffscreenCanvas,
			cacheCanvasCursorContext: OffscreenCanvasRenderingContext2D,
			cacheCanvasCursorSize: number = 30,
			cacheCanvasCursorSizeHalf: number = cacheCanvasCursorSize / 2,
			canvas: HTMLCanvasElement = Credits.canvases[0],
			canvasHeight: number = GamingCanvas.getReport().canvasHeight,
			canvasWidth: number = GamingCanvas.getReport().canvasWidth,
			canvasWidthHalf: number = canvasWidth / 2,
			context: CanvasRenderingContext2D,
			fpms: number = 16.6666, // 60fps
			gameGunLength: number = 40,
			gameGunLengthEff: number,
			gameGunRecoilTime: number = 200,
			gameShotSize: number = 10,
			gameShotSizeHalf: number = gameShotSize / 2,
			input: GamingCanvasInput,
			inputMouse: boolean = true,
			inputs: GamingCanvasFIFOQueue<GamingCanvasInput> = Credits.inputs,
			pan: number,
			pointerArcTan: number = Math.PI / 2,
			pointerX: number,
			pointerY: number,
			particle: GamingCanvasDoubleLinkedListNode<any> | undefined,
			particles: GamingCanvasDoubleLinkedList<any> = new GamingCanvasDoubleLinkedList(),
			timestampDelta: number,
			timestampFire: number = Number.NEGATIVE_INFINITY,
			timestampThen: number = performance.now(),
			volume: number,
			volumeFire: number = 0.9,
			volumeTravel: number = 0.8;

		// Initialize
		Credits.canvases[0].height = canvasHeight;
		Credits.canvases[0].width = canvasWidth;
		context = canvas.getContext('2d', {
			alpha: true,
			antialias: false,
			depth: true,
			desynchronized: true,
			powerPreference: 'high-performance',
		}) as CanvasRenderingContext2D;

		// Cache: Cursor
		cacheCanvasCursor = new OffscreenCanvas(cacheCanvasCursorSize, cacheCanvasCursorSize);
		cacheCanvasCursorContext = cacheCanvasCursor.getContext('2d', {
			alpha: true,
			antialias: false,
			depth: true,
			desynchronized: true,
			powerPreference: 'high-performance',
		}) as OffscreenCanvasRenderingContext2D;
		cacheCanvasCursorContext.lineWidth = 2;
		cacheCanvasCursorContext.strokeStyle = 'black';
		cacheCanvasCursorContext.beginPath();
		cacheCanvasCursorContext.beginPath();
		cacheCanvasCursorContext.moveTo(cacheCanvasCursorSizeHalf, 2);
		cacheCanvasCursorContext.lineTo(cacheCanvasCursorSizeHalf, cacheCanvasCursorSize - 2);
		cacheCanvasCursorContext.stroke();
		cacheCanvasCursorContext.beginPath();
		cacheCanvasCursorContext.moveTo(2, cacheCanvasCursorSizeHalf);
		cacheCanvasCursorContext.lineTo(cacheCanvasCursorSize - 2, cacheCanvasCursorSizeHalf);
		cacheCanvasCursorContext.stroke();
		cacheCanvasCursorContext.lineWidth = 3;
		cacheCanvasCursorContext.beginPath();
		cacheCanvasCursorContext.arc(cacheCanvasCursorSizeHalf, cacheCanvasCursorSizeHalf, cacheCanvasCursorSizeHalf - 2, 0, 2 * Math.PI);
		cacheCanvasCursorContext.stroke();

		// Fire
		const fire = (arcTan: number, timestampNow: number) => {
			if (particles.length >= GamingCanvas.audioBufferCount()) {
				return;
			}
			timestampFire = timestampNow;

			// Create Particle
			let particle: any = {
				audioInstance: null,
				arcTan: arcTan,
				timestamp: timestampNow,
				velocity: 0.05,
				x: canvasWidthHalf + gameGunLength * Math.cos(pointerArcTan),
				y: canvasHeight - gameGunLength * Math.sin(pointerArcTan),
			};
			particles.pushStart(particle);

			// Play Audio
			GamingCanvas.audioControlPlay(AssetId.FIRE, GamingCanvasAudioType.EFFECT, false, 0, 0, volumeFire);
			setTimeout(async () => {
				particle.audioInstance = await GamingCanvas.audioControlPlay(AssetId.TRAVEL, GamingCanvasAudioType.EFFECT, true, 0, 0, volumeTravel);
			}, 40);
		};

		// Loop
		const go = (timestampNow: number) => {
			// Always start the request for the next frame first!
			Credits.gameLoopRequest = requestAnimationFrame(go);

			while (inputs.length !== 0) {
				input = inputs.pop() as GamingCanvasInput;

				switch (input.type) {
					case GamingCanvasInputType.GAMEPAD:
						break;
					case GamingCanvasInputType.KEYBOARD:
						break;
					case GamingCanvasInputType.MOUSE:
						// Correct
						GamingCanvas.relativizeInputToCanvas(input);

						// Process
						inputMouse = true;
						if (input.propriatary.action === GamingCanvasInputMouseAction.MOVE) {
							pointerX = input.propriatary.position.x;
							pointerY = input.propriatary.position.y;

							pointerArcTan = GamingCanvasConstPI_1_000 - Math.atan((canvasHeight - pointerY) / (canvasWidthHalf - pointerX));
							if (pointerArcTan > GamingCanvasConstPI_1_000) {
								pointerArcTan -= GamingCanvasConstPI_1_000;
							}
							pointerArcTan = Math.max(Math.min(pointerArcTan, GamingCanvasConstPI_0_875), GamingCanvasConstPI_0_125);
						} else if (input.propriatary.action === GamingCanvasInputMouseAction.LEFT) {
							input.propriatary.down === true && fire(pointerArcTan, timestampNow);
						}
						break;
					case GamingCanvasInputType.TOUCH:
						// Correct
						GamingCanvas.relativizeInputToCanvas(input);

						// Process
						inputMouse = false;
						if (
							input.propriatary.action === GamingCanvasInputTouchAction.ACTIVE ||
							input.propriatary.action === GamingCanvasInputTouchAction.MOVE
						) {
							pointerX = input.propriatary.positions[0].x;
							pointerY = input.propriatary.positions[0].y;

							pointerArcTan = GamingCanvasConstPI_1_000 - Math.atan((canvasHeight - pointerY) / (canvasWidthHalf - pointerX));
							if (pointerArcTan > GamingCanvasConstPI_1_000) {
								pointerArcTan -= GamingCanvasConstPI_1_000;
							}

							if (input.propriatary.action === GamingCanvasInputTouchAction.ACTIVE) {
								input.propriatary.down === true && fire(pointerArcTan, timestampNow);
							}
						}
						break;
				}
			}

			timestampDelta = timestampNow - timestampThen;
			if (timestampDelta > fpms) {
				// More accurately calculate for more stable FPS
				timestampThen = timestampNow - (timestampDelta % fpms);

				// Clear canvas
				context.clearRect(0, 0, canvasWidth, canvasHeight);

				// Draw Shots
				context.fillStyle = 'black';
				particle = particles.start;
				while (particle !== undefined) {
					context.fillRect(particle.data.x - gameShotSizeHalf, particle.data.y - gameShotSizeHalf, gameShotSize, gameShotSize);
					particle = particle.next;
				}

				// Draw Dome Gun
				if (timestampNow - timestampFire < gameGunRecoilTime) {
					gameGunLengthEff = (timestampNow - timestampFire) / gameGunRecoilTime;
					if (gameGunLengthEff > 0.5) {
						gameGunLengthEff = 1 - gameGunLengthEff;
					}
					gameGunLengthEff = gameGunLength * (1 - gameGunLengthEff / 2);
				} else {
					gameGunLengthEff = gameGunLength;
				}
				// timestampNow
				context.strokeStyle = 'black';
				context.lineWidth = 5;
				context.beginPath();
				context.moveTo(canvasWidthHalf, canvasHeight);
				context.lineTo(canvasWidthHalf + gameGunLengthEff * Math.cos(pointerArcTan), canvasHeight - gameGunLengthEff * Math.sin(pointerArcTan));
				context.stroke();

				// Draw Dome
				context.fillStyle = '#323232';
				context.strokeStyle = 'black';
				context.lineWidth = 5;
				context.beginPath();
				context.arc(canvasWidthHalf, canvasHeight, 20, Math.PI, 2 * Math.PI);
				context.fill();
				context.stroke();

				// Draw Cursor
				if (inputMouse === true) {
					context.drawImage(cacheCanvasCursor, pointerX - cacheCanvasCursorSizeHalf, pointerY - cacheCanvasCursorSizeHalf);
				}

				// Update Audio
				particle = particles.start;
				while (particle !== undefined) {
					if (particle.data.audioInstance !== null) {
						pan = particle.data.x / canvasWidthHalf - 1;
						volume = ((particle.data.x - canvasWidthHalf) ** 2 + (particle.data.y - canvasHeight) ** 2) ** 0.5;

						GamingCanvas.audioControlPan(particle.data.audioInstance, pan);
						GamingCanvas.audioControlVolume(particle.data.audioInstance, Math.max(0.05, volumeTravel - volume / 400));
					}

					particle = particle.next;
				}
			}

			if (timestampDelta !== 0) {
				// Physics
				particle = particles.start;
				while (particle !== undefined) {
					particle.data.x -= particle.data.velocity * -Math.cos(particle.data.arcTan) * timestampDelta;
					particle.data.y -= particle.data.velocity * Math.sin(particle.data.arcTan) * timestampDelta;

					// Remove particle if out of map
					if (particle.data.x < 0 || particle.data.x > canvasWidth || particle.data.y < 0 || particle.data.y > canvasHeight) {
						GamingCanvas.audioControlStop(particle.data.audioInstance);
						particles.remove(particle);

						pan = particle.data.x / canvasWidthHalf - 1;
						volume = ((particle.data.x - canvasWidthHalf) ** 2 + (particle.data.y - canvasHeight) ** 2) ** 0.5 - 345;
						GamingCanvas.audioControlPlay(AssetId.EXPLOSION, GamingCanvasAudioType.EFFECT, false, pan, 0, 1 - volume / 150);
					}

					particle = particle.next;
				}
			}
		};

		// Done
		Credits.gameLoopRequest = requestAnimationFrame(go);
	}

	private static async initializeDOM(): Promise<void> {
		Credits.domControlsPause = <HTMLButtonElement>document.getElementById('controls-pause');
		Credits.domControlsPause.onclick = async () => {
			if (GamingCanvas.creditsControlPause() === true) {
				Credits.domControlsPlay.disabled = false;
				Credits.domControlsPause.disabled = true;
			}
		};
		Credits.domControlsPlay = <HTMLButtonElement>document.getElementById('controls-play');
		Credits.domControlsPlay.onclick = async () => {
			if (GamingCanvas.creditsControlPlay() === true) {
				Credits.domControlsPlay.disabled = true;
				Credits.domControlsPause.disabled = false;
			}
		};
		Credits.domControlsStart = <HTMLButtonElement>document.getElementById('controls-start');
		Credits.domControlsStart.onclick = async () => {
			Credits.apply();
			Credits.domControlsPlay.disabled = true;
			Credits.domControlsPause.disabled = false;
		};
		Credits.domControlsStop = <HTMLButtonElement>document.getElementById('controls-stop');
		Credits.domControlsStop.onclick = async () => {
			GamingCanvas.creditsControlStop();
			Credits.domControlsPlay.disabled = true;
			Credits.domControlsPause.disabled = true;
		};

		Credits.domFPS = <HTMLElement>document.getElementById('fps');

		Credits.domSettingsDebug = <HTMLInputElement>document.getElementById('settings-debug');
		Credits.domSettingsDuration = <HTMLInputElement>document.getElementById('settings-duration');
		Credits.domSettingsDuration.onchange = () => {
			Credits.domSettingsDurationValue.value = Math.round(Number(Credits.domSettingsDuration.value) / 1000) + 's';
		};
		Credits.domSettingsDuration.oninput = () => {
			Credits.domSettingsDurationValue.value = Math.round(Number(Credits.domSettingsDuration.value) / 1000) + 's';
		};
		Credits.domSettingsDurationValue = <HTMLInputElement>document.getElementById('settings-duration-value');
		Credits.domSettingsScrollReverse = <HTMLInputElement>document.getElementById('settings-scrollReverse');
		Credits.domSettingsScrollStopOnLastElement = <HTMLInputElement>document.getElementById('settings-scrollStopOnLastElement');
	}

	private static async initializeGC(): Promise<void> {
		Credits.canvases = GamingCanvas.initialize(<HTMLElement>document.getElementById('video'), {
			aspectRatio: 16 / 9,
			audioEnable: true,
			canvasCount: 1,
			// debug: true,
			inputGamepadEnable: false,
			inputKeyboardEnable: false,
			inputMouseEnable: true,
			inputTouchEnable: true,
			orientation: GamingCanvasOrientation.LANDSCAPE,
			resolutionWidthPx: 640,
			// resolutionScaleToFit: true,
			renderStyle: GamingCanvasRenderStyle.PIXELATED,
		});
		Credits.inputs = GamingCanvas.getInputQueue();

		GamingCanvas.setCreditsCallbackFPS((fps: number) => {
			Credits.domFPS.innerText = String(fps);
		});
		GamingCanvas.setCreditsCallbackState((state: boolean) => {
			Credits.domControlsStart.disabled = state;
			Credits.domControlsStop.disabled = !state;

			if (state === false) {
				Credits.domFPS.innerText = '';
				Credits.domControlsPlay.disabled = true;
				Credits.domControlsPause.disabled = true;
			}
		});

		// Assets
		const assets: Map<number, string> = new Map();

		// Assets: Explosion
		GamingCanvas.creditsRegisterPerson({
			collectionId: [0],
			name: 'Anomaex',
			url: 'https://freesound.org/people/Anomaex',
		});
		GamingCanvas.creditsRegisterAsset('Anomaex', {
			description:
				'Sci-Fi explosion for gun or other effect.\n\nThe Effect is created in Adobe Audition 2019 CC.\nThe source sound was a bomb explosion, which can be found in free access on the Internet without any rights.\nAdded effects distortion and Sci-Fi style.',
			license: 'Creative Commons 0',
			name: 'Sci-Fi_Explosion_2.wav',
			url: 'https://freesound.org/people/Anomaex/sounds/490266',
		});
		assets.set(
			AssetId.EXPLOSION,
			'data:audio/mp3;base64,//OAxAAAAAAAAAAAAFhpbmcAAAAPAAAAbQAAU8YABwkLDQ8SFBcZGx0iJCYoKiwuMDM1Nzo9P0FDRUdJS01PVVdZW11fYWNlZ2lydnp+gIKDhYiLjZKVl5ianJ6gpKWnrbCztrq9wMTHyszQ0tXX2tzf4uXo6u3v8fP19/n7/f7/AAAAUExBTUUzLjEwMARuAAAAAAAAAAAVCCQEAyEAAeAAAFPG10fRuQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/zoMQAD9gGvx9BAAABGKdoh0llt2tG9QIHAYWD6wcOSgIA/KUqOYf5d5T5woc//B//dy4f4IcoCHep3/l4gzkTh8v4P//OFHcH5QMKZlxzuAeCt1ZyTSSibRjVhPDGWCb2WIDVrC4AcdxUG1Tl5VM1Lysq7WwNzVgu2wcOMmQzAoeS+VsZZGyuLmICIBRofRdc8/EeR4BIBaaYbfNClMDc9nbvz7CVjK7aE3OGex6nepyJBL3Ifjj+P0nLRM8etnD+sSp3SpKeQxp3JyXw3I4xSWHfYjALr4ZUdf60fnX+lkM1ZucitvCG5f2n79ent0/cZuQW7lSjsSylnaSN5TtblPG53WVbDKMYV4fv28/l+Vj8/wx6/NNDmq1LqYqXYzEZnle5SZX71BYhipQSiGKljlW1D8v1buT/86DE7EcUDu8fmMABswqWM+73/42rG+/Dr7332iz637dndWxYi92klz7yyvQ6xt9s/q7L+4U9axnulxtCKhgRAP6mqR2sO1FFKj0UN8pJ1oDMYnDTzTNFXqbmoOd6ZmJdIs7lMKi8ByFRAOIFmolCmPqGqWg2oa+hbZryrhijto2Ul0faB9bZ00Nzf1q9YmouGkd37NOqjvXpSH9nr/HDSW+euvWV5metuo79p2j5ZmWZ5ruWZmv/iV/jiGZr7mv6X749/jmv/mTJx1IX9atdmoDJdrt99d9+tPRbBJWGNDbFBKqmleezqlyfIcwMTatv5sv6F58SgwmMDypNNDbN0w82hp6BaSrQrt3Ldc6m8ikMDiVSjzXdXIke0ScUiWZ7xp/zDzXP+PXguBqsOnW1YfD/f81JJO7r//NgxPsko97y1dlAAWOOWVX1qBCqUlHG0sXxAxFReHb//iOvJa+xtceqiqf3szcNCzXp/9XclMHINjZvlSbhZQA3VaHje27/9gAngIiYYi5IG6usepko2eC2Ye+KvI5LK2LSCpmm7Ruvkds27QFU9zqNt7AfTyRrdtcc3evZtatBpvCujmRdDATbNr1SK7ClCl38KJWl2nGy8qzN//NgxPcmvAMGXnmQ8fGyzRoxmFZ9f9ahw2PzZpP/zIMLqkQUSNJBIIBL4bMD//uGqic6J11lqND0P9f/2+kyPRzIVkIE0RwF3FUCopuRppufBcIMbWyNbFBTWo65EKYjPweBuMkQjEJtlCqQEBtIkalCBOJ1iRlAeOtrOuSVGVyM0gUhkvV4xIyBRnlbfFz3QwhJcxHPyJGloNFx//NwxOsmE+LyfnjLmfoKRQwUp3fSUr0M52d4pDZ6l3tn93eIRTpp4nuRTtDKd+HktKrsXHvNMtS3F6xft8N+20jr7NqK2ta2vZnri////qjuBoKzhpKFWTXA52TRqgBio7nJGpeY6CmixAGABQTGRVF1vm6tPaQ60QtPq4DI3cTOfZu7NYaYtGYhJ5ZLKjzU7WX8caD2GuE2VpreLWlzXUvm1bAz9tFcg4CZAWAVRxhbiwM01lb/82DE+yib+s2+0lB9firjMLCtuJyrzxjiUL9DVhCldPpDS4yRzJL6irGULik0MPEfJ+MSKkZpWMbyRU48UGYBxqwnre3po5lWxunT6Kpikjx0hIdihGzCNZyJAwRignDwzA6WdcpS1JORNciGkPppeBpRM8VWXMm/////Cf8MSROrEmW/9Y1Aj/I967a+/3u///+fUX2f/XclGTP/85DE5zy8FsW+29NsI6NE7GZPYZ////6dACeGltljScm4y2H9ISmIsEkKtLXoNYnAccZ5WfYiWNuRCcyw2jKLEwyKANHXNOFRLSPITWxNxCiaIW0xJpwvjYVDpR1i1GjxeluHtqeIk6Ymu65YbDTV0k23KWqX903URCpapaqZC+sPD1/TFwMtYp0az/d9+fldh0rd+/J/xf1Ud4xKvxqyadyzopojRWQMp7+rgdLe34yNs6DTh5pbmC5w7wM4zCUAQ7jV6WVlO3mFCIsdiQEqhALtKKoDoSmm8zSDhH4yZXOVkRIzAwwYiOmFASBEvcYQCKQlywjxy5trfTHgEwrPsNjEIzz/83DE7Cmj7tr+ylCZLojr4D8TigVx/wuGjgUFNWOAiVM4KL4yIvXnaYSB7OQPnRbYbVnjBU6qNRBaNQnbIIVqSBW13+H8KlD7V+98FE0eUXP7U6tfZ+Ccsns9gMGLUTbQRr0pGRhc2kb/6jHnBEqsjJ8mSQgRk4fN2fKo1R8oQnDM0ydP7QghAoKFjHtJmg8LZu/7v95///TrnNWpbH40mFG8JPPSqhAEmHbWlJG3eIwUllPNkf/zgMTuN4ve3v7bEvX8cR+XZvpawUzkAnDGhA+I0CgRv2EhVWGdIKnpWbPTAtHo8BmYjiPrS+tVDlGRDxGLKJO8tZcl8G6NWBm/yZmjyYa0SqVJJK0udvfCBxziridz/wiPX43lYdvvZ7a1Ot9302zKeUmXOHec9d8+I0237nwVOS25397XOd9PrsSdXegk3V+sO3U/KwlDWrI/y/ve/2z/VFK3P/3pVMBpy//7reoBFyTa3WSy7lxEfEfJ6smTIiEy/ePcRFcoWbqmSrl2aNb/84DE0iwUEu7+ywysiq601oL3E76Sd8xRo2nra5+K4wYPrJfNL6k9GHMj+ExvcoyFA9DwwrCnJUZjkv0MEAhKkFGM5nEodZDhCiw80IXTJ3iLll9pHTyKlkUZvsekXxz39jb6Z/UXh8LIbpCdVJ5NGNmFuZgzUjOnwvEEWyIf1KUt2Bn9SikCK56+22tt3jKkV0wmlutCm41n7mYbzlbcnYiUelta9uWW4tep3Yl8Zmn8sQxFKDUssvtS6jzp9BkkV8LcgY6B5lED4Ohu8Y2W//NwxOQmvBLyXnjLmIDAgwzWe10Si7vIjDviqXvVO562IymIxCVer3RCqiIRXuVj3Y6vVr93U60+WW/LI9aMjp06zatRQh3GerscSd7nBM6fKYLBG/+r/ElVBbmumttsdl6NwhVAivGruhAjvVbUXyjMkgSAnp2Ay5okIMES66xomPookrBLSOpNk4KIQLsfkouu2koQKr6rFiLbEyc4yu+tjBE0WMKSIDU3ih8GDBiJlSj/Z4j/82DE8iVUEupewYUwXgtRFdE4f5ZW0y9aSHk+jq6BUUBcYK1utgsRWYI7//juK//4SFkZmabsUdoWE9mQVG+GrnnrJr1D+M0ctEdwb8I/75kqDcc3v201uu4kZqjjbS4FvUx4VOghDqGo3aIOhOksMMk6qIYbylRhhqlzQvMdjPtwViMPRhUh/vDqcGTcFmUCGKWNHhxYcKZWtyr/83DE6ygL2u5ewka9LP30Or+NhPn9quGoEw3HKMPSyaqrqEsQ598/dU6LpZ4aWvoIlo2W0pPaWGXn3P4zjghn5BGqHs/VzOmpnrfbquUYXO7m3HiY0WIKkQ52on50dzuan/x24cE1wRE0s8tVIQFq/1J+W0AOEPFzLAWJuL84P4CfVbNBW4z8oQWWXEZweRpkJ6cko3yWO6ZZe4MvTULGthd+mV1ha9VfNUimjMPvyUVSSXXQpP/zcMTzKkvS+l55i4z9blYhuY+6ck/kcxS3MXNKkRF05VlMym+SSk03ezVNFUMMl3csddvJQ2WmFqpqI+U+JnHx//EcNFwxjo4xIB6Z+u+B9HRUlQhJ89b3L//5NIOuym3/kYEKKgjA2XJI3bNu3AC4uKkCvOZCj8PFiC8KbLBkRH4ryFQw0Fk6OsuQEhIcJA8hEIrQNi7b2ZyyEIFUFqMJ22yutr1Z1sKPmJCBnxKKQKIhvXN3//NwxPIoTALplnpQvaO+RkuY1DKKEmPxj8LiAzgdB6Fj8FOJz6kZPdQ5xn/NtSVLrC0WjAQoQN4rMGKV1qLs9cg9MmL7cv//8z5Vaep5q/Ty/rewWZjYuvgVAdTUkjk+37ERbicQiCGIxaD2pIEaMoGuhgygtPD8RDkLCdIGsgPQA0TEAYZCHhgXS+gnkhRKtqoO1HPZdu0Uz1iVc7Mpk6Lki2xmZv28Krt/Pfs9dspYCJwbKOD/82DE+SdD5u5eekadKp6bIbfkNQaDCzVwIb/tM+H8EHT/jEqJMbn68/7x7mYiWb+IbXhrturf/5/2MR8TcMeBFUR0aV3P4dib+YpmABUibkckk38OE46932ZvDchu2Zjs0TpOA0KxcJAxcageVNMFWGA5XpOs8/dy0K9rSudy3HAV4bQL6dwhW6oJhYAoGBx1A8JWGqAgggMEGnH/83DE6yazgum+wwwNY11fD+7WQgpMJGdSRwYsEI9JptBqpfrnUiDQGZz6kdZCyp5li1aUwfE/JsQKKYWYeeSmOOaOoAw22im3EKqwM1LfgVTnw/gmeHUF/eay2bbfhSgMZOy8P7PS3SK6ypRjIpGJzU6PKM5DCRhaGY3JdZpZgy2qSDxJo+qo8nZYVaSZdWpqtWgkjTkUhc0cZ4otcuiNITDztpws3rMchR2+zHNBQoSaEiGaUP/zYMT5JmuG5l7LBnzwLARg5gJIEZ1RlDqElNutIO1U4Soba+l516p7Po5fDv918++CEDAoMOCZlccvpDeQv9PnD/3B5oY/lzwJyZoExJutxuybjtR8S0H2XlA0myi89OyBt2Bxqa3fYRCEqTPNo0WgEQtkigjH1EUxG2a8cXEiFBJKlCRhdc3/a5QkaMKpKRxjwhcfbZHNthRGav/zcMTuJ4O27b56RvS/d1F0e5qodytQr0IYxBrIcUFhMYeEDi7IRBrs6mDiK50Pl3VbqdzpOeV6aq7fQ50JqcxKvqJkCTlZRQhW8qoR5Gc7DbKLPuLixnX/24j2okCUqi4m3eOBT1Bb1Jv6vZuzmsugiPyaXRmK0k3Kn0n3trym3btR/tTlqXQzRuFKn4nZymfJnlqWTrhvLT2102m3SwxWeGIjc7m2qTlyiUnGtYMhpWaQlgLC//NgxPkn7ALhvsJKvaHTmmwbA4TnGCLQkIeUiB2ioleyMTS19Y82Yl6tO/Z5SKM+hyRvTXXCxHb6c746/hfjmK8uR5c7UVrsJa5Ydf/sYVCIRBvQNCBo68yRDtiG/SXGxxXh3PNiCIoBaSOayyO27maAsGOfq6OdRIbcmGltUAjJkhk1ohVOpmNSQ8ZZ2AsgTdjZKIoaQPIBRxXY//OAxOgs5ArdHsJRSZkGyQI3G0+wImxaRGabe7t/pwZsk0tJyz/0yz4ab35kRr+b2M9Z8IYhbG2dOyTPa0BHPWhwezE07AYPWXdPbRNk3bG9ve/JT19+5+3m29hCHLXkl3ERDV/+S73+9dmayvaMy+nf5m3t37Z50s9Oy023b/T2Ddmt202td256sZQlhS7QuYdiDTrhicoqtVTA2voPh4AmFScNiFlYsuSCJmcykGbWgyQoZwmXglsce79niaS0V12CNHeqxmQTMkQ2jZRORv/zcMT3KfQO8l56THSYt0SfQlKd371m0+tyjStRvsiZ4ma8fvyv4f92c3GTUuQksDUvVNhak30konQ9F9J4YRkszVfKTflwzyToiYkrDySKbEP2fMzu39+dx/9//j94aSu9q1Ep0e6VsXC/KnHVAnWFtv3slsu7IWCc4PxoO54Sli4JxYBZa+YDq0fryS0P5utjUQem2kCUsOtLmhgIAAgOCKyglPS7SRRZMpysr3+mYOMusMvg//NwxPgr3AL+XnpMvelzS0jsP7H6iYJD3LvM8lE0pkQY7XL/2YOo/flDQ1pmv/1jZPM8yfDfyq1/jTOkjN70W3FIoWNJGS1jsEc70hJi1Ejz3grJVHo7I3HtAOIuILdXdkcT+VrOjUY0EJOtUJ9+/gubg0PKrErZqK4PFKqGdHIbMsRXmM0cYEa29wMbpfEe3fQZOxsmVz7rr7mN06LN6AAYRYlEI/QMGhGUI+ktwTxTIZ8FXL3/82DE8SM7Uwb+YYcoCu7nCNyGMv3mw7QUDEOemla1uR9c6X5TXL9Cy5LErKLUm56AT0iJX/7X5me7NdSxZaZG5h8eDAnvKwa2mlZZJK5ehgrjowkFxup464SlbW9dqZVYYm2iobQM88S7eUygjhQEoNdGjhXfA5zSaZCaSJipZs9KhZI3Vvve8edk4uab9sMrdfNLxyqKSETYikX/83DE8yd7nvpeeM2UARzkKyzgiKNFEHPu0Mgs4tm9bWfR3aipkaYz1VvLQ7FPvRejOW5nQ3arepS9nt0VqG4RYIn1ZxNSCcbbUlkjkm6qglzIKqU8j1tOoUJ9FWk3RdxmFRMT9iUrMyPUUZUceKOJ0oEfDzKcyJQZbLKCeLVVlkTyW/Pf7Z0VI3NZSS0WpuUmjWwI0AxbL5DaM5FuRqXx2QrmVBNGElYI85DpoKZRYKE+tDufi//zUMT+I2v6+l55hNwuOBv7qM1U0b1JSlCNP0ZLRV+ExG3QwoALheCoQnLP34CdhdPB+/1zFh0+mnuKIZ0JxtuRvSRyfomIrwGIvKeYFycb0v5BFKdzYKkSjYNm3lWVhYdRkINtpieeUgJlVqYSTIbhutNbb5/3gJyLVvQHkKc58NL/83DE5Sfr8vZeekb1KUwzAIPoKEZRDmyUDctBDtclQ3CDblzd8y94R9xbjlvkfSZO55QEXS/7UmZO/mhJn+k8vr5ik9FwCOQIjHOlWikeSUjz8aWTNCe4jfGMNHIORauR3SSTbpJcF/T6EGccjUstdE73yjVxJFwMisBl22kYjSZYJ4L0UIHXFERbFA5BP/FNKkVDrdQbQK1TM20eKoL0ZT3mhh1c6qOFIkYh3dFgRjp8ZqR3fP/zYMTuJSum+l56Rp0iUi4xeD1Y+EVouMZehd0m5nHdvcy2FAg4zigRdJTUuICNzddIOVG+FVWhTUW2H9hR0geeddvDptn8ubIpAYcmtckbu7GdykGiwvruc7HRmWW3dfIoWefolDmJsT0s6ifNzA4v60YMNr1Tvayx51EIesICw8FmyX/1Zju8zIc7nPW3LHlHvjzumydFxl7f1P/zcMToJXte/l56RrmTjfS1tHVETJs275/yqrf2rT0C8t0Zbtzoc7tqyHUpbiMwsA7hxvnekuIZRz8zTl0dTCSGIhiqhGJQ0XfjBIXuW1uhGQUapDnGsgZk3G245JfFYMUaGSNbkjxvtNSWUQ9EqCXW4tQRyjjN6KxOW3ZHC9Y2b0rgSFzVHOz0VA7NUOaIOo71lnKRRLU0ws4cI7PbowxxfVS2XRA2kE0kNnmXjrjs+bW7rmX7//NgxPsm7Ab1vnmLVKfWyH0uM/cpJgPLut5FKjcnV54YyNSxWygLFoEP81E1UhTSlsPqpUnkqZMMa/5f1cjdHLsVU/gms3jhj/lG28HgGxoJxKGSSWWTfsDIAxBkGmnz7Z1e2QWuCo3ivVK4sVI1dknJAQDAgRmkiB6MgsWyba6AmQRWRoyiSbX3Z9DlLIDMVEc8V1NfJ1BRKSp1//NwxO4oc/LtvsGHORm9L3d9w3dmJhIhgxs6bzJZdZUFEX7yg1MypI7pDB1WEE6fT20f8yR8IJIMMLWGfu5nLndv2Csd8pUgdz6eGHDxFRRtbpow+riCDAhVxcvMICKLKhA9ZKAwxQF6RhJkQuOGCfihQSnA4kXThZgnZNESSL22NilSfM/NuJDUVFEKqzRNYuE1CRQ5NkXx6tN3TFnszGnmic0PhIaLQx5ONU3iaKLeThpcVM7/82DE9SVzavJeeka82YbUvrsixU7m8rXDKLXjXJsiEdDIZH7uSJ3mLctaJqO66i4g6ltuliVopZXs1rJemsZf/8NxrCTf/81iV9T8CiMHKiJKd7KjiQOA1hTm9K47VkUffpyJbSPu9VgiP5RsNNos20InaQxu3RVRxbziSGEhIv8RkcMaTXmRPJWD5P1HZgIYhGMccasxor2E5uD/83DE7igDwt12elB8bloyO5nFfM3p5Ifc2ztheXC+FEfdZ6ObnoR0zhIn9V5CckfGwAncyO5qea52h2mQMUoAEElwzbLxrFyK5/X/w7ZRy//g4ALOCxTksmtuk/6LLeixWSVO1EOrt8jCtLmRXqNgY06u2dQ0W1bRgrBVjWy5Yr6gaiTLMLNsagssa+o08u3cwonrm6EXIGYhiowQ1GMd1BGTPdhQNKNVFsFwbEZXhGZr6z6rev/zYMT3JXQC4N7CRrjwvKfw4XVnZIfxunP87TRKNWClEi0XCSJBLDaO1m5pscojPrGNCQldKtQeB50purIg1/ciD06VnZ6U3Ummm2WUvFEpyLRh/41GaCM1LhY0ZoL4YYF25Re4NvQQI8YKljKKZIYs0o2UQNBWHpCfZ1TM0z4+LlekXRoHqFdXj+pINgi3b2Q2ixeaHiivHwSKR//zYMTwJTM2/l54zXT12PGL/EvSys+sXSduzNEW18XH8N1Tx8QSrHBouPodFwhyrcES147/WmZPj/jvqvmPdO/4f4GsOHkH3///+MlkAK5gRAajqjIkLNxVCxouWc0QWEE9WvoSVoqIL/ZFTxCCncgSfbjAEKEYEtykXJALbulC3lZ1KW6tmf7KvGKVtJZ9aNnQnkULgosQg0wDLP/zcMTqJsQG3DbCUL0ggytCbUSXzWFw0jQpLB0XlBRqSRz0WFSJtuEERZYit7zukU/6UmY8FIUwbVhaUVYOQ9jetOcdtV/LT+VKzsptK/8bo1QtWPuZNM7RFqiJ/Nx3xcsVZ1+VJptPxt1fJ33Z1L/ctgLHwLEo3H///K8MLQAeYtCxg5gHEzKYUPZAAgMBzGoJAQwMKgk+jFRnSBY8COF1SKYtJHMwcEezmOCl/oMx4tqgopSh//OAxPgv/Ba0BtpRVDzqJhaw6haegsQYIiOgwgcgkLQUsriTDkHGISYJfCXnKsIQMR6xKRvYw+VYaRYDANgshY7B3F0IfttH8iU0X5HNqqbEwu0wpS5yl+Jr7rhuN19AhqMzFezLlFLSwlGVmiNrS6XMkJdNrYqIEN5MnssDEwwGasaIoLtC1HjsELpBqQx8rID+uVE+gw1mPqBLqVxj1hscGHrbnusH/eMQr1/xukGmn2I3/+aObx9/6+82ZKa/8GL81/1GEvln/0OBpRkqcf/zkMT7PeOKoAbmHlgIiZbDFYWWUAxGgARHUqlDLJ5ea1HSGgtmiVSh7Sm4xWsnO5DuJC2o22OdlsRYi6Wnud7CM0MBS+JR+O1K0vrYWZ+P1ord11KiYLapQNGEjNhkHKOTCWcNSRUIBZG9ubKITZZ28iWUuDROadqQusY5N40zXS/TmKiX6VRPISJqkWLGtWxGJqduONnyKYXHGMhN2LL6M0XUc3jww4wv/0FEfggqBT4UMnefhj85pYwQYBF1FRwFADxCoBRJ8wEAEYtx0ETAV3LJZw5jA1YUO8hoogy+QIN2Xtgpp0PJzxWGaInOUcbXaHHbJImTLTTUTTbUlZIj04nyiP/zcMT7KUuKvA7Zi3CvDSol1rGZEhmU/LqraWQvYtFb2o4+htjlmGktbtneal9FmoHQrQsMzwcPOcUH9oyKmlzrBWparY00atk1mjOFXhPraKv+GqUWx/80OaClH3P//mW5tf/+MNCwrRAgspbwupFbAFHqIEgdDFmjTnYVWfZq0TuK6Zaue8/T80rwrojDwGSBlkRKA8JpkY4gJDjanZYFTUlI0kx0kEfp37jozvZeK1RlFhRC//NwxP4sK8q0BtJRMI1oJqJkYQvwSDs6OLI4EKI1KKJfsS0/0L9yyTyZCcO7kP4uRnFQ/GHIkqEqMMx0XHFfsfUDoaM3AJP6tUv+MfDFdX//UwZf//xxKgVOFIuYiA5k4LF3zAQKMFgsAgUBAdRkdB4FBSwhdoLAMwKBUZy3QhA5dkEgALAZoL9Iipdu4gJWGYOleXwi6uKVuTd0mFkIOu9B0csT0lfhoXC29GWw/CGJYPYzRiT/82DE9iXbxsTW0kbYk4/fFIN5PS/WT6FcWH3P1Q2kjNDll9Nyg95fQ7O6rCAaRCMYExeqrOcln3yIxLGB9wOmBrcH8GIOrpZFCRFHD6mt96R3I2QiuH+Cr+dR3y/vBk1//vHyIY/OawTdtgr8WfUG3NwCMTGAJFSJNIpxmvqTki53rjdMre2zey+Ze2Xv40+s88jilPG4AeSMUlL/84DE7S/bLqwG4xFMSWexlUVzqFAMICDg0eS0iXgpCEHJ47aexlxVq5lntcMp/eUqfRdrstU20laZZG+24x2pP+fhVS9Z714nf6rkdk1zkLlzUbupVB5utqLzzp/NZFJNMOJJrb27l20HjPyge6oK323iLjrZznKVWm8f3N2Yqm+48HuI01zLUMuBQuhEYfawzWPNYE4OjBCLiYLoDqBEQF4lT5UnmSAHDwkKmFhIWMKRWgrWKwyc4GF7WivGcJ5m65KPpuBtuC70qq9RbGK5//NgxPAji2rMFsmPOAiu8h2IrhTOKCHQFFlR4QrsysodXLixNCMCkYeHMqw4tOp6+CKd2p8P9Prwgb/TFympLuI4CkBl2jPzRzTLp+GoMfqH18xkSjrhEOB8Dka5wbFy44WDBlAXJ5huCuoz7mlblqqJzOtmcjQdxUCoW4cK2jiDUgcB0LR58RELdUTfYWFY0QS1JzhDX9jalHIk//NgxPAkQz7UNspE+bvM8z7C/9uC0jG9IacYmIu0URf8ZyLBH/kf8G/4GpfK1RLd/CywLWh1yVjcKKyCGIq0qHiYmSDgK4kB2GAZLCXQvqFuZWmuyyj+ZRlmgnUrHVKHMZypw4lPFVTNaajudUSwfBu/eh0kROoTpyNZztnbufs5JnblgV6TyDi2yyJphZFm3972nh+j/+us/eWj//NgxO4fyy7YHsJGmHc8U+wk1nby7zVRTASZaa403MyixE6ir/9jr8ecis5S+9HI/meSM1Rq5QOqW1OHwC0E0LsxJxKqCW6IU5PQxNqD8ttJ30Yq+z2P3LXOdKVzq8mHxhsTQ4YgtlK8oAl0lZ7KY5t+Zu7YlU5VBzBJShTuSCkSjcCTqhKdvIafDJVboo9PJY538sfMV3nD/Pb6//NgxP0mW0LMFsvMfPeJa9NTCOHA+mmyWElO9L5fcacjFMxtdryiQk0Wf69WmX9ugqyGUIC7+LilAZ3cBUAFVn80IUn8RPdxIaLNq3FryUrCJsOABgBfwKjpfsSbyRs8g9w3rV/LFLH7XM0iOLUWWyydu4vvKJ2CnZh/OjtXJE/krpovWr5kAk9pRTp2BNfIX/GPV4o+j6OVbZ8g//NgxPIjq1bEDtGLULTqXkh+QQSZDMjf52ylU+tPrP7v/4nvuKRoWd+cWo1JsdL/sX62Q3lEkN/4USUKV/cvRW5jeoCJAHxj2pYmdcouagwqpg8kMGTICKYKwVY4JcYkYZRgxgcmDCBuYVgSRgHg/GGgIeYKRHxiRhyG+EiYiqxjYWGznuYtHBuJHmpXoYVc56YDmVMuZFdpmhDm//NgxPImw1bAFsmFdNphGCi+bSGJv18mDDgZCG5h2aGDUeaVMJocYGfU4Y7CBoEsGiBWCjUF0UajJ5gIKmAhSZFBphoZmIZGfHFtBUkamMIDRiloFDAZUYYmdIWOgxwGZJAGMRkQGHxKgLNjBoBE8Ao19CJIDQ6HxgjoCHGdAhUeZlEYYADgRpwhgWRoxhkyxgQAMMmmGl7RYolw//OwxOZes45oBvc0lIguuh4Ci4cmQIFBR9rqdqJgcTYmwgVAF30wmdJuIShocl+4YgGJkLSTLTqgJbTFy/ScSPsDr7YnAXkgEvazeJvUzpPpxogoC8kWUxqw2709VbrhKoPf2PrCTre7w3H1bqeR4PQp3Pbx1zLL///////7Qsafrn67//+n0bd+d6hqLVbP41XZfm93f7z//7+etWPyinh9AG5ivIumTMhubP5ioGfkMXQCgwKQzjJ5UMjOI3OCjX88NYqI2lCzZafOKtg4OFjsxkMomU0YRDN1cN5pkwinzODDMWo0xWOjIpnNyg0zWtzbwwNBvk1awTGw3MLjQ4YEDFmIClzGwcWBwMKyxnJyZIHG3BYJMCYbAL2YYTgoOM7SzjQABDgAEDAC4FJa2xgPMwJzKycAjpnZSOA4GeBZAMYDlNgUDp3ozDImFA8uu4pQLLAjQcAl8iNi2ysiHqFZb8OGF6rMTpRlARH/88DEy1jr3mgG9zY4jACwxV5ggQYOEs4TnIAAvEoggPhtGUIFUUy06OSxmkoowTO1oGL0xJty/7+t4kaKBLOBYBUER5ZvYqsBi7a0Ln35ZIqSMJ1MBfl4mEM+aNacNfLN+dlm9ftlTcXyp6etGHFY0/2bJZrX///////////+P1v/////8std/////////9zGf7o5R9HlZ/////9f92MV5uIZfSzyA35hJBLmje64ZHIkRiiE3mFAAQYMocJgFAmGFoIiYGIDZhKgAGIuEIZGwbZzmQmri2YchBlRAHED8aYRgEHYlWxQXGnIMAEEcOrhnsSmCBUcsGRhkSm+iUDkUaPQ5m4iGVUWbPTZjU1mSy4aHFZgwaDoBBRcMBDUxqKTAIHMsC2OmQAuaDD4kZTsgGYTPEMyo2wj9JPxA3iwpAcbp5FNwMoMwREJQCZTHEICO519lHyY6bpohiQIEAMBALghg5jkgkIxQgqQPNqoDCYUcUAKAYw7IOnWOtRStGUQBmECX8kbfwCulEJWNwF/J2v4u9Ldcj6sJbtOIJHTkMf/86DE+1AqmnAG9zJ4WaswUFWuoPSugz+KNYX247rWo5TwMupYBaHYSz5qK23SfKrNduRyRf+6W9BbL4IiTKntS6u0EKeQd/Hnf/95UBf4FcGQxQKOYjkIc1CQZ4J2ZHKUasJwZ+G6Zjm0ZoDgaJlcYWl0ayh+ZyNqY/BiYCsMb8rMIT8M6SXN40/MCJOMb0uMMRUMuTUMq1mMui7M5i5MNC4MGRAMfytMpSXCpZGepTDwDmCYpg4ZDE8JjEUYDCURhATBkOPRg6ERyAJs0R2eQXCjLwUSm4FCqRR1gJjyAGBmRCLzFqAyvOApQtLfKYGOVmKDGAAsuRSMqFCAreFpxgKKiSEUFRIQIXYCDpkCYFBmDIBg1JgwYAaCvVKkJICKmEGuyIgE+IQK7gALRLhEaLMslom7hhZd//OgxOZRO/ZwBu6LPCr+BlFX5VWdWC1AG6sKbeFN1huQQtTUQBVVWGKbIXJToDR4K2iE+RIcX55DL4LqWinBirY/bgqPQLe59yLM3l/f3diaQMZvv04zq9y7/lb///////////oHWoFKK+ooA4xgnBOGsqfAcwZ5JiqGOGJ+DkYAQNhjSAhmL+E8YXYeRhkAoGMCKIYs4XhgrB4GC4BoYfgTQEETMPgScxAgah0NYxUAvzAMCEMMsJowEwNDD7AVMTINEwaQTDCRAMPfkTZtwZYDQZ02ELAzie4XGriBmwQZIHmfY4oHmxBYqKnZFhgAyYATiIdNSHQdnmFCgCHDIiExhRMJHzEA8HCwjHzKRcvmtMuOYgTmKCwIFjJQQeQRoSJhsGBJhBOAk8lFkiRgnBoYl6q9wwwCA//zsMTNViPOaAb22vwAggfMBCTAQ5A5QAlB3WAQUXpSBRPLlGAApgwOMgK1Wvo5p4IpDwWhkga5KQhaimWm9zXBoCaVEWRJHsbpIqXZgdH8eI8RBQWoL0FqE1GoLMgBdxBxKxFj+bj2HOHLL4kwLQOITARouj+ON1GoWgSY0TY6Soth5CXDDCfKf1///////////+pzh4jxegC5eAEtTDxQe9MEVHgcehtPl94daZTuG2dkCxXtZ2z2NKlWM/7/uwmJNHw1gRGCEdOgDBNdGuBo8vhONJtHNqW1uZBOskycfeblvNoMWizkvv2k8PLQOS5NmWaR3yyjCjhZAibCe07z6ib7H/vn78r7+7aduCDcb/scE+N/R2isSb34AfUguJpTlVc/lR+WJvowGnkDJ4EVieRhyy4s268XXYlE5S2JrsP24hLpGKRODwRcKkawO23M7qERjZxWjbNuaaudH9SIVMm8sWk2tGyjNqMP//NwxNQgAorAHtMM7PNVXuTmrSBLYfpEhA8gcqSMU6DFpKFpwYuQNlVoIgS+pcxh4j4YkZ/OGGoJy/gBhICMA8WhMSPaWsOx+jed4GGLvfBFB7KFMl9n5a7ATwyF2rD4agFf7zQA6RgbFCZEeEmCBXEOsTJ0uQOqHY0oiIkJ8o6G005A+RmGcvn67c8hBh0oqLFBwovV5c+3Na6X1v1JXIxgBJjin6BZX/1UTf1OoZw1Bbu4AWL/81DE/R+iisQewkUYD6ponABFVByF0KAS6TJMOF6/UD35YZaa1JIWsRmTW10zcXhUANGiEWmpPhForNV609B9PTP/TWeHEoSNKBTJeSBL61f/NmWFF6538JGyRfOhvKkokapKeRDR9pZhUr7U8M3HMhBV20yk/yNCvxAFA/Blqehm//NQxPMeOmrIHtJLGHLofjKMYzwnQqprKYYOVGgpxpReYPAGANR1c+YwcmoswxDC18YgrCIMMqdjURMy5BOMTDBW8yBEN5bDERsUCDIo01QlDkgxw/MSOjaigHAxZYa2OJPQcvKTxxIhlAwPBGTGG0GlFExpcyg2FCRscHmCEjwgHP/zUMTvHQJiyB7Ji1EYwg0tM7JZlYJFwiCp4EwhQdQVe7uMXL2JDlwUGad/00JbbTjXIj26672WQli0VbqzR4W3iUiuNPZBF2dM5feMOZKIei0peTluUU0ao841c7TX5BeprWTb9yp5I/k7FtQBB3Pz///csvatYd/84vHK+T//ygD/85DE8D2yanwG7vQcwITDGEQ4ZQOAZmzOfb8OflY2BCEMdSZB0YGbS+c8AJlM8GGQmYrChjxpGTGmYpWxiBCG42cc3VBnUgm2YIacBRl0wGeB0YERJtJIGIw8Y9ThrcjGOhiYeGoMLxpQjGIQ6aCERkRBmZScYZGANKAWAwCTRgUim0IAqAKABejnENsI4yBYswLzUWAp47UgAcdCeGGuIDmZgPSFCgYcr9D+AjeIJUEujRALlFC4Yc0EgAQ9GTiwCzsdHBAQkOpBZqeKECwBeJqZMggdF0WlQvbIHDfBjz/J0sqmmsKWxpTV3X3ZFC2HT+LM4+154X91nGHkib49eqSO9Sv/85DE8UW6jmwG7zI8mS+s/8tpp/9yifwl7UnqbvK4Y7qy40Src7//+nbkWf/IiUiEnSQAnwAWkMIzBtIJLlYVKVzh4gyceAFoyqLBSBg6RzMi7S9g9hOh6GCgi9GyAOhmgJJKxrHCsE3APDAKEoxIj3GCc6vZzQJE5p2OlyeTLpphOsOWBIMCEjCCDUzxoo1tMKK6s3DVBq2iljkeuv7UiWq/jWNk+JYfJVzNZ/U34zhQ2Eoeh2Imwte3/+Ag6HwAYCcH1yBmyacE1AwAUvAwQYmVGOgiCYGAhkQ6YIAFxzCgwO1QCG6mVuu2DgUQgAIDWj2kCw4kMDCxLAhRSDMMEXGIvAz/83DE0iMCiqwW09C0LTeBKS6GWphqriIAOBfdNSYXg3Fx2HJiKQYPm7nIXB78MVfWihuBaTO/LatZOhWbKYA4LKJnQjJaesPeBDzJInKmu/cUhRdSsn82EfcZf9KR+Okebkrjau//1UpIsZEHzxg9HABlQnHK8ab3UhpUWmjCUHB4wQLDF4DMniAKh0aFZhcVjgNMxkwzaVCs1mGx6aXC5o0EmTAuYOAIUCBv5HXmug42wmAKjP/zcMTvKjpOoAbeUpw++oeBrADQDMRLYGkDxiDxiGDgRgjERhfgcIaQrGWzZsoE7aLLMwwJAMyCJJBP8ztym1iToMEl0YcGMtBj0y+z1ak0Xppe/sVfSXv9UgmxLJS4cPymR1J6G4bp6XKhyBeHptksUeSYHx5NZNjoiuPJK///9/7PLpzPEoiVHABh1XRqpZByldB/RUevmp8HVPp9c0H+Z5B4TD5rp+ckYGSTRiQeYZXHXvZk//OAxO8wUkqMBuZQ3AmmbmZyiCZ42FzTkF4+2OGS04wfGjAw8+FJoZAwgENTQBCng5A0hz57OGQBREcYA5RdMUEDmIwg7oBPiogdGJPjQY8SkqBBAEOzEdIAYDQ24joIWNQxmqVgLvNeboomytJtNJU6ZSMTGGQMfX9QL6Zk2bOHYdfhqDEn1Z1I4BVypCy8z/w1NsFh2VXu3plxKGH7ca/+zEqsSiN6hmi/7t/n////4WMIu/F76R2+TgWpuAASbHBVQk1GYCSNgkBA0AR0Uv/zgMTwNrpGdAbu8h2wwTSLKoEiYj2GFjIqAuGXlLdCwIyRCkeB2HKyOq+8GtjSKXlDyl6iTzMFh+48cCTFqXWIhnBQwOC2Ue7InSxMCKq4WIkVukiD6l8gCQVxbOeBTL5iNSv4FkJQ7HTpxOe55LcOeJt/+hxgsHWUDvUAu3gARhDWxAWXCg0YKmEIg0ePAAQFf0WExlaTNBUAjRGjECn0vroT0YtbLQPI4bXWLtXgdiyFXjo0pOzt1BA4bH7JNiWLz/ECG7KKsZYdHZj6XSH/83DE2CDaQrAe2YtQjUr92OWZKdFcUYoXWzSJtzsogfIrwwi/1dBBJ46v/////Fuxr4aHqgC9ABjfKbKPH2iRCHmogSwJlQGBiAw4HFRskKF5g00JBQvSioJDYaAdJ9kBzkImgFqhaaEBgCCgFzAedWIvkDguGBQBQbXFBmQrFUxedhzFHppHra4Yj5dw5HQpDqVCty09fPRJN2HI3juUmMHmL33qs83dm69alvFSF/v5jsXX2P/zUMT9HspCsB7TEQgpOT8zMwR0crz7HTjm0mZmZmqUmooly4cwi+oBrwAY0VZ556mSR+ZsISmBhIDA1gwpTyUAVqPxqhL9C+TxGueNOBHSbynSrjSRQHOQr11i1RNG6IkwDhggGGldJEpNF40ZplDmAqEiOsv5wGUTVyLtlmcU6cz/82DE9ibSQpgW3hiUnUW+T6HoJXuLLR66csYmeoiZmved7SSS9Yc8a8Xt+F6mol6x86pP3uqf//38OaT9SRNe7fA///+Z9/qfdnqudQYG5wAYRBGMORsKeYUNgozaYDAYQAqNoqBFsHXUAEQSRCZgIAWkIghH9SoiCioAF1gEADoKlSq9jav5904+yZYGch92Em26u0UhNOQk81P/83DE6SayQpgW5l49JM1VWPimNYYHhws9ty2UtRSc68uce/YLW/WLoUaPmEQ4ITkNoUc+Pb8f1zCvFX/xVtXiQK0cAGPdIUwU188TeKENcLIiXoFApl0rmFw4YWKxhMqDB7NYEUzcXTBa+MihoweIzA4uRvIRTYGOc8s0N9hdw2iDALCFTkoBs5jopIg0wDEoQGEMJLg0lfK6VDSz6iCmLHGbqqJkNBZ+6Kiy65FGFtNcb1/WJv/zUMT3ILpCpBbbCyz8ODAj8wmU0MXh57oBij/v3QUth/eTcpitI+hAyTwxNSSCOwex1lpuXqlZeuhydlibET9oVwmaV1+lf//m38O0R2w6XABjdiaGR8jEbbSVhmFLXmaQE2YsgFBodCHL86e/M5tiyhQ2G/hqa2lZsJemBmAa6ED/84DE6S26PoQG5la8ZLGBx2DGYthotcYFfGQMIIFTWXI+2bFyQ5pqM0RDOAEyFKNqRx5SNGBjmzU3ojNdGAOXmTtZswYZEimZApr40YMPmAiRi6uYOBCpAZWSGdFpkwkYEFmghhh4QGIQhEDDx8INh5CMVBYADAZCaWnSpZ4Kgc0PAqbS7US09n6RCLvOaOhalj+KlJQdgWTIEFkfFqIQN0b1bSfMtBwAy9sz6WXuWEU3d29jqq0J3ZU2FyKOTyHlaOtLxlMt59WM8/v5TtDC//OQxPU/8kZgBvc2LezS/ZxxpcK1u/4qAfgAGE0Zi6iaLAmpgRhoUY2OhcMM+Lx4PFnkoHlGwYGGVCJh4edZnVgdsgEC1EZIYC5VUAIxp0PkAV2tSYLDDNn5TwY8pQv29AaK8VdWH2qwxA9mURSXRrOIRSM8tG5HVOZIiyS7Ysm5kU9BZFlKGyL1FWnnG77emw0YfPk5b+v28t/4NK/m7/eQYmZVAKvAANANMYxOa6OaEOsFLRmSGmcDA50LSgYRaU8TT1KiJWBjIFCgoIh3EZAu0Xub5S4sCklkA6v11LhLZNOUfrS5X8ld5uUIkqUNaOYoHTS6DYenzCIqUgSYevuN2/Fy//NgxO0jChqYFt4WmOffRY+tvSHD7cqw/Dz6Ntlz3+nbu1InjQcGn5Uu/oVP8IH6jUBVA4BgFFGGPeDyakZaZqJunTgQISiZCnhhQTnA0GYCYYjWpmoxGBzEaCLIcdzVgINMHsYN4GMBhcoGFGYZlBIRSNQ0PoQACk6bE1QI4bYxEoIkGNOiBKad8aOCa1OaAgZwUGAUjmDEBYMv//NgxO8hUhKgHtMPMZkQqpAxCTIi0pCABIIKCwSJIg5jhKqgoNbG8zVkpkF1jJ1Mph6H7zAGUxtgrr4t1rw6/CJjy/VU3d91nWb5m65Kz7WJZE5ZMWYLjcXpKSkpq9JJuYZc+7lz//9RK///9o5////Jqh+AYpI0RoVlYm1CNgeBDoWwxt0OGoIOY4IZmfmGEa6HNEOFRiZpG5jm//OAxPgzifpwBvc0FGynAbBepv5aGc3ecuT5FTzFAxMaCQ0ILzqYxNLBM0QSDHKmM5Ekx0EjGyXBB0MdGUwozzxLTyiznYT47T5TTCFDNjwdCOBPPlOKqcRlQEvNAbDrZjSSXxQhMUYNGDLAFkhdVC0w4YAiQsLQCqlQWIgLU0VXBAQFKiCWWpNSyDgAJV+FRjpggTRBcI12XIL107nXn4Jaa6cIYIo81Ri8LssmpXnwh1qcPY8j07/xF/b3//6oef/5Prn////////////////zkMTsP7rWYAb3NBz/P////////yr93c7////uxhW5fgBhWDXmX++EaaC3RoUGNGkQMmZQ5B5qEKOGMqRiYbA9piYDpmHGHMZBYnBjjFjmKoOYYIYUhhfhZmMIDkYMwJRgWhIGBcA+YfQoJiAgPGHyC8YYAKhhFglmDaHeYiwAhkFcdlKnY1hmgWbAqnGmIvXmZHJqqcd4oGOTppQMYc3mdkZjIGBEA09iGhsHE5jxIAjcwYdMVHjCyEyoDBycZELmDDZgYwYcDoYKsLkmLAYEDSgSGAAsuNBaUE+zVTMrAEoQYAOqu8oHU6oAZu960kuCYLV4l2/64gsAhcBIAJFVS9iqh//zkMTlQTKeWAb21PhDqht/CROUGAiACwDRrUv/66sch3/Wv/FY/qn+pZ2+Sd6AYVAKxkVE7nAmo8YHYMJhWEimDgHwZNIzJimCEmCKIecEWBky7me1idZyZoqECN+GZQuZr2489zVZWMyLo4aFwquytaGLiQZaMJm49GK1qY4Hhkk8mfEoaZO5lQqmxRybPMTYDDrhvmYPabpSaXQZcofciZhoacua1alSm4YlOw4y6EwgcDIAoNFSgtCCgoIVgpSGCkLQSRctowOJEoUGjgckScBgUKEjCk0ewoFcJDVrrUSYeWlTfXqoGxMhHCQJZasSthftvkqC1kPQGMAFDi5jd14OrP/zkMTYQCpyWAb3NFUwnhjj//////////l3//X8v4f/4bz3lvu8///qc//z7/8t/ToyfxEWAt+Aaf1OdlQgfCQQeGj+ZgwUZumscqK2bqCUYSDGZIGGZEpeYQi4ZJA+ZnFcY3BOZelQYLHyapDeYgFgYZiSYYE4YCh6ZTgQYMnEYpGQabjSZGAyJBiYfi+ZEA8DgkM3hxMVxoMEQrMZApMIhAMFxoMLwIMIg1MNBXNeAaAFXANi8Y9IbqcADAAmANSEPN8y2gNOIFI3FCwcoU2HeeZvWHCrKVHoEHReXzJm4pIs9ilI6TcFw1Z6HYBkDvQG0hxn1jLh2cvhpPmHmVMKe0fByf/zkMTPOmKSYAbuDzHf/+r1cmxU4m2hHcmOTeabzDZUsd0fLZfmaaoAr6AYEznpr5F8mJWsCYsOeb/EubbEOZ8XacHDqZAsWaiAoZvV8d/SgccIAZgUSeGpWcFtOYBO4ZXFMajEsYUm2Z4lQGaMY9BYYHqCZdJQZJqIYYigZQBKa7lCYGkGYVG4YCj+YAgAYZDgpGNTTDNjo6dQMDQzZxMHGQZCGvl5mg4DScgBDHxwCmxhAMaIJGFEJjgGYIUGHh5MAGNgQCXhpsMPKRYTBIwLCDnIcFN1h1aUpwaFqicESAy7zrlwUzES0/EqUE8PSpdeb/OCslraVbvJfl2XgdSAmXoBUf/zoMTdQ8qeVBb3dhzlMKdv5YTcP2ud///v/zX/v/y79XmGMxjfqf//vnf////+5nKbla7Y///9XrPfucukNNW/AGJcaeYRyWZr0gtGQgXGaUY3ZgWgMmBuTMYKgcxkMi0GMcKqYU4a4YFkYmochlugNmEEGmJDYGGGG6YRod5gghzAoksaCBMB0CM0XBPKUQYvmIHpnyWa4pAXEMtDzo4IxRKNgDDHIszlCNsGTFREyJVMsFAcZmFlpiQqQMZjpCYiEhQQGiwqBQ8CCQvSJekwoYGUjIWGG5ZcFEIGAhURFgwugAQEwUIEYEtFFBUoBBXKfhRRXaeTIE0VRteUDfZ2XeUUTLWYsRn7Y2jJvR+fgJg3tGjUPurWGpwjuAoP3///OvOJjipA/cEeDV2o9DU9JZX7gGEZYnD/85DE+TzCFlgG9tTcQipy8tprnHR6WAZgYtIJDsxQLM1vAMwTLcxbJExTKwxHHUxOAYweUIwVA0DIMABYKwhMeQKMPAVMHwgMRw6MEgyM1CAMKQKMBzBHqoLolXsc5KdNUkWEJkRB0mcyUh+BZZuwxuHhliIUMlAYLGU4AUVEiAXGGOGgYmUIx4eqmh+qYKg030vHDbZ2G3bqrQ8KymaylsTZmTcUwUqdV3Jl8KtJIWkvs+MSZ1KGNO06+4OjtillkksdHAHnFBGF3//+ahU05462Phwg//8Tl/IGY0g0RigRlmOanqZdo+ZmFjvmM2SKYvR/hieo9GDKPeYgIjJmRh8GMUL/84DE/jTCKmQG7o74VGIWKOYMYG5gnEnGWyOeYHYAhgtCAHBDuaCTphmJmhQwZniJlNSHB4CbJaZhSVmWqmYBQBxFdipAMngs2GmQU3QKeTaprNllgxgTzF54NYFMzyfSIMmZwaOhQIMRicmGGwCYgNZoQSGQSYYoDw4GgEVAMDTFAZHisLHoeBjdVDxgJpCA0EgwAKDlQFCIDRYxAFU3gJWIYHdA1mAUAGkAAjAUuAacJvAwBA0vBs4AsQhQTOIVAmQaIFSDKAGhDGgIGiXh//OgxO5K6/JIBvcmuLgR0BiIExixkSFaBsguEmyu9/oEeQcqMSZ52+tbddRMsiZJJf//6Du1alKWpbL1///////////46BBQljdS4Ahg+N1G4xiYdHM5BgKogmewAiZHCUZioE5mNGA2YYIiBiqAkmCiUCY0QbBlWgEGIGRyZEg8BiTDwmPaAeYZgwBjXiEGJkC0YmwSAQUKaolg47zAcPMdpE4sBzGQDM3Ew4YzDhgtPHhQxCEBkmiqqARhM+Dw1ghDDpKAAUMPBwwQAjIQ5FjWYgBgBFxkELA0KmFRaYcFyt5h0GCAaBg/MAgsHHcmE4jExQM4bJgmFAMYBBAyBgACggJrAu+keRCJp72lUCjQBTBRzTiTBd0vuBAszoEAJS1OFm9VLgRAFLFK9ClBFKY4+rcm7RaWEv/zoMTuSCvuSAb3Gt1Bzw0DxNxuMSmXz/qB7DwSaAlDEUKuFsHQ3TQv/rR/////////////////9UiAAnCwMh0PAHMvggcvnVsxj0cZiLmMshpR+ZwJGlBI9MNCLsDw4rwHI5nxlbhzmmVK+hhEgUgS3KygSWXGEtw0scBCHVgEcEYV9g4lfo0Oo4l+mCxNp1tc0mUsiC83nZywiGH/lbutV3SU9PQTUVszl+l7dwTJ5PL5IGlRJpUCcbE5NS1HaC0anaozOoOVLUb/zp/PVFYXP////////////////////oGYTousDABxCKpgi55gNHBiCLgwJRgmL5j8FpggF5kYCJhYKZjuJogFgWKgwtEoWDUzpY0bY2IoONGaXmShmfPGBHGHSGUbmyiCQQRqwg8JARYYYwqMmB7/83DE+Sl78oAO3lqcRDggwIVEoOGkRFgRUAI/JyJFrPk654aSSgMWBMehT/MY7MQl2lfSyXw83VnFPSQNBkZHqkovGg8JCxIg8PozCKNJSJR++js0LhN0OO/mt8DIFz////////////////////5EKoiSCgT4ABgQJGBSocjhZhEKGMiwBCIASDM9MXMuwsU29gvcKzDL50QGtaUJrEGnE+1BGOmKgpahzTQIR24oKILDI60wOv/zcMT8LmPudA7ulJyOBIAhVeplyXQugsBNjqWD2QttP921JNbw36dvXTNiBe6qi6duoDlWE0s1HCTLNI2WhUix439Pf+lNYeuH/////////oZp0bq8AGAKQGThuHW8IGb4LDIimLwaGDYemHIWmRwTnUcHG3mdGCA4iiYM8ZCK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',
		);

		// Assets: Fire
		GamingCanvas.creditsRegisterPerson({
			collectionId: [0],
			name: 'TannerSound',
			url: 'https://freesound.org/people/TannerSound',
		});
		GamingCanvas.creditsRegisterAsset('TannerSound', {
			description:
				'The wind-up, burst fire, single shot, and rapid fire of a laser gun. Lots of instances of Massive resampled, in addition to reverb layers and some random foley of cups and glasses.',
			license: 'Attribution 4.0',
			name: 'Scifi Laser Gun Firing',
			url: 'https://freesound.org/people/TannerSound/sounds/495054',
		});
		assets.set(
			AssetId.FIRE,
			'data:audio/mp3;base64,//OAxAAAAAAAAAAAAFhpbmcAAAAPAAAADgAAC0kAHR0dHR0dHTs7Ozs7OztNTU1NTU1NW1tbW1tbW21tbW1tbW18fHx8fHx8i4uLi4uLi5qampqampqaq6urq6urq7q6urq6urrLy8vLy8vL7u7u7u7u7v39/f39/f3/////////AAAAUExBTUUzLjEwMARuAAAAAAAAAAAVCCQEeiEAAeAAAAtJW6BsVQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/zoMQAEAAC4n1AAAD25MSA4UTn4BiD4P1rB8H4nPxICDonBBzvwQ8TvEEEPy7/rB98PxAc1YIAgGM4CBz+D5//8oGChzKf/yjv/6gQWFWDE1FZd6Z0m6dWgdCoeLj3zYIhZMciguRY8SOEtCYz1ShDRWJj7Mn9XOpQ3N5VduQDNAyUYDQXBgIQw8ajiaaq6SaK7NXcaY/8PrVbtCOSx/2dMrQlrCs7kcmbMzJ9GgNHVzIo78BtygWKPbqeduAm0fyJ2JVDshmpHRO3k7M1SZyyM25HTNxeCW0dSUVXcbtGK8XvSigl8tca5Z1hZfunleLtw+4mHKGel0SmYi+sxCpFNRaetwFfrQ7ZuTT7U0Rl8vkN+4/boNMgClh+pGHbfV7nEv4Y44zNNduWr1fKtdqS/tm1apN37lH/86DE7EtcFv8fmckA01JnfhF+WX/fl5nUor7hxtrj92qOQM5fbGSQ++V/lNhne3q3je7rOphnhlupjjXux6goJdHqSVSuJSiX1rVBf5OqNdaUZd4l09aVJe43HARUwXBYK/s5D0zDkC09ue7Eq0tvSWRZ1ZcINECwWFruHtBQFAhi4uJiTaU4WTtrmbEIQhiCEW44QXYRhdRUu9KlFJ+Ze40qZuo7sZ9t3pw78w/fz/cvfN78y/G59yuvV2fpK27IrNN91B9fA2o2L0LGkJu6pbS+99e7ttx1NutcdqrLozJq4iZFQwxTbn455ny1HkdSGVZK3HGpCMHiViCR8iyxP0QSdtPpvXOYLljuK+olt0ctHsHcWlXbLBjJ7SYUl1m1WN+WlJDUlJUZQLiS1I2WpY+GgzvVutGS//NwxOonm7r2VdhAAc0uNeajvkTDdrlKbo3JzVqKYSAlGpszcxwjVmpGRN9IGYbVKVhLtTin+xNeI/5By2orho6CXUCrbM31iSfOF+x+3gjXwEeQeCQZnXKiVRgyM1IYwsssocwTILYsA01xBVSkwh0I/2dHeeTc7XGiL+mdXxjkC8bUIVSB4NUoBxhbFirF7s7kD6EUOA5FQSxI92OUbCq3uPRqGpMY2s1tYoe8JNLvzZafszT/82DE9CYjlwJ+eYc0kj4hmHWIDf8SLGOKJMCnCO2UdpjClqpBYkzxcU/KYxpQB4Mt3wa3CA0VnRYZXmYjuUvP/4UEJDP1Akt2RyB0NFk1t3RJnzXUyOFfNzFO2cUUmgyJyu3IZVSv9KqMiQpR3hYeSmDzYMhzITccaxbMrnaPN/nF+98adRY9WLFx/S+12Ne+/hXXpR5iotYvWCP/83DE6ibzku70egUchGEq4IEtUwEFqIhfw3X6e5oxlXAkH57ox3ZTXIKJUuVih/WBRhWIxHS//62AeTBwAw+DTClf9hvYcqAgZdKiYQrZHP6zv8sHVZ1LeikgU0OUZlK1lYn0hM8+UtSGAzOBaWTpMXeELR+6yGUSGdKl0MB9Y5d35Zw5PjwsGC8eRMFHDsRYsslbSMZ2Rjbg4V5q+Idvh4Qw6Rmg2GW3lf958RTNrWGmmdZWiv/zYMT3JZMq7lTDBryWFaeipdV3//ujXivkbU/Pr/T+9eaqM1MvKjlWu/8bI6WQp/EoiHgpOBz/9bk1HfIsTIk3oADNAGQI4SRbP5hfK67AtKd4pZy3HOqkU/SDiy1xpvkfX3eIvqNTKEkwAWlWooJaHMv1iJ+RaCKkXCmx5xaZmsSTN/NIyxrwdc1mNkISMsiVMZvVuLnGCogVOf/zYMTvIzMa5lTDEFyNSkmJjZBrDzGc52JNOzlZWow0YJCdGPnZRw1Edyl/crdB2Y3U36vbcsraAvIQBRc7kPOfxEg1FDWEsgbcbcc2SjcC5qhUnk5SSOWUI+fhCze6mbIW1T7JtPVZX7iyx1CMWApEg1lNzTSRVzPo2glEQ42xFIodTKUZqaPOsPjKEMXFxZjdNIqKGOQxCBzZa//zYMTxJjP24lZ5izFC01Efx5tks0HkDhpSlC3CMr+pyOVRN+a6jFr//8olbYqE/48wdFI6fXz/40f/lf8rX///0pK+mIQ/GUMoXig/uSBZ8OawfWXdZ1Vx65QG1BqZPQTkco/UKGnvGiqVGKQ0Uq6h377bg2Rpo7keq3B1OzMbYSScxVYEIEQo4CJ3b6dqKKMFPTy8l1vmmTvSSP/zcMTnJ7Pe5v56UHyVAbCUOjqOG5aAKeKjqOxkVCz92YYYjh1nZ4oYl0ZvIYaKKQHekpjA//siCrziPoPu5ldSqg5Dsrs8jf9aPRv+nfkYcgkHBEPB0Vf8oFk2hmASPubjjYCGPM9CDISpUavQYjM9SJx3tIsxo1n8znNHrHGnB8KCcMDnkZ1I1yzhBHFAWSIhYWPES4GChQlLG/iNbUP5bFZNkJ1s0osVoWMDkRhqk5ViCs73//NgxPElc9bWNHmLMOTKU1cwySdNCwfCoqXGwszzKD78baMkDCYrFqjHfN/i1fsYwhDSr9EyzCw4sj5FV+hW7vhvO/4r4vFq0r/0q8bW9lhyriU4ZDvpKDEGFscaiOvIQSFKmMxlsooA5MaYPsmMVIi9REQPieqvAkYNjXAYGrZZeZDJgJcNadzRF0wwBPVgalAUCNuCIJ1laKBE//NwxOops8bS109AABngfYySsIjmZCF5jJhgsbYY9rcWKpbiQKWjIkKgDChDCgGVJyJFs5fpHpFdLBNJB5ZDAlCljgIqyqQu1IoOgmRMpeiUupK2DP80MMDJggACXmEIgONI83XlgujfWOwZQ5OU3Fj6/GfKPuDFKRnwVAJUskYSzmq/UDfuEwDSdr5Yy+7KpXJFbHgbElzx6lTLuaxKIeh6u2d7oZdqMopSZyEulpNhXbFbNDr/87DE7FX8Fq7/m9AExgf6riYTsmovypndfuP0VC/0UrWXvsthz/T8stmW4s1iLZmHu0osqNW5dy/soKZv3H62NeJwfUlFWiikjx//xo+7z7H71l1otHnJ+Cnfgfu7+OrsMWqXKI0jPkvZDJIKnr7pSK/QstxgKPwALlykQoTgTaipCSmVhUGmlWpIgsGmooULyEUilDGKFDsmkQUAkSJGu8kZNIkdNn1rmkdmZatNAKTzONVVM4xxJKv3mZn1U5/VHEks//7zP//eZmv/+8zW+ZnKr1WvMozXeZmf//5nP/6OJEq8+caiVb//6rvNf1VeZ3//////+jiWNW/9qztVb//VVVb/59HEkqfkFeFVTEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zYMT0JVvuel/JMAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zEMTtAAADSAAAAABVVVVVVVVVVVVVVVVV',
		);

		// Assets: Travel
		GamingCanvas.creditsRegisterPerson({
			collectionId: [0],
			name: 'BMacZero',
			url: 'https://www.brianmacintosh.com',
		});
		GamingCanvas.creditsRegisterAsset('BMacZero', {
			description: 'This is a loopable sci-fi laser beam sound effect. The effect was created for Ludum Dare #24',
			license: 'Creative Commons 0',
			name: 'laser.wav',
			url: 'https://freesound.org/people/BMacZero/sounds/164102',
		});
		assets.set(
			AssetId.TRAVEL,
			'data:audio/mp3;base64,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',
		);

		await GamingCanvas.audioLoad(assets);
	}

	public static async main(): Promise<void> {
		// Initialize
		Credits.initializeDOM();
		Credits.initializeGC();

		// Game
		Credits.gameLoop();
	}
}
Credits.main();
