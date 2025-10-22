class LoadingStateStore {
	public isLoading = $state(true);
	public loadingMessage = $state('Initializing Python environment...');
	public progress = $state(0);

	setLoading(loading: boolean, message = '') {
		this.isLoading = loading;
		this.loadingMessage = message;
	}

	setProgress(progress: number) {
		this.progress = progress;
	}
}

export const loadingState = new LoadingStateStore();
